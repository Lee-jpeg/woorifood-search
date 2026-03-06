"""Naver News API Collector
Requires: NAVER_CLIENT_ID, NAVER_CLIENT_SECRET env variables
Get keys at: https://developers.naver.com
"""

import os
import re
import hashlib
import requests
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime

KST = timezone(timedelta(hours=9))

KEYWORDS = [
    "소스 신제품", "양념 트렌드", "저당 소스", "발효 소스",
    "식품 트렌드", "HMR 소스", "간편식 양념", "대체 감미료",
    "식물성 단백질", "비건 식품", "저염 식품", "천연 조미료",
    "알룰로스 식품", "클린라벨", "건강기능식품 소스",
]


def collect_naver_news(days_back: int = 1) -> list[dict]:
    client_id = os.getenv("NAVER_CLIENT_ID")
    client_secret = os.getenv("NAVER_CLIENT_SECRET")

    if not client_id or not client_secret:
        print("NAVER API keys not set - skipping")
        return []

    cutoff = datetime.now(KST) - timedelta(days=days_back)
    articles = []
    seen_ids = set()

    for keyword in KEYWORDS:
        try:
            response = requests.get(
                "https://openapi.naver.com/v1/search/news.json",
                params={"query": keyword, "display": 10, "sort": "date"},
                headers={"X-Naver-Client-Id": client_id, "X-Naver-Client-Secret": client_secret},
                timeout=10,
            )
            response.raise_for_status()

            for item in response.json().get("items", []):
                title = re.sub(r"<[^>]+>", "", item.get("title", ""))
                description = re.sub(r"<[^>]+>", "", item.get("description", ""))
                article_id = hashlib.md5(item.get("link", "").encode()).hexdigest()[:12]

                if article_id in seen_ids:
                    continue
                seen_ids.add(article_id)

                try:
                    pub_date = parsedate_to_datetime(item.get("pubDate", ""))
                    pub_date_str = pub_date.isoformat()
                    # Skip articles older than cutoff
                    if pub_date.astimezone(KST) < cutoff:
                        continue
                except Exception:
                    pub_date_str = datetime.now(KST).isoformat()

                articles.append({
                    "id": article_id,
                    "title": title,
                    "url": item.get("link", item.get("originallink", "")),
                    "source": "Naver News",
                    "language": "ko",
                    "published_at": pub_date_str,
                    "content": description,
                    "search_keyword": keyword,
                    "category": None,
                    "keywords": [],
                    "summary": None,
                    "relevance_score": None,
                })
        except Exception as e:
            print(f"Naver error [{keyword}]: {e}")

    print(f"Naver: {len(articles)} articles")
    return articles
