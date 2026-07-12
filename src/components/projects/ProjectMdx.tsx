import { MDXRemote } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import MdxImage from "@/components/knowledge/MdxImage";
import MermaidDiagram from "@/components/knowledge/MermaidDiagram";

type Props = {
  source: string;
  format?: "md" | "mdx";
};

export default function ProjectMdx({ source, format }: Props) {
  return (
    <MDXRemote
      source={source}
      components={{
        img: MdxImage,
        MermaidDiagram,
      }}
      options={{
        mdxOptions: {
          format: format ?? "mdx",
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
