"use client";

import { useEffect } from "react";

/**
 * 文章页的零侵入阅读增强：代码复制按钮、图片灯箱、阅读进度条。
 * 直接操作已渲染的 DOM，MDX 编译链与 rehype-pretty-code 输出完全不动，
 * 因此知识文章和课程章节两类详情页可以共用。
 */
export default function ArticleEnhancements() {
  useEffect(() => {
    const article = document.querySelector("article");
    if (!article) return;

    const cleanups: Array<() => void> = [];

    // 1. 代码复制
    const copyButtons: HTMLButtonElement[] = [];
    const pres = Array.from(article.querySelectorAll<HTMLElement>(".prose pre"));
    for (const pre of pres) {
      if (pre.querySelector(".sf-copy-btn")) continue;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "sf-copy-btn";
      button.textContent = "复制";
      button.setAttribute("aria-label", "复制代码");
      button.dataset.sfCopy = "true";
      let resetTimer = 0;
      const onClick = async () => {
        const code = pre.querySelector("code")?.textContent ?? pre.textContent ?? "";
        try {
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(code);
          } else {
            const textarea = document.createElement("textarea");
            textarea.value = code;
            textarea.style.position = "fixed";
            textarea.style.opacity = "0";
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            textarea.remove();
          }
          button.textContent = "已复制";
          button.dataset.copied = "true";
        } catch {
          button.textContent = "复制失败";
        }
        window.clearTimeout(resetTimer);
        resetTimer = window.setTimeout(() => {
          button.textContent = "复制";
          delete button.dataset.copied;
        }, 1800);
      };
      button.addEventListener("click", onClick);
      pre.appendChild(button);
      copyButtons.push(button);
      cleanups.push(() => {
        window.clearTimeout(resetTimer);
        button.removeEventListener("click", onClick);
        button.remove();
      });
    }

    // 2. 图片灯箱
    const images = Array.from(article.querySelectorAll<HTMLImageElement>(".prose img"));
    let lightbox: HTMLDivElement | null = null;
    const closeLightbox = () => {
      lightbox?.remove();
      lightbox = null;
      document.body.style.overflow = "";
    };
    const openLightbox = (img: HTMLImageElement) => {
      closeLightbox();
      const overlay = document.createElement("div");
      overlay.className = "sf-lightbox";
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-modal", "true");
      overlay.setAttribute("aria-label", "查看大图");

      const large = document.createElement("img");
      large.src = img.currentSrc || img.src;
      large.alt = img.alt;
      overlay.appendChild(large);

      const close = document.createElement("button");
      close.type = "button";
      close.className = "sf-lightbox-close";
      close.textContent = "关闭 ✕";
      close.addEventListener("click", (event) => {
        event.stopPropagation();
        closeLightbox();
      });
      overlay.appendChild(close);

      if (img.alt) {
        const caption = document.createElement("div");
        caption.className = "sf-lightbox-caption";
        caption.textContent = img.alt;
        overlay.appendChild(caption);
      }

      overlay.addEventListener("click", (event) => {
        if (event.target === overlay || event.target === large) closeLightbox();
      });
      document.body.appendChild(overlay);
      lightbox = overlay;
      document.body.style.overflow = "hidden";
      close.focus();
    };

    const imageHandlers: Array<() => void> = [];
    for (const img of images) {
      img.classList.add("sf-prose-img");
      const onClick = (event: MouseEvent) => {
        event.preventDefault();
        openLightbox(img);
      };
      img.addEventListener("click", onClick);
      imageHandlers.push(() => img.removeEventListener("click", onClick));
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && lightbox) closeLightbox();
    };
    window.addEventListener("keydown", onKeyDown);

    // 3. 阅读进度条
    const progress = document.createElement("div");
    progress.className = "sf-reading-progress";
    progress.setAttribute("aria-hidden", "true");
    document.body.appendChild(progress);
    let ticking = false;
    const updateProgress = () => {
      const rect = article.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight * 0.6;
      const passed = -rect.top + window.innerHeight * 0.25;
      const pct = scrollable <= 0 ? 100 : Math.min(100, Math.max(0, (passed / scrollable) * 100));
      progress.style.width = `${pct}%`;
      ticking = false;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateProgress);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    updateProgress();

    return () => {
      for (const cleanup of cleanups) cleanup();
      for (const off of imageHandlers) off();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      closeLightbox();
      progress.remove();
    };
  }, []);

  return null;
}
