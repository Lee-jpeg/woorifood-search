import { Article } from "@/types";
import CategoryBadge from "./CategoryBadge";
import { ExternalLink, TrendingUp, Minus, TrendingDown } from "lucide-react";

function SignalIcon({ signal }: { signal?: string }) {
  if (signal === "rising") return <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />;
  if (signal === "declining") return <TrendingDown className="w-3.5 h-3.5 text-red-400" />;
  return <Minus className="w-3.5 h-3.5 text-slate-400" />;
}

function RelevanceBar({ score }: { score: number }) {
  const pct = Math.round((score / 10) * 100);
  const color = score >= 8 ? "bg-teal-500" : score >= 6 ? "bg-yellow-400" : "bg-slate-300";
  return (
    <div className="flex items-center gap-2 text-xs text-slate-500">
      <span>관련도</span>
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-medium text-slate-700">{score}/10</span>
    </div>
  );
}

// 샘플 데이터 여부 판별 (실제 파이프라인 수집 기사는 정상 URL을 가짐)
function isSampleUrl(url: string): boolean {
  if (!url) return true;
  try {
    const { hostname, pathname, search } = new URL(url);
    // 가짜 네이버: 정확히 naver.com (실제는 n.news.naver.com 등 서브도메인)
    if (hostname === "naver.com") return true;
    // 가짜 Semantic Scholar: 경로에 20자 이상 hex 해시 없음 (진짜는 40자 해시 포함)
    if (hostname.includes("semanticscholar.org") && !/[a-f0-9]{20}/i.test(pathname)) return true;
    // 가짜 미디어: /article/ 경로이면서 쿼리스트링 없음 (진짜는 ?cid= 등 파라미터 포함)
    if (
      !search &&
      pathname.toLowerCase().includes("/article/") &&
      (hostname.includes("foodnavigator") ||
        hostname.includes("newfoodmagazine") ||
        hostname.includes("foodbusinessnews"))
    )
      return true;
    return false;
  } catch {
    return true;
  }
}

export default function ArticleCard({ article }: { article: Article }) {
  const date = new Date(article.published_at).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });

  const sample = isSampleUrl(article.url);

  return (
    <div className="card hover:shadow-md transition-shadow flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <CategoryBadge category={article.category} />
          {article.language === "en" && (
            <span className="badge bg-slate-100 text-slate-500">EN</span>
          )}
          {sample && (
            <span className="badge bg-amber-100 text-amber-600">샘플</span>
          )}
        </div>
        <div className="flex items-center gap-1 text-slate-400 shrink-0">
          <SignalIcon signal={article.trend_signal} />
        </div>
      </div>

      {sample ? (
        <span className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2 cursor-default">
          {article.title}
        </span>
      ) : (
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-start gap-1"
        >
          <span className="text-sm font-semibold text-slate-800 leading-snug group-hover:text-teal-700 transition-colors line-clamp-2">
            {article.title}
          </span>
          <ExternalLink className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
        </a>
      )}

      {article.summary && (
        <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{article.summary}</p>
      )}

      {article.actionable_insight && (
        <div className="bg-teal-50 border-l-2 border-teal-400 px-3 py-2 rounded-r-lg">
          <p className="text-xs text-teal-800 font-medium">{article.actionable_insight}</p>
        </div>
      )}

      {article.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {article.keywords.slice(0, 5).map((kw) => (
            <span key={kw} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
              #{kw}
            </span>
          ))}
        </div>
      )}

      {typeof article.relevance_score === "number" && (
        <RelevanceBar score={article.relevance_score} />
      )}

      <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-50">
        <span>{article.source}</span>
        <span>{date}</span>
      </div>
    </div>
  );
}
