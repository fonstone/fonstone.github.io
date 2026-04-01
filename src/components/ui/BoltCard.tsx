import clsx from "clsx";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

export default function BoltCard({ children, className }: Props) {
  return (
    <div
      className={clsx(
        "bg-white rounded-3xl p-6 transition-transform hover:scale-[1.02] duration-300",
        "shadow-[0_10px_30px_rgba(0,0,0,0.08)]",
        "dark:bg-slate-900 dark:text-slate-100",
        className
      )}
    >
      {children}
    </div>
  );
}
