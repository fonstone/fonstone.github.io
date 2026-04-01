import type { LucideIcon } from "lucide-react";
import BoltCard from "./BoltCard";

type Props = {
  Icon: LucideIcon;
  iconWrapClassName: string;
  iconClassName: string;
  title: string;
  description: string;
};

export default function BoltIconCard({
  Icon,
  iconWrapClassName,
  iconClassName,
  title,
  description,
}: Props) {
  return (
    <BoltCard className="p-6">
      <div className={`w-16 h-16 ${iconWrapClassName} rounded-2xl flex items-center justify-center mb-4`}>
        <Icon className={`w-8 h-8 ${iconClassName}`} />
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-slate-600 text-sm dark:text-slate-300">
        {description}
      </p>
    </BoltCard>
  );
}

