const express = require('express');
const puppeteer = require('puppeteer');
const axios = require('axios');
const cheerio = require('cheerio');
const querystring = require('querystring');
const cors = require('cors');
require('dotenv').config({ quiet: true });
const mongoose = require("mongoose");
const http = require('http');
require('moment-timezone');

const time = require('./utils/time.js');
const json = require('./utils/json.js');
const iden = require('./services/identification.js');
const mc = require('./utils/main_character.js');
const seedRing = require('./utils/seed_ring.js');
const { RULE } = require('./utils/format.js');
const Boss = require('./models/boss');
const BossMessageTemplate = require('./models/boss_message_template');
const bossMessageUtil = require('./utils/boss_message');

var moment = require('moment');
moment.tz.setDefault("Asia/Seoul");

// axios 기본 타임아웃은 0(무제한)이다. 업스트림(넥슨 OpenAPI·홈페이지)이 응답을
// 물고 있으면 요청 핸들러가 상한 없이 매달리고, 봇 쪽에는 원인을 알 수 없는
// java.net.SocketTimeoutException 으로만 보인다. 개별 호출에 timeout 을 적어 둔
// 곳은 그 값이 이긴다(utils/cash_probability.js 등).
axios.defaults.timeout = 8000;

const app = express();

// express 미들웨어 추가
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

process.env.TZ='Asia/Seoul';
const server = http.createServer(app);

// Node 기본값은 keepAliveTimeout 5초라 서버가 5초 만에 유휴 커넥션을 닫는다.
// 그런데 클라이언트(안드로이드 OkHttp — 봇의 Http.request 와 JSoup 이 모두 이걸
// 탄다)는 응답의 "Keep-Alive: timeout=5" 를 따르지 않고 유휴 커넥션을 몇 분씩
// 풀에 들고 있다가 재사용한다. 서버가 이미 닫은 소켓에 요청을 쓰면 그 요청은
// 사라지고 오지 않을 응답을 기다리게 되는데, 봇에는 이것이
// java.net.SocketTimeoutException: timeout 으로 보인다(2026-08-19 실측 재현:
// 유휴 4초 재사용은 성공, 6초부터 요청 유실).
// 그래서 클라이언트 재사용 창보다 길게 잡아 서버가 먼저 끊지 않게 한다.
// headersTimeout 은 keepAliveTimeout 보다 커야 한다.
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

// 브라우저에서 이 API 를 부르는 것은 메이플링과 RN 관리 앱의 웹 배포다. 봇
// (안드로이드)·Flutter 관리 앱·RN 네이티브 빌드는 브라우저가 아니라 CORS 를
// 적용받지 않으므로 영향이 없다.
// Vercel 프리뷰 배포는 배포마다 호스트가 달라 여기에 못 적는다. 프리뷰로
// 붙어야 하면 CORS_ORIGINS 에 그 호스트를 넣어 pm2 를 다시 띄운다.
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS ||
    [
        'https://maple-ing.com',                   // 메이플링 운영
        'https://maple.emotionbsy.com',            // 메이플링 옛 도메인(전환 기간)
        'https://gsbot-manager-rn.vercel.app',     // RN 관리 앱 웹 배포(운영)
        'http://localhost:3100',                   // 메이플링 로컬
        'http://localhost:3000',
        'http://localhost:8081',                   // Expo 웹 기본 포트
        'http://localhost:19006'
    ].join(',')
).split(',').map((o) => o.trim()).filter(Boolean);

app.use(cors({
    origin(origin, callback) {
        // Origin 헤더가 없는 요청(네이티브 앱 · 서버 간 호출 · curl)은 그대로 통과시킨다.
        // CORS 는 브라우저가 강제하는 규약이라 이런 요청에는 애초에 적용되지 않는다.
        if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
        return callback(null, false);   // 헤더를 안 붙이면 브라우저가 알아서 막는다
    }
}));

const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI).catch(err => {
    console.error('MongoDB 연결 실패 (DB 의존 기능 사용 불가):', err.message);
});

const db = mongoose.connection;
db.on('error', (err) => {
    console.error('MongoDB connection error:', err.message);
});
db.once('open', () => {
    console.log('MongoDB connected successfully');
});

const openAPIBaseUrl = "https://open.api.nexon.com/maplestory/v1";

app.use(express.json());

const api = require("./routes/index.js");
app.use('/api', api);

app.get('/', (req, res) => {
    res.status(200).send('Hello World!');
});

// 레벨별 필요 경험치표. 예전에는 Lv.200~299 구간이 여기 인라인으로 박혀
// 있었는데, 23주년 패치 이전 값이라 Lv.210~259 가 실제보다 최대 2.4배 컸다.
// 표는 utils/exp_table.js 로 옮기고 Lv.1 부터 전 구간을 담는다.
const { expAmount } = require('./utils/exp_table.js');

const expCoupon = [
    7404000,
    7605000,
    7808000,
    8035000,
    8242000,
    8450000,
    8661000,
    8895000,
    9109000,
    9325000,
    18601000,
    19026000,
    19504000,
    19936000,
    20372000,
    20861000,
    21340000,
    21801000,
    22249000,
    22755000,
    23211000,
    23724000,
    24186000,
    24707000,
    25176000,
    25704000,
    26238000,
    26717000,
    27258000,
    27802000,
    29503000,
    30080000,
    30660000,
    31178000,
    31766000,
    32360000,
    32959000,
    33488000,
    34093000,
    34701000,
    35312000,
    36422000,
    37051000,
    37610000,
    38248000,
    38889000,
    39533000,
    40182000,
    40835000,
    41492000,
    43861000,
    44553000,
    45249000,
    45949000,
    46654000,
    47360000,
    48073000,
    48788000,
    49595000,
    50321000,
    76572000
];

const advancedExpCoupon = [
    388229000,
    393816000,
    399411000,
    405046000,
    411393000,
    462820000,
    469175000,
    475554000,
    482760000,
    489212000,
    511726000,
    536006000,
    542983000,
    572884000,
    581154000,
    653181000,
    661414000,
    670728000,
    679048000,
    688437000,
    773107000,
    783656000,
    793073000,
    803703000,
    813213000,
    914168000,
    924819000,
    936844000,
    948944000,
    959736000,
    1078497000
]

// HEXA 코어 강화 비용 (인덱스 n = n레벨 → n+1레벨 1단계 비용, 인덱스 0 = 코어 개방)
// "스킬 코어(3번째)"와 "공용 코어(직업군)"은 각 종류의 3번째 슬롯에만 적용되는 별도 비용표다.
const hexaCoreCost = {
    "스킬 코어": {
        //        0→1   1→2  2→3  3→4  4→5  5→6  6→7  7→8  8→9 9→10 …
        "sol":   [ 5,  1,  1,  1,  2,  2,  2,  3,  3, 10,  3,  3,  4,  4,  4,  4,  4,  4,  5, 15,  5,  5,  5,  5,  5,  6,  6,  6,  7, 20],
        "crack": [100,  30,  35,  40,  45,  50,  55,  60,  65, 200,  80,  90, 100, 110, 120, 130, 140, 150, 160, 350, 170, 180, 190, 200, 210, 220, 230, 240, 250, 500]
    },
    "스킬 코어(3번째)": {
        //        0→1   1→2  2→3  3→4  4→5  5→6  6→7  7→8  8→9 9→10 …
        "sol":   [ 7,  1,  1,  1,  1,  2,  2,  2,  2,  8,  2,  2,  3,  3,  3,  3,  3,  3,  3, 12,  4,  4,  4,  4,  4,  4,  5,  5,  5, 14],
        "crack": [140,  21,  26,  30,  34,  38,  43,  47,  51, 142,  62,  69,  77,  83,  91,  98, 105, 112, 120, 252, 128, 136, 145, 152, 161, 168, 177, 184, 193, 357]
    },
    "마스터리 코어": {
        //        0→1   1→2  2→3  3→4  4→5  5→6  6→7  7→8  8→9 9→10 …
        "sol":   [ 3,  1,  1,  1,  1,  1,  1,  2,  2,  5,  2,  2,  2,  2,  2,  2,  2,  2,  3,  8,  3,  3,  3,  3,  3,  3,  3,  3,  4, 10],
        "crack": [ 50,  15,  18,  20,  23,  25,  28,  30,  33, 100,  40,  45,  50,  55,  60,  65,  70,  75,  80, 175,  85,  90,  95, 100, 105, 110, 115, 120, 125, 250]
    },
    "강화 코어": {
        //        0→1   1→2  2→3  3→4  4→5  5→6  6→7  7→8  8→9 9→10 …
        "sol":   [ 4,  1,  1,  1,  2,  2,  2,  3,  3,  8,  3,  3,  3,  3,  3,  3,  3,  3,  4, 12,  4,  4,  4,  4,  4,  5,  5,  5,  6, 15],
        "crack": [ 75,  23,  27,  30,  34,  38,  42,  45,  49, 150,  60,  68,  75,  83,  90,  98, 105, 113, 120, 263, 128, 135, 143, 150, 158, 165, 173, 180, 188, 375]
    },
    "공용 코어": {
        //        0→1   1→2  2→3  3→4  4→5  5→6  6→7  7→8  8→9 9→10 …
        "sol":   [ 7,  2,  2,  2,  3,  3,  3,  5,  5, 14,  5,  5,  6,  6,  6,  6,  6,  6,  7, 17,  7,  7,  7,  7,  7,  9,  9,  9, 10, 20],
        "crack": [125,  38,  44,  50,  57,  63,  69,  75,  82, 300, 110, 124, 138, 152, 165, 179, 193, 207, 220, 525, 234, 248, 262, 275, 289, 303, 317, 330, 344, 750]
    },
    "공용 코어(직업군)": {
        //        0→1   1→2  2→3  3→4  4→5  5→6  6→7  7→8  8→9 9→10 …
        "sol":   [ 4,  1,  1,  1,  2,  2,  2,  3,  3,  9,  3,  3,  3,  3,  4,  4,  4,  4,  4, 14,  4,  5,  5,  5,  5,  5,  5,  5,  6, 18],
        "crack": [ 90,  25,  30,  35,  40,  45,  50,  55,  60, 180,  73,  81,  90,  98, 107, 115, 124, 132, 141, 315, 151, 160, 170, 179, 189, 198, 208, 217, 227, 450]
    }
};

// 종류별 코어 슬롯 수 (게임 업데이트 시 수동 갱신)
//
// 2026-08-13 확인: 종합 랭킹 상위 15명의 HEXA 매트릭스를 API 로 긁어 종류별
// 코어 개수를 셌다. 강화·마스터리는 15명 전원이 정확히 4개였고 4개를 넘는
// 캐릭터는 없었다. 스킬·공용은 12명이 3개, 넘는 사람은 없었다.
// (아래 값들은 그때까지 근거 없이 들고 있던 것인데 실측과 맞았다)
const hexaCoreSlots = {
    "스킬 코어": 3,
    "마스터리 코어": 4,
    "강화 코어": 4,
    "공용 코어": 3
};

// API는 코어 종류만 주고 몇 번째 슬롯인지는 주지 않으므로, 응답 배열 순서를 슬롯 순서로 본다.
function getHexaCostTable(coreType, ordinal) {
    if (coreType === "스킬 코어" && ordinal === 2) return hexaCoreCost["스킬 코어(3번째)"];
    if (coreType === "공용 코어" && ordinal === 2) return hexaCoreCost["공용 코어(직업군)"];
    return hexaCoreCost[coreType];
}

// 6차 전직 시 첫 번째 스킬 코어는 자동 지급되므로 개방(0→1) 비용이 들지 않는다.
function hasFreeHexaOpening(coreType, ordinal) {
    return coreType === "스킬 코어" && ordinal === 0;
}

// 코어 하나를 0레벨에서 targetLev까지 올리는 데 드는 누적 비용
function calcHexaCoreCost(coreType, ordinal, targetLev) {
    const table = getHexaCostTable(coreType, ordinal);
    let sol = 0;
    let crack = 0;
    if (!table) return { sol, crack };

    const start = hasFreeHexaOpening(coreType, ordinal) ? 1 : 0;
    const end = Math.min(targetLev, table.sol.length);
    for (let i = start; i < end; i++) {
        sol += table.sol[i];
        crack += table.crack[i];
    }
    return { sol, crack };
}

// 해당 종류의 코어를 slotCount개 만렙까지 올리는 데 필요한 총량
function calcHexaTypeTotal(coreType, slotCount) {
    let sol = 0;
    let crack = 0;
    for (let i = 0; i < slotCount; i++) {
        const table = getHexaCostTable(coreType, i);
        const maxLev = table ? table.sol.length : 0;
        const cost = calcHexaCoreCost(coreType, i, maxLev);
        sol += cost.sol;
        crack += cost.crack;
    }
    return { sol, crack };
}

