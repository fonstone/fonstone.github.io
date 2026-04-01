import fs from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { getPlaiceholder } from "plaiceholder";
import sharp from "sharp";

type BlurResult = {
  blurDataURL?: string;
  width?: number;
  height?: number;
};

function isRemoteUrl(src: string) {
  return /^https?:\/\//i.test(src);
}

function resolvePublicFile(src: string) {
  const cleaned = src.startsWith("/") ? src.slice(1) : src;
  return path.join(process.cwd(), "public", cleaned);
}

export const getImageBlurData = cache(async (src: string): Promise<BlurResult> => {
  if (!src || isRemoteUrl(src)) return {};

  const filePath = resolvePublicFile(src);

  try {
    const buf = await fs.readFile(filePath);
    const meta = await sharp(buf).metadata();
    const plaice = await getPlaiceholder(buf);

    return {
      blurDataURL: plaice.base64,
      width: meta.width,
      height: meta.height,
    };
  } catch {
    return {};
  }
});

