# CLAUDE.md

이 파일은 Claude Code(claude.ai/code)가 이 저장소에서 작업할 때 참고하는 가이드 문서입니다.

## 프로젝트 개요

메이플스토리 게임 봇(gsbot)의 백엔드 서버. 카카오톡 챗봇과 모바일 앱에서 사용하는 REST API를 제공한다.
Nexon OpenAPI를 통해 캐릭터 정보, 랭킹, 보스 데이터 등을 조회하고, Firebase Cloud Messaging(FCM)으로 푸시 알림을 전송한다.

## 실행 명령어

```bash
# 프로덕션 서버 실행 (PM2)
pm2 start ecosystem.config.js --only gsbot_server

# 테스트 서버 실행 (PM2)
pm2 start ecosystem.config.js --only gsbot_server_test

# 직접 실행
node index.js          # 프로덕션
node index_test.js     # 테스트

# 의존성 설치
npm install
```

별도의 빌드, 린트, 테스트 프레임워크는 설정되어 있지 않다.

## 아키텍처

### 진입점

- `index.js` — 프로덕션 서버. Express 앱 초기화, MongoDB 연결, 라우터 마운트, 경험치 테이블 등 인라인 데이터를 포함하는 거대한 단일 파일(~3500줄). 많은 API 엔드포인트가 이 파일에 직접 정의되어 있다.
- `index_test.js` — 테스트용 서버. index.js와 유사한 구조.

### 라우터 (`routes/`)

`routes/index.js`에서 모든 하위 라우터를 `/api` 경로 하에 통합한다.

| 라우터 파일 | 경로 | 기능 |
|---|---|---|
| `history.js` | `/api/history` | 경험치/레벨 히스토리 (이진 탐색으로 레벨업 날짜 탐색) |
| `ranking.js` | `/api/ranking` | 캐릭터/길드 랭킹 조회 |
| `boss.js` | `/api/boss` | 보스 데이터 CRUD |
| `main_character.js` | `/api/main_character` | 본캐 지정/조회 |
| `fcm.js` | `/api/fcm` | FCM 토큰 관리 및 알림 전송 |
| `interval_message.js` | `/api/intervalMessage` | 예약 알림 CRUD (정확한 시간/요일/매일) |
| `enforcements.js` | `/api/enforcements` | 스타포스/슈페리얼 시뮬레이션 |
| `probability.js` | `/api/probability` | 로얄스타일/원더베리 시뮬레이션 |
| `home_page_scrapping.js` | `/api/homepage` | 이벤트/공지/캐시샵/업데이트 조회 |
| `extra.js` | `/api/extra` | 도움말 |

### 모델 (`models/`) — Mongoose 스키마

- `boss.js` — 보스 정보 (난이도별 페이즈, 보상, 특수 아이템 등 중첩 스키마)
- `main_character.js` — 본캐 지정 (chatRoomName + talkProfileName → characterName)
- `character_history.js` — 레벨 히스토리 캐시
- `daily_message.js`, `weekly_message.js`, `exact_time_message.js` — 예약 알림
- `fcm_token.js` — FCM 디바이스 토큰

### 서비스 (`services/`)

- `identification.js` — Nexon OpenAPI ocid/oguild_id 조회 (`getOcid`, `getOGuildId`)
- `fcm_service.js` — Firebase Admin SDK 기반 푸시 알림 전송 (단일/다중/토픽)

### 유틸리티 (`utils/`)

- `time.js` — 날짜 포맷팅 함수 (API용, 한국어 표시용)
- `json.js` — 표준 응답 JSON 생성. 모든 API 응답은 `{ success, result(URI 인코딩), resultRaw }` 형태
- `main_character.js` — 본캐 조회/지정 DB 로직
- `index.js` — sleep 유틸리티

## 핵심 규칙

### 응답 형식
모든 API 응답은 `utils/json.js`의 헬퍼를 사용한다. `result` 필드는 `encodeURIComponent()`로 인코딩되고, `resultRaw`에 원본 문자열이 들어간다.

### 타임존
서버 타임존은 `Asia/Seoul`로 고정. `process.env.TZ='Asia/Seoul'`과 `moment.tz.setDefault("Asia/Seoul")`이 설정되어 있다.

### 외부 API
- Nexon OpenAPI: `https://open.api.nexon.com/maplestory/v1` — 모든 요청에 `x-nxopen-api-key` 헤더 필요 (환경변수 `API_KEY`)
- Nexon API 데이터는 매일 0시~2시 사이에 갱신되므로, 해당 시간대의 전일 데이터 조회가 불가능할 수 있다
- API 서비스 시작일: 2023-12-21

### 환경변수
`.env`에서 관리. `.env.example` 참고: `MONGO_URI`, `API_KEY`, `DISCORD_TOKEN`, `PORT` 등.

### 프로세스 관리
PM2로 운영. `ecosystem.config.js`에서 프로덕션/테스트 두 인스턴스를 정의하며, `models/`, `routes/`, `utils/`, `services/` 폴더를 watch 대상으로 설정.
