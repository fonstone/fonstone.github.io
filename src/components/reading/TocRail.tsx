"use client";

import { useEffect, useId, useRef, useState } from "react";
import clsx from "clsx";
import { ListTree, Pin, PinOff } from "lucide-react";

type Heading = {
  id: string;
  text: string;
  level: number;
};

type Props = {
  headings: Heading[];
};

/**
 * 桌面端右侧目录：默认只占 44px 的窄轨道，把宽度让给正文。
 * 鼠标靠近 / 键盘聚焦时以浮层展开（不挤压正文布局），点击轨道可固定展开。
 * xl 以下完全不渲染，小屏保持正文全宽。
 */
export default function TocRail({ headings }: Props) {
  const [activeId, setActiveId] = useState("");
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const panelId = useId();
  const open = pinned || hovered || focused;
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 鼠标只是路过右边缘时不要立刻弹出，停驻 120ms 才算「靠近」
  const scheduleHover = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setHovered(true), 120);
  };
  const cancelHover = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setHovered(false);
  };

  useEffect(() => () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: "0px 0px -80% 0px" }
    );

    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  useEffect(() => {
    if (!pinned) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPinned(false);
        setHovered(false);
        setFocused(false);
        const active = document.activeElement as HTMLElement | null;
        if (active?.closest("[data-toc-group]")) active.blur();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pinned]);

  if (headings.length === 0) return null;

  return (
    <aside className="relative hidden w-11 shrink-0 xl:block">
      <div
        data-toc-group
        className="group sticky top-[88px] flex justify-end"
        onMouseEnter={scheduleHover}
        onMouseLeave={cancelHover}
        onFocusCapture={(event) => {
          // 鼠标点击让按钮获得焦点时不要误判成键盘操作，否则目录会一直展开
          const target = event.target;
          if (target instanceof HTMLElement && target.matches(":focus-visible")) {
            setFocused(true);
          }
        }}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setFocused(false);
          }
        }}
      >
        {/* 轨道左侧的透明感应区：鼠标从正文往右靠近就展开，不必精确命中窄条 */}
        <div aria-hidden className="absolute -left-6 top-0 h-36 w-6" />

        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={pinned ? "取消固定目录" : "展开并固定目录"}
          title={pinned ? "已固定，点击取消（Esc）" : "鼠标靠近展开，点击可固定"}
          onClick={() => setPinned((value) => !value)}
          className={clsx(
            "relative z-20 flex h-36 w-11 flex-col items-center justify-center gap-2 rounded-l-xl border border-r-0 border-slate-200 bg-white/75 text-slate-500 shadow-sm backdrop-blur-sm transition-colors",
            "hover:border-blue-400 hover:text-blue-600 dark:border-slate-700/80 dark:bg-slate-900/60 dark:text-slate-400 dark:hover:border-sky-500/60 dark:hover:text-sky-400",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500",
            pinned && "border-blue-400 text-blue-600 dark:border-sky-500/70 dark:text-sky-400"
          )}
        >
          <ListTree className="h-4 w-4" aria-hidden />
          <span className="text-xs font-medium tracking-widest [writing-mode:vertical-rl]">
            目录
          </span>
          <span className="text-[10px] tabular-nums opacity-70">{headings.length}</span>
        </button>

        <div
          id={panelId}
          aria-hidden={!open}
          className={clsx(
            "absolute right-11 top-0 z-10 w-56 rounded-xl border border-slate-300/80 bg-white/95 p-3.5 shadow-2xl ring-1 ring-slate-900/5 backdrop-blur-md transition-all duration-200 ease-out",
            "dark:border-slate-600/70 dark:bg-slate-900/95 dark:ring-white/5",
            open
              ? "translate-x-0 opacity-100"
              : "pointer-events-none translate-x-3 opacity-0"
          )}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">目录</h3>
            <button
              type="button"
              tabIndex={open ? 0 : -1}
              aria-label={pinned ? "取消固定目录" : "固定目录"}
              title={pinned ? "取消固定" : "固定展开"}
              onClick={() => setPinned((value) => !value)}
              className={clsx(
                "rounded-md p-1 transition-colors hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800 dark:hover:text-sky-400",
                pinned ? "text-blue-600 dark:text-sky-400" : "text-slate-400 dark:text-slate-500"
              )}
            >
              {pinned ? (
                <PinOff className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <Pin className="h-3.5 w-3.5" aria-hidden />
              )}
            </button>
          </div>

          <nav
            className="max-h-[68vh] overflow-y-auto pr-1"
            style={{ scrollbarWidth: "thin" }}
            aria-label="文章目录"
          >
            <ul className="space-y-1">
              {headings.map((h) => (
                <li key={h.id}>
                  <a
                    href={`#${h.id}`}
                    tabIndex={open ? 0 : -1}
                    onClick={() => {
                      if (!pinned) setHovered(false);
                    }}
                    className={clsx(
                      "block rounded-md py-1 text-xs leading-relaxed transition-colors line-clamp-2 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-800/70 dark:hover:text-sky-400",
                      activeId === h.id
                        ? "bg-blue-50 font-medium text-blue-600 dark:bg-sky-500/10 dark:text-sky-400"
                        : "text-slate-500 dark:text-slate-400"
                    )}
                    style={{ paddingLeft: `${8 + (h.level - 1) * 12}px`, paddingRight: "8px" }}
                  >
                    {h.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </aside>
  );
}
