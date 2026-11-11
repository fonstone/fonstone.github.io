import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-sm font-medium tracking-widest text-slate-500 dark:text-slate-400">
        404
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
        这一页没有生成出来
      </h1>
      <p className="text-base leading-relaxed text-slate-600 dark:text-slate-400">
        静态站点里没有这个地址。可以从知识空间按分类找，也可以回到首页看最近更新。
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/start"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          从这里开始
        </Link>
        <Link
          href="/"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 transition-colors hover:border-blue-500 hover:text-blue-500 dark:border-slate-700 dark:text-slate-300 dark:hover:text-sky-400"
        >
          回到首页
        </Link>
        <Link
          href="/knowledge"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 transition-colors hover:border-blue-500 hover:text-blue-500 dark:border-slate-700 dark:text-slate-300 dark:hover:text-sky-400"
        >
          知识空间
        </Link>
        <Link
          href="/projects"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 transition-colors hover:border-blue-500 hover:text-blue-500 dark:border-slate-700 dark:text-slate-300 dark:hover:text-sky-400"
        >
          项目与课程
        </Link>
      </div>
    </main>
  );
}