// 코어 하나를 startLev 에서 endLev 까지 올리는 데 드는 비용.
// calcHexaCoreCost 와 달리 슬롯 순번이 아니라 비용표 이름을 직접 받는다.
function calcHexaCoreCostRange(tableKey, startLev, endLev) {
    const table = hexaCoreCost[tableKey];
    let sol = 0;
    let crack = 0;
    if (!table) return { sol, crack };

    const start = Math.max(0, startLev);
    const end = Math.min(endLev, table.sol.length);
    for (let i = start; i < end; i++) {
        sol += table.sol[i];
        crack += table.crack[i];
    }
    return { sol, crack };
}

// 비용표의 최대 레벨 (모든 표가 동일한 길이를 가진다)
function getHexaMaxLevel() {
    return hexaCoreCost["스킬 코어"].sol.length;
}

const hexaStatMainMultiplier = {
    "주력 스탯": {
        "제논": [48, 96, 144, 192, 288, 384, 480, 624, 768, 960],
        "데몬어벤져": [2100, 4200, 6300, 8400, 12600, 16800, 21000, 27300, 33600, 42000],
        "기타": [100, 200, 300, 400, 600, 800, 1000, 1300, 1600, 2000]
    },
    "공격력": [5, 10, 15, 20, 30, 40, 50, 65, 80, 100],
    "마력": [5, 10, 15, 20, 30, 40, 50, 65, 80, 100],
    "데미지": [0.75, 1.5, 2.25, 3, 4.5, 6, 7.5, 9.75, 12, 15],
    "방어율 무시": [1, 2, 3, 4, 6, 8, 10, 13, 16, 20],
    "보스 데미지": [1, 2, 3, 4, 6, 8, 10, 13, 16, 20],
    "크리티컬 데미지": [0.35, 0.7, 1.05, 1.4, 2.10, 2.8, 3.5, 4.55, 5.6, 7]
};

const hexaStatSubMultiplier = {
    "주력 스탯": {
        "제논": 48,
        "데몬어벤져": 2100,
        "기타": 100
    },
    "공격력": 5,
    "마력": 5,
    "데미지": 0.75,
    "방어율 무시": 1,
    "보스 데미지": 1,
    "크리티컬 데미지": 0.35
};


app.get('/boss/:diff/:name', async (req, res) => {
    let {diff, name} = req.params;
    let success = false;
    let content = '';
    console.log(`${time.getNowDateTime()} - 보스(${diff}, ${name})`);

    const diffList = ['이지', '노멀', '노말', '하드', '카오스', '익스트림', '익스'];
    // 사용자 입력 → 시도할 DB 키 후보 (앞에서부터 매칭 시도)
    const diffCandidates = {
        '노멀': ['노말'], '노말': ['노말'],
        '카오스': ['카오스', '하드'], '하드': ['하드', '카오스'],
        '익스': ['익스트림'], '익스트림': ['익스트림'],
        '이지': ['이지']
    };

    if (diffList.includes(diff)) {
        const candidates = diffCandidates[diff] || [diff];
        try {
            const boss = await Boss.findOne({
                $or: [{ name: name }, { aliases: name }]
            });

            if (boss) {
                // 후보 키를 순서대로 시도하여 매칭되는 난이도를 찾는다
                let diffData = null;
                let matchedDiff = null;
                for (const candidate of candidates) {
                    diffData = boss.difficulties.get(candidate);
                    if (diffData) { matchedDiff = candidate; break; }
                }
                if (diffData) {
                    success = true;
                    // 표시용 난이도: DB 키가 '노말'이면 '노멀'로 표시, 나머지는 DB 키 그대로
                    const displayDiff = matchedDiff === '노말' ? '노멀' : matchedDiff;
                    let templateDoc = await BossMessageTemplate.findOne({ key: 'default' });
                    if (!templateDoc) {
                        templateDoc = await BossMessageTemplate.create({
                            key: 'default',
                            template: bossMessageUtil.DEFAULT_TEMPLATE
                        });
                    }
                    content = bossMessageUtil.renderBossMessage(
                        templateDoc.template,
                        boss.name,
                        boss.entryLevel,
                        displayDiff,
                        diffData
                    );
                } else {
                    content = `${boss.name}에는 해당 난이도(${diff})가 없습니다.\n사용 가능한 난이도: ${boss.availableDifficulties.join(', ')}`;
                }
            } else {
                content =
                    name +
                    '\n보스명을 잘못 입력하셨습니다. 보스 명령어는 아래의 규칙에 따라 작성하셔야 합니다.\n\n<보스 명령어 사용 방법>\n"/보스(ㅄ or ㅂㅅ) [난이도] [보스명]"\n\n[난이도]: 카오스 / 하드 / 노말 / 노멀 / 이지 / 익스트림 / 익스\n[보스명]: 띄어쓰기를 포함하지 않은 보스명(ex. 가디언 엔젤 슬라임 -> 가디언엔젤슬라임 or 가엔슬)';
            }
        } catch (err) {
            console.error(`보스 조회 오류: ${err.message}`);
            content = '보스 정보 조회 중 오류가 발생했습니다.';
        }
    } else {
        content =
            '난이도를 잘못 입력하셨습니다. 보스 명령어는 아래의 규칙에 따라 작성하셔야 합니다.\n\n<보스 명령어 사용 방법>\n"/보스(ㅄ or ㅂㅅ) [난이도] [보스명]"\n[난이도]: 카오스 / 하드 / 노말 / 노멀 / 이지 / 익스트림 / 익스\n[보스명]: 띄어쓰기를 포함하지 않은 보스명(ex. 가디언 엔젤 슬라임 -> 가디언엔젤슬라임 or 가엔슬)';
    }
    let successM = '명령어 실행 결과: ';
    if (success) {
        successM = `${successM}성공`;
    } else {
        successM = `${successM}실패`;
    }

    res.status(200).json({
        result: encodeURIComponent(`${successM}\n\n${content}`),
    });
});

app.get('/symbol1/:start/:goal', async (req, res) => {
    let start = Number(req.params.start);
    let goal = Number(req.params.goal);
    console.log(`${time.getNowDateTime()} - 심볼1(${start}, ${goal})`);

    let result = {};
    let message = '';

    if (start < 1 || start > 19 || goal < 2 || goal > 20 || start >= goal) {
        result = {
            success: false,
            result: encodeURIComponent(
                '강화가 가능한 범위를 벗어나는 수치를 입력하였습니다.\n다시 시도해 주세요.'
            ),
        };
    } else {
        let start_arc = start;
        let start_aut = start;
        let goal_arc = goal;
        let goal_aut = goal;

        let isAuthentic = true;
        let isOutofBound = false;

        if (start_aut >= 11) {
            isAuthentic = false;
        }

        if (goal_aut > 11) {
            isOutofBound = true;
            goal_aut = 11;
        }

        let symbol_cost_yeoro = 0;
        let symbol_cost_chuchu = 0;
        let symbol_cost_aut = 0;

        let meso_cost_arc_yeoro = 0;
        let meso_cost_arc_chuchu = 0;
        let meso_cost_arc_lecheln = 0;
        let meso_cost_arc_arcana = 0;
        let meso_cost_arc_morass = 0;
        let meso_cost_arc_esfera = 0;

        let meso_cost_aut_cernium = 0;
        let meso_cost_aut_arcs = 0;
        let meso_cost_aut_odium = 0;
        let meso_cost_aut_dwk = 0;
        let meso_cost_aut_arteria = 0;
        let meso_cost_aut_carcion = 0;
        let meso_cost_gaut_tallahart = 0;

        for (let i = start_arc; i < goal_arc; i++) {
            if (i != 1) {
                symbol_cost_yeoro += Math.pow(i, 2) + 11;
                meso_cost_arc_yeoro +=
                    Math.floor(Math.pow(i, 3) * 0.1 + Math.pow(i, 2) * 8 + i * 1.1 + 88) * 10000;
            }
            symbol_cost_chuchu += Math.pow(i, 2) + 11;
            meso_cost_arc_chuchu +=
                Math.floor(Math.pow(i, 3) * 0.1 + Math.pow(i, 2) * 10 + i * 1.1 + 110) * 10000;
            meso_cost_arc_lecheln +=
                Math.floor(Math.pow(i, 3) * 0.1 + Math.pow(i, 2) * 12 + i * 1.1 + 132) * 10000;
            meso_cost_arc_arcana +=
                Math.floor(Math.pow(i, 3) * 0.1 + Math.pow(i, 2) * 14 + i * 1.1 + 154) * 10000;
            meso_cost_arc_morass +=
                Math.floor(Math.pow(i, 3) * 0.1 + Math.pow(i, 2) * 16 + i * 1.1 + 176) * 10000;
            meso_cost_arc_esfera +=
                Math.floor(Math.pow(i, 3) * 0.1 + Math.pow(i, 2) * 18 + i * 1.1 + 198) * 10000;
        }

        symbol_cost_yeoro = AddComma(symbol_cost_yeoro);
        symbol_cost_chuchu = AddComma(symbol_cost_chuchu);
        meso_cost_arc_yeoro = AddComma(meso_cost_arc_yeoro);
        meso_cost_arc_chuchu = AddComma(meso_cost_arc_chuchu);
        meso_cost_arc_lecheln = AddComma(meso_cost_arc_lecheln);
        meso_cost_arc_arcana = AddComma(meso_cost_arc_arcana);
        meso_cost_arc_morass = AddComma(meso_cost_arc_morass);
        meso_cost_arc_esfera = AddComma(meso_cost_arc_esfera);

        message = `< 심볼 비용 계산기 결과 >\n기능: 1번 / 특정 레벨부터 특정 레벨까지 모든 심볼의 강화 비용 및 요구 심볼 갯수 계산\n\n`;
        message = `${message}- 아케인 심볼 -\n[소멸의 여로]\n요구 심볼 수: ${symbol_cost_yeoro}개\n강화 비용: ${meso_cost_arc_yeoro}메소\n\n`;
        message = `${message}[츄츄 아일랜드]\n요구 심볼 수: ${symbol_cost_chuchu}개(츄츄 이후 심볼 수 동일)\n강화 비용: ${meso_cost_arc_chuchu}메소\n\n`;
        message = `${message}[꿈의 도시 레헬른]\n강화 비용: ${meso_cost_arc_lecheln}메소\n\n`;
        message = `${message}[신비의 숲 아르카나]\n강화 비용: ${meso_cost_arc_arcana}메소\n\n`;
        message = `${message}[기억의 늪 모라스]\n강화 비용: ${meso_cost_arc_morass}메소\n\n`;
        message = `${message}[태초의 바다 에스페라]\n강화 비용: ${meso_cost_arc_esfera}메소\n\n`;

        if (isAuthentic) {
            for (let i = start_aut; i < goal_aut; i++) {
                symbol_cost_aut += 9 * Math.pow(i, 2) + 20 * i;
                meso_cost_aut_cernium +=
                    Math.floor(Math.pow(i, 3) * -5.4 + Math.pow(i, 2) * 106.8 + i * 264) * 100000;
                meso_cost_aut_arcs +=
                    Math.floor(Math.pow(i, 3) * -5.4 + Math.pow(i, 2) * 123 + i * 300) * 100000;
                meso_cost_aut_odium +=
                    Math.floor(Math.pow(i, 3) * -5.4 + Math.pow(i, 2) * 139.2 + i * 336) * 100000;
                meso_cost_aut_dwk +=
                    Math.floor(Math.pow(i, 3) * -5.4 + Math.pow(i, 2) * 155.4 + i * 372) * 100000;
                meso_cost_aut_arteria +=
                    Math.floor(Math.pow(i, 3) * -5.4 + Math.pow(i, 2) * 171.6 + i * 408) * 100000;
                meso_cost_aut_carcion +=
                    Math.floor(Math.pow(i, 3) * -5.4 + Math.pow(i, 2) * 187.8 + i * 444) * 100000;
                meso_cost_gaut_tallahart += Math.floor(Math.pow(i, 3) * -5.4 + Math.pow(i, 2) * 346.2 + i * 796) * 100000;
            }

            symbol_cost_aut = AddComma(symbol_cost_aut);
            meso_cost_aut_cernium = AddComma(meso_cost_aut_cernium);
            meso_cost_aut_arcs = AddComma(meso_cost_aut_arcs);
            meso_cost_aut_odium = AddComma(meso_cost_aut_odium);
            meso_cost_aut_dwk = AddComma(meso_cost_aut_dwk);
            meso_cost_aut_arteria = AddComma(meso_cost_aut_arteria);
            meso_cost_aut_carcion = AddComma(meso_cost_aut_carcion);
            meso_cost_gaut_tallahart = AddComma(meso_cost_gaut_tallahart);

            message = `${message}\n- 어센틱 심볼 -\n\n`;
            if (isOutofBound) {
                message = `${message}(목표 레벨이 어센틱 심볼의 최대 레벨을 초과하여 최대 레벨인 11레벨까지로 조정되었습니다.)\n\n`;
            }
            message = `${message}요구 심볼 수(공통): ${symbol_cost_aut}개\n\n`;
            message = `${message}[신의 도시 세르니움]\n강화 비용: ${meso_cost_aut_cernium}메소\n\n`;
            message = `${message}[호텔 아르크스]\n강화 비용: ${meso_cost_aut_arcs}메소\n\n`;
            message = `${message}[눈을 뜬 실험실 오디움]\n강화 비용: ${meso_cost_aut_odium}메소\n\n`;
            message = `${message}[죄인들의 낙원 도원경]\n강화 비용: ${meso_cost_aut_dwk}메소\n\n`;
            message = `${message}[움직이는 요새 아르테리아]\n강화 비용: ${meso_cost_aut_arteria}메소\n\n`;
            message = `${message}[생명의 요람 카르시온]\n강화 비용: ${meso_cost_aut_carcion}메소\n\n`;
            message = `${message}\n- 그랜드 어센틱 심볼 -\n\n`;
            message = `${message}[신들의 무덤 탈라하트]\n강화 비용: ${meso_cost_gaut_tallahart}메소`;
        } else {
            message = `${message}\n- 어센틱 심볼 -\n\n입력된 구간 계산 불가`;
        }

        result = {
            success: true,
            result: encodeURIComponent(message),
        };
    }

    res.status(200).json(result);
});

