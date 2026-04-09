import { getAllKnowledgePosts, getKnowledgeCategories, getAllTags } from "@/lib/knowledge/knowledge";
import KnowledgeTagFilter from "@/components/knowledge/KnowledgeTagFilter";
import { Suspense } from "react";

export default async function KnowledgeIndexPage() {
  const allPosts = await getAllKnowledgePosts();
  const categories = await getKnowledgeCategories();
  const allTags = await getAllTags();

  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-6">
          <div className="h-8 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          <div className="flex gap-2">
            <div className="h-6 w-16 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
            <div className="h-6 w-20 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
            <div className="h-6 w-12 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
      }
    >
      <KnowledgeTagFilter allPosts={allPosts} categories={categories} allTags={allTags} />
    </Suspense>
  );
}
