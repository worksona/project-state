"use client";

import { useEffect, useRef, useState } from "react";

let mermaidPromise: Promise<typeof import("mermaid").default> | null = null;

function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then((m) => {
      m.default.initialize({
        startOnLoad: false,
        theme: "default",
        securityLevel: "loose",
        fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        themeVariables: {
          primaryColor: "#eef2ff",
          primaryBorderColor: "#6366f1",
          primaryTextColor: "#0f172a",
          lineColor: "#475569",
          secondaryColor: "#fef3c7",
          tertiaryColor: "#fdf2f8",
          fontSize: "13px",
        },
      });
      return m.default;
    });
  }
  return mermaidPromise;
}

export default function Mermaid({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const idRef = useRef(`mmd-${Math.random().toString(36).slice(2, 10)}`);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = await loadMermaid();
        const { svg } = await mermaid.render(idRef.current, code);
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (error) {
    return (
      <div className="my-4 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-900">
        <div className="font-semibold mb-1">Mermaid render error</div>
        <pre className="whitespace-pre-wrap font-mono text-[11px]">{error}</pre>
        <details className="mt-2">
          <summary className="cursor-pointer">Source</summary>
          <pre className="mt-1 whitespace-pre-wrap font-mono text-[11px]">{code}</pre>
        </details>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="my-4 flex justify-center bg-white border border-[var(--border)] rounded-lg p-4 overflow-x-auto"
    />
  );
}