app.get('/symbol2/:symbolType/:curLev/:curAmount/:goalLev', async (req, res) => {
    let symbolType = req.params.symbolType;
    let curLev = Number(req.params.curLev);
    let curAmount = Number(req.params.curAmount);
    let goalLev = Number(req.params.goalLev);
    console.log(`${time.getNowDateTime()} - 심볼2(${symbolType}, ${curLev}, ${curAmount}, ${goalLev})`);

    let result = {};

    const symbol_data = [
        {index: ['여로'], name: '소멸의 여로', data: [8, 88]},
        {index: ['츄츄'], name: '츄츄 아일랜드', data: [10, 110]},
        {index: ['레헬른', '레헬'], name: '꿈의 도시 레헬른', data: [12, 132]},
        {index: ['아르카나', '알카'], name: '신비의 숲 아르카나', data: [14, 154]},
        {index: ['모라스'], name: '기억의 늪 모라스', data: [16, 176]},
        {index: ['에스페라', '에페'], name: '태초의 바다 에스페라', data: [18, 198]},
        {index: ['세르니움', '세르'], name: '신의 도시 세르니움', data: [106.8, 264]},
        {index: ['아르크스', '호텔'], name: '호텔 아르크스', data: [123, 300]},
        {index: ['오디움'], name: '눈을 뜬 실험실 오디움', data: [139.2, 336]},
        {index: ['도원경'], name: '죄인들의 낙원 도원경', data: [155.4, 372]},
        {index: ['아르테리아'], name: '움직이는 요새 아르테리아', data: [171.6, 408]},
        {index: ['카르시온'], name: '생명의 요람 카르시온', data: [187.8, 444]},
        {index: ['탈라하트'], name: '신들의 무덤 탈라하트', data: [346.2, 796]}
    ];

    const all_symbol_name = [
        '여로',
        '츄츄',
        '레헬른',
        '레헬',
        '아르카나',
        '알카',
        '모라스',
        '에스페라',
        '에페',
        '세르니움',
        '세르',
        '아르크스',
        '호텔',
        '오디움',
        '도원경',
        '아르테리아',
        '카르시온',
    ];
    const aut_symbol_name = [
        '세르니움',
        '세르',
        '아르크스',
        '호텔',
        '오디움',
        '도원경',
        '아르테리아',
        '카르시온',
        '탈라하트'
    ];

    if (!all_symbol_name.includes(symbolType)) {
        result = {
            success: false,
            result: encodeURIComponent(
                '유효한 심볼 이름이 아닙니다. 아래 심볼 중 하나의 이름을 입력해 주세요.\n\n여로/츄츄/레헬른/레헬/아르카나/알카/모라스/에스페라/에페/세르니움/세르/아르크스/호텔/오디움/도원경/아르테리아/카르시온'
            ),
        };
    }
    if (symbolType == '여로' && curLev == 1) {
        result = {
            success: false,
            result: encodeURIComponent(
                '소멸의 여로 심볼은 스토리 완료 후 2레벨 심볼을 지급받기 때문에 시작 레벨이 2 이상이어야 합니다.'
            ),
        };
    } else if (curLev < 1 || curLev > 19 || goalLev > 20 || curLev >= goalLev) {
        result = {
            success: false,
            result: encodeURIComponent('강화가 가능한 범위를 벗어나는 수치를 입력하였습니다.'),
        };
    } else if (aut_symbol_name.includes(symbolType) && (curLev > 10 || goalLev > 11)) {
        result = {
            success: false,
            result: encodeURIComponent('강화가 가능한 범위를 벗어나는 수치를 입력하였습니다.'),
        };
    } else {
        let symbol_cost = 0;
        let meso_cost = 0;
        const matchedSymbol = symbol_data.find((symbol) => symbol.index.includes(symbolType));
        for (let i = curLev; i < goalLev; i++) {
            if (aut_symbol_name.includes(symbolType)) {
                symbol_cost += 9 * Math.pow(i, 2) + 20 * i;
                meso_cost +=
                    Math.floor(
                        Math.pow(i, 3) * -5.4 +
                        Math.pow(i, 2) * matchedSymbol.data[0] +
                        i * matchedSymbol.data[1]
                    ) * 100000;
            } else {
                symbol_cost += Math.pow(i, 2) + 11;
                meso_cost +=
                    Math.floor(
                        Math.pow(i, 3) * 0.1 +
                        Math.pow(i, 2) * 8 +
                        i * matchedSymbol.data[0] +
                        matchedSymbol.data[1]
                    ) * 10000;
            }
        }

        symbol_cost -= curAmount;

        symbol_cost = AddComma(symbol_cost);
        meso_cost = AddComma(meso_cost);

        let message = '';

        message = `< 심볼 비용 계산기 결과 >\n기능: 2번 / 특정 심볼의 현재 레벨과 수치에서 목표 레벨까지의 강화 비용 및 요구 심볼 수 계산\n\n`;
        message = `${message}[ ${matchedSymbol.name} ]\n요구 심볼 수: ${symbol_cost}개\n강화 비용: ${meso_cost}메소`;

        result = {
            success: true,
            result: encodeURIComponent(message),
        };
    }

    res.status(200).json(result);
});

app.get('/randomChannel', async (req, res) => {
    console.log(`${time.getNowDateTime()} - 랜덤채널`);
    let randomChannel = pickRandNum(1, 39);

    let randomMessage = [
        `오늘? ${randomChannel}채널 여기 맛있다`,
        `오늘은 ${randomChannel}채널 맛도리다 ㄹㅇ임`,
        `${randomChannel}채 가보쉴?`,
        `오늘은 ${randomChannel}채널이 어떨까요?`,
        `${randomChannel}채가 오늘은 좀 기운이 좋아보입니다.`,
        `${randomChannel}ㅊㄴ ㄱ`,
        `${randomChannel}채가서 delicious한거 먹어요 ㅎㅎ`,
        `${randomChannel}채가 오늘의 1픽`,
        `${randomChannel}채 가면 원하는거 뜸`,
        `${randomChannel}채널이 정답이올시다`,
        `${randomChannel}채 가면 awesome 해요`,
        `${randomChannel}채 가서 good한 템 얻으면 I am 행복이에요~`,
    ];

    let randomMessageIndex = pickRandNum(0, randomMessage.length - 1);

    let message = randomMessage[randomMessageIndex];
    res.status(200).json({
        success: true,
        result: encodeURIComponent(message),
    });
});

