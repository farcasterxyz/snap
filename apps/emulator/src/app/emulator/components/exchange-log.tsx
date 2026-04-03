"use client";

import { useCallback, useRef, useState, type CSSProperties } from "react";
import {
  type LogPair,
  pairChrome,
  pairCollapsedSummary,
  formatOutboundSnapBlock,
  formatHeaderBlock,
} from "../lib/emulator-log";

/** Request/response sub-rows and JSON blocks inside a pair (neutral gray). */
const INNER_LOG_STRIP = {
  stripBackground: "var(--border)",
  preBackground: "var(--bg-hover)",
  labelColor: "var(--text-secondary)",
  copyHoverBg: "var(--bg-hover)",
} as const;

function CopyIcon() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function LogChevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width={12}
      height={12}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{
        flexShrink: 0,
        transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
        transition: "transform 0.15s ease",
      }}
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

export type ExchangeLogProps = {
  log: LogPair[];
  expandedLogIds: Set<string>;
  onToggleExpand: (id: string) => void;
};

function CopyButton({
  partKey,
  copiedLogPart,
  text,
  label,
  onCopied,
}: {
  partKey: string;
  copiedLogPart: string | null;
  text: string;
  label: string;
  onCopied: (partKey: string) => void;
}) {
  const isCopied = copiedLogPart === partKey;
  return (
    <button
      type="button"
      onClick={() => {
        void (async () => {
          const ok = await copyToClipboard(text);
          if (!ok) return;
          onCopied(partKey);
        })();
      }}
      aria-label={isCopied ? `Copied ${label}` : `Copy ${label}`}
      title={isCopied ? "Copied to clipboard" : `Copy ${label}`}
      style={{
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: isCopied ? 4 : 0,
        margin: 0,
        padding: isCopied ? "2px 6px" : 2,
        border: "none",
        borderRadius: 6,
        background: "transparent",
        color: isCopied ? "var(--green-text)" : "inherit",
        cursor: "pointer",
        opacity: isCopied ? 1 : 0.75,
      }}
      onMouseEnter={(e) => {
        if (isCopied) return;
        e.currentTarget.style.opacity = "1";
        e.currentTarget.style.background = INNER_LOG_STRIP.copyHoverBg;
      }}
      onMouseLeave={(e) => {
        if (isCopied) {
          e.currentTarget.style.background = "transparent";
          return;
        }
        e.currentTarget.style.opacity = "0.75";
        e.currentTarget.style.background = "transparent";
      }}
    >
      {isCopied ? (
        <>
          <CheckIcon />
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.03em",
              lineHeight: 1,
            }}
          >
            Copied
          </span>
        </>
      ) : (
        <CopyIcon />
      )}
    </button>
  );
}

