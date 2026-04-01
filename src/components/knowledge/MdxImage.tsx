import Image, { type ImageProps } from "next/image";
import { getImageBlurData } from "@/lib/knowledge/blur";

type Props = Omit<ImageProps, "src" | "alt"> & {
  src?: string;
  alt?: string;
};

function toNumber(v: unknown) {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return undefined;
}

export default async function MdxImage(props: Props) {
  const src = props.src ?? "";
  const alt = props.alt ?? "";

  const widthProp = toNumber(props.width);
  const heightProp = toNumber(props.height);

  const blur = src.startsWith("/") ? await getImageBlurData(src) : {};

  const width = widthProp ?? blur.width ?? 1200;
  const height = heightProp ?? blur.height ?? 800;

  return (
    <span className="block not-prose">
      <Image
        {...props}
        src={src}
        alt={alt}
        width={width}
        height={height}
        placeholder={blur.blurDataURL ? "blur" : "empty"}
        blurDataURL={blur.blurDataURL}
        sizes="(max-width: 1024px) 100vw, 768px"
        className={`rounded-xl border border-white/10 ${props.className ?? ""}`}
      />
    </span>
  );
}

