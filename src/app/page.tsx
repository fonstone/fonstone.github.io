import Image from "next/image";
import Link from "next/link";
import {
  Bike,
  Book,
  Brain,
  Camera,
  Code,
  Coffee,
  Github,
  Globe,
  Heart,
  Mail,
  MapPin,
  Music,
  Sparkles,
  Trophy,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import BoltCard from "@/components/ui/BoltCard";
import { contactInfo } from "@/lib/constants/contact";
import { projects } from "@/lib/constants/projects";
import { profile, aboutDescription, personImage } from "@/lib/constants/siteContent";
import { socials } from "@/lib/constants/socials";
import { getAllKnowledgePosts, getKnowledgeCategories } from "@/lib/knowledge/knowledge";

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
  if (key.includes("work")) {
    return {
      Icon: Coffee,
      iconWrapClassName: "bg-pink-100 dark:bg-pink-500/15",
      iconClassName: "text-pink-500 dark:text-pink-300",
    };
  }
  if (key.includes("life")) {
    return {
      Icon: Heart,
      iconWrapClassName: "bg-red-100 dark:bg-red-500/15",
      iconClassName: "text-red-500 dark:text-red-300",
    };
  }
  return {
    Icon: Globe,
    iconWrapClassName: "bg-green-100 dark:bg-green-500/15",
    iconClassName: "text-green-500 dark:text-green-300",
  };
}

