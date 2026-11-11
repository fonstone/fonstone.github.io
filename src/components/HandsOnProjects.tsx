import Link from "next/link";
import { ArrowRight, Wrench } from "lucide-react";
import BoltCard from "@/components/ui/BoltCard";
import { COURSES, FEATURED_HANDS_ON } from "@/lib/constants/courses";

type ProjectCard = {
  slug: string;
  shortTitle: string;
  level: string;
  goal: string;
  also: string;
  chapters: number;
};

/**
 * 首页「项目实战」板块。
 * 精选课程由 FEATURED_HANDS_ON 指定，标题、难度与成果物文案取自 COURSES，
 * 章节数由页面从 projects/ 目录派生，不维护第二份内容清单。
 */
export default function HandsOnProjects({
  chapterCounts,
}: {
  chapterCounts: Map<string, number>;
}) {
  const projects = FEATURED_HANDS_ON.flatMap((pick): ProjectCard[] => {
    const course = COURSES.find((c) => c.slug === pick.slug);
    if (!course) return [];
    return [
      {
        slug: course.slug,
        shortTitle: course.shortTitle,
        level: course.level,
        goal: course.outcomes[pick.outcomeIndex] ?? course.outcomes[0],
        also: course.outcomes.find((_, i) => i !== pick.outcomeIndex) ?? "",
        chapters: chapterCounts.get(course.slug) ?? 0,
      },
    ];
  });

  if (projects.length === 0) return null;

  return (
    <section id="hands-on" className="max-w-7xl mx-auto mb-16">
      <div className="flex items-center gap-3 mb-8 justify-center">
        <Wrench className="w-8 h-8 text-emerald-500" />
        <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
          项目实战
        </h2>
      </div>
      <BoltCard className="p-8">
        <p className="mb-6 text-center text-sm text-slate-500 dark:text-slate-400">
          原理读完就该动手。下面四门课都按实验顺序排好了章节，每张卡写的是学完能做出来的东西。
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {projects.map((project) => (
            <Link
              key={project.slug}
              href={`/projects/${project.slug}`}
              className="group flex flex-col gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-5 hover:border-emerald-400 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-emerald-500 transition-colors"
            >
              <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400 dark:text-slate-500">
                <span>{project.shortTitle}</span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
                  {project.level}
                </span>
              </div>
              <div className="text-sm font-semibold leading-snug text-slate-900 group-hover:text-emerald-600 dark:text-slate-100 dark:group-hover:text-emerald-300">
                {project.goal}
              </div>
              <div className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                还会做到：{project.also}
              </div>
              <div className="mt-auto flex items-center justify-between gap-2 pt-2 text-[11px] text-emerald-600 dark:text-emerald-300">
                <span>{project.chapters} 章 · 从总纲开始</span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0" />
              </div>
            </Link>
          ))}
        </div>
        <p className="mt-5 text-center text-[11px] text-slate-400 dark:text-slate-500">
          全部 {COURSES.length} 门课程与难度、前置要求见
          <Link href="/projects" className="mx-1 text-emerald-600 hover:underline dark:text-emerald-300">
            课程总览
          </Link>
          ，做过哪些章节可以在
          <Link href="/progress" className="mx-1 text-emerald-600 hover:underline dark:text-emerald-300">
            进度仪表盘
          </Link>
          里回看。
        </p>
      </BoltCard>
    </section>
  );
}
