"""Main Pipeline Orchestrator — runs daily via GitHub Actions"""

import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from collectors.rss_collector import collect_rss
from collectors.naver_collector import collect_naver_news
from collectors.google_trends_collector import collect_google_trends
from collectors.youtube_collector import collect_youtube_trends
from collectors.scholar_collector import collect_academic_papers
from processors.gemini_processor import process_articles_batch, generate_daily_summary, setup_gemini
from processors.aggregator import build_daily_json, save_all

# KST timezone
KST = timezone(timedelta(hours=9))
MAX_AI_ARTICLES = 50  # Gemini API 토큰 절약을 위해 상위 50건만 AI 처리


def run():
    today = datetime.now(KST)
    date_str = today.strftime("%Y-%m-%d")
    print(f"\n{'='*60}")
    print(f"Food Trend Pipeline — {date_str} (KST)")
    print(f"{'='*60}\n")

    print("=== Phase 1: Data Collection ===")
    rss_articles = collect_rss(days_back=2)  # 2일로 확장 (UTC/KST 차이 커버)
    naver_articles = collect_naver_news(days_back=1)
    academic_papers = collect_academic_papers()
    youtube_videos = collect_youtube_trends()
    trends_data = collect_google_trends()

    all_articles = rss_articles + naver_articles + academic_papers
    print(f"\nTotal collected: {len(all_articles)} articles, {len(youtube_videos)} YouTube videos")

    # Sort by relevance heuristic: Naver first (Korean), then RSS, then Scholar
    # Within each group, newer articles first
    def sort_key(a):
        source_priority = 0  # default
        if a.get("source") == "Naver News":
            source_priority = 2  # highest
        elif a.get("type") == "academic":
            source_priority = -1  # lowest
        else:
            source_priority = 1  # RSS in middle
        return (source_priority, a.get("published_at", ""))

    all_articles.sort(key=sort_key, reverse=True)

    # Split: top N for AI processing, rest stay as-is
    ai_candidates = all_articles[:MAX_AI_ARTICLES]
    remaining = all_articles[MAX_AI_ARTICLES:]

    print(f"AI processing: {len(ai_candidates)} articles (top {MAX_AI_ARTICLES})")
    print(f"Skipping AI for: {len(remaining)} articles (saved as-is)")

    print("\n=== Phase 2: AI Processing ===")
    processed = process_articles_batch(ai_candidates)

    # Set defaults for remaining articles (no AI processing)
    for a in remaining:
        a.setdefault("category", "other")
        a.setdefault("keywords", [])
        a.setdefault("summary", a.get("content", "")[:200])
        a.setdefault("relevance_score", 3)

    all_processed = processed + remaining

    print(f"\n=== Phase 3: Summary Generation ===")
    try:
        model = setup_gemini()
        summary = generate_daily_summary(model, processed, date_str)
    except Exception as e:
        print(f"Summary skipped: {e}")
        top_kws = []
        for a in processed:
            top_kws.extend(a.get("keywords", []))
        kw_str = ", ".join(list(dict.fromkeys(top_kws))[:10])
        summary = f"## {date_str} 트렌드 요약\n\n총 {len(all_processed)}건 수집. 주요 키워드: {kw_str}"

    print("\n=== Phase 4: Save ===")
    daily_data = build_daily_json(all_processed, trends_data, youtube_videos, summary, today)
    save_all(daily_data, today)

    print(f"\n{'='*60}")
    print(f"Done: {len(all_processed)} articles total ({len(processed)} AI-processed)")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    run()
