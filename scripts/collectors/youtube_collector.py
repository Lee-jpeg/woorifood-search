"""YouTube Trends Collector
Requires: YOUTUBE_API_KEY env variable
Get key at: https://console.developers.google.com
"""

import os
import hashlib
import requests
from datetime import datetime, timezone

SEARCH_QUERIES = [
    "소스 레시피 트렌드", "양념 신제품 리뷰", "식품 트렌드",
    "핫소스 리뷰", "발효 소스 만들기", "food sauce trend 2026",
    "condiment review", "Korean sauce recipe",
]


def collect_youtube_trends() -> list[dict]:
    api_key = os.getenv("YOUTUBE_API_KEY")
    if not api_key:
        print("YOUTUBE_API_KEY not set - skipping")
        return []

    videos = []
    seen_ids = set()

    for query in SEARCH_QUERIES:
        try:
            response = requests.get(
                "https://www.googleapis.com/youtube/v3/search",
                params={
                    "key": api_key,
                    "q": query,
                    "part": "snippet",
                    "type": "video",
                    "maxResults": 5,
                    "order": "viewCount",
                    "publishedAfter": "2025-01-01T00:00:00Z",
                },
                timeout=10,
            )
            response.raise_for_status()

            for item in response.json().get("items", []):
                video_id = item["id"].get("videoId", "")
                if not video_id or video_id in seen_ids:
                    continue
                seen_ids.add(video_id)

                snippet = item.get("snippet", {})
                videos.append({
                    "id": video_id,
                    "title": snippet.get("title", ""),
                    "channel": snippet.get("channelTitle", ""),
                    "published_at": snippet.get("publishedAt", ""),
                    "description": snippet.get("description", "")[:300],
                    "thumbnail": snippet.get("thumbnails", {}).get("medium", {}).get("url", ""),
                    "url": f"https://www.youtube.com/watch?v={video_id}",
                    "search_query": query,
                    "source": "YouTube",
                })
        except Exception as e:
            print(f"YouTube error [{query}]: {e}")

    print(f"YouTube: {len(videos)} videos")
    return videos