export function ExchangeLog({
  log,
  expandedLogIds,
  onToggleExpand,
}: ExchangeLogProps) {
  const [copiedLogPart, setCopiedLogPart] = useState<string | null>(null);
  const copyFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const flashCopied = useCallback((partKey: string) => {
    setCopiedLogPart(partKey);
    if (copyFeedbackTimerRef.current !== null) {
      clearTimeout(copyFeedbackTimerRef.current);
    }
    copyFeedbackTimerRef.current = setTimeout(() => {
      setCopiedLogPart(null);
      copyFeedbackTimerRef.current = null;
    }, 2000);
  }, []);

  const preStyle: CSSProperties = {
    margin: 0,
    padding: "6px 8px 8px",
    fontSize: 10,
    lineHeight: 1.35,
    overflowX: "auto",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    fontFamily:
      'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    minHeight: 100,
    maxHeight: 220,
    overflowY: "auto",
    background: INNER_LOG_STRIP.preBackground,
  };

  const innerSectionBarStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    padding: "5px 8px",
    boxSizing: "border-box",
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.01em",
    textTransform: "none",
    color: INNER_LOG_STRIP.labelColor,
    background: INNER_LOG_STRIP.stripBackground,
  };

  if (log.length === 0) {
    return (
      <p
        style={{
          margin: 8,
          fontSize: 13,
          color: "var(--text-muted)",
          flexShrink: 0,
        }}
      >
        Request-response pairs appear here after you load a snap or tap a POST
        button.
      </p>
    );
  }

  return (
    <>
      {log.map((pair) => {
        const expanded = expandedLogIds.has(pair.id);
        const reqPartKey = `${pair.id}:request`;
        const resPartKey = `${pair.id}:response`;
        const res = pair.response;
        const outboundToSnap =
          pair.response?.resolvedOutboundToSnap ??
          pair.request.outboundToSnap;
        const outboundToSnapText =
          outboundToSnap && outboundToSnap.url.trim() !== ""
            ? formatOutboundSnapBlock(outboundToSnap)
            : "";
        const outboundPartKey = `${pair.id}:outboundSnap`;
        const emuHdr = pair.request.emulatorFetchHeaders ?? {};
        const emulatorHeadersText =
          Object.keys(emuHdr).length > 0
            ? formatHeaderBlock(emuHdr)
            : "(no custom headers \u2014 browser default fetch)";
        const emulatorHeadersPartKey = `${pair.id}:emulatorHeaders`;
        const responseHeadersPartKey = `${pair.id}:responseHeaders`;
        const responseContentTypeLine =
          res && res.contentType !== undefined
            ? formatHeaderBlock({
                "Content-Type": res.contentType || "\u27E8not present\u27E9",
              })
            : "";
        const chrome = pairChrome(pair);

        return (
          <article
            key={pair.id}
            style={{
              flexShrink: 0,
              border: `1px solid ${chrome.border}`,
              borderRadius: 12,
              background: chrome.background,
              overflow: "hidden",
            }}
          >
            <header
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 10px",
                minHeight: 34,
                boxSizing: "border-box",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.02em",
                textTransform: "uppercase",
                color: chrome.color,
                background: chrome.background,
                borderBottom: expanded
                  ? `1px solid ${chrome.border}`
                  : "none",
              }}
            >
              <button
                type="button"
                onClick={() => onToggleExpand(pair.id)}
                aria-expanded={expanded}
                aria-controls={`log-body-${pair.id}`}
                id={`log-header-${pair.id}`}
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  margin: 0,
                  padding: 0,
                  border: "none",
                  borderRadius: 6,
                  background: "transparent",
                  color: "inherit",
                  font: "inherit",
                  letterSpacing: "inherit",
                  textTransform: "inherit",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <LogChevron expanded={expanded} />
                <span style={{ minWidth: 0, lineHeight: 1.3 }}>
                  {pairCollapsedSummary(pair)}
                </span>
              </button>
            </header>
            {expanded ? (
              <div
                id={`log-body-${pair.id}`}
                role="region"
                aria-labelledby={`log-header-${pair.id}`}
              >
                {outboundToSnapText ? (
                  <div
                    style={{
                      borderBottom: "1px solid rgba(17, 24, 39, 0.08)",
                    }}
                  >
                    <div style={innerSectionBarStyle}>
                      <span style={{ minWidth: 0, lineHeight: 1.25 }}>
                        Snap server (proxy outbound request)
                      </span>
                      <CopyButton
                        partKey={outboundPartKey}
                        copiedLogPart={copiedLogPart}
                        text={outboundToSnapText}
                        label="snap server request"
                        onCopied={flashCopied}
                      />
                    </div>
                    <pre
                      style={{
                        ...preStyle,
                        minHeight: 0,
                        maxHeight: 280,
                      }}
                    >
                      {outboundToSnapText}
                    </pre>
                  </div>
                ) : null}
                <div
                  style={{
                    borderBottom: res
                      ? "1px solid rgba(17, 24, 39, 0.08)"
                      : undefined,
                  }}
                >
                  <div style={innerSectionBarStyle}>
                    <span style={{ minWidth: 0, lineHeight: 1.25 }}>
                      Emulator API (this page &rarr; /api/snap) &middot; headers
                    </span>
                    <CopyButton
                      partKey={emulatorHeadersPartKey}
                      copiedLogPart={copiedLogPart}
                      text={emulatorHeadersText}
                      label="emulator request headers"
                      onCopied={flashCopied}
                    />
                  </div>
                  <pre
                    style={{
                      ...preStyle,
                      minHeight: 0,
                      maxHeight: 100,
                      borderBottom: "1px solid rgba(17, 24, 39, 0.08)",
                    }}
                  >
                    {emulatorHeadersText}
                  </pre>
                  <div style={innerSectionBarStyle}>
                    <span style={{ minWidth: 0, lineHeight: 1.25 }}>
                      Emulator API &middot; body (JSON)
                    </span>
                    <CopyButton
                      partKey={reqPartKey}
                      copiedLogPart={copiedLogPart}
                      text={pair.request.content}
                      label="emulator request body"
                      onCopied={flashCopied}
                    />
                  </div>
                  <pre style={preStyle}>{pair.request.content}</pre>
                </div>
                {res ? (
                  <div>
                    {res.contentType !== undefined ? (
                      <div
                        style={{
                          borderBottom: "1px solid rgba(17, 24, 39, 0.08)",
                        }}
                      >
                        <div style={innerSectionBarStyle}>
                          <span style={{ minWidth: 0, lineHeight: 1.25 }}>
                            response headers
                          </span>
                          <CopyButton
                            partKey={responseHeadersPartKey}
                            copiedLogPart={copiedLogPart}
                            text={responseContentTypeLine}
                            label="response headers"
                            onCopied={flashCopied}
                          />
                        </div>
                        <pre
                          style={{
                            ...preStyle,
                            minHeight: 0,
                            maxHeight: 80,
                          }}
                        >
                          {responseContentTypeLine}
                        </pre>
                      </div>
                    ) : null}
                    <div style={innerSectionBarStyle}>
                      <span style={{ minWidth: 0, lineHeight: 1.25 }}>
                        response
                      </span>
                      <CopyButton
                        partKey={resPartKey}
                        copiedLogPart={copiedLogPart}
                        text={res.content}
                        label="response body"
                        onCopied={flashCopied}
                      />
                    </div>
                    <pre style={preStyle}>{res.content}</pre>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: "6px 8px 8px",
                      fontSize: 11,
                      color: "var(--text-muted)",
                      fontStyle: "italic",
                    }}
                  >
                    Waiting for response...
                  </div>
                )}
              </div>
            ) : null}
          </article>
        );
      })}
    </>
  );
}
