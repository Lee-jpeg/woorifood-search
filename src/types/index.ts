export type ArticleCategory =
  | "ingredient"
  | "product"
  | "consumer"
  | "manufacturing"
  | "market"
  | "regulation"
  | "other";

export const CATEGORY_KO: Record<ArticleCategory, string> = {
  ingredient: "원료 트렌드",
  product: "제품 트렌드",
  consumer: "소비자 트렌드",
  manufacturing: "제조/기술",
  market: "시장/유통",
  regulation: "규제/정책",
  other: "기타",
};

export const CATEGORY_COLOR: Record<ArticleCategory, string> = {
  ingredient: "bg-emerald-100 text-emerald-800",
  product: "bg-blue-100 text-blue-800",
  consumer: "bg-purple-100 text-purple-800",
  manufacturing: "bg-orange-100 text-orange-800",
  market: "bg-yellow-100 text-yellow-800",
  regulation: "bg-red-100 text-red-800",
  other: "bg-gray-100 text-gray-700",
};

export const CATEGORY_DOT: Record<ArticleCategory, string> = {
  ingredient: "#10b981",
  product: "#3b82f6",
  consumer: "#8b5cf6",
  manufacturing: "#f97316",
  market: "#eab308",
  regulation: "#ef4444",
  other: "#9ca3af",
};

export interface Article {
  id: string;
  title: string;
  url: string;
  source: string;
  language: "ko" | "en";
  published_at: string;
  content?: string;
  summary: string;
  category: ArticleCategory;
  keywords: string[];
  key_ingredients?: string[];
  relevance_score: number;
  trend_signal?: "rising" | "stable" | "declining";
  actionable_insight?: string;
}

export interface KeywordCount {
  keyword: string;
  count: number;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  channel: string;
  published_at: string;
  description: string;
  thumbnail: string;
  url: string;
}

export interface DailyData {
  date: string;
  generated_at: string;
  total_articles: number;
  category_counts: Partial<Record<ArticleCategory, number>>;
  top_keywords: KeywordCount[];
  highlighted_articles: Article[];
  articles: Article[];
  ai_summary: string;
  youtube_highlights: YouTubeVideo[];
  trends_summary: {
    google_trends: Array<{
      keywords: string[];
      timeseries: Record<string, number[]>;
      related_rising: Record<string, string[]>;
    }>;
  };
}

export interface WeeklyData {
  week_id: string;
  start_date: string;
  end_date: string;
  total_articles: number;
  days_included: string[];
  top_keywords: KeywordCount[];
  daily_keyword_freq: Record<string, number>;
  category_totals: Partial<Record<ArticleCategory, number>>;
  highlighted_articles: Article[];
  daily_article_counts: Record<string, number>;
  ai_summary: string | null;
}

export interface MonthlyData {
  month_id: string;
  year: number;
  month: number;
  total_articles: number;
  days_included: string[];
  top_keywords: KeywordCount[];
  keyword_freq: Record<string, number>;
  category_totals: Partial<Record<ArticleCategory, number>>;
  weekly_keyword_trend: Record<string, Record<string, number>>;
}

export interface MetaData {
  latest_date: string;
  latest_week: string;
  latest_month: string;
  updated_at: string;
}
