"use client";

import { useEffect, useState } from "react";
import { WeeklyData, MetaData, CATEGORY_KO, CATEGORY_DOT, ArticleCategory } from "@/types";
import ArticleCard from "../components/ArticleCard";
import KeywordCloud from "../components/KeywordCloud";
import { KeywordBarChart, CategoryDonutChart, WeeklyLineChart } from "../components/TrendChart";
import { RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";

export default function WeeklyPage() {
  const [data, setData] = useState<WeeklyData | null>(null);
  const [meta, setMeta] = useState<MetaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [weekId, setWeekId] = useState<string>("");

  useEffect(() => {
    fetch("/data/meta/latest.json")
      .then((r) => r.json())
      .then((m: MetaData) => {
        setMeta(m);
        setWeekId(m.latest_week);
        return fetch(`/data/summaries/weekly/${m.latest_week}.json`);
      })
      .then((r) => {
        if (!r.ok) throw new Error("No weekly data");
        return r.json();
      })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const loadWeek = (wid: string) => {
    setLoading(true);
    setWeekId(wid);
    fetch(`/data/summaries/weekly/${wid}.json`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  const changeWeek = (offset: number) => {
    if (!weekId) return;
    const [year, week] = weekId.split("-W").map(Number);
    const totalWeeks = new Date(year, 11, 28).getDay() > 0 ? 53 : 52;
    let newWeek = week + offset;
    let newYear = year;
    if (newWeek < 1) { newYear--; newWeek = 52; }
    if (newWeek > totalWeeks) { newYear++; newWeek = 1; }
    loadWeek(`${newYear}-W${String(newWeek).padStart(2, "0")}`);
  };

  const dailyLineData = data
    ? Object.entries(data.daily_article_counts ?? {})
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date: date.slice(5), count }))
    : [];

  const catChartData = data
    ? (Object.entries(data.category_totals) as [ArticleCategory, number][])
        .filter(([, v]) => v > 0)
        .map(([cat, value]) => ({ name: CATEGORY_KO[cat], value, color: CATEGORY_DOT[cat] }))
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 text-teal-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">위클리 리포트</h1>
          {data && (
            <p className="text-sm text-slate-500">{data.start_date} ~ {data.end_date}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => changeWeek(-1)} className="p-2 rounded-lg hover:bg-slate-100">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-slate-700 px-3">{weekId}</span>
          <button
            onClick={() => changeWeek(1)}
            disabled={weekId >= (meta?.latest_week ?? "")}
            className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!data ? (
        <div className="card text-center text-slate-400 py-16">해당 주차 데이터 없음</div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="card text-center">
              <p className="text-3xl font-bold text-teal-600">{data.total_articles}</p>
              <p className="text-sm text-slate-500">이번 주 수집</p>
            </div>
            <div className="card text-center">
              <p className="text-3xl font-bold text-blue-600">{data.days_included.length}</p>
              <p className="text-sm text-slate-500">수집일</p>
            </div>
            <div className="card text-center">
              <p className="text-3xl font-bold text-orange-600">{data.highlighted_articles.length}</p>
              <p className="text-sm text-slate-500">핵심 기사</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card">
              <h2 className="font-semibold text-slate-800 mb-4 text-sm">일별 수집량</h2>
              {dailyLineData.length > 0
                ? <WeeklyLineChart data={dailyLineData} />
                : <p className="text-slate-400 text-sm text-center py-8">데이터 수집 중</p>}
            </div>
            <div className="card">
              <h2 className="font-semibold text-slate-800 mb-4 text-sm">카테고리 분포</h2>
              <CategoryDonutChart data={catChartData} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="card lg:col-span-2">
              <h2 className="font-semibold text-slate-800 mb-4 text-sm">이번 주 주요 키워드</h2>
              <KeywordBarChart keywords={data.top_keywords} maxShow={12} />
            </div>
            <div className="card">
              <h2 className="font-semibold text-slate-800 mb-4 text-sm">키워드 클라우드</h2>
              <KeywordCloud keywords={data.top_keywords} maxShow={20} />
            </div>
          </div>

          {data.ai_summary && (
            <div className="card border-l-4 border-teal-500">
              <h2 className="font-semibold text-slate-800 mb-3 text-sm">주간 AI 요약</h2>
              <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {data.ai_summary}
              </div>
            </div>
          )}

          <div className="card">
            <h2 className="font-semibold text-slate-800 mb-4 text-sm">
              이번 주 핵심 기사 ({data.highlighted_articles.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {data.highlighted_articles.slice(0, 12).map((a) => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
