import { MDXRemote } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import MdxImage from "./MdxImage";
import MermaidDiagram from "./MermaidDiagram";

type Props = {
  source: string;
};

export default function KnowledgeMdx({ source }: Props) {
  return (
    <MDXRemote
      source={source}
      components={{
        img: MdxImage,
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
