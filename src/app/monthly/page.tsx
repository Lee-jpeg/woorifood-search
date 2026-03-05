"use client";

import { useEffect, useState } from "react";
import { MonthlyData, MetaData, CATEGORY_KO, CATEGORY_DOT, ArticleCategory } from "@/types";
import KeywordCloud from "../components/KeywordCloud";
import { KeywordBarChart, CategoryDonutChart, MultiKeywordLineChart } from "../components/TrendChart";
import { RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";

export default function MonthlyPage() {
  const [data, setData] = useState<MonthlyData | null>(null);
  const [meta, setMeta] = useState<MetaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [monthId, setMonthId] = useState<string>("");

  useEffect(() => {
    fetch("/data/meta/latest.json")
      .then((r) => r.json())
      .then((m: MetaData) => {
        setMeta(m);
        setMonthId(m.latest_month);
        return fetch(`/data/summaries/monthly/${m.latest_month}.json`);
      })
      .then((r) => {
        if (!r.ok) throw new Error("No monthly data");
        return r.json();
      })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const loadMonth = (mid: string) => {
    setLoading(true);
    setMonthId(mid);
    fetch(`/data/summaries/monthly/${mid}.json`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  const changeMonth = (offset: number) => {
    if (!monthId) return;
    const [y, m] = monthId.split("-").map(Number);
    const d = new Date(y, m - 1 + offset, 1);
    loadMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  // Build multi-keyword line chart data from weekly_keyword_trend
  const weeklyTrendData = data
    ? Object.entries(data.weekly_keyword_trend ?? {})
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([week, kwData]) => ({ week, ...kwData }))
    : [];

  const topKeywordsForLine = data?.top_keywords?.slice(0, 5).map((k) => k.keyword) ?? [];

  const catChartData = data
    ? (Object.entries(data.category_totals) as [ArticleCategory, number][])
        .filter(([, v]) => v > 0)
        .map(([cat, value]) => ({ name: CATEGORY_KO[cat], value, color: CATEGORY_DOT[cat] }))
    : [];

  const MONTH_KO = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

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
          <h1 className="text-2xl font-bold text-slate-900">먼슬리 리포트</h1>
          {data && (
            <p className="text-sm text-slate-500">{data.year}년 {MONTH_KO[data.month - 1]}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => changeMonth(-1)} className="p-2 rounded-lg hover:bg-slate-100">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <input
            type="month"
            value={monthId}
            max={meta?.latest_month}
            onChange={(e) => loadMonth(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5"
          />
          <button
            onClick={() => changeMonth(1)}
            disabled={monthId >= (meta?.latest_month ?? "")}
            className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!data ? (
        <div className="card text-center text-slate-400 py-16">해당 월 데이터 없음</div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="card text-center">
              <p className="text-3xl font-bold text-teal-600">{data.total_articles}</p>
              <p className="text-sm text-slate-500">이달 수집</p>
            </div>
            <div className="card text-center">
              <p className="text-3xl font-bold text-blue-600">{data.days_included.length}</p>
              <p className="text-sm text-slate-500">수집일</p>
            </div>
            <div className="card text-center">
              <p className="text-3xl font-bold text-orange-600">{Object.keys(data.weekly_keyword_trend ?? {}).length}</p>
              <p className="text-sm text-slate-500">수집 주차</p>
            </div>
          </div>

          {weeklyTrendData.length > 1 && topKeywordsForLine.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-slate-800 mb-4 text-sm">주차별 키워드 트렌드 (TOP 5)</h2>
              <MultiKeywordLineChart data={weeklyTrendData} keywords={topKeywordsForLine} />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="card lg:col-span-2">
              <h2 className="font-semibold text-slate-800 mb-4 text-sm">이달 주요 키워드</h2>
              <KeywordBarChart keywords={data.top_keywords} maxShow={15} />
            </div>
            <div className="card">
              <h2 className="font-semibold text-slate-800 mb-4 text-sm">카테고리 분포</h2>
              <CategoryDonutChart data={catChartData} />
            </div>
          </div>

          <div className="card">
            <h2 className="font-semibold text-slate-800 mb-4 text-sm">이달 키워드 클라우드</h2>
            <KeywordCloud keywords={data.top_keywords} maxShow={30} />
          </div>
        </>
      )}
    </div>
  );
}