app.get('/extreme/:curLev/:iteration', async (req, res) => {
    try {
        const curLev = Number(req.params.curLev);
        const iteration = Number(req.params.iteration);
        console.log(`${time.getNowDateTime()} - 익성비(${curLev}, ${iteration})`);

        let result = {};
        let message = `[익스트림 성장의 비약 시뮬레이션 결과]\n시작레벨: ${curLev}\n사용횟수: ${iteration}회\n\n`;

        if (iteration > 500) {
            result = {
                success: false,
                result: '익성비 시뮬레이션은 서버 과부하 방지를 위해 최대 500회까지 사용 가능합니다.',
            };
        } else if (curLev < 141 || curLev > 299) {
            result = {
                success: false,
                result: '익성비 시뮬레이션은 레벨 141 ~ 299 구간에서만 사용 가능합니다.',
            };
        } else {
            let lev = curLev;
            let extream_pbt = [];
            let temp = 0;
            let res = 0;
            let remain_iter;
            let i = 0;
            let isUnder200 = true;

            if (lev >= 200) {
                isUnder200 = false;
            }
            if (isUnder200) {
                for (i = 1; i <= iteration; i++) {
                    let extream_randNum = Math.floor(Math.random() * 99 + 1);
                    switch (lev) {
                        case 141:
                            extream_pbt = [0, 5, 5, 5, 5, 5, 5, 10, 20, 20, 20];
                            break;
                        case 142:
                            extream_pbt = [0, 5, 5, 5, 5, 5, 10, 10, 20, 20, 15];
                            break;
                        case 143:
                            extream_pbt = [0, 5, 5, 5, 5, 5, 10, 20, 15, 15, 15];
                            break;
                        case 144:
                            extream_pbt = [0, 5, 5, 5, 5, 5, 20, 10, 15, 15, 15];
                            break;
                        case 145:
                            extream_pbt = [0, 5, 5, 5, 10, 10, 10, 10, 15, 15, 15];
                            break;
                        case 146:
                            extream_pbt = [0, 5, 5, 5, 10, 10, 10, 15, 15, 15, 10];
                            break;
                        case 147:
                            extream_pbt = [0, 5, 5, 5, 10, 10, 15, 15, 15, 10, 10];
                            break;
                        case 148:
                            extream_pbt = [0, 5, 5, 5, 10, 15, 15, 15, 10, 10, 10];
                            break;
                        case 149:
                            extream_pbt = [0, 5, 5, 10, 10, 15, 15, 10, 10, 10, 10];
                            break;
                        case 150:
                            extream_pbt = [0, 5, 5, 10, 15, 10, 15, 10, 10, 10, 10];
                            break;
                        case 151:
                            extream_pbt = [0, 5, 5, 10, 10, 15, 20, 10, 10, 10, 5];
                            break;
                        case 152:
                            extream_pbt = [0, 5, 5, 10, 10, 20, 15, 15, 10, 5, 5];
                            break;
                        case 153:
                            extream_pbt = [0, 5, 5, 10, 15, 15, 20, 10, 10, 5, 5];
                            break;
                        case 154:
                            extream_pbt = [0, 5, 5, 10, 20, 20, 10, 10, 10, 5, 5];
                            break;
                        case 155:
                            extream_pbt = [0, 5, 10, 10, 20, 15, 10, 10, 10, 5, 5];
                            break;
                        case 156:
                            extream_pbt = [0, 10, 10, 10, 15, 15, 10, 10, 10, 5, 5];
                            break;
                        case 157:
                            extream_pbt = [0, 10, 10, 15, 15, 10, 10, 10, 10, 5, 5];
                            break;
                        case 158:
                            extream_pbt = [0, 10, 15, 15, 10, 10, 10, 10, 10, 5, 5];
                            break;
                        case 159:
                            extream_pbt = [0, 15, 20, 5, 10, 10, 10, 10, 10, 5, 5];
                            break;
                        case 160:
                            extream_pbt = [0, 15, 10, 15, 15, 10, 10, 10, 5, 5, 5];
                            break;
                        case 161:
                            extream_pbt = [0, 15, 15, 15, 10, 10, 10, 10, 5, 5, 5];
                            break;
                        case 162:
                            extream_pbt = [0, 20, 15, 10, 10, 10, 10, 10, 5, 5, 5];
                            break;
                        case 163:
                            extream_pbt = [0, 15, 20, 15, 10, 10, 10, 5, 5, 5, 5];
                            break;
                        case 164:
                            extream_pbt = [0, 20, 20, 10, 10, 10, 10, 5, 5, 5, 5];
                            break;
                        case 165:
                            extream_pbt = [0, 20, 20, 15, 10, 10, 5, 5, 5, 5, 5];
                            break;
                        case 166:
                            extream_pbt = [0, 20, 15, 15, 15, 10, 10, 5, 5, 5];
                            break;
                        case 167:
                            extream_pbt = [0, 20, 20, 15, 10, 10, 10, 5, 5, 5];
                            break;
                        case 168:
                            extream_pbt = [0, 20, 25, 10, 10, 10, 10, 5, 5, 5];
                            break;
                        case 169:
                            extream_pbt = [0, 25, 20, 10, 10, 10, 10, 5, 5, 5];
                            break;
                        case 170:
                            extream_pbt = [0, 25, 20, 15, 10, 10, 5, 5, 5, 5];
                            break;
                        case 171:
                            extream_pbt = [0, 25, 20, 10, 15, 10, 10, 5, 5];
                            break;
                        case 172:
                            extream_pbt = [0, 25, 20, 15, 15, 10, 5, 5, 5];
                            break;
                        case 173:
                            extream_pbt = [0, 25, 25, 15, 10, 10, 5, 5, 5];
                            break;
                        case 174:
                            extream_pbt = [0, 25, 30, 10, 10, 10, 5, 5, 5];
                            break;
                        case 175:
                            extream_pbt = [0, 30, 20, 20, 10, 5, 5, 5, 5];
                            break;
                        case 176:
                            extream_pbt = [0, 25, 20, 25, 10, 10, 5, 5];
                            break;
                        case 177:
                            extream_pbt = [0, 30, 20, 20, 10, 10, 5, 5];
                            break;
                        case 178:
                            extream_pbt = [0, 30, 25, 15, 10, 10, 5, 5];
                            break;
                        case 179:
                            extream_pbt = [0, 30, 25, 20, 10, 5, 5, 5];
                            break;
                        case 180:
                            extream_pbt = [0, 35, 25, 20, 5, 5, 5, 5];
                            break;
                        case 181:
                            extream_pbt = [0, 35, 30, 15, 10, 5, 5];
                            break;
                        case 182:
                            extream_pbt = [0, 35, 35, 15, 5, 5, 5];
                            break;
                        case 183:
                            extream_pbt = [0, 40, 35, 10, 5, 5, 5];
                            break;
                        case 184:
                            extream_pbt = [0, 50, 25, 10, 5, 5, 5];
                            break;
                        case 185:
                            extream_pbt = [0, 55, 25, 5, 5, 5, 5];
                            break;
                        case 186:
                            extream_pbt = [0, 50, 30, 10, 5, 5];
                            break;
                        case 187:
                            extream_pbt = [0, 50, 35, 5, 5, 5];
                            break;
                        case 188:
                            extream_pbt = [0, 60, 25, 5, 5, 5];
                            break;
                        case 189:
                            extream_pbt = [0, 60, 25, 10, 5];
                            break;
                        case 190:
                            extream_pbt = [0, 55, 35, 10];
                            break;
                        case 191:
                            extream_pbt = [0, 60, 35, 5];
                            break;
                        case 192:
                            extream_pbt = [0, 65, 30, 5];
                            break;
                        case 193:
                            extream_pbt = [0, 65, 35];
                            break;
                        case 194:
                            extream_pbt = [0, 75, 25];
                            break;
                        case 195:
                            extream_pbt = [0, 80, 20];
                            break;
                        case 196:
                            extream_pbt = [0, 85, 15];
                            break;
                        case 197:
                            extream_pbt = [0, 90, 10];
                            break;
                        case 198:
                            extream_pbt = [0, 95, 5];
                            break;
                        case 199:
                            extream_pbt = [0, 100];
                            break;
                    }

                    for (let j = 1; j <= extream_pbt.length; j++) {
                        temp += extream_pbt[j];
                        if (temp >= extream_randNum) {
                            res = j;
                            break;
                        }
                    }

                    lev += res;
                    let iStr = i.toString().padStart(2, '0');
                    let resStr = res.toString().padStart(2, '0');
                    message += `${iStr}번째 시도: ${resStr}레벨업 -> Lv.${lev}\n`;
                    temp = 0;
                    if (lev == 200) {
                        break;
                    }
                }
            }
            if (lev >= 200) {
                remain_iter = iteration - i;
                if (remain_iter > 0) {
                    if (isUnder200) {
                        message += `\n200레벨 달성으로 이후 199 -> 200에 해당하는 경험치를 획득합니다.`;
                    } else {
                        message += `시작 레벨이 200 이상인 경우, 199 -> 200에 해당하는 경험치로 시뮬레이션을 진행합니다.`;
                    }
                    let remain_exp = 571115568 * remain_iter;
                    let curExpAmount;
                    let resLevPercent;
                    let resLev;
                    while (true) {
                        if (remain_exp == 0) {
                            resLevPercent = 0;
                            resLev = lev;
                            break;
                        }
                        curExpAmount = expAmount.find((element) => element.lev == lev).exp;
                        if (remain_exp < curExpAmount) {
                            let resLevPercentRaw = (remain_exp / curExpAmount) * 100;
                            resLevPercent = resLevPercentRaw.toFixed(3);
                            resLev = lev;
                            break;
                        }
                        if (remain_exp >= curExpAmount) {
                            lev++;
                            remain_exp -= curExpAmount;
                        }
                    }
                    if (isUnder200) {
                        message += `\n\n남은 익성비 ${remain_iter}개를 사용한 결과:\nLv.${resLev} (${resLevPercent}%)`;
                    } else {
                        message += `\n\n익성비 ${remain_iter}개를 사용한 결과:\nLv.${resLev} (${resLevPercent}%)`;
                    }
                }
            }
            result = {
                success: true,
                result: encodeURIComponent(message),
            };
        }

        res.status(200).json(result);
    } catch (error) {
        let message = `서버 오류입니다. 관리자에게 문의해 주세요.\n\nerror: ${error}`;

        const date = new Date();
        console.log(date.toLocaleString());
        console.log(error);
        res.status(200).json({
            success: false,
            result: encodeURIComponent(message),
        });
    }
});

app.get('/seedRing/:mode/:iteration', (req, res) => {
    const mode = Number(req.params.mode);
    const iteration = Number(req.params.iteration);

    console.log(`${time.getNowDateTime()} - 시드링(${req.params.mode}, ${req.params.iteration})`);

    try {
        const box = Number.isInteger(mode) ? seedRing.findBox(mode) : null;
        if (box === null) {
            const list = seedRing.SEED_RING_BOXES.map((b) => `${b.mode}: ${b.label}`).join("\n");
            return res.status(200).json(json.failure(`알 수 없는 상자입니다.\n\n${list}`));
        }

        if (!Number.isInteger(iteration) || iteration < 1) {
            return res.status(200).json(json.failure(`횟수는 1 이상의 정수로 입력해 주세요.`));
        }
        if (iteration > seedRing.MAX_ITERATION) {
            return res.status(200).json(json.failure(`${box.label} 시뮬레이션은 최대 ${AddComma(seedRing.MAX_ITERATION)}회까지만 가능합니다.`));
        }

        const rows = seedRing.flatten(seedRing.simulate(box, iteration));
        const line = (row) => row.level === null
            ? `${row.name}: ${AddComma(row.count)}회`
            : `${row.name} ${row.level}레벨: ${AddComma(row.count)}회`;

        let message = `<${box.label} 시뮬레이션 결과>\n시도 횟수: ${AddComma(iteration)}회\n`;
        let markdown = `## ${box.label}\n\n시도 횟수: ${AddComma(iteration)}회\n`;
        for (const row of rows) {
            message += `\n${line(row)}`;
            markdown += `\n- ${line(row)}`;
        }

        return res.status(200).json(json.successWithMarkdown(message, markdown));
    } catch (error) {
        console.error(error);
        return res.status(200).json(json.failure(`서버 오류입니다. 관리자에게 문의해 주세요.\n\nerror: ${error.message}`));
    }
});

app.get('/sunday', async (req, res) => {
    console.log(`${time.getNowDateTime()} - 썬데이메이플`);
    try {
        const url = 'https://maplestory.nexon.com/News/Event';

        const response = await axios.get(url);
        const html = response.data;
        const $ = cheerio.load(html);

        let isSunday = false;
        let sundayUrl = '';

        $('div[class=event_board] ul li').each((index, element) => {
            let event_name = $(element).find('dd.data p a').text();
            let url = $(element).find('dd.data p a').attr('href');
            if (event_name == '썬데이 메이플') {
                isSunday = true;
                sundayUrl = 'https://maplestory.nexon.com' + url;
            }
        });

        let message = '';

        if (isSunday) {
            message = `썬데이 메이플 정보가 발견되었습니다.\n\n${sundayUrl}`;
        } else {
            message = `썬데이 메이플 정보가 없습니다.`;
        }

        res.status(200).json({
            success: true,
            result: encodeURIComponent(message),
        });
    } catch (error) {
        const date = new Date();
        console.log(date.toLocaleString());
        console.log(error);
        res.status(200).json({
            success: false,
            result: encodeURIComponent(error),
        });
    }
});

app.get('/hyperStat/:characterName/:presetNum', async (req, res) => {
    const url = openAPIBaseUrl + "/character/hyper-stat";
    let characterName = req.params.characterName;
    let presetNum = Number(req.params.presetNum);
    let dateString = time.getAPIDateString();

    console.log(`${time.getNowDateTime()} - 하이퍼스탯(${characterName}, ${presetNum})`);

    let ocid = await iden.getOcid(characterName);
    if (ocid == null) {
        console.log(`${characterName} doesn't exist`);
        res.status(200).json(noOcidJSON(characterName));
    } else {
        try {
            const config = {
                method: 'get',
                url: url + `?ocid=${ocid}`,
                headers: {
                    'accept': 'application/json',
                    'x-nxopen-api-key': process.env.API_KEY
                },
            };
            let hyperStatRespose = await axios(config);
            let hyperStat = hyperStatRespose.data;
            let message = "";
            let success = false;
            if (hyperStat.character_class == null) {
                message = `메이플 API로부터 데이터를 불러오지 못했습니다.\n\n잠시 후 다시 시도해 주세요.`;
                success = false;
            } else {
                let statData;
                switch (presetNum) {
                    case 1:
                        statData = hyperStat.hyper_stat_preset_1;
                        break;
                    case 2:
                        statData = hyperStat.hyper_stat_preset_2;
                        break;
                    case 3:
                        statData = hyperStat.hyper_stat_preset_3;
                        break;
                }
                message = `[${characterName}의 하이퍼 스탯 ${presetNum}번 프리셋]\n`;
                for (let single of statData) {
                    let string = "";
                    if (single.stat_level == 0) {
                        continue;
                    } else {
                        string = `[Lv.${single.stat_level}] ${single.stat_increase}`;
                        message += `\n${string}`;
                    }
                }
                success = true;
            }

            res.status(200).json(successJSON(success, message));
        } catch (e) {
            console.error(e.response);
            res.status(200).json({
                success: false,
                result: e.response
            });
        }
    }
});

app.get('/propensity/:characterName', async (req, res) => {
    const url = openAPIBaseUrl + "/character/propensity";
    const characterName = req.params.characterName;
    let dateString = time.getAPIDateString();

    console.log(`${time.getNowDateTime()} - 성향(${characterName})`);

    let ocid = await iden.getOcid(characterName);
    if (ocid == null) {
        console.log(`${characterName} doesn't exist`);
        res.status(200).json(noOcidJSON(characterName));
    } else {
        console.log(`${characterName} exist`);
        try {
            const config = {
                method: 'get',
                url: url + `?ocid=${ocid}`,
                headers: {
                    'accept': 'application/json',
                    'x-nxopen-api-key': process.env.API_KEY
                },
            };
            let response = await axios(config);
            let propensity = response.data;
            let message = "";
            let success = false;
            if (propensity.charisma_level == null) {
                message = `메이플 API로부터 데이터를 불러오지 못했습니다.\n\n잠시 후 다시 시도해 주세요.`;
                success = false;
            } else {
                message = `[${characterName}의 성향]\n\n카리스마: Lv.${propensity.charisma_level}\n` +
                    `감성: Lv.${propensity.sensibility_level}` +
                    `\n통찰력: Lv.${propensity.insight_level}` +
                    `\n의지: Lv.${propensity.willingness_level}` +
                    `\n손재주: Lv.${propensity.handicraft_level}` +
                    `\n매력: Lv.${propensity.charm_level}`;
                success = true;
            }
            res.status(200).json(successJSON(success, message));
        } catch (e) {
            console.error(e.response ? e.response.data : e);
            res.status(200).json(json.nexonAPIError(e));
        }
    }
});

