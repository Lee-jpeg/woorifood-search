"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { KeywordCount } from "@/types";

interface KeywordBarProps {
  keywords: KeywordCount[];
  maxShow?: number;
}

export function KeywordBarChart({ keywords, maxShow = 12 }: KeywordBarProps) {
  const data = keywords.slice(0, maxShow).map((k) => ({
    name: k.keyword,
    count: k.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ left: 16, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
          formatter={(v) => [`${v}회`, "언급"]}
        />
        <Bar dataKey="count" fill="#0d9488" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface CategoryPieProps {
  data: { name: string; value: number; color: string }[];
}

export function CategoryDonutChart({ data }: CategoryPieProps) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="space-y-2">
      {data.map((d) => {
        const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
        return (
          <div key={d.name} className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ background: d.color }} />
            <span className="text-xs text-slate-600 flex-1">{d.name}</span>
            <div className="flex items-center gap-2">
              <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, background: d.color }}
                />
              </div>
              <span className="text-xs font-medium text-slate-700 w-8 text-right">{d.value}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface WeeklyLineProps {
  data: { date: string; count: number }[];
}

export function WeeklyLineChart({ data }: WeeklyLineProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ left: 0, right: 8 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Line type="monotone" dataKey="count" stroke="#0d9488" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

interface MultiLineProps {
  data: { week: string; [key: string]: number | string }[];
  keywords: string[];
  colors?: string[];
}

export function MultiKeywordLineChart({ data, keywords, colors }: MultiLineProps) {
  const palette = colors ?? ["#0d9488", "#f97316", "#8b5cf6", "#3b82f6", "#eab308"];
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ left: 0, right: 8 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="week" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {keywords.map((kw, i) => (
          <Line
            key={kw}
            type="monotone"
            dataKey={kw}
            stroke={palette[i % palette.length]}
            strokeWidth={2}
            dot={{ r: 2 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
