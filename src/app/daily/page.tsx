"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DailyData, MetaData, ArticleCategory, CATEGORY_KO } from "@/types";
import ArticleCard from "../components/ArticleCard";
import KeywordCloud from "../components/KeywordCloud";
import { RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { Suspense } from "react";

function DailyContent() {
  const params = useSearchParams();
  const [data, setData] = useState<DailyData | null>(null);
  const [meta, setMeta] = useState<MetaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ArticleCategory | "all">("all");
  const [date, setDate] = useState<string>("");

  useEffect(() => {
    const paramDate = params.get("date");
    fetch("/data/meta/latest.json")
      .then((r) => r.json())
      .then((m: MetaData) => {
        setMeta(m);
        const targetDate = paramDate ?? m.latest_date;
        setDate(targetDate);
        return fetch(`/data/articles/${targetDate}.json`);
      })
      .then((r) => {
        if (!r.ok) throw new Error("No data");
        return r.json();
      })
      .then((d: DailyData) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [params]);

  const navigate = (offset: number) => {
    if (!date) return;
    const d = new Date(date);
    d.setDate(d.getDate() + offset);
    const newDate = d.toISOString().split("T")[0];
    window.location.href = `/daily?date=${newDate}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 text-teal-500 animate-spin" />
        <span className="ml-3 text-slate-500">로딩 중...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Nav */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{date} 데일리 리포트</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-slate-100">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <input
            type="date"
            value={date}
            max={meta?.latest_date}
            onChange={(e) => (window.location.href = `/daily?date=${e.target.value}`)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5"
          />
          <button
            onClick={() => navigate(1)}
            disabled={date >= (meta?.latest_date ?? "")}
            className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!data ? (
        <div className="card text-center text-slate-400 py-16">
          {date} 데이터 없음. GitHub Actions가 실행된 날짜를 선택해주세요.
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card text-center">
              <p className="text-3xl font-bold text-teal-600">{data.total_articles}</p>
              <p className="text-sm text-slate-500">수집 기사</p>
            </div>
            <div className="card text-center">
              <p className="text-3xl font-bold text-blue-600">{data.top_keywords.length}</p>
              <p className="text-sm text-slate-500">추출 키워드</p>
            </div>
            <div className="card text-center">
              <p className="text-3xl font-bold text-orange-600">{data.highlighted_articles.length}</p>
              <p className="text-sm text-slate-500">핵심 기사 (7+)</p>
            </div>
          </div>

          {/* AI Summary */}
          {data.ai_summary && (
            <div className="card">
              <h2 className="font-semibold text-slate-800 mb-3 text-sm">AI 분석 요약</h2>
              <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {data.ai_summary}
              </div>
            </div>
          )}

          {/* Keywords */}
          <div className="card">
            <h2 className="font-semibold text-slate-800 mb-4 text-sm">오늘의 키워드</h2>
            <KeywordCloud keywords={data.top_keywords} maxShow={30} />
          </div>

          {/* Articles */}
          <div className="card">
            <div className="flex flex-wrap gap-2 mb-5">
              <button
                onClick={() => setActiveTab("all")}
                className={`btn-tab ${activeTab === "all" ? "btn-tab-active" : "btn-tab-inactive"}`}
              >
                전체 ({data.total_articles})
              </button>
              {(Object.keys(data.category_counts) as ArticleCategory[]).map((cat) => {
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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {(activeTab === "all"
                ? data.articles
                : data.articles.filter((a) => a.category === activeTab)
              ).map((a) => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function DailyPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><RefreshCw className="w-6 h-6 text-teal-500 animate-spin" /></div>}>
      <DailyContent />
    </Suspense>
  );
}
