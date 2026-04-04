import { getAllKnowledgePosts, getKnowledgeCategories, getAllTags } from "@/lib/knowledge/knowledge";
import KnowledgeTagFilter from "@/components/knowledge/KnowledgeTagFilter";

export default async function KnowledgeIndexPage() {
  const allPosts = await getAllKnowledgePosts();
  const categories = await getKnowledgeCategories();
  const allTags = await getAllTags();

  return (
    <KnowledgeTagFilter
      allPosts={allPosts}
      categories={categories}
      allTags={allTags}
    />
  );
}
