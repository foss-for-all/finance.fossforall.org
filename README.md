# finance.fossforall.org

Astro + React 기반의 정적 재무 보고 웹 앱입니다.

## 개요

이 앱은 `src/data`의 hledger 재무 보고 JSON 파일을 읽어, 탐색 가능한 인터랙티브 표 형태로 렌더링합니다.

현재 UI 구성:
- 왼쪽: 회계연도/보고서 유형 선택 내비게이션
- 가운데: 섹션별 보고서 테이블 영역
- 오른쪽: 목차(TOC) 영역
- 하단: 보고서 전체 순액(Net) 섹션

데이터 디렉터리 패턴:

```text
src/data/<year>/<report-type>/*.json
```

지원 보고서 유형:
- `bse`: Balance Sheet with Equity
- `is`: Income Statement
- `budget`: Budget Performance

## 기술 스택

- Astro (정적 사이트 생성)
- React (인터랙티브 UI)
- Bulma (기본 UI 스타일)
- TanStack Table (테이블 렌더링)

## 프로젝트 구조

```text
/
├── src/
│   ├── components/finance/
│   │   ├── FinanceReportApp.tsx
│   │   ├── ReportDrawer.tsx
│   │   ├── ReportHeader.tsx
│   │   ├── ReportTable.tsx
│   │   └── SectionToc.tsx
│   ├── data/
│   │   └── <year>/<report-type>/*.json
│   ├── lib/finance/
│   │   ├── catalog.ts
│   │   ├── format.ts
│   │   ├── normalize.ts
│   │   └── types.ts
│   ├── pages/index.astro
│   └── styles/finance-report.css
├── astro.config.mjs
└── package.json
```

## 데이터 처리 메모

- 보고서 파일은 빌드 시점에 glob import로 자동 탐색됩니다.
- 금액은 재무 표기 형식으로 포맷됩니다 (예: `20,000 KRW`).
- 같은 통화가 한 셀에 여러 번 나타나는 경우, 통화별로 합산하여 표시합니다.
- 보고서 전체 순액(Net) 데이터 출처:
  - `bse`, `is`: `cbrTotals.prrTotal`
  - `budget`: `prTotals.prrTotal`

## 개발 실행

의존성 설치:

```sh
npm install
```

개발 서버 실행:

```sh
npm run dev
```

정적 빌드:

```sh
npm run build
```

프로덕션 빌드 미리보기:

```sh
npm run preview
```

## 새 보고서 추가

1. 아래 폴더에 JSON 파일을 추가합니다.
   - `src/data/<year>/bse/`
   - `src/data/<year>/is/`
   - `src/data/<year>/budget/`
2. 필요하면 개발 서버를 재시작합니다.
3. 새로운 연도/유형/파일이 드로어와 파일 선택기에 자동 반영됩니다.
