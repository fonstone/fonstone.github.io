"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  Compass,
  Github,
  GraduationCap,
  Home,
  LibraryBig,
  ListChecks,
  Menu,
  Search,
  X,
} from "lucide-react";
import { COURSES, COURSE_HUBS } from "@/lib/constants/courses";
import { socials } from "@/lib/constants/socials";
import { profile } from "@/lib/constants/siteContent";
import SearchLauncher from "@/components/search/SearchLauncher";
import ThemeToggle from "@/components/ThemeToggle";

const MAIN_LINKS = [
  { href: "/", label: "首页", Icon: Home },
  { href: "/start", label: "从这里开始", Icon: Compass },
  { href: "/knowledge", label: "知识空间", Icon: BookOpen },
  { href: "/projects", label: "课程", Icon: GraduationCap },
];

const MORE_LINKS = [
  { href: "/papers", label: "出处索引", Icon: LibraryBig },
  { href: "/progress", label: "学习进度", Icon: ListChecks },
  { href: "/search", label: "站内搜索", Icon: Search },
];

/** 首页专属的页内锚点，与顶部导航放进同一张卡片，避免形成两块割裂的区域 */
const HOME_QUICK_LINKS = [
  { href: "#system-stack", label: "系统栈" },
  { href: "#recent-updates", label: "近期更新" },
  { href: "#hands-on", label: "项目实战" },
  { href: "#knowledge", label: "知识分类" },
  { href: "#projects", label: "课程领域" },
  { href: "#contact", label: "联系方式" },
];

