/**
 * 浏览器控制台的启动日志。仅在客户端挂载时执行一次，不轮询，不清理控制台。
 */

declare global {
  interface Window {
    stonefon?: {
      boot: () => void;
      info: () => void;
    };
  }
}

const BOOT_LINES = [
  "[    0.000000] stonefon boot: from silicon to system",
  "[    0.000412] cpu: ARM64 / RISC-V awareness ........ ok",
  "[    0.001237] bsp: device tree parsed, 0 warnings",
  "[    0.004981] mm: page tables and memory barriers .. ok",
  "[    0.009314] sched: deterministic path enabled",
  "[    0.014002] virt: qemu device model .............. ok",
  "[    0.021770] edge-ai: npu runtime registered",
  "[    0.033115] mount: knowledge space ready",
];

const LINE_STYLE =
  "color: #7dd3fc; font-family: ui-monospace, monospace; font-size: 12px; line-height: 1.6;";
const TITLE_STYLE = "color: #5eead4; font-size: 14px; font-weight: 500;";

function printBoot() {
  console.log("%cStoneFon / 从内核到智能系统", TITLE_STYLE);
  for (const line of BOOT_LINES) {
    console.log(`%c${line}`, LINE_STYLE);
  }
  console.log("%chttps://fonstone.github.io", LINE_STYLE);
}

export const consoleUtil = {
  init() {
    if (typeof window === "undefined") return;
    try {
      printBoot();
      window.stonefon = {
        boot: printBoot,
        info: () => {
          console.log("%cStoneFon / 知识空间", TITLE_STYLE);
          console.log("%c/knowledge 技术长文 · /projects 课程与实验", LINE_STYLE);
          console.log("%chttps://github.com/fonstone", LINE_STYLE);
        },
      };
    } catch {
      // 控制台不可用时静默跳过
    }
  },
};
