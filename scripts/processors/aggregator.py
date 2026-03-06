"""Data Aggregator
Builds daily/weekly/monthly JSON summaries from processed articles.
"""

import json
from collections import Counter
from datetime import datetime, timedelta, timezone
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent.parent / "public" / "data"


def get_week_id(date: datetime) -> str:
    year, week, _ = date.isocalendar()
    return f"{year}-W{week:02d}"


def get_month_id(date: datetime) -> str:
    return date.strftime("%Y-%m")


def build_daily_json(
    articles: list[dict],
    trends: dict,
    youtube: list[dict],
    ai_summary: str,
    date: datetime,
) -> dict:
    date_str = date.strftime("%Y-%m-%d")

    categories: dict[str, list] = {}
    all_keywords = []
    for article in articles:
        cat = article.get("category", "other")
        # Gemini sometimes returns a list instead of a string
        if isinstance(cat, list):
            cat = cat[0] if cat else "other"
        cat = str(cat)
        # Normalize: take first category if pipe-separated, handle None/comma
        if "|" in cat:
            cat = cat.split("|")[0].strip()
        if "," in cat:
            cat = cat.split(",")[0].strip()
        if cat in ("None", "none", "null", ""):
            cat = "other"
        article["category"] = cat
        categories.setdefault(cat, []).append(article)
        kws = article.get("keywords", [])
        if isinstance(kws, str):
            kws = [kws]
        all_keywords.extend(kws)

    keyword_freq = Counter(all_keywords)
    top_keywords = [{"keyword": kw, "count": cnt} for kw, cnt in keyword_freq.most_common(25)]

    highlighted = sorted(
        [a for a in articles if (a.get("relevance_score") or 0) >= 7],
        key=lambda x: x.get("relevance_score", 0),
        reverse=True,
    )[:12]

    return {
        "date": date_str,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "total_articles": len(articles),
        "category_counts": {cat: len(items) for cat, items in categories.items()},
        "top_keywords": top_keywords,
        "highlighted_articles": highlighted,
        "articles": articles,
        "ai_summary": ai_summary,
        "youtube_highlights": youtube[:8],
        "trends_summary": {"google_trends": trends.get("keyword_groups", [])},
    }


def _load_or_init_weekly(week_file: Path, date: datetime, week_id: str) -> dict:
    if week_file.exists():
        with open(week_file, "r", encoding="utf-8") as f:
            return json.load(f)

    day_of_week = date.weekday()
    week_start = (date - timedelta(days=day_of_week)).strftime("%Y-%m-%d")
    week_end = (date + timedelta(days=6 - day_of_week)).strftime("%Y-%m-%d")
    return {
        "week_id": week_id,
        "start_date": week_start,
        "end_date": week_end,
        "total_articles": 0,
        "days_included": [],
        "top_keywords": [],
        "daily_keyword_freq": {},
        "category_totals": {},
        "highlighted_articles": [],
        "daily_article_counts": {},
        "ai_summary": None,
    }


def update_weekly_json(date: datetime, daily_data: dict):
    week_id = get_week_id(date)
    week_file = DATA_DIR / "summaries" / "weekly" / f"{week_id}.json"
    week_file.parent.mkdir(parents=True, exist_ok=True)

    weekly = _load_or_init_weekly(week_file, date, week_id)
    date_str = date.strftime("%Y-%m-%d")

    # If re-running same day, subtract old counts first
    if date_str in weekly["days_included"]:
        old_count = weekly["daily_article_counts"].get(date_str, 0)
        weekly["total_articles"] -= old_count
    else:
        weekly["days_included"].append(date_str)

    weekly["total_articles"] += daily_data["total_articles"]
    weekly["daily_article_counts"][date_str] = daily_data["total_articles"]

    # Rebuild keyword freq and category totals from scratch for accuracy
    weekly["daily_keyword_freq"] = {}
    weekly["category_totals"] = {}
    for kw_item in daily_data["top_keywords"]:
        kw, cnt = kw_item["keyword"], kw_item["count"]
        weekly["daily_keyword_freq"][kw] = weekly["daily_keyword_freq"].get(kw, 0) + cnt

    for cat, cnt in daily_data["category_counts"].items():
        weekly["category_totals"][cat] = weekly["category_totals"].get(cat, 0) + cnt

    sorted_kws = sorted(weekly["daily_keyword_freq"].items(), key=lambda x: x[1], reverse=True)
    weekly["top_keywords"] = [{"keyword": k, "count": v} for k, v in sorted_kws[:25]]

    # Replace highlighted articles (deduplicate by id)
    existing_ids = {a.get("id") for a in daily_data.get("highlighted_articles", [])}
    weekly["highlighted_articles"] = [
        a for a in weekly["highlighted_articles"] if a.get("id") not in existing_ids
    ]
    weekly["highlighted_articles"].extend(daily_data.get("highlighted_articles", []))
    weekly["highlighted_articles"] = sorted(
        weekly["highlighted_articles"],
        key=lambda x: x.get("relevance_score", 0),
        reverse=True,
    )[:20]

    with open(week_file, "w", encoding="utf-8") as f:
        json.dump(weekly, f, ensure_ascii=False, indent=2)


