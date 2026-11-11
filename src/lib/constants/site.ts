export const SITE_URL = "https://fonstone.github.io";
export const SITE_NAME = "StoneFon";
export const SITE_AUTHOR = "StoneFon";
export const SITE_TITLE = "StoneFon，从内核到智能系统";

export const SITE_DESCRIPTION =
  "StoneFon 的知识空间。记录操作系统内核、系统软件、AI 在边缘设备上的部署，以及自动驾驶系统栈里的工程实践与动手项目。";

export const SITE_KEYWORDS = [
  "嵌入式系统",
  "操作系统内核",
  "Linux 内核",
  "ARM64",
  "RISC-V",
  "边缘 AI",
  "模型部署",
  "异构计算",
  "超低时延",
  "自动驾驶",
  "技术博客",
];

export function absoluteUrl(pathname: string) {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return new URL(normalized, SITE_URL).toString();
}

export function toValidDate(value?: string) {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}
