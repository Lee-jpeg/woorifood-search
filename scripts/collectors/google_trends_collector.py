"""Google Trends Collector via pytrends"""

from datetime import datetime, timezone
from pytrends.request import TrendReq

KEYWORD_GROUPS = [
    ["소스", "양념", "저당 소스", "발효 소스", "저염"],
    ["식품 트렌드", "비건 식품", "건강식품", "간편식", "HMR"],
    ["hot sauce", "plant-based sauce", "fermented food", "clean label", "low sugar"],
]


def collect_google_trends() -> dict:
    result = {
        "collected_at": datetime.now(timezone.utc).isoformat(),
        "keyword_groups": [],
    }

    try:
        pytrends = TrendReq(hl="ko-KR", tz=540, timeout=(10, 25))

        for group in KEYWORD_GROUPS:
            try:
                pytrends.build_payload(group, cat=71, timeframe="today 3-m", geo="KR")
                iot = pytrends.interest_over_time()

                timeseries = {}
                if not iot.empty:
                    for kw in group:
                        if kw in iot.columns:
                            timeseries[kw] = iot[kw].tolist()[-30:]

                related = {}
                try:
                    rq = pytrends.related_queries()
                    for kw in group:
                        if kw in rq and rq[kw].get("rising") is not None:
                            related[kw] = rq[kw]["rising"]["query"].head(5).tolist()
                except Exception:
                    pass

                result["keyword_groups"].append({
                    "keywords": group,
                    "timeseries": timeseries,
                    "related_rising": related,
                })
            except Exception as e:
                print(f"Google Trends error [{group}]: {e}")

    except Exception as e:
        print(f"Google Trends setup error: {e}")
        result["error"] = str(e)

    return result
