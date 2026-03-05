"""Main Pipeline Orchestrator — runs daily via GitHub Actions"""

import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from collectors.rss_collector import collect_rss
from collectors.naver_collector import collect_naver_news
from collectors.google_trends_collector import collect_google_trends
from collectors.youtube_collector import collect_youtube_trends
from collectors.scholar_collector import collect_academic_papers
from processors.gemini_processor import process_articles_batch, generate_daily_summary, setup_gemini
from processors.aggregator import build_daily_json, save_all


def run():
    today = datetime.now(timezone.utc)
    date_str = today.strftime("%Y-%m-%d")
    print(f"\n{'='*60}")
    print(f"Food Trend Pipeline — {date_str}")
    print(f"{'='*60}\n")

    print("=== Phase 1: Data Collection ===")
    rss_articles = collect_rss(days_back=1)
    naver_articles = collect_naver_news(days_back=1)
    academic_papers = collect_academic_papers()
    youtube_videos = collect_youtube_trends()
    trends_data = collect_google_trends()

    all_articles = rss_articles + naver_articles + academic_papers
    print(f"\nTotal: {len(all_articles)} articles, {len(youtube_videos)} YouTube videos")

    print("\n=== Phase 2: AI Processing ===")
    processed = process_articles_batch(all_articles)

    print("\n=== Phase 3: Summary Generation ===")
    try:
        model = setup_gemini()
        summary = generate_daily_summary(model, processed, date_str)
    except Exception as e:
        print(f"Summary skipped: {e}")
        summary = f"{date_str} — {len(processed)}건 수집 완료"

    print("\n=== Phase 4: Save ===")
    daily_data = build_daily_json(processed, trends_data, youtube_videos, summary, today)
    save_all(daily_data, today)

    print(f"\n{'='*60}")
    print(f"Done: {len(processed)} articles processed")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    run()