app.get('/ability/:characterName', async (req, res) => {
    const url = openAPIBaseUrl + "/character/ability";
    const characterName = req.params.characterName;
    let date = new Date();
    date.setDate(date.getDate() - 1)
    let dateString = time.getDateStringForAPI(date);

    console.log(`${time.getNowDateTime()} - 어빌리티(${characterName})`);

    let ocid = await iden.getOcid(characterName);
    if (ocid == null) {
        console.log(`${characterName} doesn't exist`);
        res.status(200).json(noOcidJSON(characterName));
    } else {
        console.log(`${characterName} exist`);
        try {
            const config = {
                method: 'get',
                url: url + `?ocid=${ocid}`,
                headers: {
                    'accept': 'application/json',
                    'x-nxopen-api-key': process.env.API_KEY
                },
            };
            let response = await axios(config);
            let ability = response.data.ability_info;
            let message = "";
            let success = false;
            if (response.data.ability_grade == null) {
                message = `메이플 API로부터 데이터를 불러오지 못했습니다.\n\n잠시 후 다시 시도해 주세요.`;
                success = false;
            } else {
                message = `[${characterName}의 어빌리티]\n`;
                success = true;

                for (let single of ability) {
                    let string = `\n[${single.ability_grade}] ${single.ability_value}`;
                    message += string;
                }
            }

            res.status(200).json(successJSON(success, message));
        } catch (e) {
            console.error(e.response ? e.response.data : e);
            res.status(200).json(json.nexonAPIError(e));
        }
    }
});

app.get('/popularity/:characterName', async (req, res) => {
    const url = openAPIBaseUrl + "/character/popularity";
    const characterName = req.params.characterName;
    let date = new Date();
    date.setDate(date.getDate() - 1);
    let dateString = `${time.getDateStringForAPI(date)}`;

    console.log(`${time.getNowDateTime()} - 인기도(${characterName})`);

    let ocid = await iden.getOcid(characterName);
    if (ocid == null) {
        console.log(`${characterName} doesn't exist`);
        res.status(200).json(noOcidJSON(characterName));
    } else {
        console.log(`${characterName} exist`);
        try {
            const config = {
                method: 'get',
                url: url + `?ocid=${ocid}`,
                headers: {
                    'accept': 'application/json',
                    'x-nxopen-api-key': process.env.API_KEY
                },
            };
            let response = await axios(config);
            let popularity = response.data.popularity;
            let message = `[${characterName}의 인기도]\n`;
            message += `\n${characterName}의 인기도는 ${AddComma(popularity)}입니다.`;

            res.status(200).json(successJSON(true, message));
        } catch (e) {
            console.error(e.response ? e.response.data : e);
            res.status(200).json(json.nexonAPIError(e));
        }
    }
});

app.get('/fightingPower/:characterName', async (req, res) => {
    const url = openAPIBaseUrl + "/character/stat";
    const characterName = req.params.characterName;
    let dateString = time.getAPIDateString();

    console.log(`${time.getNowDateTime()} - 전투력(${characterName})`);

    let ocid = await iden.getOcid(characterName);
    if (ocid == null) {
        console.log(`${characterName} doesn't exist`);
        res.status(200).json(noOcidJSON(characterName));
    } else {
        console.log(`${characterName} exist`);
        try {
            const config = {
                method: 'get',
                url: url + `?ocid=${ocid}`,
                headers: {
                    'accept': 'application/json',
                    'x-nxopen-api-key': process.env.API_KEY
                },
            };
            let response = await axios(config);
            let statData = response.data.final_stat;
            let power = statData.filter((element) => element.stat_name == "전투력");
            let powerNum = Number(power[0].stat_value);
            let message = `[${characterName}의 전투력]\n`;
            message += `\n전투력: ${AddComma(powerNum)}\n\n넥슨 Open API에서 로드하는 데이터는 인게임 데이터와 차이가 발생할 수 있습니다.(마약버프, 칭호 등 옵션 미적용)`;

            res.status(200).json(successJSON(true, message));
        } catch (e) {
            console.error(e.response ? e.response.data : e);
            res.status(200).json(json.nexonAPIError(e));
        }
    }
});

app.get('/hexaStat/:characterName', async (req, res) => {
    const url = openAPIBaseUrl + "/character/hexamatrix-stat";
    const characterName = req.params.characterName;
    let dateString = time.getAPIDateString();

    console.log(`${time.getNowDateTime()} - 헥사스탯(${characterName})`);

    let ocid = await iden.getOcid(characterName);
    if (ocid == null) {
        console.log(`${characterName} doesn't exist`);

        res.status(200).json(noOcidJSON(characterName));
    } else {
        console.log(`${characterName} exist`);
        try {
            const config = {
                method: 'get',
                url: url + `?ocid=${ocid}`,
                headers: {
                    'accept': 'application/json',
                    'x-nxopen-api-key': process.env.API_KEY
                },
            };
            let response = await axios(config);
            let hexaStat = response.data.character_hexa_stat_core[0];
            let characterClass = response.data.character_class;
            let mainName = hexaStat.main_stat_name;
            let mainOption = mainName.slice(0, mainName.length - 3);
            let mainLev = Number(hexaStat.main_stat_level);
            let sub1Name = hexaStat.sub_stat_name_1;
            let sub1Option = sub1Name.slice(0, sub1Name.length - 3);
            let sub1Lev = Number(hexaStat.sub_stat_level_1);
            let sub2Name = hexaStat.sub_stat_name_2;
            let sub2Option = sub2Name.slice(0, sub2Name.length - 3);
            let sub2Lev = Number(hexaStat.sub_stat_level_2);

            let mainEff;
            let sub1Eff;
            let sub2Eff;
            let mainEffStr, sub1EffStr, sub2EffStr;

            if (characterClass != "제논" || characterClass != "데몬어벤져") {
                characterClass = "기타";
            }
            if (mainOption == "주력 스탯") {
                mainEff = hexaStatMainMultiplier[mainOption][characterClass][mainLev - 1];
            } else {
                mainEff = hexaStatMainMultiplier[mainOption][mainLev - 1];
            }
            if (mainOption == "공격력" || mainOption == "마력" || mainOption == "주력 스탯") {
                mainEffStr = mainEff;
            } else {
                mainEffStr = `${mainEff}%`
            }

            if (sub1Option == "주력 스탯") {
                sub1Eff = hexaStatSubMultiplier[sub1Option][characterClass] * sub1Lev;
            } else {
                sub1Eff = Number((hexaStatSubMultiplier[sub1Option] * sub1Lev).toFixed(2));
            }
            if (sub1Option == "공격력" || sub1Option == "마력" || sub1Option == "주력 스탯") {
                sub1EffStr = sub1Eff;
            } else {
                sub1EffStr = `${sub1Eff}%`
            }

            if (sub2Option == "주력 스탯") {
                sub2Eff = hexaStatSubMultiplier[sub2Option][characterClass] * sub2Lev;
            } else {
                sub2Eff = Number((hexaStatSubMultiplier[sub2Option] * sub2Lev).toFixed(2));
            }
            if (sub2Option == "공격력" || sub2Option == "마력" || sub2Option == "주력 스탯") {
                sub2EffStr = sub2Eff;
            } else {
                sub2EffStr = `${sub2Eff}%`
            }

            let message = `[${characterName}의 헥사 스탯]\n\n` +
                `메인: [Lv.${mainLev}] ${mainOption} ${mainEffStr} 증가\n` +
                `서브1: [Lv.${sub1Lev}] ${sub1Option} ${sub1EffStr} 증가\n` +
                `서브2: [Lv.${sub2Lev}] ${sub2Option} ${sub2EffStr} 증가`;

            const responseJson = successJSON(true, message);

            res.status(200).json(responseJson);
        } catch (e) {
            console.error(e.response ? e.response.data : e);
            res.status(200).json(json.nexonAPIError(e));
        }
    }
});

app.get("/union/:characterName", async (req, res) => {
    const url = openAPIBaseUrl + "/user/union";
    const characterName = req.params.characterName;
    let dateString = time.getAPIDateString();

    console.log(`${time.getNowDateTime()} - 유니온(${characterName})`);

    let ocid = await iden.getOcid(characterName);
    if (ocid == null) {
        console.log(`${characterName} doesn't exist`);

        res.status(200).json(noOcidJSON(characterName));
    } else {
        console.log(`${characterName} exist`);
        try {
            const config = {
                method: 'get',
                url: url + `?ocid=${ocid}`,
                headers: {
                    'accept': 'application/json',
                    'x-nxopen-api-key': process.env.API_KEY
                },
            };
            let response = await axios(config);
            let unionData = response.data;
            let level = unionData.union_level;
            let grade = unionData.union_grade;
            let artifact_level = unionData.union_artifact_level;
            let artifact_exp = unionData.union_artifact_exp;
            let artifact_point = unionData.union_artifact_point;

            let message = `[${characterName}의 유니온]\n\n` +
                `레벨: Lv.${AddComma(level)}\n` +
                `등급: ${grade}\n` +
                `아티팩트 레벨: Lv.${artifact_level}\n` +
                `현재 아티팩트 경험치: ${AddComma(artifact_exp)}\n` +
                `보유 아티팩트 포인트: ${AddComma(artifact_point)}`;

            const responseJson = successJSON(true, message);

            res.status(200).json(responseJson);
        } catch (e) {
            console.error(e.response ? e.response.data : e);
            res.status(200).json(json.nexonAPIError(e));
        }
    }
});

// 캐릭터명을 생략하면 톡방·톡프로필에 지정된 본캐를 사용한다.
app.get("/info_six", infoSixHandler);
app.get("/info_six/:characterName", infoSixHandler);

