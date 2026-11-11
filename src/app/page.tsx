import Image from "next/image";
import Link from "next/link";
import {
  Bike,
  Brain,
  Briefcase,
  Box,
  CircuitBoard,
  Coffee,
  Compass,
  Cpu as CpuIcon,
  Github,
  Globe,
  Layers3,
  Mail,
  MapPin,
  Monitor,
  Trophy,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import BoltCard from "@/components/ui/BoltCard";
import WeChatCard from "@/components/WeChatCard";
import OfficialAccountCard from "@/components/OfficialAccountCard";
import SystemStack from "@/components/SystemStack";
import ProgressSummary from "@/components/course/ProgressSummary";
import { contactInfo } from "@/lib/constants/contact";
import { profile, aboutDescription, personImage } from "@/lib/constants/siteContent";
import { socials } from "@/lib/constants/socials";
import { getAllKnowledgePosts, getKnowledgeCategories, categoryToSlug } from "@/lib/knowledge/knowledge";
import { getProjectCategories, isChapterIndex } from "@/lib/projects/projects";
import { COURSES, type CourseIcon } from "@/lib/constants/courses";
import { getStackData } from "@/lib/learningMapData";
import HandsOnProjects from "@/components/HandsOnProjects";
import type { ProgressCourse } from "@/lib/courseProgress";

function getCourseIcon(icon: CourseIcon): { Icon: LucideIcon; className: string } {
  const map: Record<CourseIcon, { Icon: LucideIcon; className: string }> = {
    cpu: { Icon: Monitor, className: "bg-blue-100 dark:bg-blue-500/15 text-blue-500 dark:text-blue-300" },
    brain: { Icon: Brain, className: "bg-purple-100 dark:bg-purple-500/15 text-purple-500 dark:text-purple-300" },
    circuit: { Icon: CircuitBoard, className: "bg-green-100 dark:bg-green-500/15 text-green-500 dark:text-green-300" },
    monitor: { Icon: Monitor, className: "bg-cyan-100 dark:bg-cyan-500/15 text-cyan-500 dark:text-cyan-300" },
    box: { Icon: Box, className: "bg-orange-100 dark:bg-orange-500/15 text-orange-500 dark:text-orange-300" },
    network: { Icon: Globe, className: "bg-teal-100 dark:bg-teal-500/15 text-teal-500 dark:text-teal-300" },
    binary: { Icon: Coffee, className: "bg-amber-100 dark:bg-amber-500/15 text-amber-500 dark:text-amber-300" },
    chip: { Icon: CpuIcon, className: "bg-red-100 dark:bg-red-500/15 text-red-500 dark:text-red-300" },
  };
  return map[icon] ?? map.cpu;
}

function getCategoryIcon(category: string): {
  Icon: LucideIcon;
  iconWrapClassName: string;
  iconClassName: string;
} {
  const key = category.toLowerCase();
  if (key.includes("ai")) {
    return {
      Icon: Brain,
      iconWrapClassName: "bg-blue-100 dark:bg-blue-500/15",
      iconClassName: "text-blue-500 dark:text-blue-300",
    };
  }
  if (key.includes("os")) {
    return {
      Icon: Coffee,
      iconWrapClassName: "bg-pink-100 dark:bg-pink-500/15",
      iconClassName: "text-pink-500 dark:text-pink-300",
    };
  }
  if (key.includes("管理") || key.includes("management")) {
    return {
      Icon: Briefcase,
      iconWrapClassName: "bg-red-100 dark:bg-red-500/15",
      iconClassName: "text-red-500 dark:text-red-300",
    };
  }
  if (key.includes("自动") || key.includes("驾驶")) {
    return {
      Icon: Bike,
      iconWrapClassName: "bg-yellow-100 dark:bg-yellow-500/15",
      iconClassName: "text-yellow-500 dark:text-yellow-300",
    };
  }
  return {
    Icon: Globe,
    iconWrapClassName: "bg-green-100 dark:bg-green-500/15",
    iconClassName: "text-green-500 dark:text-green-300",
  };
}

export default async function Home() {
  const [categories, allPosts, projectCategories, stackData] = await Promise.all([
    getKnowledgeCategories(),
    getAllKnowledgePosts(),
    getProjectCategories(),
    getStackData(),
  ]);
  const latestPosts = allPosts.slice(0, 6);
  const projectCounts = new Map(
    projectCategories.map((c) => [c.slug, c.posts.length])
  );
  const progressCourses: ProgressCourse[] = COURSES.filter((course) =>
    projectCategories.some((c) => c.slug === course.slug)
  ).map((course) => ({
    slug: course.slug,
    shortTitle: course.shortTitle,
    title: course.title,
    level: course.level,
    chapters: (projectCategories.find((c) => c.slug === course.slug)?.posts ?? [])
      .filter((post) => !isChapterIndex(post.slug))
      .map((post) => post.slug),
  }));

  return (
    <div className="min-h-screen bg-transparent text-slate-900 dark:text-slate-100">
      <main className="pb-16 px-6">
        <section id="home" className="max-w-7xl mx-auto mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <div className="relative flex items-center justify-center py-10 lg:py-14">
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="breathe-glow h-[360px] w-[360px] rounded-full bg-gradient-to-br from-blue-500/25 to-purple-500/20 blur-3xl dark:from-cyan-400/20 dark:to-blue-500/25" />
              </div>
              <div className="breathe relative h-64 w-64 md:h-72 md:w-72 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
                <Image
                  src={personImage.src}
                  alt={personImage.alt}
                  width={768}
                  height={768}
                  priority
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            <div className="px-1 lg:px-0">
              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Hi! 我是 {profile.name}
                </span>
              </h1>

              <h2 className="mt-5 text-lg md:text-xl font-medium text-slate-800 dark:text-slate-100">
                {profile.headline}
              </h2>

              <p className="mt-6 text-slate-600 dark:text-slate-300 leading-relaxed text-justify">
                {aboutDescription}
              </p>

              {profile.locationLine && (
                <div className="mt-6 flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <MapPin className="w-5 h-5" />
                  <span>{profile.locationLine}</span>
                </div>
              )}

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/start"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 text-sm font-medium text-white hover:from-blue-700 hover:to-cyan-600 transition-colors shadow-[0_10px_30px_rgba(0,0,0,0.08)]"
                >
                  <Compass className="w-5 h-5" />
                  从这里开始
                </Link>
                <a
                  href={socials.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-medium text-slate-700 border border-slate-200 hover:border-blue-400 hover:text-blue-600 transition-colors dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700"
                >
                  <Github className="w-5 h-5" />
                  GitHub
                </a>
                <a
                  href={`mailto:${contactInfo.email}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-purple-500 px-6 py-3 text-sm font-medium text-white hover:bg-purple-600 transition-colors shadow-[0_10px_30px_rgba(0,0,0,0.08)]"
                >
                  <Mail className="w-5 h-5" />
                  联系我
                </a>
              </div>

              <div className="mt-10 max-w-xl">
                <p className="text-slate-500 dark:text-slate-400 italic text-sm">
                  “{profile.quote}”
                </p>
                <p className="mt-2 text-slate-400 dark:text-slate-500 text-xs leading-relaxed">
                  {profile.quoteNote}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="system-stack" className="max-w-7xl mx-auto mb-16">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <Layers3 className="w-8 h-8 text-blue-500" />
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              从内核到智能系统
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr,300px]">
            <BoltCard className="p-6">
              <SystemStack tracks={stackData} variant="compact" />
            </BoltCard>
            <div className="flex flex-col gap-4">
              <ProgressSummary courses={progressCourses} />
            </div>
          </div>
        </section>

        <section id="recent-updates" className="max-w-7xl mx-auto mb-16">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <span className="text-2xl">✨</span>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              近期更新
            </h2>
          </div>

          <BoltCard className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {latestPosts.map((p) => (
                <Link
                  key={`${p.category}:${p.slug}`}
                  href={`/knowledge/${categoryToSlug(p.category)}/${p.slug}`}
                  className="bg-slate-50 rounded-2xl p-5 border border-slate-100 hover:bg-slate-100 transition-colors dark:bg-slate-950 dark:border-slate-800 dark:hover:bg-slate-900"
                >
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <span>{p.category}</span>
                    {p.date && (
                      <span className="text-slate-400 dark:text-slate-500">· {p.date}</span>
                    )}
                  </div>
                  <div className="mt-2 font-semibold">{p.title}</div>
                  {p.description && (
                    <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      {p.description}
                    </div>
                  )}
                </Link>
              ))}
              {latestPosts.length === 0 && (
                <div className="text-slate-500 dark:text-slate-400">
                  还没有文章内容，请在 /content 里添加 .mdx 文件。
                </div>
              )}
            </div>
          </BoltCard>
        </section>

        <section id="knowledge" className="max-w-7xl mx-auto mb-16">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <span className="text-4xl">⛳</span>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-cyan-600 bg-clip-text text-transparent">
              知识空间
            </h2>
          </div>

          <BoltCard className="p-8">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📚</span>
                <h3 className="text-xl font-bold">分类</h3>
              </div>
              <Link
                href="/knowledge"
                className="text-sm text-slate-500 hover:text-blue-500 transition-colors dark:text-slate-400"
              >
                进入知识空间
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 justify-items-center">
              {categories.slice(0, 6).map((c) => {
                const icon = getCategoryIcon(c.category);
                return (
                  <Link
                    key={c.slug}
                    href={`/knowledge/${c.slug}`}
                    className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 hover:bg-slate-100 transition-colors dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 w-full max-w-xs"
                  >
                    <div
                      className={`w-12 h-12 ${icon.iconWrapClassName} rounded-2xl flex items-center justify-center`}
                    >
                      <icon.Icon className={`w-6 h-6 ${icon.iconClassName}`} />
                    </div>
                    <div className="flex flex-col">
                      <div className="font-semibold">{c.category}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {c.posts.length} 篇
                      </div>
                    </div>
                  </Link>
                );
              })}
              {categories.length === 0 && (
                <div className="text-slate-500 dark:text-slate-400 col-span-full text-center">
                  未检测到分类。请在 content/ 下创建分类文件夹与 .mdx。
                </div>
              )}
            </div>

            {categories.length > 6 && (
              <div className="mt-5 text-sm text-slate-500 dark:text-slate-400 text-center">
                还有 {categories.length - 6} 个分类未展示。
              </div>
            )}
          </BoltCard>
        </section>

        <section id="projects" className="max-w-7xl mx-auto mb-16">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
              课程
            </h2>
          </div>

          <BoltCard className="p-8">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🛠️</span>
                <h3 className="text-xl font-bold">全部 {COURSES.length} 门课程</h3>
              </div>
              <Link
                href="/projects"
                className="text-sm text-slate-500 hover:text-blue-500 transition-colors dark:text-slate-400"
              >
                查看课程总览
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 justify-items-center">
              {COURSES.map((course) => {
                const { Icon, className: iconClass } = getCourseIcon(course.icon);
                const count = projectCounts.get(course.slug) ?? 0;
                return (
                  <Link
                    key={course.slug}
                    href={`/projects/${course.slug}`}
                    className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 hover:bg-slate-100 transition-colors dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 w-full max-w-xs"
                  >
                    <div className={`w-12 h-12 ${iconClass} rounded-2xl flex items-center justify-center shrink-0`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="font-semibold text-sm truncate">{course.shortTitle}</div>
                      <div className="text-[11px] leading-tight text-slate-500 dark:text-slate-400">
                        {course.level} · {count} 章
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </BoltCard>
        </section>

        <HandsOnProjects chapterCounts={projectCounts} />

        <section id="contact" className="max-w-7xl mx-auto mb-16">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <Mail className="w-8 h-8 text-yellow-500" />
            <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
              联系方式
            </h2>
          </div>

          <BoltCard className="p-8">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📬</span>
                <h3 className="text-xl font-bold">联系我</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 justify-items-center">
              <a
                href={`mailto:${contactInfo.email}`}
                className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 hover:bg-slate-100 transition-colors dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 w-full max-w-xs"
              >
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-500/15 rounded-2xl flex items-center justify-center">
                  <Mail className="w-6 h-6 text-orange-500 dark:text-orange-300" />
                </div>
                <div className="flex flex-col">
                  <div className="font-semibold">Email</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 break-all">
                    {contactInfo.email}
                  </div>
                </div>
              </a>

              <a
                href={socials.github}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 hover:bg-slate-100 transition-colors dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 w-full max-w-xs"
              >
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                  <Github className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                </div>
                <div className="flex flex-col">
                  <div className="font-semibold">GitHub</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 break-all">
                    {socials.github}
                  </div>
                </div>
              </a>

              <WeChatCard />

              <OfficialAccountCard />
            </div>
          </BoltCard>
        </section>
      </main>

      <footer className="bg-white border-t border-slate-100 py-8 dark:bg-slate-950 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-500 dark:text-slate-400 text-sm">
          <div className="mb-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
            <Link href="/start" className="hover:text-blue-600 dark:hover:text-sky-400">阅读路线图</Link>
            <Link href="/search" className="hover:text-blue-600 dark:hover:text-sky-400">站内搜索</Link>
            <Link href="/papers" className="hover:text-blue-600 dark:hover:text-sky-400">出处索引墙</Link>
            <Link href="/progress" className="hover:text-blue-600 dark:hover:text-sky-400">学习进度</Link>
            <Link href="/feed.xml" className="hover:text-blue-600 dark:hover:text-sky-400">RSS</Link>
          </div>
          <p>© {new Date().getFullYear()} {profile.name}. Built with Next.js & Tailwind CSS</p>
        </div>
      </footer>
    </div>
  );
}