def update_monthly_json(date: datetime, daily_data: dict):
    month_id = get_month_id(date)
    month_file = DATA_DIR / "summaries" / "monthly" / f"{month_id}.json"
    month_file.parent.mkdir(parents=True, exist_ok=True)

    if month_file.exists():
        with open(month_file, "r", encoding="utf-8") as f:
            monthly = json.load(f)
    else:
        monthly = {
            "month_id": month_id,
            "year": date.year,
            "month": date.month,
            "total_articles": 0,
            "days_included": [],
            "top_keywords": [],
            "keyword_freq": {},
            "category_totals": {},
            "weekly_keyword_trend": {},
        }

    date_str = date.strftime("%Y-%m-%d")
    # Always update (allow re-runs on same day)
    if date_str not in monthly["days_included"]:
        monthly["days_included"].append(date_str)
    # Recalculate total from daily article file counts
    monthly["total_articles"] = sum(
        monthly.get("daily_article_counts", {}).get(d, 0) for d in monthly["days_included"]
        if d != date_str
    ) + daily_data["total_articles"]
    monthly.setdefault("daily_article_counts", {})[date_str] = daily_data["total_articles"]

    week_label = f"W{date.isocalendar()[1]}"
    monthly["weekly_keyword_trend"].setdefault(week_label, {})

    for kw_item in daily_data["top_keywords"]:
        kw, cnt = kw_item["keyword"], kw_item["count"]
        monthly["keyword_freq"][kw] = monthly["keyword_freq"].get(kw, 0) + cnt
        monthly["weekly_keyword_trend"][week_label][kw] = (
            monthly["weekly_keyword_trend"][week_label].get(kw, 0) + cnt
        )

    for cat, cnt in daily_data["category_counts"].items():
        monthly["category_totals"][cat] = monthly["category_totals"].get(cat, 0) + cnt

    sorted_kws = sorted(monthly["keyword_freq"].items(), key=lambda x: x[1], reverse=True)
    monthly["top_keywords"] = [{"keyword": k, "count": v} for k, v in sorted_kws[:30]]

    with open(month_file, "w", encoding="utf-8") as f:
        json.dump(monthly, f, ensure_ascii=False, indent=2)


def update_meta(date: datetime):
    meta_file = DATA_DIR / "meta" / "latest.json"
    meta_file.parent.mkdir(parents=True, exist_ok=True)
    meta = {
        "latest_date": date.strftime("%Y-%m-%d"),
        "latest_week": get_week_id(date),
        "latest_month": get_month_id(date),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    with open(meta_file, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)


def save_all(daily_data: dict, date: datetime):
    date_str = date.strftime("%Y-%m-%d")
    articles_dir = DATA_DIR / "articles"
    articles_dir.mkdir(parents=True, exist_ok=True)

    with open(articles_dir / f"{date_str}.json", "w", encoding="utf-8") as f:
        json.dump(daily_data, f, ensure_ascii=False, indent=2)

    update_weekly_json(date, daily_data)
    update_monthly_json(date, daily_data)
    update_meta(date)
    print(f"Saved: {date_str} — {daily_data['total_articles']} articles")