/** 记住用户是否收起首页快捷跳转，离开首页再回来不会被强制展开 */
const QUICK_LINKS_STORAGE_KEY = "sf-home-quick-links-open";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SiteNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [courseOpen, setCourseOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [quickLinksOpen, setQuickLinksOpen] = useState(true);
  const [quickLinksReady, setQuickLinksReady] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
    setCourseOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(QUICK_LINKS_STORAGE_KEY) === "false") {
        setQuickLinksOpen(false);
      }
    } catch {
      // 隐私模式下 localStorage 不可用时保持默认展开
    }
    setQuickLinksReady(true);
  }, []);

  useEffect(() => {
    if (!quickLinksReady) return;
    try {
      window.localStorage.setItem(QUICK_LINKS_STORAGE_KEY, String(quickLinksOpen));
    } catch {
      // 写入失败不影响交互
    }
  }, [quickLinksOpen, quickLinksReady]);

  return (
    <header className="sticky top-0 z-50 mb-6 border border-slate-200/80 dark:border-slate-800 bg-white/85 dark:bg-slate-950/80 backdrop-blur-md rounded-2xl shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link href="/" className="group flex items-center gap-2.5 shrink-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 text-sm font-bold text-white shadow-sm">
            {profile.brandInitial}
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {profile.name}
            </span>
            <span className="hidden text-[10px] tracking-wide text-slate-400 dark:text-slate-500 sm:block">
              从内核到智能系统
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="主导航">
          {MAIN_LINKS.slice(0, 3).map(({ href, label }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-blue-50 font-medium text-blue-600 dark:bg-blue-500/10 dark:text-sky-400"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                }`}
              >
                {label}
              </Link>
            );
          })}

          <div className="relative">
            <button
              type="button"
              onClick={() => setCourseOpen((v) => !v)}
              aria-expanded={courseOpen}
              aria-haspopup="true"
              className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer ${
                isActive(pathname, "/projects")
                  ? "bg-blue-50 font-medium text-blue-600 dark:bg-blue-500/10 dark:text-sky-400"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              }`}
            >
              课程
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${courseOpen ? "rotate-180" : ""}`}
              />
            </button>

            {courseOpen && (
              <>
                <button
                  type="button"
                  aria-label="关闭课程菜单"
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setCourseOpen(false)}
                />
                <div className="absolute right-0 z-20 mt-2 w-[560px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xl">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      全部 {COURSES.length} 门课程
                    </span>
                    <Link
                      href="/projects"
                      className="text-xs text-blue-600 hover:underline dark:text-sky-400"
                    >
                      查看课程总览 →
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {COURSE_HUBS.map((hub) => (
                      <div key={hub.slug}>
                        <Link
                          href={`/projects/${hub.slug}`}
                          className="mb-1.5 block text-xs font-semibold text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-sky-400"
                        >
                          {hub.title}
                        </Link>
                        <div className="flex flex-col gap-0.5">
                          {hub.courseSlugs.map((slug) => {
                            const course = COURSES.find((c) => c.slug === slug);
                            if (!course) return null;
                            return (
                              <Link
                                key={slug}
                                href={`/projects/${slug}`}
                                className="rounded-md px-2 py-1.5 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                              >
                                {course.shortTitle}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    <div>
                      <span className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        车载与功能安全
                      </span>
                      <Link
                        href="/projects/autosar-functional-safety"
                        className="block rounded-md px-2 py-1.5 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                      >
                        AUTOSAR 与功能安全
                      </Link>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="relative hidden lg:block">
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              aria-expanded={moreOpen}
              aria-haspopup="true"
              className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer ${
                MORE_LINKS.some((l) => isActive(pathname, l.href))
                  ? "bg-blue-50 font-medium text-blue-600 dark:bg-blue-500/10 dark:text-sky-400"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              }`}
            >
              更多
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${moreOpen ? "rotate-180" : ""}`} />
            </button>
            {moreOpen && (
              <>
                <button
                  type="button"
                  aria-label="关闭更多菜单"
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setMoreOpen(false)}
                />
                <div className="absolute right-0 z-20 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                  {MORE_LINKS.map(({ href, label, Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                    >
                      <Icon className="h-4 w-4 text-slate-400" />
                      {label}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </nav>

        <div className="flex items-center gap-1">
          <SearchLauncher />
          <ThemeToggle />
          <a
            href={socials.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 sm:block"
          >
            <Github className="h-4 w-4" />
          </a>
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "关闭菜单" : "打开菜单"}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden cursor-pointer"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {pathname === "/" && (
        <div
          className={`sf-scrollbar-none overflow-x-auto border-t border-slate-200/70 bg-slate-50/40 dark:border-slate-800/70 dark:bg-slate-900/30 ${
            mobileOpen ? "" : "rounded-b-2xl"
          }`}
        >
          {/* w-max + mx-auto 让整组内容水平居中，窄屏放不下时自动退化为可横向滚动 */}
          <div
            className={`mx-auto flex w-max items-center px-4 text-xs transition-[padding,gap] duration-300 ease-out md:px-6 ${
              quickLinksOpen ? "gap-2 py-2.5" : "gap-0 py-1"
            }`}
          >
            <button
              type="button"
              onClick={() => setQuickLinksOpen((v) => !v)}
              aria-expanded={quickLinksOpen}
              aria-controls="home-quick-links"
              aria-label={quickLinksOpen ? "收起本页快速跳转" : "展开本页快速跳转"}
              className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/70 font-medium text-slate-500 transition-all duration-300 hover:border-blue-400 hover:text-blue-600 dark:border-slate-700/70 dark:bg-slate-950/40 dark:text-slate-400 dark:hover:border-sky-500/60 dark:hover:text-sky-400 ${
                quickLinksOpen ? "px-3 py-1" : "px-2.5 py-0.5 text-[11px]"
              }`}
            >
              本页快速跳转
              <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500">
                {quickLinksOpen ? "收起" : `展开 ${HOME_QUICK_LINKS.length} 项`}
              </span>
              <ChevronDown
                className={`h-3 w-3 transition-transform duration-300 ${quickLinksOpen ? "rotate-180" : ""}`}
              />
            </button>

            <div
              id="home-quick-links"
              aria-hidden={!quickLinksOpen}
              className={`grid items-center transition-[grid-template-columns,opacity] duration-300 ease-out ${
                quickLinksOpen ? "grid-cols-[1fr] opacity-100" : "grid-cols-[0fr] opacity-0"
              }`}
            >
              <div className="flex min-w-0 items-center gap-2 overflow-hidden">
                {HOME_QUICK_LINKS.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    tabIndex={quickLinksOpen ? undefined : -1}
                    className="shrink-0 rounded-full border border-slate-200/80 bg-white/60 px-3 py-1 text-slate-500 transition-colors hover:border-blue-400 hover:text-blue-600 dark:border-slate-700/70 dark:bg-slate-950/30 dark:text-slate-400 dark:hover:border-sky-500/60 dark:hover:text-sky-400"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {mobileOpen && (
        <nav
          className="rounded-b-2xl border-t border-slate-200 dark:border-slate-800 px-4 pb-4 pt-3 md:hidden"
          aria-label="移动端导航"
        >
          <div className="flex flex-col gap-1">
            {MAIN_LINKS.map(({ href, label, Icon }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                    active
                      ? "bg-blue-50 font-medium text-blue-600 dark:bg-blue-500/10 dark:text-sky-400"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
            {MORE_LINKS.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                  isActive(pathname, href)
                    ? "bg-blue-50 font-medium text-blue-600 dark:bg-blue-500/10 dark:text-sky-400"
                    : "text-slate-600 dark:text-slate-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>

          <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-800">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              全部课程
            </p>
            <div className="grid grid-cols-2 gap-1">
              {COURSES.map((course) => (
                <Link
                  key={course.slug}
                  href={`/projects/${course.slug}`}
                  className="rounded-lg px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {course.shortTitle}
                </Link>
              ))}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