async function infoSixHandler(req, res) {
    const url = openAPIBaseUrl + "/character/hexamatrix";
    const { chatRoomName, talkProfileName } = req.query;
    let characterName = req.params.characterName;
    let dateString = time.getAPIDateString();

    if (!characterName) {
        try {
            characterName = await mc.getMainCharacter(chatRoomName, talkProfileName);
        } catch (e) {
            console.error(e);
            return res.status(200).json(json.failure("본캐 정보를 불러오지 못했습니다. 캐릭터 이름을 명령어 뒤에 입력해 주세요."));
        }
        if (!characterName) {
            let message = `${talkProfileName} <<< 이 톡프로필에 저장된 본캐가 없습니다. \"/본캐 [캐릭터명]\"명령어를 통해 본캐 지정을 하거나, 찾고 싶은 캐릭터 이름을 명령어 뒤에 입력해 주세요.`;
            return res.status(200).json(json.failure(message));
        }
    }

    console.log(`${time.getNowDateTime()} - HEXA강화(${characterName})`);

    let ocid = await iden.getOcid(characterName);
    if (ocid == null) {
        console.log(`${characterName} doesn't exist`);

        res.status(200).json(noOcidJSON(characterName));
    } else {
        console.log(`${characterName} exist`);
        try {
            const config = {
                method: 'get',
                url: url + `?ocid=${ocid}`,
                headers: {
                    'accept': 'application/json',
                    'x-nxopen-api-key': process.env.API_KEY
                },
            };
            let response = await axios(config);
            let hexaData = response.data;
            let hexaCoreArr = hexaData.character_hexa_core_equipment || [];
            let hexaCoreRes = {
                "스킬 코어": [],
                "마스터리 코어": [],
                "강화 코어": [],
                "공용 코어": []
            };

            // 코어별 개수 카운트 (배열 순서 = 슬롯 순서로 간주)
            let coreCounts = {
                "스킬 코어": 0,
                "마스터리 코어": 0,
                "강화 코어": 0,
                "공용 코어": 0
            };

            let usedSols = 0;
            let usedCracks = 0;
            let usedSolsForPublic = 0;
            let usedCracksForPublic = 0;
            let hasEventLevel = false;

            for(let singleCore of hexaCoreArr) {
                let coreType = singleCore.hexa_core_type;
                if(!hexaCoreRes[coreType]) continue;

                let ordinal = coreCounts[coreType]++;
                let lev = Number(singleCore.hexa_core_level);
                let eventLev = Number(singleCore.hexa_core_event_level) || 0;

                if(eventLev > 0) hasEventLevel = true;

                hexaCoreRes[coreType].push({
                    "name": singleCore.hexa_core_name,
                    "lev": lev,
                    "eventLev": eventLev
                });

                // 이벤트 레벨은 무상 지급분이므로 실제 강화 레벨만 비용으로 합산한다
                let cost = calcHexaCoreCost(coreType, ordinal, lev);

                if(coreType == "공용 코어") {
                    usedSolsForPublic += cost.sol;
                    usedCracksForPublic += cost.crack;
                }
                else {
                    usedSols += cost.sol;
                    usedCracks += cost.crack;
                }
            }

            // 슬롯 상수가 실제 보유 개수보다 적으면(게임 업데이트 지연) 실제 개수를 분모로 쓴다
            let slotsInUse = {};
            for(let coreType in hexaCoreSlots) {
                slotsInUse[coreType] = Math.max(hexaCoreSlots[coreType], coreCounts[coreType]);
            }

            let totalRequiredSols = 0;
            let totalRequiredCracks = 0;

            for(let coreType of ["스킬 코어", "마스터리 코어", "강화 코어"]) {
                let total = calcHexaTypeTotal(coreType, slotsInUse[coreType]);
                totalRequiredSols += total.sol;
                totalRequiredCracks += total.crack;
            }

            let publicTotal = calcHexaTypeTotal("공용 코어", slotsInUse["공용 코어"]);
            let totalRequiredSolsForPublic = publicTotal.sol;
            let totalRequiredCracksForPublic = publicTotal.crack;

            const toRatio = (used, total) => total > 0 ? Number(((used / total) * 100).toFixed(3)) : 0;

            let solRatio = toRatio(usedSols, totalRequiredSols);
            let crackRatio = toRatio(usedCracks, totalRequiredCracks);
            let solPublicRatio = toRatio(usedSolsForPublic, totalRequiredSolsForPublic);
            let crackPublicRatio = toRatio(usedCracksForPublic, totalRequiredCracksForPublic);

            const characterClass = await iden.getCharacterClass(ocid);
            const title = iden.characterTitle(characterName, characterClass);

            let message = `[${title}]\n\n[HEXA강화]`;
            // 마크다운을 렌더링하는 방용 출력.
            // 레벨을 앞에 두고 이름은 평문과 똑같이 자른다 — 모바일 카카오톡에서
            // 스킬명 하나가 두 줄로 넘어가지 않게 하려는 의도적인 처리다.
            // 표는 렌더링을 지원하지 않는 클라이언트에서 파이프가 그대로 노출되므로 목록을 쓴다.
            let markdown = `## ${title}`;

            const isVisibleCore = (core) => core["lev"] > 0 || core["eventLev"] > 0;
            const hasVisiblePublicCore = hexaCoreRes["공용 코어"].some(isVisibleCore);

            for(let key in hexaCoreRes) {
                // 보유 레벨과 이벤트 레벨이 모두 0인 코어는 노출하지 않는다
                let visibleCores = hexaCoreRes[key].filter(isVisibleCore);
                if(visibleCores.length === 0) continue;

                message += `\n\n- ${key} (${visibleCores.length}/${slotsInUse[key]}개) -`;
                markdown += `\n\n### ${key} (${visibleCores.length}/${slotsInUse[key]}개)`;
                for(let singleData of visibleCores) {
                    // 0인 레벨은 표기에서 제외한다
                    let levelText;
                    if(singleData["eventLev"] > 0 && singleData["lev"] > 0) {
                        levelText = `이벤트 Lv.${singleData["eventLev"]}/보유 Lv.${singleData["lev"]}`;
                    }
                    else if(singleData["eventLev"] > 0) {
                        levelText = `이벤트 Lv.${singleData["eventLev"]}`;
                    }
                    else {
                        levelText = `Lv.${singleData["lev"]}`;
                    }
                    message += `\n[${levelText}] ${truncateText(singleData["name"])}`;
                    markdown += `\n- [${levelText}] ${truncateText(singleData["name"])}`;
                }
            }

            // 코어 목록과 진척도 요약을 눈으로 갈라 놓는다
            message += `\n\n${RULE}\n[HEXA강화 진척도(공용코어 제외)]\n- 솔 에르다: ${AddComma(usedSols)}개/${AddComma(totalRequiredSols)}개(${solRatio}%)`;
            message += `\n- 조각: ${AddComma(usedCracks)}개/${AddComma(totalRequiredCracks)}개(${crackRatio}%)`;

            markdown += `\n\n${RULE}\n\n### 진척도 (공용코어 제외)`;
            markdown += `\n- 솔 에르다: ${AddComma(usedSols)} / ${AddComma(totalRequiredSols)} (${solRatio}%)`;
            markdown += `\n- 조각: ${AddComma(usedCracks)} / ${AddComma(totalRequiredCracks)} (${crackRatio}%)`;

            if (hasVisiblePublicCore) {
                message += `\n\n[HEXA강화 진척도(공용코어)]\n- 솔 에르다: ${AddComma(usedSolsForPublic)}개/${AddComma(totalRequiredSolsForPublic)}개(${solPublicRatio}%)`;
                message += `\n- 조각: ${AddComma(usedCracksForPublic)}개/${AddComma(totalRequiredCracksForPublic)}개(${crackPublicRatio}%)`;

                markdown += `\n\n### 진척도 (공용코어)`;
                markdown += `\n- 솔 에르다: ${AddComma(usedSolsForPublic)} / ${AddComma(totalRequiredSolsForPublic)} (${solPublicRatio}%)`;
                markdown += `\n- 조각: ${AddComma(usedCracksForPublic)} / ${AddComma(totalRequiredCracksForPublic)} (${crackPublicRatio}%)`;
            }

            if (hasEventLevel) {
                const eventNote = `이벤트 레벨은 무상 지급분이므로 강화 비용 합산에서 제외됩니다.`;
                message += `\n\n※ ${eventNote}`;
                markdown += `\n\n> ${eventNote}`;
            }

            res.status(200).json(json.successWithMarkdown(message, markdown, { characterName, characterClass, title }));
        } catch (e) {
            console.error(e.response ? e.response.data : e);
            res.status(200).json(json.nexonAPIError(e));
        }
    }
}

// HEXA 코어를 [시작레벨] 에서 [목표레벨] 까지 올리는 데 필요한 비용 (코어 1개 기준)
app.get("/hexa_cost/:startLev/:endLev", (req, res) => {
    const maxLev = getHexaMaxLevel();
    const startLev = Number(req.params.startLev);
    const endLev = Number(req.params.endLev);

    console.log(`${time.getNowDateTime()} - HEXA강화비용(${req.params.startLev} → ${req.params.endLev})`);

    const usage = `/6차 [시작레벨] [목표레벨]\n[시작레벨]: 0 ~ ${maxLev - 1} 사이의 숫자(0일 땐 코어 개방 포함)\n[목표레벨]: 1 ~ ${maxLev} 사이의 숫자`;

    if (!Number.isInteger(startLev) || !Number.isInteger(endLev)) {
        return res.status(200).json(successJSON(false, `레벨은 정수로 입력해 주세요.\n\n${usage}`));
    }
    if (startLev < 0 || startLev > maxLev - 1 || endLev < 1 || endLev > maxLev) {
        return res.status(200).json(successJSON(false, `입력할 수 있는 레벨 범위를 벗어났습니다.\n\n${usage}`));
    }
    if (startLev >= endLev) {
        return res.status(200).json(successJSON(false, `목표레벨이 시작레벨보다 커야 합니다.\n\n${usage}`));
    }

    // 코어 종류마다 단위가 같으므로 "솔 에르다 / 조각"은 머리말에서 한 번만 알리고,
    // 항목은 숫자만 한 줄로 낸다. 이름과 단위를 매 줄에 붙이면 줄바꿈이 생겨 읽기 나쁘다.
    let message = `[HEXA 코어 강화 비용]\nLv.${startLev} → Lv.${endLev} (코어 1개 기준)\n※ 솔 에르다 개수 / 조각 개수\n`;
    let markdown = `## HEXA 코어 강화 비용\n\n**Lv.${startLev} → Lv.${endLev}** (코어 1개 기준)\n솔 에르다 개수 / 조각 개수\n`;

    for (const tableKey in hexaCoreCost) {
        const cost = calcHexaCoreCostRange(tableKey, startLev, endLev);
        message += `\n${tableKey} — ${AddComma(cost.sol)} / ${AddComma(cost.crack)}`;
        markdown += `\n- ${tableKey} — ${AddComma(cost.sol)} / ${AddComma(cost.crack)}`;
    }

    if (startLev === 0) {
        message += `\n\n※ 코어 개방(0→1) 비용이 포함된 금액입니다.\n※ 6차 전직 시 지급되는 첫 번째 스킬 코어는 개방 비용이 들지 않습니다.`;
        markdown += `\n\n> 코어 개방(0→1) 비용이 포함된 금액입니다.\n> 6차 전직 시 지급되는 첫 번째 스킬 코어는 개방 비용이 들지 않습니다.`;
    }

    res.status(200).json(json.successWithMarkdown(message, markdown));
});

app.get("/exp_coupon/:type/:lev/:ratio/:expCoupons", async (req, res) => {

    const { type, lev, ratio, expCoupons } = req.params;
    const date = new Date();
    console.log(`${time.getNowDateTime()} - exp쿠폰(${type}, ${lev}, ${ratio}, ${expCoupons})`);

    try {
        let typeIndex = Number(type);
        if(typeIndex != 1 && typeIndex != 2) {
            let message = `EXP쿠폰의 종류를 정확히 입력해주세요.\n\n일반 EXP 쿠폰: 1\n상급 EXP 쿠폰: 2`;
            let json = successJSON(false, message);
            res.status(200).json(json);
        }
        else {
            let curLev = Number(lev);
            // 경험치표가 Lv.1 부터 담기기 전에는 200 미만이 들어오면 find 가
            // undefined 를 물어 와 그대로 터졌다. 이제는 표를 찾아내지만 쿠폰
            // 획득량 배열(expCoupon)이 200 시작이라 음수 인덱스로 NaN 이 되므로
            // 여기서 막는다.
            if(!Number.isInteger(curLev) || curLev < 200 || curLev > 299) {
                let message = `레벨은 200 이상 299 이하로 입력해 주세요.`;
                let json = successJSON(false, message);
                return res.status(200).json(json);
            }
            if(typeIndex == 2 && curLev < 260){
                let message = `상급 EXP 쿠폰은 260레벨부터 사용 가능합니다.`;
                let json = successJSON(false, message);
                res.status(200).json(json);
            }
            else {
                let expRatio = Number(ratio);
                let expCouponCount = Number(expCoupons);

                let resLev = curLev;
                let resRatio = expRatio;

                let nowLev = curLev;
                let remainingExpCoupon = expCouponCount;
                let curLevExp = expAmount.find((element) => element.lev == curLev).exp;
                let nowExp = Math.round(curLevExp * (expRatio / 100));
                let remainingExp = curLevExp - nowExp;
                while(true) {
                    curLevExp = expAmount.find((element) => element.lev == nowLev).exp;
                    remainingExp = curLevExp - nowExp;
                    // console.log(`${nowLev}레벨에서 ${nowExp}인 상태로 시작: 남은 exp: ${remainingExp}`);
                    let nowExpCouponAmount = 0;
                    if(typeIndex == 1) {
                        if(nowLev >= 260) {
                            nowExpCouponAmount = expCoupon[expCoupon.length - 1];
                        }
                        else {
                            nowExpCouponAmount = expCoupon[nowLev - 200];
                        }
                    } else {
                        if(nowLev >= 290) {
                            nowExpCouponAmount = advancedExpCoupon[advancedExpCoupon.length - 1];
                        }
                        else {
                            nowExpCouponAmount = advancedExpCoupon[nowLev - 260];
                        }
                    }
                    let neededCouponCount = Math.floor((remainingExp / nowExpCouponAmount)) + 1;
                    // console.log(`${nowLev}에서 exp쿠폰 1개당 ${nowExpCouponAmount} 증가, ${neededCouponCount}개 필요`);
                    if(neededCouponCount < remainingExpCoupon) {
                        let addedExp = neededCouponCount * nowExpCouponAmount;
                        nowExp += addedExp;
                        nowLev++;
                        remainingExpCoupon -= neededCouponCount;
                        nowExp -= curLevExp;
                        // console.log(`${nowLev-1}레벨에서 ${nowLev}로 가기 위해 exp쿠폰 ${neededCouponCount}개 사용: ${remainingExpCoupon}개 남음`);
                        continue;
                    }
                    else {
                        let addedExp = remainingExpCoupon * nowExpCouponAmount;
                        nowExp += addedExp;
                        resLev = nowLev;
                        resRatio = ((nowExp / (expAmount.find((element) => element.lev == nowLev).exp)) * 100).toFixed(3);
                        // console.log(`더 이상 레벨업이 불가능해 ${nowLev}에서 exp쿠폰 ${remainingExpCoupon}개 사용`);
                        remainingExpCoupon = 0;
                    }
                    if(remainingExpCoupon == 0) {
                        break;
                    }
                }

                console.log(resLev, resRatio);

                let message = '';

                if(typeIndex == 1) {
                    message = `[EXP쿠폰 계산]\n\n` +
                        `${curLev}레벨 ${expRatio}%에서 ${expCouponCount}개 사용 후\n↓↓↓↓↓↓\n${resLev}레벨 ${resRatio}% 달성 예상\n\n` +
                        `(해당 연산은 산술연산의 오차로 실제 결과와 소폭 차이가 있을 수 있습니다.)`;
                }
                else {
                    message = `[상급 EXP쿠폰 계산]\n\n` +
                        `${curLev}레벨 ${expRatio}%에서 ${expCouponCount}개 사용 후\n↓↓↓↓↓↓\n${resLev}레벨 ${resRatio}% 달성 예상\n\n` +
                        `(해당 연산은 산술연산의 오차로 실제 결과와 소폭 차이가 있을 수 있습니다.)`;
                }

                const responseJson = successJSON(true, message);

                res.status(200).json(responseJson);
            }
        }
    } catch (e) {
        console.error(e);
        res.status(200).json({
            success: false,
            result: e
        });
    }
});

