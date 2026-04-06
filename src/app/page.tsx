import Image from "next/image";
import Link from "next/link";
import {
  Bike,
  Brain,
  Box,
  CircuitBoard,
  Coffee,
  Cpu,
  Github,
  Globe,
  Heart,
  Mail,
  MapPin,
  Monitor,
  Sparkles,
  Trophy,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import BoltCard from "@/components/ui/BoltCard";
import WeChatCard from "@/components/WeChatCard";
import OfficialAccountCard from "@/components/OfficialAccountCard";
import { contactInfo } from "@/lib/constants/contact";
import { profile, aboutDescription, personImage } from "@/lib/constants/siteContent";
import { socials } from "@/lib/constants/socials";
import { getAllKnowledgePosts, getKnowledgeCategories, categoryToSlug } from "@/lib/knowledge/knowledge";

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
  if (key.includes("生活") || key.includes("life")) {
    return {
      Icon: Heart,
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
            <a
              href="#recent-updates"
              className="hover:text-blue-500 transition-colors"
            >
              近期更新
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

              <h2 className="mt-5 text-lg md:text-xl font-medium text-slate-800 dark:text-slate-100">
                {profile.headline}
              </h2>

              <p className="mt-6 text-slate-600 dark:text-slate-300 leading-relaxed">
                {aboutDescription}
              </p>

              {profile.locationLine && (
                <div className="mt-6 flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <MapPin className="w-5 h-5" />
                  <span>{profile.locationLine}</span>
                </div>
              )}

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
              项目
            </h2>
          </div>

          <BoltCard className="p-8">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🛠️</span>
                <h3 className="text-xl font-bold">项目领域</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 justify-items-center">
              {[
                {
                  name: "OS",
                  desc: "操作系统核心原理与实现",
                  Icon: Monitor,
                  iconWrapClassName: "bg-purple-100 dark:bg-purple-500/15",
                  iconClassName: "text-purple-500 dark:text-purple-300",
                },
                {
                  name: "QEMU",
                  desc: "虚拟化与系统仿真工具",
                  Icon: Box,
                  iconWrapClassName: "bg-orange-100 dark:bg-orange-500/15",
                  iconClassName: "text-orange-500 dark:text-orange-300",
                },
                {
                  name: "ARM/RISC-V",
                  desc: "主流指令集架构解析",
                  Icon: Cpu,
                  iconWrapClassName: "bg-cyan-100 dark:bg-cyan-500/15",
                  iconClassName: "text-cyan-500 dark:text-cyan-300",
                },
                {
                  name: "MCU",
                  desc: "微控制器开发与应用",
                  Icon: CircuitBoard,
                  iconWrapClassName: "bg-green-100 dark:bg-green-500/15",
                  iconClassName: "text-green-500 dark:text-green-300",
                },
              ].map((p) => (
                <Link
                  key={p.name}
                  href="#projects"
                  className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 hover:bg-slate-100 transition-colors dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 w-full max-w-xs"
                >
                  <div
                    className={`w-12 h-12 ${p.iconWrapClassName} rounded-2xl flex items-center justify-center`}
                  >
                    <p.Icon className={`w-6 h-6 ${p.iconClassName}`} />
                  </div>
                  <div className="flex flex-col">
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {p.desc}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </BoltCard>
        </section>

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
          <p>© {new Date().getFullYear()} {profile.name}. Built with Next.js & Tailwind CSS</p>
        </div>
      </footer>
    </div>
  );
}
