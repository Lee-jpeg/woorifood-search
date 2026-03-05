"""RSS Feed Collector for Food Industry Media"""

import re
import hashlib
import feedparser
from datetime import datetime, timedelta, timezone

RSS_FEEDS = [
    {"name": "FoodNavigator Global", "url": "https://www.foodnavigator.com/info/rss/", "language": "en"},
    {"name": "FoodNavigator Asia", "url": "https://www.foodnavigator-asia.com/info/rss/", "language": "en"},
    {"name": "FoodNavigator USA", "url": "https://www.foodnavigator-usa.com/info/rss/", "language": "en"},
    {"name": "Food Business News", "url": "https://www.foodbusinessnews.net/rss/topic/new-products", "language": "en"},
    {"name": "New Food Magazine", "url": "https://www.newfoodmagazine.com/feed/", "language": "en"},
    {"name": "식품의약품안전처", "url": "https://www.mfds.go.kr/brd/m_99/rss.do", "language": "ko"},
]


def collect_rss(days_back: int = 1) -> list[dict]:
    cutoff = datetime.now(timezone.utc) - timedelta(days=days_back)
    articles = []

    for feed_config in RSS_FEEDS:
        try:
            feed = feedparser.parse(feed_config["url"])
            for entry in feed.entries:
                pub_date = None
                if hasattr(entry, "published_parsed") and entry.published_parsed:
                    pub_date = datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)
                elif hasattr(entry, "updated_parsed") and entry.updated_parsed:
                    pub_date = datetime(*entry.updated_parsed[:6], tzinfo=timezone.utc)

                if pub_date and pub_date < cutoff:
                    continue

                content = getattr(entry, "summary", "") or getattr(entry, "description", "")
                content = re.sub(r"<[^>]+>", "", content)

                article_id = hashlib.md5(
                    (entry.get("link", "") + entry.get("title", "")).encode()
                ).hexdigest()[:12]

                articles.append({
                    "id": article_id,
                    "title": entry.get("title", ""),
                    "url": entry.get("link", ""),
                    "source": feed_config["name"],
                    "language": feed_config["language"],
                    "published_at": pub_date.isoformat() if pub_date else datetime.now(timezone.utc).isoformat(),
                    "content": content[:2000],
                    "category": None,
                    "keywords": [],
                    "summary": None,
                    "relevance_score": None,
                })
        except Exception as e:
            print(f"RSS error [{feed_config['name']}]: {e}")

    print(f"RSS: {len(articles)} articles from {len(RSS_FEEDS)} feeds")
    return articles
