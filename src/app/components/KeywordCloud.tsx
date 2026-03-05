"use client";

import { KeywordCount } from "@/types";

interface Props {
  keywords: KeywordCount[];
  maxShow?: number;
}

export default function KeywordCloud({ keywords, maxShow = 20 }: Props) {
  const top = keywords.slice(0, maxShow);
  if (top.length === 0) return <p className="text-sm text-slate-400">키워드 없음</p>;

  const maxCount = top[0]?.count ?? 1;

  return (
    <div className="flex flex-wrap gap-2">
      {top.map(({ keyword, count }, i) => {
        const ratio = count / maxCount;
        const size =
          ratio > 0.8 ? "text-base font-bold" :
          ratio > 0.5 ? "text-sm font-semibold" :
          "text-xs font-medium";
        const bg =
          i < 3 ? "bg-teal-600 text-white" :
          i < 8 ? "bg-teal-100 text-teal-800" :
          "bg-slate-100 text-slate-600";

        return (
          <span
            key={keyword}
            className={`px-3 py-1 rounded-full ${size} ${bg} transition-all`}
          >
            {keyword}
            <span className="ml-1 opacity-60 text-xs">({count})</span>
          </span>
        );
      })}
    </div>
  );
}