export default async function Home() {
  const categories = await getKnowledgeCategories();
  const allPosts = await getAllKnowledgePosts();
  const latestPosts = allPosts.slice(0, 6);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 dark:bg-slate-950/70 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center text-white font-bold">
              {profile.brandInitial}
            </div>
            <span className="font-semibold text-lg">{profile.name}</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm">
            <a href="#home" className="hover:text-blue-500 transition-colors">
              首页
            </a>
            <a href="#about" className="hover:text-blue-500 transition-colors">
              关于我
            </a>
            <a
              href="#knowledge"
              className="hover:text-blue-500 transition-colors"
            >
              知识空间
            </a>
            <a href="#projects" className="hover:text-blue-500 transition-colors">
              项目
            </a>
            <a href="#contact" className="hover:text-blue-500 transition-colors">
              联系方式
            </a>
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-16 px-6">
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
              <div className="inline-flex items-center gap-3 rounded-2xl bg-white/60 px-4 py-3 backdrop-blur-sm dark:bg-slate-900/40">
                <Sparkles className="w-7 h-7 text-yellow-500" />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Portfolio
                </span>
              </div>

              <h1 className="mt-8 text-4xl md:text-5xl font-semibold tracking-tight">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Hi! 我是 {profile.name}
                </span>
              </h1>

              <h2 className="mt-5 text-xl md:text-2xl font-medium text-slate-800 dark:text-slate-100">
                {profile.headline}
              </h2>

              <p className="mt-6 text-slate-600 dark:text-slate-300 leading-relaxed">
                {aboutDescription}
              </p>

              <div className="mt-6 flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <MapPin className="w-5 h-5" />
                <span>{profile.locationLine || contactInfo.location}</span>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={socials.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-6 py-3 text-white hover:bg-blue-600 transition-colors shadow-[0_10px_30px_rgba(0,0,0,0.08)]"
                >
                  <Github className="w-5 h-5" />
                  GitHub
                </a>
                <a
                  href={`mailto:${contactInfo.email}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-purple-500 px-6 py-3 text-white hover:bg-purple-600 transition-colors shadow-[0_10px_30px_rgba(0,0,0,0.08)]"
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

        <section id="about" className="max-w-7xl mx-auto mb-16">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <span className="text-2xl">🪄</span>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              关于我
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <BoltCard className="p-8">
              <div className="w-14 h-14 bg-purple-100 dark:bg-purple-500/15 rounded-2xl flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7 text-purple-500 dark:text-purple-300" />
              </div>
              <p className="text-lg">{profile.headline}</p>
            </BoltCard>

            <BoltCard className="p-8">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-500/15 rounded-2xl flex items-center justify-center mb-4">
                <Code className="w-7 h-7 text-blue-500 dark:text-blue-300" />
              </div>
              <p className="text-lg">{aboutDescription}</p>
            </BoltCard>
          </div>

          <BoltCard className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">💫</span>
              <h3 className="text-xl font-bold">近期更新</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {latestPosts.map((p) => (
                <Link
                  key={`${p.category}:${p.slug}`}
                  href={`/knowledge/${encodeURIComponent(
                    p.category
                  )}/${encodeURIComponent(p.slug)}`}
                  className="bg-slate-50 rounded-2xl p-5 border border-slate-100 hover:bg-slate-100 transition-colors dark:bg-slate-950 dark:border-slate-800 dark:hover:bg-slate-900"
                >
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    {p.category}
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
          <div className="flex items-center gap-3 mb-4 justify-center">
            <span className="text-4xl">⛳</span>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-cyan-600 bg-clip-text text-transparent">
              知识空间
            </h2>
          </div>

          <p className="text-center text-slate-600 dark:text-slate-300 mb-8">
            以 bento-grid 的方式组织：分类、近期更新、项目精选。
            <span className="mx-2 text-slate-300 dark:text-slate-700">·</span>
            <Link className="underline hover:text-blue-500" href="/knowledge">
              进入 /knowledge
            </Link>
          </p>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-6 md:auto-rows-[180px] md:grid-flow-dense">
            <BoltCard className="h-full p-8 md:col-span-2 md:row-span-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold">
                  {profile.brandInitial}
                </div>
                <div className="flex flex-col">
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    数字花园
                  </div>
                  <div className="text-lg font-bold">知识空间</div>
                </div>
              </div>
              <p className="mt-5 text-slate-600 dark:text-slate-300 leading-relaxed">
                所有内容来自 content/，自动生成分类与文章路由；支持 MDX、代码高亮与图片模糊占位。
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/knowledge"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-3 text-white hover:bg-blue-600 transition-colors"
                >
                  浏览目录
                </Link>
                <Link
                  href="/knowledge/AI"
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-white hover:bg-slate-800 transition-colors dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  示例分类
                </Link>
              </div>
              <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-6 text-sm text-slate-500 dark:text-slate-400">
                <div className="flex items-center justify-between">
                  <span>分类</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {categories.length}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span>文章</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {allPosts.length}
                  </span>
                </div>
              </div>
            </BoltCard>

            <BoltCard className="h-full p-8 md:col-span-4 md:row-span-2">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✨</span>
                  <h3 className="text-xl font-bold">近期更新</h3>
                </div>
                <Link
                  href="/knowledge"
                  className="text-sm text-slate-500 hover:text-blue-500 transition-colors dark:text-slate-400"
                >
                  查看全部
                </Link>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
                {latestPosts.map((p) => (
                  <Link
                    key={`${p.category}:${p.slug}`}
                    href={`/knowledge/${encodeURIComponent(
                      p.category
                    )}/${encodeURIComponent(p.slug)}`}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-5 hover:bg-slate-100 transition-colors dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {p.category}
                      </div>
                      {p.date && (
                        <div className="text-xs text-slate-400 dark:text-slate-500">
                          {p.date}
                        </div>
                      )}
                    </div>
                    <div className="mt-2 font-semibold">{p.title}</div>
                    {p.description && (
                      <div className="mt-2 text-sm text-slate-600 dark:text-slate-300 overflow-hidden">
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

            <BoltCard className="h-full p-8 md:col-span-3 md:row-span-2">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📚</span>
                  <h3 className="text-xl font-bold">分类</h3>
                </div>
                <Link
                  href="/knowledge"
                  className="text-sm text-slate-500 hover:text-blue-500 transition-colors dark:text-slate-400"
                >
                  目录页
                </Link>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {categories.slice(0, 6).map((c) => {
                  const icon = getCategoryIcon(c.category);
                  return (
                    <Link
                      key={c.category}
                      href={`/knowledge/${encodeURIComponent(c.category)}`}
                      className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 hover:bg-slate-100 transition-colors dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900"
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
                  <div className="text-slate-500 dark:text-slate-400">
                    未检测到分类。请在 content/ 下创建分类文件夹与 .mdx。
                  </div>
                )}
              </div>

              {categories.length > 6 && (
                <div className="mt-5 text-sm text-slate-500 dark:text-slate-400">
                  还有 {categories.length - 6} 个分类未展示。
                </div>
              )}
            </BoltCard>

            <BoltCard className="h-full p-8 md:col-span-3 md:row-span-2">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🧩</span>
                  <h3 className="text-xl font-bold">项目精选</h3>
                </div>
                <a
                  href={socials.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-slate-500 hover:text-blue-500 transition-colors dark:text-slate-400"
                >
                  GitHub
                </a>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3">
                {projects.slice(0, 4).map((p) => (
                  <div
                    key={p.name}
                    className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950"
                  >
                    <div className="h-14 w-14 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-400">
                      <Image
                        src={p.imgSrc}
                        alt={p.name}
                        width={112}
                        height={112}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col">
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        来自配置文件渲染
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </BoltCard>

            <BoltCard className="h-full p-8 md:col-span-6 md:row-span-1 bg-blue-50 border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col">
                  <div className="font-bold">提示</div>
                  <div className="text-slate-600 dark:text-slate-300">
                    知识空间支持左侧目录折叠，点击分类旁按钮可展开文章列表。
                  </div>
                </div>
                <div className="flex gap-3">
                  <Link
                    href="/knowledge"
                    className="rounded-xl bg-white px-5 py-3 text-slate-900 border border-white/40 hover:bg-white/80 transition-colors dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800"
                  >
                    打开目录
                  </Link>
                  <a
                    href={`mailto:${contactInfo.email}`}
                    className="rounded-xl bg-blue-500 px-5 py-3 text-white hover:bg-blue-600 transition-colors"
                  >
                    写封邮件
                  </a>
                </div>
              </div>
            </BoltCard>
          </div>
        </section>

        <section id="projects" className="max-w-7xl mx-auto mb-16">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
              项目
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {projects.map((p) => (
              <BoltCard key={p.name} className="p-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl mb-4 overflow-hidden">
                  <Image
                    src={p.imgSrc}
                    alt={p.name}
                    width={320}
                    height={240}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold mb-2">{p.name}</h3>
                <p className="text-slate-600 text-sm dark:text-slate-300">
                  来自项目配置文件的便当盒卡片渲染。
                </p>
              </BoltCard>
            ))}
          </div>
        </section>

        <section id="contact" className="max-w-7xl mx-auto">
          <BoltCard className="p-12 bg-gradient-to-br from-yellow-50 to-orange-50 border border-slate-100 dark:from-yellow-500/10 dark:to-orange-500/10 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-8 justify-center">
              <Mail className="w-8 h-8 text-yellow-500" />
              <span className="text-2xl">☀️</span>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                联系方式
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href={`mailto:${contactInfo.email}`}
                className="bg-white/60 backdrop-blur rounded-2xl p-6 border border-white/40 hover:bg-white/80 transition-colors dark:bg-slate-900/60 dark:border-slate-800"
              >
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <div className="font-semibold">Email</div>
                    <div className="text-slate-600 dark:text-slate-300 text-sm">
                      {contactInfo.email}
                    </div>
                  </div>
                </div>
              </a>

              <a
                href={socials.github}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/60 backdrop-blur rounded-2xl p-6 border border-white/40 hover:bg-white/80 transition-colors dark:bg-slate-900/60 dark:border-slate-800"
              >
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <div className="font-semibold">GitHub</div>
                    <div className="text-slate-600 dark:text-slate-300 text-sm">
                      {socials.github}
                    </div>
                  </div>
                </div>
              </a>
            </div>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { Icon: Camera, label: "摄影/剪辑" },
                { Icon: Coffee, label: "探店/咖啡" },
                { Icon: Bike, label: "夜骑" },
                { Icon: Music, label: "听歌/唱歌" },
                { Icon: Book, label: "阅读" },
                { Icon: Trophy, label: "运动/挑战" },
              ].map(({ Icon, label }) => (
                <BoltCard key={label} className="p-6">
                  <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-3">
                    <Icon className="w-7 h-7 text-slate-600 dark:text-slate-200" />
                  </div>
                  <p className="font-medium">{label}</p>
                </BoltCard>
              ))}
            </div>
          </BoltCard>
        </section>
      </main>

      <footer className="bg-white border-t border-slate-100 py-8 dark:bg-slate-950 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-500 dark:text-slate-400 text-sm">
          <p>© {new Date().getFullYear()} {profile.name}. Built with Next.js & Tailwind CSS</p>
        </div>
      </footer>
    </div>
  );
}
