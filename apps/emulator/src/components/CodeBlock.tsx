"use client";

import { useRef, useState } from "react";
import { Copy, Check } from "lucide-react";

export default function CodeBlock(props: React.HTMLAttributes<HTMLPreElement>) {
  const preRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = preRef.current?.textContent ?? "";
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="code-block-wrapper">
      <button
        type="button"
        className="code-copy-btn"
        onClick={handleCopy}
        title="Copy to clipboard"
        aria-label="Copy code to clipboard"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
      <pre ref={preRef} {...props} />
    </div>
  );
}