app.get("/info/:characterName", async (req, res) => {

    let url = openAPIBaseUrl + "/character/basic";
    const characterName = req.params.characterName;
    let dateString = time.getAPIDateString();

    console.log(`${time.getNowDateTime()} - 캐릭터정보(${characterName})`);

    let ocid = await iden.getOcid(characterName);
    if (ocid == null) {
        console.log(`${characterName} doesn't exist`);

        res.status(200).json(noOcidJSON(characterName));
    } else {
        console.log(`${characterName} exist`);
        let message = `[${characterName}의 캐릭터 정보]\n\n`;
        try {
            const config = {
                method: 'get',
                url: url + `?ocid=${ocid}`,
                headers: {
                    'accept': 'application/json',
                    'x-nxopen-api-key': process.env.API_KEY
                },
            };
            let response = await axios(config);
            let world = response.data.world_name;
            let gender = `${response.data.character_gender}성`;
            let job = response.data.character_class;
            let level = response.data.character_level;
            let ratio = `${response.data.character_exp_rate}%`;
            let guild = response.data.character_guild_name;

            message += `월드: ${world}` +
                `\n성별: ${gender}` +
                `\n직업: ${job}` +
                `\n레벨: ${level}(${ratio})` +
                `\n길드: ${guild}`;

            const responseJson = successJSON(true, message);

            return res.status(200).json(responseJson);
        } catch (e) {
            if (e.response) {
                console.error(e.response);
                return res.status(200).json({
                    success: false,
                    result: e.response
                });
            } else {
                console.error(e);
                return res.status(200).json({
                    success: false,
                    result: e
                });
            }
        }
    }
});

app.get('/test', async (req, res) => {
    const url = openAPIBaseUrl + "/character/basic";
    const characterName = "숍승혹";
    let date = new Date();

    console.log(`${date.toLocaleDateString()} - 레벨히스토리(${characterName})`);

    date.setDate(date.getDate() - 1);

    let ocid = await iden.getOcid(characterName);
    if (ocid == null) {
        console.log(`${characterName} doesn't exist`);
        res.status(200).json(noOcidJSON(characterName));
    } else {
        console.log(`${characterName} exist`);
        try {
            let message = `[${characterName}의 레벨 히스토리]\n`;
            let dateString = "";
            let curLev = -1;
            let dateStringArr = [];
            for (; ;) {
                dateString = time.getDateStringForAPI(date);
                let config = {
                    method: 'get',
                    url: url + `?ocid=${ocid}&date=${dateString}`,
                    headers: {
                        'accept': 'application/json',
                        'x-nxopen-api-key': process.env.API_KEY
                    },
                };
                let response = await axios(config);
                let basicData = response.data;
                let lev = basicData.character_level;
                let exp = basicData.character_exp_rate;
                dateStringArr.push(`\n${dateString}: Lv.${lev} ${exp}`);
                console.log(`\n${dateString}: Lv.${lev} ${exp}`);
                if (date.getFullYear() == 2023 && date.getMonth() == 11 && date.getDate() == 21) {
                    if(lev != null) {
                        dateStringArr.push(`\n${dateString}: Lv.${lev}`);
                    }
                    break;
                }
                date.setDate(date.getDate() - 1);
            }

            for (let i = dateStringArr.length - 1; i >= 0; i--) {
                message += dateStringArr[i];
            }

            res.status(200).json(successJSON(true, message));
        } catch (e) {
            if (e.response) {
                console.log("error with response");
                console.error(e.response);
                res.status(200).json({
                    success: false,
                    result: e.response
                });
            } else {
                console.log("error without response");
                console.error(e);
                res.status(200).json({
                    success: false,
                    result: e
                });
            }
        }
    }
});

// const identicalOptions = ["공", "마", "방", "이", "점", "착", "H", "M", "올"];
// const simpleOptions = ["공", "마", "방", "이", "점", "올"];
// const simpleOptionsValue = [3, 4, 5, 6, 7];
// const levReduceOption = "착";
// const levReduceValue = [15, 20, 25, 30, 35];
//
// app.post('/addOption', async (req, res) => {
//     const {lev, str} = req.body;
//
//     let optionCountLeft = 4;
//
//     const level = Number(lev);
//     const optionString = str.replace(/([가-힣])(\d+)/g, '$1:$2').replace(/(\d+)([가-힣])/g, '$1,$2');
//     const optionArr = optionString.split(",");
//     let options = {};
//     // add option to map
//     for (let i = 0; i < optionArr.length; i++) {
//         let optionElements = optionArr[i].split(":");
//         let option = optionElements[0];
//         let value = Number(optionElements[1]);
//         options[option] = value;
//     }
//     options = new Map(Object.entries(options));
//
//     let constantHPMP = level * 3;
//     let hpmpOptions = [];
//     for (let i = 3; i <= 7; i++) {
//         hpmpOptions.push(constantHPMP * i);
//     }
//
//     let determinedOptions = {};
//
//     // determine each options and extract simple options
//     for (let [key, value] of options) {
//         if (identicalOptions.includes(key)) {
//             console.log(`identicalOptions includes ${key}`);
//             if (simpleOptions.includes(key)) {
//                 let valueGrade = 5 - simpleOptionsValue.indexOf(value);
//                 let optionName = getOptionName(key);
//                 determinedOptions[optionName] = {
//                     "valueGrade": valueGrade,
//                     "value": value
//                 };
//             } else if (levReduceOption.includes(key)) {
//                 let valueGrade = 5 - levReduceValue.indexOf(value);
//                 let optionName = getOptionName(key);
//                 determinedOptions[optionName] = {
//                     "valueGrade": valueGrade,
//                     "value": value
//                 };
//             }
//             // TODO: HP, MP Determinition
//             options.delete(key);
//             optionCountLeft--;
//         }
//     }
//
//     console.log(options);
//     console.log(`optionCountLeft: ${optionCountLeft}`);
//
//     // determine single options and duplicate options for stats
//     let singleOptions = [];
//     let doubleOptions = [];
//     let constantSingle = Math.floor(level / 20) + 1;
//     let constantDouble = Math.floor(level / 40) + 1;
//     for (let i = 3; i <= 7; i++) {
//         singleOptions.push(constantSingle * i);
//         doubleOptions.push(constantDouble * i);
//     }
//
//     console.log(singleOptions);
//     console.log(doubleOptions);
//
//     let resultObject = {};
//     let optionName = [];
//     let combinations = [];
//
//     switch (optionCountLeft) {
//         case 1:
//             console.log(`option left count: 1`);
//             let keyCount = options.size;
//             if (keyCount == 1) {
//                 options.forEach((value, key) => {
//                     let valueGrade = 5 - singleOptions.indexOf(value);
//                     let optionName = getOptionName(key);
//                     console.log(valueGrade, optionName);
//                     determinedOptions[optionName] = {
//                         "valueGrade": valueGrade,
//                         "value": value
//                     };
//                 });
//             } else {
//                 let optionName = "";
//                 let value = 0;
//                 let valueGrade = 0;
//                 for (let key of options.keys()) {
//                     if (optionName) {
//                         optionName += `+${getOptionName(key)}`;
//                     } else {
//                         value = options.get(key);
//                         valueGrade = 5 - doubleOptions.indexOf(value);
//                         optionName = getOptionName(key);
//                     }
//                 }
//                 determinedOptions[optionName] = {
//                     "valueGrade": valueGrade,
//                     "value": value
//                 };
//             }
//             break;
//         case 2:
//             for (let key of options.keys()) {
//                 optionName.push(key);
//             }
//             optionName.forEach(name => combinations.push(name));
//             for (let i = 0; i < optionName.length; i++) {
//                 for (let j = i + 1; j < optionName.length; j++) {
//                     combinations.push([optionName[i], optionName[j]]);
//                 }
//             }
//
//             for (let i = 0; i < combinations.length; i++) {
//                 for (let j = i + 1; j < combinations.length; j++) {
//                     if (i !== j) {
//                         let combination = [combinations[i], combinations[j]];
//                         let result = determineValidCombination(combination, options, singleOptions, doubleOptions);
//                         if (result != undefined) {
//                             resultObject = Object.assign({}, result, determinedOptions);
//                         }
//                     }
//                 }
//             }
//             break;
//         case 3:
//             // for (let key of options.keys()) {
//             //     optionName.push(key);
//             // }
//             // optionName.forEach(name => combinations.push(name));
//             // for (let i = 0; i < optionName.length; i++) {
//             //     for (let j = i + 1; j < optionName.length; j++) {
//             //         combinations.push([optionName[i], optionName[j]]);
//             //     }
//             // }
//             //
//             // for (let i = 0; i < combinations.length; i++) {
//             //     for (let j = i + 1; j < combinations.length; j++) {
//             //         for (let k = j + 1; k < combinations.length; k++) {
//             //             if (i !== j && j !== k && i !== k) {
//             //                 let combination = [combinations[i], combinations[j], combinations[k]];
//             //                 let result = determineValidCombination(combination, options, singleOptions, doubleOptions);
//             //                 if (result != undefined) {
//             //                     resultObject = Object.assign({}, result, determinedOptions);
//             //                 }
//             //             }
//             //         }
//             //     }
//             // }
//             break;
//         case 4:
//             for (let key of options.keys()) {
//                 optionName.push(key);
//             }
//             let targetResult = Object.fromEntries(options);
//             const result = findMatchingCombinations(targetResult, optionName, singleOptions, doubleOptions);
//             console.log(result);
//         default:
//             break;
//     }
//     console.log(resultObject);
//     res.status(200).json({
//         success: true
//     });
// });

//
// function determineValidCombination(combination, sums, singleOptions, doubleOptions) {
//     let computedSumsObj = {};
//     for (let key of sums.keys()) {
//         computedSumsObj[key] = 0;
//     }
//     for (let singleValue of singleOptions) {
//         for (let doubleValue of doubleOptions) {
//             let computedSums = new Map(Object.entries(computedSumsObj));
//
//             console.log(`------------------ comparison between sums and conputedSums -----------------`);
//
//             combination.forEach(option => {
//                 if (option.length === 1) {
//                     computedSums.set(option[0], (computedSums.get(option[0]) + singleValue));
//                     console.log(`${option[0]}: ${singleValue}`);
//                 } else if (option.length === 2) {
//                     computedSums.set(option[0], (computedSums.get(option[0]) + doubleValue));
//                     computedSums.set(option[1], (computedSums.get(option[1]) + doubleValue));
//                     console.log(`${option[0]}, ${option[1]}: ${doubleValue}`);
//                 }
//             });
//
//             let isValid = true;
//             console.log(sums);
//             console.log(computedSums)
//             for (let key of sums.keys()) {
//                 if (sums.get(key) !== computedSums.get(key)) {
//                     isValid = false;
//                     break;
//                 }
//             }
//             if (isValid) {
//                 let result = {};
//                 let singleOptionValue = singleValue;
//                 let singleOptionGrade = 5 - singleOptions.indexOf(singleValue);
//                 let doubleOptionValue = doubleValue;
//                 let doubleOptionGrade = 5 - doubleOptions.indexOf(doubleValue);
//
//                 combination.forEach(option => {
//                     if (option.length === 1) {
//                         let optionName = `${getOptionName(option[0])}`;
//                         let temp = {
//                             "valueGrade": singleOptionGrade,
//                             "value": singleOptionValue
//                         };
//                         result[optionName] = temp;
//                     } else if (option.length === 2) {
//                         let optionName = `${getOptionName(option[0])}+${getOptionName(option[1])}`;
//                         let temp = {
//                             "valueGrade": doubleOptionGrade,
//                             "value": doubleOptionValue
//                         };
//                         result[optionName] = temp;
//                     }
//                 });
//                 console.log(result);
//                 return result;
//             }
//         }
//     }
//     return undefined;
// }
//
// function generateCombinations(variables) {
//     const combinations = [];
//     for (let i = 0; i < variables.length; i++) {
//         combinations.push([variables[i]]);
//         for(let j = i + 1; j < variables.length; j++) {
//             combinations.push([variables[i], variables[j]]);
//         }
//     }
//     return combinations;
// }
//
// function assignValuesToCombinations(combinations, singleOptions, doubleOptions) {
//     const allAssignments = [];
//
//     combinations.forEach(combination => {
//         const values = combinations.length === 1 ? singleOptions : doubleOptions;
//         values.forEach(value => {
//             allAssignments.push({combination, value});
//         });
//     });
//
//     return allAssignments;
// }
//
// function matchesResult(assignments, targetResult) {
//     const result = {};
//
//     assignments.forEach(({combination, value}) => {
//         combination.forEach(variable => {
//             result[variable] = (result[variable] || 0) + value;
//         });
//     });
//
//     console.log(`assignment result: ${JSON.stringify(result)}`);
//     console.log(`targetResult: ${JSON.stringify(targetResult)}`);
//
//     for (let variable in targetResult) {
//         if (result[variable] !== targetResult[variable]) {
//             return false;
//         }
//     }
//
//     return true;
// }
//
// function findMatchingCombinations(targetResult, variables, singleOptions, doubleOptions) {
//     const combinations = generateCombinations(variables);
//     const allAssignments = assignValuesToCombinations(combinations, singleOptions, doubleOptions);
//
//     for (let i = 0; i < allAssignments.length; i++) {
//         for (let j = i + 1; j < allAssignments.length; j++) {
//             for(let k = i + 1; j < allAssignments.length; k++) {
//                 for(let l = k + 1; l < allAssignments.length; l++) {
//                     const selectedAssignments = [allAssignments[i], allAssignments[j], allAssignments[k], allAssignments[l]];
//                     if(matchesResult(selectedAssignments, targetResult)) {
//                         return selectedAssignments.map(assignment => ({
//                             'combination': assignment.combination.join('+'),
//                             'value': assignment.value
//                         }));
//                     }
//                 }
//             }
//         }
//     }
//
//     return null;
// }

