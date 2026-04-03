"use client";

export type EmulatorFormProps = {
  urlInput: string;
  onUrlChange: (url: string) => void;
  fidInput: string;
  onFidChange: (fid: string) => void;
  onLoad: () => void;
  loading: boolean;
};

export function EmulatorForm({
  urlInput,
  onUrlChange,
  fidInput,
  onFidChange,
  onLoad,
  loading,
}: EmulatorFormProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 16px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-surface)",
        flexShrink: 0,
      }}
    >
      <label
        htmlFor="snap-url"
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "var(--text-secondary)",
          flexShrink: 0,
        }}
      >
        Snap URL
      </label>
      <input
        id="snap-url"
        type="url"
        value={urlInput}
        onChange={(e) => onUrlChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onLoad();
        }}
        placeholder="https://..."
        autoComplete="off"
        spellCheck={false}
        style={{
          flex: 1,
          minWidth: 0,
          border: "1px solid var(--input-border)",
          background: "var(--input-bg)",
          borderRadius: 10,
          padding: "8px 12px",
          fontSize: 14,
          fontFamily: "inherit",
        }}
      />
      <label
        htmlFor="snap-fid"
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "var(--text-secondary)",
          flexShrink: 0,
        }}
      >
        FID
      </label>
      <input
        id="snap-fid"
        type="text"
        inputMode="numeric"
        value={fidInput}
        onChange={(e) => onFidChange(e.target.value)}
        placeholder="e.g. 12345"
        autoComplete="off"
        spellCheck={false}
        style={{
          width: 100,
          minWidth: 0,
          boxSizing: "border-box",
          border: "1px solid var(--input-border)",
          background: "var(--input-bg)",
          borderRadius: 10,
          padding: "8px 12px",
          fontSize: 14,
          fontFamily: "inherit",
        }}
      />
      <button
        type="button"
        onClick={onLoad}
        disabled={loading || !urlInput.trim()}
        style={{
          padding: "8px 18px",
          borderRadius: 10,
          border: "none",
          background:
            loading || !urlInput.trim()
              ? "var(--btn-disabled-bg)"
              : "var(--btn-primary-bg)",
          color: "var(--btn-primary-color)",
          fontWeight: 600,
          fontSize: 14,
          cursor: loading || !urlInput.trim() ? "not-allowed" : "pointer",
          flexShrink: 0,
        }}
      >
        {loading ? "Loading\u2026" : "Load"}
      </button>
    </div>
  );
}
