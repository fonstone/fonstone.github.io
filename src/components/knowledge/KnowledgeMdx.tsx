import { MDXRemote } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";
import MdxImage from "./MdxImage";

type Props = {
  source: string;
};

export default function KnowledgeMdx({ source }: Props) {
  return (
    <MDXRemote
      source={source}
      components={{
        img: MdxImage,
      }}
      options={{
        mdxOptions: {
          rehypePlugins: [
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
        },
      }}
    />
  );
}

