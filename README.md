# 식품 트렌드 인사이트 — R&D Edition

소스·양념류 R&D팀을 위한 식품 트렌드 자동 수집·분석 대시보드.

매일 오전 9시(KST) GitHub Actions가 자동으로 데이터를 수집·분석하여 Vercel에 배포합니다.

---

## 구조

```
food-trend-dashboard/
├── .github/workflows/daily-pipeline.yml   # 매일 자동 실행
├── scripts/
│   ├── pipeline.py                        # 메인 오케스트레이터
│   ├── collectors/
│   │   ├── rss_collector.py               # RSS 피드 수집
│   │   ├── naver_collector.py             # 네이버 뉴스 수집
│   │   ├── google_trends_collector.py     # Google Trends
│   │   ├── youtube_collector.py           # YouTube 트렌드
│   │   └── scholar_collector.py           # 학술 논문 (Semantic Scholar)
│   └── processors/
│       ├── gemini_processor.py            # Gemini AI 분류·요약
│       └── aggregator.py                  # 데일리/위클리/먼슬리 집계
├── public/data/                           # 수집된 데이터 (JSON)
│   ├── articles/YYYY-MM-DD.json           # 일별 기사
│   ├── summaries/weekly/YYYY-WNN.json     # 주간 요약
│   ├── summaries/monthly/YYYY-MM.json     # 월간 요약
│   └── meta/latest.json                   # 최신 날짜 포인터
└── src/app/                               # Next.js 대시보드
    ├── page.tsx                           # 메인 대시보드
    ├── daily/page.tsx                     # 데일리 리포트
    ├── weekly/page.tsx                    # 위클리 리포트
    ├── monthly/page.tsx                   # 먼슬리 리포트
    └── annual/page.tsx                    # 연간 리포트
```

---

## 설정 방법

### 1. GitHub Repository 생성 후 push

```bash
git init
git add .
git commit -m "initial"
git remote add origin https://github.com/YOUR_USERNAME/food-trend-dashboard.git
git push -u origin main
```

### 2. GitHub Secrets 설정

GitHub Repo → Settings → Secrets and variables → Actions → New repository secret

| Secret 이름 | 값 | 필수 여부 |
|---|---|---|
| `GEMINI_API_KEY` | Google AI Studio에서 발급 | **필수** |
| `NAVER_CLIENT_ID` | 네이버 개발자센터에서 발급 | 권장 |
| `NAVER_CLIENT_SECRET` | 네이버 개발자센터에서 발급 | 권장 |
| `YOUTUBE_API_KEY` | Google Cloud Console에서 발급 | 선택 |

#### API 키 발급 방법

- **Gemini**: https://aistudio.google.com/app/apikey (무료 플랜 충분)
- **Naver**: https://developers.naver.com → 애플리케이션 등록 → 뉴스 검색 API 활성화
- **YouTube**: https://console.developers.google.com → YouTube Data API v3 활성화

### 3. Vercel 배포

1. https://vercel.com → New Project → GitHub 연동
2. 이 레포 선택 후 Deploy
3. 이후 GitHub Actions가 매일 데이터를 commit하면 Vercel이 자동 재배포

### 4. 수동 파이프라인 실행

GitHub Actions → daily-pipeline.yml → Run workflow

또는 로컬 실행:
```bash
cd scripts
pip install -r requirements.txt
GEMINI_API_KEY=your_key python pipeline.py
```

---

## 수집 소스

### 자동 수집 (매일)
- **FoodNavigator** (Global / Asia / USA) — 글로벌 식품 뉴스
- **Food Business News** — 신제품·시장 동향
- **New Food Magazine** — 식품 기술 트렌드
- **식품의약품안전처** — 국내 규제·정책
- **네이버 뉴스** — 국내 식품 키워드 뉴스 (API 키 필요)
- **Google Trends** — 키워드 검색량 추이
- **YouTube** — 식품 트렌드 영상 (API 키 필요)
- **Semantic Scholar** — 학술 논문 (무료, 키 불필요)

### 인스타그램 수집 관련
인스타그램은 공식 API 접근이 매우 제한적(비즈니스 계정 + 앱 승인 필요)입니다.
대안으로 **Google Trends**에서 관련 키워드 검색량 추이로 인스타 트렌드를 간접 파악하거나,
유료 소셜 리스닝 서비스(Apify, Brand24 등) 연동을 검토하세요.

---

## 카테고리 분류 (Gemini AI 자동 분류)

| 카테고리 | 설명 |
|---|---|
| 원료 트렌드 | 새로운 원재료, 성분, 감미료, 향신료 |
| 제품 트렌드 | 신제품, 콘셉트, 패키지 |
| 소비자 트렌드 | 소비자 행동, 건강·다이어트, 라이프스타일 |
| 제조/기술 | 제조 공정, R&D, 특허 |
| 시장/유통 | 시장 동향, 유통, 수출, M&A |
| 규제/정책 | 식품 법규, 인증, 식약처 |

---

## 로컬 개발

```bash
npm install
npm run dev
# http://localhost:3000
```
