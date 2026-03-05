"use client";

import { useEffect, useState } from "react";
import { MonthlyData, MetaData, CATEGORY_KO, ArticleCategory } from "@/types";
import { RefreshCw } from "lucide-react";

const MONTHS = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

interface MonthCard {
  monthId: string;
  label: string;
  data: MonthlyData | null;
  available: boolean;
}

export default function AnnualPage() {
  const [cards, setCards] = useState<MonthCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [meta, setMeta] = useState<MetaData | null>(null);

  useEffect(() => {
    fetch("/data/meta/latest.json")
      .then((r) => r.json())
      .then((m: MetaData) => {
        setMeta(m);
        setYear(Number(m.latest_month.split("-")[0]));
        return m;
      })
      .then((m) => loadYear(Number(m.latest_month.split("-")[0])))
      .finally(() => setLoading(false));
  }, []);

  const loadYear = async (y: number) => {
    setLoading(true);
    const result: MonthCard[] = [];
    for (let mo = 1; mo <= 12; mo++) {
      const monthId = `${y}-${String(mo).padStart(2, "0")}`;
      try {
        const r = await fetch(`/data/summaries/monthly/${monthId}.json`);
        if (r.ok) {
          const d = await r.json();
          result.push({ monthId, label: MONTHS[mo - 1], data: d, available: true });
        } else {
          result.push({ monthId, label: MONTHS[mo - 1], data: null, available: false });
        }
      } catch {
        result.push({ monthId, label: MONTHS[mo - 1], data: null, available: false });
      }
    }
    setCards(result);
    setLoading(false);
  };

  const totalArticles = cards.reduce((s, c) => s + (c.data?.total_articles ?? 0), 0);
  const availableMonths = cards.filter((c) => c.available).length;

  // Aggregate top keywords across all months
  const allKeywords: Record<string, number> = {};
  for (const c of cards) {
    if (!c.data) continue;
    for (const kw of c.data.top_keywords ?? []) {
      allKeywords[kw.keyword] = (allKeywords[kw.keyword] ?? 0) + kw.count;
    }
  }
  const topAnnualKeywords = Object.entries(allKeywords)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  // Aggregate categories
  const allCats: Partial<Record<ArticleCategory, number>> = {};
  for (const c of cards) {
    if (!c.data) continue;
    for (const [cat, cnt] of Object.entries(c.data.category_totals ?? {})) {
      allCats[cat as ArticleCategory] = (allCats[cat as ArticleCategory] ?? 0) + (cnt ?? 0);
    }
  }

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
        <h1 className="text-2xl font-bold text-slate-900">{year}년 연간 트렌드</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { const y = year - 1; setYear(y); loadYear(y); }}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            ← {year - 1}년
          </button>
          {meta && year < Number(meta.latest_month.split("-")[0]) && (
            <button
              onClick={() => { const y = year + 1; setYear(y); loadYear(y); }}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              {year + 1}년 →
            </button>
          )}
        </div>
      </div>

      {/* Annual Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-teal-600">{totalArticles.toLocaleString()}</p>
          <p className="text-sm text-slate-500">연간 수집</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-blue-600">{availableMonths}</p>
          <p className="text-sm text-slate-500">데이터 있는 월</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-purple-600">{topAnnualKeywords.length}</p>
          <p className="text-sm text-slate-500">주요 키워드</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-orange-600">
            {Math.round(totalArticles / Math.max(availableMonths, 1))}
          </p>
          <p className="text-sm text-slate-500">월평균 기사</p>
        </div>
      </div>

      {/* Top Annual Keywords */}
      {topAnnualKeywords.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4 text-sm">{year}년 TOP 10 키워드</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {topAnnualKeywords.map(([kw, cnt], i) => (
              <div key={kw} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm font-medium text-slate-700">{kw}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-500 rounded-full"
                      style={{ width: `${(cnt / (topAnnualKeywords[0]?.[1] ?? 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 w-12 text-right">{cnt}회</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Annual */}
      {Object.keys(allCats).length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4 text-sm">카테고리별 연간 분포</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {(Object.entries(allCats) as [ArticleCategory, number][])
              .sort(([, a], [, b]) => b - a)
              .map(([cat, cnt]) => (
                <div key={cat} className="text-center p-3 bg-slate-50 rounded-xl">
                  <p className="text-2xl font-bold text-teal-600">{cnt}</p>
                  <p className="text-xs text-slate-500 mt-1">{CATEGORY_KO[cat]}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Month Grid */}
      <div>
        <h2 className="font-semibold text-slate-800 mb-4 text-sm">월별 현황</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
            <a
              key={card.monthId}
              href={card.available ? `/monthly?month=${card.monthId}` : undefined}
              className={`card transition-all ${
                card.available
                  ? "hover:shadow-md hover:border-teal-200 cursor-pointer"
                  : "opacity-40 cursor-not-allowed"
              }`}
            >
              <p className="text-sm font-semibold text-slate-700">{card.label}</p>
              {card.data ? (
                <>
                  <p className="text-2xl font-bold text-teal-600 mt-1">
                    {card.data.total_articles}
                    <span className="text-xs font-normal text-slate-400 ml-1">건</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {card.data.days_included.length}일 수집
                  </p>
                  {card.data.top_keywords[0] && (
                    <p className="text-xs text-teal-600 mt-2 truncate">
                      #{card.data.top_keywords[0].keyword}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-slate-400 mt-2">데이터 없음</p>
              )}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
