import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  const { message } = await req.json();

  if (!message?.trim()) {
    return NextResponse.json({ reply: "질문을 입력해주세요." });
  }

  // Load latest article data
  let articles: Record<string, unknown>[] = [];
  let topKeywords: { keyword: string; count: number }[] = [];
  let date = "";

  try {
    const metaPath = path.join(process.cwd(), "public", "data", "meta", "latest.json");
    const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
    date = meta.latest_date;

    const articlesPath = path.join(process.cwd(), "public", "data", "articles", `${date}.json`);
    const dailyData = JSON.parse(fs.readFileSync(articlesPath, "utf-8"));
    articles = dailyData.articles ?? [];
    topKeywords = dailyData.top_keywords ?? [];
  } catch {
    // Data not yet available
  }

  // Find relevant articles by keyword matching
  const msgLower = message.toLowerCase();
  const relevant = articles
    .filter((a) => {
      const title = String(a.title ?? "").toLowerCase();
      const summary = String(a.summary ?? "").toLowerCase();
      const keywords = (a.keywords as string[]) ?? [];
      return (
        title.includes(msgLower) ||
        summary.includes(msgLower) ||
        keywords.some(
          (k) => msgLower.includes(k.toLowerCase()) || k.toLowerCase().includes(msgLower)
        )
      );
    })
    .slice(0, 6);

  // Build context
  const articleContext =
    relevant.length > 0
      ? relevant
        .map(
          (a) =>
            `[${a.category}] ${a.title}\n요약: ${a.summary}\n키워드: ${(a.keywords as string[]).join(", ")}`
        )
        .join("\n\n")
      : `관련 기사 없음. 전체 주요 키워드: ${topKeywords
        .slice(0, 10)
        .map((k) => k.keyword)
        .join(", ")}`;

  // Call Gemini
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      reply: "Gemini API 키가 설정되지 않았습니다. Vercel 환경변수에 GEMINI_API_KEY를 추가해주세요.",
    });
  }

  try {
    const genai = new GoogleGenerativeAI(apiKey);
    const model = genai.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `당신은 식품 R&D팀(소스·양념류 전문)을 위한 트렌드 분석 AI 어시스턴트입니다.
최신 수집 데이터 (${date}):

${articleContext}

질문: ${message}

한국어로 간결하고 실무적으로 답변해주세요. R&D 개발에 바로 활용 가능한 인사이트를 포함해주세요.`;

    const result = await model.generateContent(prompt);
    return NextResponse.json({ reply: result.response.text() });
  } catch (e) {
    console.error("Gemini error:", e);
    return NextResponse.json({ reply: "AI 응답 생성 중 오류가 발생했습니다." });
  }
}