function getOptionName(str) {
    let result = "";
    switch (str) {
        case "공":
            result = "공격력";
            break;
        case "마":
            result = "마력";
            break;
        case "방":
            result = "방어력";
            break;
        case "이":
            result = "이동속도";
            break;
        case "점":
            result = "점프력";
            break;
        case "착":
            result = "착용 가능 레벨 감소";
            break;
        case "H":
            result = "최대 HP";
            break;
        case "M":
            result = "최대 MP";
            break;
        case "올":
            result = "올스탯";
            break;
        case "힘" :
            result = "STR";
            break;
        case "덱":
            result = "DEX";
            break;
        case "럭":
            result = "LUK";
            break;
        case "인":
            result = "INT";
            break;
    }
    return result;
}

function noOcidJSON(name) {
    var str = "";
    let date = new Date();
    if(date.getHours() == 0) {
        str = `현재 NEXON OpenAPI 서버 점검 및 업데이트 시간으로 로드가 불가능합니다. 오전 01시 이후에 재시도해 주세요.`;
    }
    str = `API 서버에서 ${name}에 대한 id를 가져올 수 없습니다.\n(데이터 누락일 수 있으니, 재시도 해보시기 바랍니다.)`;
    return {
        success: false,
        result: encodeURIComponent(str),
        resultRaw: str
    };
}

function AddComma(data_value) {
    var txtNumber = '' + data_value;
    if (isNaN(txtNumber) || txtNumber == '') {
        return;
    } else {
        var rxSplit = new RegExp('([0-9])([0-9][0-9][0-9][,.])');
        var arrNumber = txtNumber.split('.');
        arrNumber[0] += '.';
        do {
            arrNumber[0] = arrNumber[0].replace(rxSplit, '$1,$2');
        } while (rxSplit.test(arrNumber[0]));
        if (arrNumber.length > 1) {
            return arrNumber.join('');
        } else {
            return arrNumber[0].split('.')[0];
        }
    }
}

function successJSON(success, result) {
    var json = {
        success: success,
        result: encodeURIComponent(result),
        resultRaw: result
    }

    return json;
}

function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

function pickRandNum(min, max) {
    let randNum = Math.floor(Math.random() * (max - min + 1)) + min;
    return randNum;
}

function determineClass(subclass) {
    let mainClassSoldier = ["검사", "파이터", "페이지", "스피어맨", "크루세이더", "나이트", "버서커", "히어로", "팔라딘", "다크나이트"];
    let mainClassWizard = ["매지션", "위자드(불,독)", "위자드(썬,콜)", "클레릭", "메이지(불,독)", "메이지(썬,콜)", "프리스트", "아크메이지(불,독)", "아크메이지(썬,콜)", "비숍"];
    let mainClassBow = ["아처", "헌터", "사수", "레인저", "저격수", "보우마스터", "신궁", "아처(패스파인더)", "에인션트아처", "체이서", "패스파인더"];
    let mainClassThief = ["로그", "어쌔신", "시프", "허밋", "시프마스터", "나이트로드", "섀도어", "세미듀어러", "듀어러", "듀얼마스터", "슬래셔", "듀얼블레이더"];
    let mainClassPirate = ["해적", "인파이터", "건슬링거", "캐논슈터", "버커니어", "발키리", "캐논블래스터", "바이퍼", "캡틴", "캐논마스터"];
    let mainClassKnight = ["노블레스", "소울마스터", "플레임위자드", "윈드브레이커", "나이트워커", "스트라이커", "미하일"];
    let mainClassResistance = ["시티즌", "배틀메이지", "와일드헌터", "메카닉", "데몬슬레이어", "데몬어벤져", "제논", "블래스터"];
    let mainClassCWJ = ["제로"];
    let mainClassFriends = ["키네시스"];

    let className = "";

    if(mainClassSoldier.includes(subclass)) {
        className = "전사";
    } else if(mainClassWizard.includes(subclass)) {
        className = "마법사";
    } else if(mainClassBow.includes(subclass)) {
        className = "궁수";
    } else if(mainClassThief.includes(subclass)) {
        className = "도적";
    } else if(mainClassPirate.includes(subclass)) {
        className = "해적";
    } else if(mainClassKnight.includes(subclass)) {
        className = "기사단";
    } else if(mainClassResistance.includes(subclass)) {
        className = "레지스탕스";
    } else if(mainClassCWJ.includes(subclass)) {
        className = "초월자";
    } else if(mainClassFriends.includes(subclass)) {
        className = "프렌즈 월드";
    } else {
        className = "전체 전직";
    }

    return className;
}

function truncateText(text, maxLength = 13) {
    // console.log(`loaded text = ${text}`);
    // console.log(`text's length = ${text.length}`);
    if (text.length >= maxLength) {
        // console.log(`${text}'s length is more than 10`);
        return text.slice(0, maxLength) + "...";
    }
    // console.log(`${text}'s length is less than 10`);
    return text;
}

function roundTo(num, digits) {
    const factor = Math.pow(10, digits);
    // console.log(`num: ${num}`);
    // console.log(`digits: ${digits}`);
    // console.log(`factor: ${factor}`);
    // console.log(Math.round(num * factor) / factor);
    return Math.round(num * factor) / factor;
}

function cleanItemName(name) {
    return name
        .replace(/\([^)]*\)/g, '')              // 괄호 및 괄호 안 제거
        .replace(/\s*\/\s*/g, '/')              // 슬래시 앞뒤 공백 제거
        .replace(/](?! )/g, '] ')               // 대괄호 뒤 공백 없으면 추가
        .replace(/\s+/g, ' ')                   // 중복 공백 제거
        .trim();
}

function parseProbability(percentStr) {
    return parseFloat(percentStr.replace('%', '')) / 100;
}

// HP 숫자를 한국어 단위로 변환 (경, 조, 억)
function formatHp(hp) {
    const gyeong = Math.floor(hp / 10000000000000000); // 경
    const jo = Math.floor((hp % 10000000000000000) / 1000000000000); // 조
    const eok = Math.floor((hp % 1000000000000) / 100000000); // 억

    let parts = [];
    if (gyeong > 0) parts.push(`${gyeong.toLocaleString('ko-KR')}경`);
    if (jo > 0) parts.push(`${jo.toLocaleString('ko-KR')}조`);
    if (eok > 0) parts.push(`${eok.toLocaleString('ko-KR')}억`);

    return parts.join(' ') || '0';
}

// 특수 아이템 카테고리 라벨 매핑
const specialItemLabels = {
    yeomyeong: '[여명]',
    chilheuk: '[칠흑]',
    absolab: '[앱솔]',
    arcane: '[아케인]',
    eternal: '[에테르넬]',
    gwanghwi: '[광휘]',
    exceptional: '[익셉셔널]'
};

// DB 보스 데이터로 출력 텍스트 생성
function formatBossContent(bossName, entryLevel, displayDiff, diffData) {
    const phases = diffData.phases;
    const rewards = diffData.rewards;
    const hasPhaseSpecificInfo = phases.some(p => p.monsterLevel || p.authenticForce || p.shield);
    const isSinglePhase = phases.length === 1;

    // === 정보 섹션 ===
    let info = `<${bossName}(${displayDiff}) 정보>\n\n`;
    info += `입장 가능 레벨: ${entryLevel}\n\n`;

    if (isSinglePhase) {
        // 단일 페이즈: 공통 정보 + 체력을 한 블록으로
        info += `- 단일 페이즈\n`;
        info += `몬스터 레벨: ${diffData.monsterLevel}\n`;
        if (diffData.arcaneForce) info += `아케인 포스: ${diffData.arcaneForce}\n`;
        if (diffData.authenticForce) info += `어센틱 포스: ${diffData.authenticForce}\n`;
        info += `방어율: ${diffData.defenseRate}%\n`;
        info += `체력: ${formatHp(phases[0].hp)}\n`;
        if (phases[0].shield) info += `방어막: ${formatHp(phases[0].shield)}\n`;
    } else if (hasPhaseSpecificInfo) {
        // 페이즈별 고유 정보가 있는 경우
        // 페이즈에 개별 값이 있는 항목은 공통에서 제외
        const hasPhaseMonsterLevel = phases.some(p => p.monsterLevel);
        const hasPhaseAuthForce = phases.some(p => p.authenticForce);
        info += `- 공통\n`;
        if (!hasPhaseMonsterLevel) info += `몬스터 레벨: ${diffData.monsterLevel}\n`;
        if (diffData.arcaneForce) info += `아케인 포스: ${diffData.arcaneForce}\n`;
        if (!hasPhaseAuthForce && diffData.authenticForce) info += `어센틱 포스: ${diffData.authenticForce}\n`;
        info += `방어율: ${diffData.defenseRate}%\n`;
        for (const phase of phases) {
            info += `\n- 페이즈 ${phase.phaseNumber}\n`;
            if (phase.monsterLevel) info += `  . 몬스터 레벨: ${phase.monsterLevel}\n`;
            if (phase.authenticForce) info += `  . 어센틱 포스: ${phase.authenticForce}\n`;
            if (phase.description) {
                info += `  . ${phase.description}\n`;
            } else {
                info += `  . 체력: ${formatHp(phase.hp)}\n`;
            }
            if (phase.shield) info += `  . 방어막: ${formatHp(phase.shield)}\n`;
        }
    } else {
        // 다중 페이즈: 공통 정보 + 페이즈별 체력
        info += `- 공통\n`;
        info += `몬스터 레벨: ${diffData.monsterLevel}\n`;
        if (diffData.arcaneForce) info += `아케인 포스: ${diffData.arcaneForce}\n`;
        if (diffData.authenticForce) info += `어센틱 포스: ${diffData.authenticForce}\n`;
        info += `방어율: ${diffData.defenseRate}%\n`;
        for (const phase of phases) {
            info += `\n- 페이즈 ${phase.phaseNumber}\n`;
            if (phase.description) {
                info += `${phase.description}\n`;
            } else {
                info += `체력: ${formatHp(phase.hp)}\n`;
            }
        }
    }

    info += `\n\n`;

    // === 보상 섹션 ===
    let reward = `<${bossName}(${displayDiff}) 주요 보상>\n\n`;
    reward += `결정석 가격: ${rewards.crystalPrice.toLocaleString('ko-KR')}메소\n`;
    if (rewards.solErda) reward += `솔 에르다의 기운: ${rewards.solErda}\n`;

    // 일반 아이템
    if (rewards.items && rewards.items.length > 0) {
        reward += '\n';
        for (const item of rewards.items) {
            reward += `${item}\n`;
        }
    }

    // 특수 아이템
    const specialItems = rewards.specialItems;
    let hasSpecial = false;
    if (specialItems) {
        const specialLines = [];
        for (const [category, label] of Object.entries(specialItemLabels)) {
            const itemList = specialItems[category];
            if (itemList && itemList.length > 0) {
                for (const item of itemList) {
                    specialLines.push(`${label} ${item}`);
                }
            }
        }
        if (specialLines.length > 0) {
            reward += '\n';
            reward += specialLines.join('\n');
        }
    }

    return info + reward;
}

function formatMesoPrice(amount) {
    // 숫자를 천 단위마다 콤마로 구분
    const formattedNumber = amount.toLocaleString('ko-KR');

    // 억 단위 변환
    const eok = Math.floor(amount / 100000000); // 억
    const man = Math.floor((amount % 100000000) / 10000); // 만

    let koreanFormat = '';
    if (eok > 0) {
        koreanFormat += eok + '억';
        if (man > 0) {
            koreanFormat += ' ' + man + '만';
        }
    } else if (man > 0) {
        koreanFormat += man + '만';
    }

    // 최종 출력 형태
    const result = `[결정석 가격]\n${formattedNumber}메소\n(${koreanFormat})\n\n`;

    return result;
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`GSBot running in port ${PORT}!`);
});
