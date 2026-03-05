"""Gemini AI Processor
Categorizes articles and generates Korean summaries for food R&D teams.
"""

import os
import json
import time
import google.generativeai as genai

CATEGORY_KO = {
    "ingredient": "원료 트렌드",
    "product": "제품 트렌드",
    "consumer": "소비자 트렌드",
    "manufacturing": "제조/기술",
    "market": "시장/유통",
    "regulation": "규제/정책",
    "other": "기타",
}


def setup_gemini():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not set")
    genai.configure(api_key=api_key)
    return genai.GenerativeModel("gemini-1.5-flash")


def process_article(model, article: dict) -> dict:
    title = article.get("title", "")
    content = article.get("content", "") or article.get("summary", "")

    if not title and not content:
        article.setdefault("category", "other")
        article.setdefault("keywords", [])
        article.setdefault("summary", "")
        article.setdefault("relevance_score", 5)
        return article

    prompt = f"""당신은 식품 R&D 전문 분석가입니다. 소스·양념류 전문입니다.
다음 기사를 분석하고 JSON만 출력하세요 (설명 없이).

제목: {title}
내용: {content[:800]}

{{
  "category": "ingredient|product|consumer|manufacturing|market|regulation|other",
  "keywords": ["키워드1", "키워드2", "키워드3"],
  "summary_ko": "2-3문장 한국어 요약 (소스/양념 R&D 관점)",
  "relevance_score": 1~10,
  "trend_signal": "rising|stable|declining",
  "key_ingredients": ["성분1", "성분2"],
  "actionable_insight": "R&D팀 주목 포인트 1문장"
}}

카테고리: ingredient=원료/성분, product=신제품/콘셉트, consumer=소비트렌드/건강,
manufacturing=제조기술/공정/특허, market=시장/유통/M&A, regulation=법규/인증"""

    try:
        response = model.generate_content(prompt)
        text = response.text.strip()

        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()

        result = json.loads(text)
        article["category"] = result.get("category", "other")
        article["keywords"] = result.get("keywords", [])
        article["summary"] = result.get("summary_ko", content[:200])
        article["relevance_score"] = result.get("relevance_score", 5)
        article["trend_signal"] = result.get("trend_signal", "stable")
        article["key_ingredients"] = result.get("key_ingredients", [])
        article["actionable_insight"] = result.get("actionable_insight", "")
    except Exception as e:
        print(f"Gemini error [{title[:40]}]: {e}")
        article.setdefault("category", "other")
        article.setdefault("keywords", [])
        article.setdefault("summary", content[:200])
        article.setdefault("relevance_score", 5)

    return article


def generate_daily_summary(model, articles: list[dict], date_str: str) -> str:
    if not articles:
        return "오늘 수집된 기사가 없습니다."

    by_category = {}
    keyword_freq = {}
    for a in articles:
        cat = a.get("category", "other")
        by_category.setdefault(cat, []).append(a.get("title", ""))
        for kw in a.get("keywords", []):
            keyword_freq[kw] = keyword_freq.get(kw, 0) + 1

    top_kws = sorted(keyword_freq.items(), key=lambda x: x[1], reverse=True)[:12]
    cat_summary = "\n".join(
        f"- {CATEGORY_KO.get(cat, cat)}: {len(items)}건"
        for cat, items in by_category.items()
    )
    kw_list = ", ".join(f"{kw}({cnt}회)" for kw, cnt in top_kws[:8])

    high_relevance = [a for a in articles if (a.get("relevance_score") or 0) >= 8]
    top_titles = "\n".join(
        f"- {a['title']}" for a in sorted(high_relevance, key=lambda x: x.get("relevance_score", 0), reverse=True)[:5]
    )

    prompt = f"""식품 R&D팀(소스·양념 전문)을 위한 {date_str} 트렌드 요약을 작성해주세요.

수집 기사:
{cat_summary}

주요 키워드: {kw_list}

주목 기사:
{top_titles}

마크다운 형식으로 작성 (간결하게):
## 오늘의 핵심 인사이트 (3개)
## 주목할 트렌드 시그널
## R&D 액션 아이템"""

    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Daily summary error: {e}")
        return f"오늘 {len(articles)}건 수집. 주요 키워드: {kw_list}"


def process_articles_batch(articles: list[dict], batch_size: int = 10) -> list[dict]:
    if not articles:
        return []

    try:
        model = setup_gemini()
    except ValueError as e:
        print(f"Gemini not available: {e}")
        for a in articles:
            a.setdefault("category", "other")
            a.setdefault("keywords", [])
            a.setdefault("summary", a.get("content", "")[:200])
            a.setdefault("relevance_score", 5)
        return articles

    processed = []
    total_batches = (len(articles) - 1) // batch_size + 1

    for i in range(0, len(articles), batch_size):
        batch = articles[i:i + batch_size]
        print(f"Processing batch {i // batch_size + 1}/{total_batches}...")
        for article in batch:
            if article.get("category") and article.get("summary"):
                processed.append(article)
                continue
            processed.append(process_article(model, article))
            time.sleep(0.3)

    return processed
