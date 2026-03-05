"use client";

import { useEffect, useState } from "react";
import { DailyData, MetaData, ArticleCategory, CATEGORY_KO, CATEGORY_DOT } from "@/types";
import ArticleCard from "./components/ArticleCard";
import KeywordCloud from "./components/KeywordCloud";
import { KeywordBarChart, CategoryDonutChart } from "./components/TrendChart";
import { RefreshCw, FileText, Hash, Database, ChevronDown, ChevronUp } from "lucide-react";

const ALL_CATS: ArticleCategory[] = ["ingredient", "product", "consumer", "manufacturing", "market", "regulation"];

export default function Dashboard() {
  const [data, setData] = useState<DailyData | null>(null);
  const [meta, setMeta] = useState<MetaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ArticleCategory | "all">("all");
  const [summaryOpen, setSummaryOpen] = useState(false);

  useEffect(() => {
    fetch("/data/meta/latest.json")
      .then((r) => r.json())
      .then((m: MetaData) => {
        setMeta(m);
        return fetch(`/data/articles/${m.latest_date}.json`);
      })
      .then((r) => r.json())
      .then((d: DailyData) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 text-teal-500 animate-spin" />
        <span className="ml-3 text-slate-500">데이터 로딩 중...</span>
      </div>
    );
  }

  if (!data || !meta) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        데이터를 불러올 수 없습니다. GitHub Actions를 먼저 실행해주세요.
      </div>
    );
  }

  const updatedAt = new Date(meta.updated_at).toLocaleString("ko-KR", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const catChartData = ALL_CATS
    .filter((c) => (data.category_counts[c] ?? 0) > 0)
    .map((c) => ({
      name: CATEGORY_KO[c],
      value: data.category_counts[c] ?? 0,
      color: CATEGORY_DOT[c],
    }));

  const filteredArticles =
    activeTab === "all"
      ? data.highlighted_articles
      : data.articles.filter((a) => a.category === activeTab).slice(0, 12);

  const totalKeywords = data.top_keywords.reduce((s, k) => s + k.count, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{meta.latest_date} 트렌드</h1>
          <p className="text-sm text-slate-500 mt-0.5">갱신: {updatedAt}</p>
        </div>
        <div className="flex gap-2">
          <a href="/weekly" className="btn-tab bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-teal-700">위클리 →</a>
          <a href="/monthly" className="btn-tab bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-teal-700">먼슬리 →</a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: FileText, label: "수집 기사", value: data.total_articles, unit: "건", color: "text-teal-600" },
          { icon: Hash, label: "분석 키워드", value: totalKeywords, unit: "회 언급", color: "text-blue-600" },
          { icon: Database, label: "주요 소스", value: new Set(data.articles.map((a) => a.source)).size, unit: "곳", color: "text-purple-600" },
          { icon: FileText, label: "핵심 기사", value: data.highlighted_articles.length, unit: "건 (관련도 7+)", color: "text-orange-600" },
        ].map((s) => (
          <div key={s.label} className="card flex items-center gap-3">
            <s.icon className={`w-8 h-8 ${s.color} opacity-80`} />
            <div>
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className="text-xl font-bold text-slate-900">
                {s.value} <span className="text-xs font-normal text-slate-400">{s.unit}</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* AI Summary */}
      {data.ai_summary && (
        <div className="card border-l-4 border-teal-500">
          <button
            className="flex items-center justify-between w-full text-left"
            onClick={() => setSummaryOpen(!summaryOpen)}
          >
            <span className="font-semibold text-slate-800 text-sm">AI 오늘의 요약</span>
            {summaryOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>
          {summaryOpen && (
            <div className="mt-3 prose prose-sm max-w-none text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">
              {data.ai_summary}
            </div>
          )}
        </div>
      )}

      {/* Keyword + Category Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-2">
          <h2 className="font-semibold text-slate-800 mb-4 text-sm">오늘의 키워드 빈도</h2>
          <KeywordBarChart keywords={data.top_keywords} maxShow={12} />
        </div>
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4 text-sm">카테고리 분포</h2>
          <CategoryDonutChart data={catChartData} />
        </div>
      </div>

      {/* Keyword Cloud */}
      <div className="card">
        <h2 className="font-semibold text-slate-800 mb-4 text-sm">키워드 클라우드</h2>
        <KeywordCloud keywords={data.top_keywords} maxShow={25} />
      </div>

      {/* Articles by Category */}
      <div className="card">
        <h2 className="font-semibold text-slate-800 mb-4 text-sm">기사 목록</h2>
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={() => setActiveTab("all")}
            className={`btn-tab ${activeTab === "all" ? "btn-tab-active" : "btn-tab-inactive"}`}
          >
            핵심 ({data.highlighted_articles.length})
          </button>
          {ALL_CATS.map((cat) => {
            const cnt = data.category_counts[cat] ?? 0;
            if (cnt === 0) return null;
            return (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`btn-tab ${activeTab === cat ? "btn-tab-active" : "btn-tab-inactive"}`}
              >
                {CATEGORY_KO[cat]} ({cnt})
              </button>
            );
          })}
        </div>
        {filteredArticles.length === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center">해당 카테고리 기사 없음</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredArticles.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        )}
      </div>

      {/* YouTube Highlights */}
      {data.youtube_highlights?.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4 text-sm">YouTube 트렌드 영상</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {data.youtube_highlights.slice(0, 4).map((v) => (
              <a
                key={v.id}
                href={v.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:opacity-80 transition-opacity"
              >
                {v.thumbnail && (
                  <img
                    src={v.thumbnail}
                    alt={v.title}
                    className="w-full aspect-video object-cover rounded-lg mb-2"
                  />
                )}
                <p className="text-xs font-medium text-slate-800 line-clamp-2">{v.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{v.channel}</p>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
