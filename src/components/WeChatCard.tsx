"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { MessageCircle } from "lucide-react";

export default function WeChatCard() {
  const [showImage, setShowImage] = useState(false);

  const handleOpen = useCallback(() => setShowImage(true), []);
  const handleClose = useCallback(() => setShowImage(false), []);

  useEffect(() => {
    if (!showImage) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowImage(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showImage]);

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={handleOpen}
        onKeyDown={(e) => e.key === "Enter" && handleOpen()}
        className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 hover:bg-slate-100 transition-colors dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 w-full max-w-xs cursor-pointer"
      >
        <div className="w-12 h-12 bg-green-100 dark:bg-green-500/15 rounded-2xl flex items-center justify-center">
          <MessageCircle className="w-6 h-6 text-green-500 dark:text-green-300" />
        </div>
        <div className="flex flex-col">
          <div className="font-semibold">WeChat</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            点击查看二维码
          </div>
        </div>
      </div>

      {showImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-500"
          />
          <div
            className="relative z-10 opacity-100 scale-100 transition-all duration-500 ease-in-out"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(59,130,246,0.3)] animate-[breathe_4s_ease-in-out_infinite] bg-white p-4 dark:bg-slate-900">
              <Image
                src="/wehcart.jpg"
                alt="WeChat QR Code"
                width={400}
                height={400}
                className="rounded-2xl w-[320px] h-[320px] md:w-[400px] md:h-[400px] object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
