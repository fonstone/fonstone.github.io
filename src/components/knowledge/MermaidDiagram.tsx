"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

type Props = {
  chart: string;
};

/** 读取 globals.css 里的 Mermaid 主题变量，配色与字体只在 CSS 一处维护 */
function readMermaidTheme() {
  const style = getComputedStyle(document.documentElement);
  const v = (name: string) => style.getPropertyValue(name).trim();
  const surface = v("--mm-surface");
  const clusterBg = v("--mm-cluster-bg");
  const clusterBorder = v("--mm-cluster-border");
  const clusterFg = v("--mm-cluster-fg");
  const nodeBg = v("--mm-node-bg");
  const nodeBorder = v("--mm-node-border");
  const nodeFg = v("--mm-node-fg");
  const line = v("--mm-line");
  const fg = v("--mm-fg");

  return {
    background: surface,
    primaryColor: nodeBg,
    primaryTextColor: nodeFg,
    primaryBorderColor: nodeBorder,
    secondaryColor: nodeBg,
    secondaryTextColor: nodeFg,
    secondaryBorderColor: nodeBorder,
    tertiaryColor: clusterBg,
    tertiaryTextColor: clusterFg,
    tertiaryBorderColor: clusterBorder,
    lineColor: line,
    textColor: fg,
    arrowheadColor: line,
    clusterBkg: clusterBg,
    clusterBorder,
    titleColor: clusterFg,
    edgeLabelBackground: surface,
    nodeBkg: nodeBg,
    nodeBorder,
    nodeTextColor: nodeFg,
    mainBkg: nodeBg,
    defaultLinkColor: line,
    noteBkgColor: v("--mm-note-bg"),
    noteTextColor: v("--mm-note-fg"),
    noteBorderColor: v("--mm-note-border"),
    actorBkg: nodeBg,
    actorBorder: nodeBorder,
    actorTextColor: nodeFg,
    actorLineColor: line,
    signalColor: fg,
    signalTextColor: fg,
    labelBoxBkgColor: nodeBg,
    labelBoxBorderColor: nodeBorder,
    labelTextColor: nodeFg,
    loopTextColor: clusterFg,
    // 甘特图：默认 section / task 是纯白，深色下会变成刺眼亮块，统一收进主题色
    sectionBkgColor: clusterBg,
    sectionBkgColor2: nodeBg,
    altSectionBkgColor: clusterBg,
    taskBkgColor: nodeBg,
    taskBorderColor: nodeBorder,
    taskTextColor: nodeFg,
    taskTextLightColor: nodeFg,
    taskTextDarkColor: fg,
    taskTextOutsideColor: fg,
    activeTaskBkgColor: nodeBg,
    activeTaskBorderColor: nodeBorder,
    doneTaskBkgColor: clusterBg,
    doneTaskBorderColor: clusterBorder,
    critBkgColor: v("--mm-note-bg"),
    critBorderColor: v("--mm-note-border"),
    critTextColor: v("--mm-note-fg"),
    gridColor: clusterBorder,
    excludeBkgColor: clusterBg,
    todayLineColor: line,
    activationBkgColor: clusterBg,
    activationBorderColor: clusterBorder,
    fontFamily: v("--font-chart"),
    fontSize: v("--mm-font-size") || "16px",
  };
}

/** Mermaid 在构建期不执行，主题必须等客户端拿到 <html class="dark"> 后再决定 */
export default function MermaidDiagram({ chart }: Props) {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [minRenderWidth, setMinRenderWidth] = useState<number | undefined>();

  useEffect(() => {
    const sync = () => setIsDark(document.documentElement.classList.contains("dark"));
    sync();
    const onThemeChange = (event: Event) => {
      const detail = (event as CustomEvent<{ dark?: boolean }>).detail;
      setIsDark(typeof detail?.dark === "boolean" ? detail.dark : document.documentElement.classList.contains("dark"));
    };
    window.addEventListener("stonefon-theme-change", onThemeChange);
    // 系统主题变化由 layout 的首帧脚本派发同一个事件，"跟随系统" 时也能重绘
    return () => window.removeEventListener("stonefon-theme-change", onThemeChange);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;
        // 只有 base 主题允许完全自定义变量；dark / neutral 会锁死 cluster、node、edgeLabel 的默认色
        mermaid.initialize({
          startOnLoad: false,
          theme: "base",
          themeVariables: readMermaidTheme(),
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            curve: "basis",
            // 字号上调后补偿节点间距，避免整张图被等比放大、屏幕上反而看不出变清晰
            nodeSpacing: 30,
            rankSpacing: 34,
          },
        });

        const id = `mermaid-${Math.random().toString(36).slice(2, 10)}`;
        const { svg: renderedSvg } = await mermaid.render(id, chart.trim());
        if (!cancelled) {
          // 宽图若被压到容器宽度，SVG 内 17px 的字在屏幕上只剩约 10px。
          // 给一个下限宽度，配合容器横向滚动，保证缩放比不低于 0.8。
          const viewBoxWidth = Number(renderedSvg.match(/viewBox="0 0 ([\d.]+)/)?.[1] ?? 0);
          setSvg(renderedSvg);
          setMinRenderWidth(viewBoxWidth > 700 ? Math.round(viewBoxWidth * 0.8) : undefined);
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
  }, [chart, isDark]);

  if (error) {
    return (
      <div className="sf-mermaid not-prose my-6 overflow-x-auto rounded-xl">
        <p className="mb-2 text-sm font-semibold">Mermaid Diagram</p>
        <pre className="whitespace-pre-wrap font-mono text-xs">{chart}</pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="sf-mermaid not-prose my-6 flex h-32 items-center justify-center rounded-xl">
        <span className="text-sm opacity-60">Rendering diagram...</span>
      </div>
    );
  }

  return (
    <div
      className="sf-mermaid not-prose my-6 w-full overflow-x-auto rounded-xl [&>svg]:max-w-full [&>svg]:h-auto"
      style={
        minRenderWidth
          ? ({ "--mm-render-min": `${minRenderWidth}px` } as CSSProperties)
          : undefined
      }
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
