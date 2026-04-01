import KnowledgeCards from "@/components/knowledge/KnowledgeCards";
import { getAllKnowledgePosts } from "@/lib/knowledge/knowledge";

export default async function KnowledgeIndexPage() {
  const posts = await getAllKnowledgePosts();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold">文章</h1>
        <p className="text-sm text-white/70">
          按分类沉淀笔记与思考，支持 MDX、代码高亮与图片模糊占位。
        </p>
      </header>

      <KnowledgeCards posts={posts} showCategory />
    </div>
  );
}

