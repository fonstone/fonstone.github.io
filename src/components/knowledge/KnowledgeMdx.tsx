import { MDXRemote } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import MermaidDiagram from "./MermaidDiagram";

function FallbackImg(props: Record<string, unknown>) {
  const src = (props.src as string) ?? "";
  const alt = (props.alt as string) ?? "";
  return (
    <span className="block not-prose">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="rounded-xl border border-white/10"
      />
    </span>
  );
}

type Props = {
  source: string;
};

export default function KnowledgeMdx({ source }: Props) {
  return (
    <MDXRemote
      source={source}
      components={{
        img: FallbackImg,
        MermaidDiagram,
      }}
      options={{
        mdxOptions: {
          rehypePlugins: [
            rehypeSlug,
            [
              rehypePrettyCode,
              {
                theme: {
                  dark: "github-dark",
                  light: "github-light",
                },
                keepBackground: false,
              },
            ],
          ],
          remarkPlugins: [remarkGfm],
        },
      }}
    />
  );
}
