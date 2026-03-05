"""Academic Paper Collector via Semantic Scholar API (free, no key required)"""

import hashlib
import requests
from datetime import datetime, timezone

QUERIES = [
    "sauce fermentation technology",
    "food condiment health low sodium",
    "plant-based sauce ingredient development",
    "flavor enhancement food science",
    "natural preservative food sauce",
    "allulose sweetener food application",
    "Korean fermented food global market",
]


def collect_academic_papers() -> list[dict]:
    papers = []
    seen_ids = set()

    for query in QUERIES:
        try:
            response = requests.get(
                "https://api.semanticscholar.org/graph/v1/paper/search",
                params={
                    "query": query,
                    "limit": 3,
                    "fields": "title,abstract,year,publicationDate,url,tldr",
                    "sort": "publicationDate:desc",
                },
                headers={"User-Agent": "FoodTrendDashboard/1.0"},
                timeout=15,
            )

            if response.status_code != 200:
                continue

            for paper in response.json().get("data", []):
                if not paper.get("title"):
                    continue

                paper_id = hashlib.md5(paper.get("title", "").encode()).hexdigest()[:12]
                if paper_id in seen_ids:
                    continue
                seen_ids.add(paper_id)

                abstract = paper.get("abstract", "") or ""
                tldr = paper.get("tldr") or {}
                summary = tldr.get("text", abstract[:300])

                pub_date = paper.get("publicationDate") or f"{paper.get('year', 2025)}-01-01"

                papers.append({
                    "id": paper_id,
                    "title": paper.get("title", ""),
                    "url": paper.get("url", ""),
                    "source": "Semantic Scholar",
                    "language": "en",
                    "published_at": pub_date + "T00:00:00+00:00",
                    "content": abstract[:1000],
                    "summary": summary,
                    "search_query": query,
                    "type": "academic",
                    "category": "manufacturing",
                    "keywords": [],
                    "relevance_score": None,
                })
        except Exception as e:
            print(f"Scholar error [{query}]: {e}")

    print(f"Academic: {len(papers)} papers")
    return papers
