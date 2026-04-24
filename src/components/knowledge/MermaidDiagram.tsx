"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  chart: string;
};

export default function MermaidDiagram({ chart }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "neutral",
          themeVariables: {
            fontSize: "14px",
          },
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            curve: "basis",
          },
        });

        const id = `mermaid-${Math.random().toString(36).slice(2, 10)}`;
        const { svg: renderedSvg } = await mermaid.render(id, chart.trim());
        if (!cancelled) {
          setSvg(renderedSvg);
          setError(false);
        }
      } catch {
        if (!cancelled) {
          setError(true);
        }
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [chart]);

  if (error) {
    return (
      <div className="not-prose my-6 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
        <p className="mb-2 text-sm font-semibold text-slate-600 dark:text-slate-400">
          Mermaid Diagram
        </p>
        <pre className="text-xs text-slate-500 dark:text-slate-400">{chart}</pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="not-prose my-6 flex h-32 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
        <span className="text-sm text-slate-400">Rendering diagram...</span>
      </div>
    );
  }

  return (
    <div
      className="not-prose my-6 w-full overflow-x-auto rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 [&>svg]:max-w-full [&>svg]:h-auto"
      ref={containerRef}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}