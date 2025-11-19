const express = require('express');
const puppeteer = require('puppeteer');
const axios = require('axios');
const cheerio = require('cheerio');
const querystring = require('querystring');
const cors = require('cors');
require('dotenv').config();
const mongoose = require("mongoose");
const http = require('http');
require('moment-timezone');

var moment = require('moment');
moment.tz.setDefault("Asia/Seoul");

const app = express();

// express 미들웨어 추가
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

process.env.TZ='Asia/Seoul';
const server = http.createServer(app);

app.use(cors());

const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error'));
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

const expAmount = [
    {lev: 200, exp: 2207026470},
    {lev: 201, exp: 2471869646},
    {lev: 202, exp: 2768494003},
    {lev: 203, exp: 3100713283},
    {lev: 204, exp: 3472798876},
    {lev: 205, exp: 3889534741},
    {lev: 206, exp: 4356278909},
    {lev: 207, exp: 4879032378},
    {lev: 208, exp: 5464516263},
    {lev: 209, exp: 6120258214},
    {lev: 210, exp: 7956335678},
    {lev: 211, exp: 8831532602},
    {lev: 212, exp: 9803001188},
    {lev: 213, exp: 10881331318},
    {lev: 214, exp: 12078277762},
    {lev: 215, exp: 15701761090},
    {lev: 216, exp: 17114919588},
    {lev: 217, exp: 18655262350},
    {lev: 218, exp: 20334235961},
    {lev: 219, exp: 22164317197},
    {lev: 220, exp: 28813612356},
    {lev: 221, exp: 30830565220},
    {lev: 222, exp: 32988704785},
    {lev: 223, exp: 35297914119},
    {lev: 224, exp: 37768768107},
    {lev: 225, exp: 49099398539},
    {lev: 226, exp: 52536356436},
    {lev: 227, exp: 56213901386},
    {lev: 228, exp: 60148874483},
    {lev: 229, exp: 64359295696},
    {lev: 230, exp: 83667084404},
    {lev: 231, exp: 86177096936},
    {lev: 232, exp: 88762409844},
    {lev: 233, exp: 91425282139},
    {lev: 234, exp: 94168040603},
    {lev: 235, exp: 122418452783},
    {lev: 236, exp: 126091006366},
    {lev: 237, exp: 129873736556},
    {lev: 238, exp: 133769948652},
    {lev: 239, exp: 137783047111},
    {lev: 240, exp: 179117961244},
    {lev: 241, exp: 184491500081},
    {lev: 242, exp: 190026245083},
    {lev: 243, exp: 195727032435},
    {lev: 244, exp: 201598843408},
    {lev: 245, exp: 262078496430},
    {lev: 246, exp: 269940851322},
    {lev: 247, exp: 278039076861},
    {lev: 248, exp: 286380249166},
    {lev: 249, exp: 294971656640},
    {lev: 250, exp: 442457484960},
    {lev: 251, exp: 455731209508},
    {lev: 252, exp: 469403145793},
    {lev: 253, exp: 483485240166},
    {lev: 254, exp: 497989797370},
    {lev: 255, exp: 512929491291},
    {lev: 256, exp: 528317376029},
    {lev: 257, exp: 544166897309},
    {lev: 258, exp: 560491904228},
    {lev: 259, exp: 577306661354},
    {lev: 260, exp: 1731919984062},
    {lev: 261, exp: 1749239183902},
    {lev: 262, exp: 1766731575741},
    {lev: 263, exp: 1784398891498},
    {lev: 264, exp: 1802242880412},
    {lev: 265, exp: 2342915744535},
    {lev: 266, exp: 2366344901980},
    {lev: 267, exp: 2390008350999},
    {lev: 268, exp: 2413908434508},
    {lev: 269, exp: 2438047518853},
    {lev: 270, exp: 5412465491853},
    {lev: 271, exp: 5466590146771},
    {lev: 272, exp: 5521256048238},
    {lev: 273, exp: 5576468608720},
    {lev: 274, exp: 5632233294807},
    {lev: 275, exp: 11377111255510},
    {lev: 276, exp: 12514822381061},
    {lev: 277, exp: 13766304619167},
    {lev: 278, exp: 15142935081083},
    {lev: 279, exp: 16657228589191},
    {lev: 280, exp: 33647601750165},
    {lev: 281, exp: 37012361925181},
    {lev: 282, exp: 40713598117699},
    {lev: 283, exp: 44784957929468},
    {lev: 284, exp: 49263453722414},
    {lev: 285, exp: 99512176519276},
    {lev: 286, exp: 109463394171203},
    {lev: 287, exp: 120409733588323},
    {lev: 288, exp: 132450706947155},
    {lev: 289, exp: 145695777641870},
    {lev: 290, exp: 294305470836577},
    {lev: 291, exp: 323736017920234},
    {lev: 292, exp: 356109619712257},
    {lev: 293, exp: 391720581683482},
    {lev: 294, exp: 430892639851830},
    {lev: 295, exp: 870403132500696},
    {lev: 296, exp: 957443445750765},
    {lev: 297, exp: 1053187790325841},
    {lev: 298, exp: 1158506569358425},
    {lev: 299, exp: 1737759854037637},
];

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

const hexaEvalStep = {
    "스킬 코어": {
        "master": {
            "sol": 145,
            "crack": 4400
        },
        "sol": [0, 1, 1, 1, 2, 2, 2, 3, 3, 10, 3, 3, 4, 4, 4, 4, 4, 4, 5, 15, 5, 5, 5, 5, 5, 6, 6, 6, 7, 20],
        "crack": [0, 30, 35, 40, 45, 50, 55, 60, 65, 200, 80, 90, 100, 110, 120, 130, 140, 150, 160, 350, 170, 180, 190, 200, 210, 220, 230, 240, 250, 500]
    },
    "마스터리 코어": {
        "master": {
            "sol": 83,
            "crack": 2252
        },
        "sol": [3, 1, 1, 1, 1, 1, 1, 2, 2, 5, 2, 2, 2, 2, 2, 2, 2, 2, 3, 8, 3, 3, 3, 3, 3, 3, 3, 3, 4, 10],
        "crack": [50, 15, 18, 20, 23, 25, 28, 30, 33, 100, 40, 45, 50, 55, 60, 65, 70, 75, 80, 175, 85, 90, 95, 100, 105, 110, 115, 120, 125, 250]
    },
    "강화 코어": {
        "master": {
            "sol": 123,
            "crack": 3383
        },
        "sol": [4, 1, 1, 1, 2, 2, 2, 3, 3, 8, 3, 3, 3, 3, 3, 3, 3, 3, 4, 12, 4, 4, 4, 4, 4, 5, 5, 5, 6, 15],
        "crack": [75, 23, 27, 30, 34, 38, 42, 45, 49, 150, 60, 68, 75, 83, 90, 98, 105, 113, 120, 263, 128, 135, 143, 150, 158, 165, 173, 180, 188, 375]
    },
    "공용 코어": {
        "master": {
            "sol": 208,
            "crack": 6268
        },
        "sol": [7, 2, 2, 2, 3, 3, 3, 5, 5, 14, 5, 5, 6, 6, 6, 6, 6, 6, 7, 17, 7, 7, 7, 7, 7, 9, 9, 9, 10, 20],
        "crack": [125, 38, 44, 50, 57, 63, 69, 75, 82, 300, 110, 124, 138, 152, 165, 179, 193, 207, 220, 525, 234, 248, 262, 275, 289, 303, 317, 330, 344, 750]
    }
};

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


app.get('/boss/:diff/:name', (req, res) => {
    let {diff, name} = req.params;
    let success = false;
    let content = '';
    let now = new Date();
    console.log(`${getNowDateTime()} - 보스(${diff}, ${name})`);

    const diffList = ['이지', '노멀', '노말', '하드', '카오스', '익스트림', '익스'];
    if (diffList.includes(diff)) {
        success = true;
        switch (name) {
            case '가디언엔젤슬라임':
            case '가엔슬':
                switch (diff) {
                    case '노말':
                    case '노멀':
                        content =
                            '<가디언 엔젤 슬라임(노멀) 정보>\n\n입장 가능 레벨: 215\n\n- 단일 페이즈\n몬스터 레벨: 220\n체력: 5조\n방어율: 300%\n\n\n';
                        content =
                            content +
                            '<가디언 엔젤 슬라임(노멀) 주요 보상>\n\n결정석 가격: 47,800,000메소\n\n[여명] 가디언 엔젤 링\n녹옥의 보스 반지 상자(하급)';
                        break;
                    case '하드':
                    case '카오스':
                        content =
                            '<가디언 엔젤 슬라임(카오스) 정보>\n\n입장 가능 레벨: 215\n\n- 단일 페이즈\n몬스터 레벨: 250\n체력: 90조\n방어율: 300%\n\n\n';
                        content =
                            content +
                            '<가디언 엔젤 슬라임(카오스) 주요 보상>\n\n결정석 가격: 161,000,000메소\n\n솔 에르다의 기운: 70\n[여명] 가디언 엔젤 링\n흑옥의 보스 반지 상자(상급)';
                        break;
                }
                break;

            case '스우':
                switch (diff) {
                    case '노말':
                    case '노멀':
                        content =
                            '<스우(노멀) 정보>\n\n입장 가능 레벨: 190\n\n- 공통\n몬스터 레벨: 210\n방어율: 300%\n\n- 페이즈 1\n체력: 4,700억\n\n- 페이즈 2\n체력: 4,700억\n\n- 페이즈 3\n체력: 6,300억\n\n\n';
                        content =
                            content +
                            '<스우(노멀) 주요 보상>\n\n결정석 가격: 31,400,000메소\n\n특수형 에너지 코어(S급): 1~3개\n녹옥의 보스 반지 상자 (하급)';
                        break;
                    case '하드':
                    case '카오스':
                        content =
                            '<스우(하드) 정보>\n\n입장 가능 레벨: 190\n\n- 공통\n몬스터 레벨: 210\n방어율: 300%\n\n- 페이즈 1\n체력: 10조\n\n- 페이즈 2\n체력: 10조\n\n- 페이즈 3\n체력: 13.5조\n\n\n';
                        content =
                            content +
                            '<스우(하드) 주요 보상>\n\n결정석 가격: 119,000,000메소\n\n특수형 에너지 코어(S급): 2~4개\n스우로이드\n솔 에르다의 기운: 50\n\n[앱솔] 앱솔랩스 장비 상자\n[칠흑] 루즈 컨트롤 머신 마크\n[칠흑] 손상된 블랙 하트\n홍옥의 보스 반지 상자 (중급)';
                        break;
                    case '익스':
                    case '익스트림':
                        content =
                            '<스우(익스트림) 정보>\n\n입장 가능 레벨: 190\n\n- 공통\n몬스터 레벨: 285\n방어율: 380%\n\n- 페이즈 1\n체력: 545조\n- 방어막: 2.7조\n\n- 페이즈 2\n체력: 545조\n\n- 페이즈 3\n체력: 720조\n\n\n';
                        content =
                            content +
                            '<스우(익스트림) 주요 보상>\n\n결정석 가격: 392,000,000메소\n\n섬멸병기 스우로이드\n솔 에르다의 기운: 280\n\n[칠흑] 컴플리트 언더컨트롤\n[칠흑] 루즈 컨트롤 머신 마크\n[칠흑] 손상된 블랙 하트\n백옥의 보스 반지 상자 (최상급)';
                        break;
                }
                break;

            case '데미안':
            case '데먄':
                switch (diff) {
                    case '노말':
                    case '노멀':
                        content =
                            '<데미안(노멀) 정보>\n\n입장 가능 레벨: 190\n\n- 공통\n몬스터 레벨: 210\n방어율: 300%\n\n- 페이즈 1\n체력: 8,400억\n\n- 페이즈 2\n체력: 3,600억\n\n\n';
                        content =
                            content +
                            '<데미안(노멀) 주요 보상>\n\n결정석 가격: 32,900,000메소\n\n뒤틀린 낙인의 영혼석: 1~3개\n루인 포스실드\n녹옥의 보스 반지 상자 (하급)';
                        break;
                    case '하드':
                    case '카오스':
                        content =
                            '<데미안(하드) 정보>\n\n입장 가능 레벨: 190\n\n- 공통\n몬스터 레벨: 210\n방어율: 300%\n\n- 페이즈 1\n체력: 25.2조\n\n- 페이즈 2\n체력: 10.8조\n\n\n';
                        content =
                            content +
                            '<데미안(하드) 주요 보상>\n\n결정석 가격: 113,000,000메소\n\n뒤틀린 낙인의 영혼석: 2~4개\n데미안로이드\n루인 포스실드\n솔 에르다의 기운: 50\n\n[앱솔] 앱솔랩스 장비 상자\n[칠흑]마력이 깃든 안대\n홍옥의 보스 반지 상자 (중급)';
                        break;
                }
                break;

            case '루시드':
            case '루시':
                switch (diff) {
                    case '이지':
                        content =
                            '<루시드(이지) 정보>\n\n입장 가능 레벨: 220\n\n- 공통\n몬스터 레벨: 230\n아케인 포스: 360\n방어율: 300%\n\n- 페이즈 1\n체력: 6조\n\n- 페이즈 2\n체력: 6조\n\n\n';
                        content =
                            content +
                            '<루시드(이지) 주요 보상>\n\n결정석 가격: 49,000,000메소\n\n녹옥의 보스 반지 상자 (하급)';
                        break;
                    case '노말':
                    case '노멀':
                        content =
                            '<루시드(노멀) 정보>\n\n입장 가능 레벨: 220\n\n- 공통\n몬스터 레벨: 230\n아케인 포스: 360\n방어율: 300%\n\n- 페이즈 1\n체력: 12조\n\n- 페이즈 2\n체력: 12조\n\n\n';
                        content =
                            content +
                            '<루시드(노멀) 주요 보상>\n\n결정석 가격: 58,600,000메소\n\n[아케인(재료)] 나비날개 물방울석: 1~2개\n[여명]트와일라이트 마크\n녹옥의 보스 반지 상자 (하급)';
                        break;
                    case '하드':
                    case '카오스':
                        content =
                            '<루시드(하드) 정보>\n\n입장 가능 레벨: 220\n\n- 공통\n몬스터 레벨: 230\n아케인 포스: 360\n방어율: 300%\n\n- 페이즈 1\n체력: 50.8조\n\n- 페이즈 2\n체력: 54조\n\n- 페이즈 3\n체력: 12.8조\n\n\n';
                        content =
                            content +
                            '<루시드(하드) 주요 보상>\n\n결정석 가격: 135,000,000메소\n\n루시드로이드\n솔 에르다의 기운: 50\n\n[아케인(재료)] 나비날개 물방울석: 2~3개\n[아케인] 아케인셰이드 장비 상자\n[여명] 트와일라이트 마크\n[칠흑] 몽환의 벨트\n홍옥의 보스 반지 상자 (중급)';
                        break;
                }
                break;

            case '윌':
                switch (diff) {
                    case '이지':
                        content =
                            '<윌(이지) 정보>\n\n입장 가능 레벨: 235\n\n- 공통\n몬스터 레벨: 235\n아케인 포스: 560\n방어율: 300%\n\n- 페이즈 1\n체력: 5.6조\n\n- 페이즈 2\n체력: 4.2조\n\n- 페이즈 3\n체력: 7조\n\n\n';
                        content =
                            content +
                            '<윌(이지) 주요 보상>\n\n결정석 가격: 53,100,000메소\n\n녹옥의 보스 반지 상자 (하급)';
                        break;
                    case '노말':
                    case '노멀':
                        content =
                            '<윌(노멀) 정보>\n\n입장 가능 레벨: 235\n\n- 공통\n몬스터 레벨: 250\n아케인 포스: 760\n방어율: 300%\n\n- 페이즈 1\n체력: 8.4조\n\n- 페이즈 2\n체력: 6.3조\n\n- 페이즈 3\n체력: 10.5조\n\n\n';
                        content =
                            content +
                            '<윌(노멀) 주요 보상>\n\n결정석 가격: 67,600,000메소\n\n[아케인(재료)] 코브웹 물방울석: 1~2개\n[여명] 트와일라이트 마크\n녹옥의 보스 반지 상자 (하급)';
                        break;
                    case '하드':
                    case '카오스':
                        content =
                            '<윌(하드) 정보>\n\n입장 가능 레벨: 235\n\n- 공통\n몬스터 레벨: 250\n아케인 포스: 760\n방어율: 300%\n\n- 페이즈 1\n체력: 42조\n\n- 페이즈 2\n체력: 31.5조\n\n- 페이즈 3\n체력: 52.5조\n\n\n';
                        content =
                            content +
                            '<윌(하드) 주요 보상>\n\n결정석 가격: 165,000,000메소\n\n거울 세계의 코어 젬스톤: 1개\n솔 에르다의 기운: 50\n\n[아케인(재료)] 코브웹 물방울석: 2~3개\n[아케인] 아케인셰이드 장비 상자\n[여명] 트와일라이트 마크\n[칠흑] 저주받은 마도서 교환권\n홍옥의 보스 반지 상자 (중급)';
                        break;
                }
                break;

            case '더스크':
                switch (diff) {
                    case '노말':
                    case '노멀':
                        content =
                            '<거대 괴수 더스크(노멀) 정보>\n\n입장 가능 레벨: 245\n\n- 단일 페이즈\n몬스터 레벨: 255\n아케인 포스: 730\n방어율: 300%\n체력: 25.5조\n\n\n';
                        content =
                            content +
                            '<거대 괴수 더스크(노멀) 주요 보상>\n\n결정석 가격: 72,400,000메소\n\n염원의 불꽃: 14개\n\n[여명] 에스텔라 이어링\n녹옥의 보스 반지 상자 (하급)';
                        break;
                    case '하드':
                    case '카오스':
                        content =
                            '<거대 괴수 더스크(카오스) 정보>\n\n입장 가능 레벨: 245\n\n- 단일 페이즈\n몬스터 레벨: 255\n아케인 포스: 730\n방어율: 300%\n체력: 127.5조\n\n\n';
                        content =
                            content +
                            '<거대 괴수 더스크(카오스) 주요 보상>\n\n결정석 가격: 150,000,000메소\n\n염원의 불꽃: 14개\n솔 에르다의 기운: 100\n\n[아케인] 아케인셰이드 장비 상자\n[여명] 에스텔라 이어링\n[칠흑] 거대한 공포\n흑옥의 보스 반지 상자 (상급)';
                        break;
                }
                break;

            case '듄켈':
                switch (diff) {
                    case '노말':
                    case '노멀':
                        content =
                            '<친위대장 듄켈(노멀) 정보>\n\n입장 가능 레벨: 255\n\n- 단일 페이즈\n몬스터 레벨: 265\n아케인 포스: 850\n방어율: 300%\n체력: 26조\n\n\n';
                        content =
                            content +
                            '<친위대장 듄켈(노멀) 주요 보상>\n\n결정석 가격: 78,100,000메소\n\n염원의 불꽃: 16개\n\n[여명] 에스텔라 이어링\n녹옥의 보스 반지 상자 (하급)';
                        break;
                    case '하드':
                    case '카오스':
                        content =
                            '<친위대장 듄켈(하드) 정보>\n\n입장 가능 레벨: 255\n\n- 단일 페이즈\n몬스터 레벨: 265\n아케인 포스: 850\n방어율: 300%\n체력: 157.5조\n\n\n';
                        content =
                            content +
                            '<친위대장 듄켈(하드) 주요 보상>\n\n결정석 가격: 177,000,000메소\n\n염원의 불꽃: 14개\n솔 에르다의 기운: 120\n\n[아케인] 아케인셰이드 장비 상자\n[여명]에스텔라 이어링\n[칠흑]커맨더 포스 이어링\n흑옥의 보스 반지 상자 (상급)';
                        break;
                }
                break;

            case '진힐라':
            case '지닐라':
                switch (diff) {
                    case '노말':
                    case '노멀':
                        content =
                            '<진 힐라(노멀) 정보>\n\n입장 가능 레벨: 250\n\n- 공통\n몬스터 레벨: 250\n아케인 포스: 820\n방어율: 300%\n\n- 페이즈 1\n체력: 22조\n\n- 페이즈 2\n체력: 22조\n\n- 페이즈 3\n체력: 22조\n\n- 페이즈 4\n체력: 22조\n\n\n';
                        content =
                            content +
                            '<진 힐라(노멀) 주요 보상>\n\n결정석 가격: 153,000,000메소\n\n솔 에르다의 기운: 70\n\n[아케인] 아케인셰이드 장비 상자\n[여명] 데이브레이크 펜던트\n홍옥의 보스 반지 상자 (중급)';
                        break;
                    case '하드':
                    case '카오스':
                        content =
                            '<진 힐라(하드) 정보>\n\n입장 가능 레벨: 250\n\n- 공통\n몬스터 레벨: 250\n아케인 포스: 900\n방어율: 300%\n\n- 페이즈 1\n체력: 44조\n\n- 페이즈 2\n체력: 44조\n\n- 페이즈 3\n체력: 44조\n\n- 페이즈 4\n체력: 44조\n\n\n';
                        content =
                            content +
                            '<진 힐라(하드) 주요 보상>\n\n결정석 가격: 200,000,000메소\n\n어두운 힘의 기운: 3개\n솔 에르다의 기운: 120\n\n[아케인] 아케인셰이드 장비 상자\n[여명] 데이브레이크 펜던트\n[칠흑] 고통의 근원\n흑옥의 보스 반지 상자 (상급)';
                        break;
                }
                break;

            case '선택받은세렌':
            case '세렌':
                switch (diff) {
                    case '노말':
                    case '노멀':
                        content =
                            '<선택받은 세렌(노멀) 정보>\n\n- 입장 가능 레벨: 260\n- 몬스터 레벨: 270\n- 방어율: 380%\n\n[페이즈 별 포스 및 체력]\n- 페이즈 1\n  . 어센틱 포스: 150\n  . 체력: 52.5조\n- 페이즈 2\n  . 어센틱 포스: 200\n  . 체력: 155.4조\n\n';
                        content = content + formatMesoPrice(295000000) + '[주요 보상]\n- 솔 에르다의 기운: 150\n- 미트라의 코어 젬스톤\n- 흑옥의 보스 반지 상자 (상급)\n- [여명] 데이브레이크 펜던트';
                        break;
                    case '하드':
                    case '카오스':
                        content =
                            '<선택받은 세렌(하드) 정보>\n\n- 입장 가능 레벨: 260\n- 몬스터 레벨: 275\n- 방어율: 380%\n\n[페이즈 별 포스 및 체력]\n- 페이즈 1\n  . 어센틱 포스: 150\n  . 체력: 126조\n- 페이즈 2\n  . 어센틱 포스: 200\n  . 체력: 357조\n\n';
                        content = content + formatMesoPrice(440000000) + '[주요 보상]\n- 솔 에르다의 기운: 220\n- 미트라의 코어 젬스톤\n- 백옥의 보스 반지 상자 (최상급)\n- [여명] 데이브레이크 펜던트\n- [칠흑] 미트라의 분노';
                        break;
                    case '익스트림':
                    case '익스':
                        content =
                            '<선택받은 세렌(익스트림) 정보>\n\n- 입장 가능 레벨: 260\n- 방어율: 380%\n\n[페이즈 별 정보]\n- 페이즈 1\n- 몬스터 레벨: 275\n  . 어센틱 포스: 150\n  . 체력: 1,320조\n- 페이즈 2\n- 몬스터 레벨: 280\n  . 어센틱 포스: 200\n  . 체력: 5,160조\n\n';
                        content = content + formatMesoPrice(2420000000) + '[주요 보상]\n- 솔 에르다의 기운: 560\n- 미트라의 코어 젬스톤\n- 백옥의 보스 반지 상자 (최상급)\n- [여명] 데이브레이크 펜던트\n- [칠흑] 미트라의 분노\n- [익셉셔널] 익셉셔널 해머(얼굴장식)';
                        break;
                }
                break;

            case '검은마법사':
            case '검마':
                switch (diff) {
                    case '하드':
                    case '카오스':
                        content =
                            '<검은 마법사(하드) 정보>\n\n- 입장 가능 레벨: 255\n\n아케인 포스: 1320\n방어율: 300%\n\n[페이즈 별 정보]\n- 페이즈 1\n  . 체력: 63조\n  . 방어막: 7,500억\n  . 몬스터 레벨: 265\n- 페이즈 2\n  . 체력: 115.5조\n  . 방어막: 2.2조\n  . 몬스터 레벨: 275\n- 페이즈 3\n  . 체력: 157.5조\n  . 방어막: 3.5조\n  . 몬스터 레벨: 275\n- 페이즈 4\n  . 체력: 136.5조\n  . 방어막: 3조\n  . 몬스터 레벨: 275\n\n';
                        content = content + formatMesoPrice(1000000000) + '[주요 보상]\n- 솔 에르다의 기운: 300\n- (해방) 어둠의 흔적: 600\n- 백옥의 보스 반지 상자 (최상급)\n- [칠흑] 창세의 뱃지';
                        break;
                    case '익스트림':
                    case '익스':
                        content =
                            '<검은 마법사(익스트림) 정보>\n\n- 입장 가능 레벨: 255\n아케인 포스: 1320\n방어율: 300%\n\n[페이즈 별 정보]\n- 페이즈 1\n  . 몬스터 레벨: 275\n  . 체력: 1,180조\n  . 방어막: 42조\n- 페이즈 2\n  . 몬스터 레벨: 280\n  . 체력: 1,191조\n  . 방어막: 42조\n- 페이즈 3\n  . 몬스터 레벨: 280\n  . 체력: 1,285조\n  . 방어막: 60조\n- 페이즈 4\n  . 몬스터 레벨: 280\n  . 체력: 1,155조\n  . 방어막: 52조\n\n';
                        content = content + formatMesoPrice(9200000000) + '[주요 보상]\n- 솔 에르다의 기운: 600\n- (해방) 어둠의 흔적: 600\n- 백옥의 보스 반지 상자 (최상급)\n- [칠흑] 창세의 뱃지\n- [익셉셔널] 익셉셔널 해머(벨트)';
                        break;
                }
                break;

            case '칼로스':
                switch (diff) {
                    case '이지':
                        content =
                            '<감시자 칼로스(이지) 정보>\n\n- 입장 가능 레벨: 265\n- 몬스터 레벨: 270\n- 어센틱 포스: 200\n- 방어율: 330%\n\n[페이즈 별 체력과 방어율]\n- 페이즈 1\n  . 체력: 94조 5,000억\n  . 방어율: 330%\n- 페이즈 2\n  . 체력: 262조 5,000억\n  . 방어율: 380%\n\n';
                        content = content + formatMesoPrice(345000000) + '[주요 보상]\n- 솔 에르다의 기운: 200\n- 백옥의 보스 반지 상자 (최상급)';
                        break;
                    case '노말':
                    case '노멀':
                        content =
                            '<감시자 칼로스(노멀) 정보>\n\n- 입장 가능 레벨: 265\n- 어센틱 포스: 200\n\n[페이즈 별 정보]\n- 페이즈 1\n  . 체력: 336조\n  . 방어율: 330%\n  . 몬스터 레벨: 275\n- 페이즈 2\n  . 체력: 720조\n  . 방어율: 380%\n  . 몬스터 레벨: 280\n\n';
                        content = content + formatMesoPrice(510000000) + '[주요 보상]\n- 솔 에르다의 기운: 250\n- 니키로이드\n- 백옥의 보스 반지 상자 (최상급)\n- 생명의 연마석\n- [에테르넬] 남겨진 칼로스의 의지 조각(공통): 3개';
                        break;
                    case '하드':
                    case '카오스':
                        content =
                            '<감시자 칼로스(카오스) 정보>\n\n- 입장 가능 레벨: 265\n- 몬스터 레벨: 285\n- 어센틱 포스: 330\n- 방어율: 380%\n\n[페이즈 별 체력]\n- 페이즈 1: 1,066조\n- 페이즈 2: 4,016조\n\n';
                        content = content + formatMesoPrice(1120000000) + '[주요 보상]\n- 솔 에르다의 기운: 400\n- 니키로이드\n- 생명의 보스 반지 상자\n- 생명의 연마석\n- [에테르넬] 남겨진 칼로스의 의지(공통): 5개\n- [에테르넬] 의지의 에테르넬 방어구 상자';
                        break;
                    case '익스트림':
                    case '익스':
                        content =
                            '<감시자 칼로스(익스트림) 정보>\n\n- 입장 가능 레벨: 265\n- 몬스터 레벨: 285\n- 어센틱 포스: 440\n- 방어율: 380%\n\n[페이즈 별 체력]\n- 페이즈 1: 5,970조\n- 페이즈 2: 1경 5,498조\n\n';
                        content = content + formatMesoPrice(2700000000) + '[주요 보상]\n- 솔 에르다의 기운: 700\n- 니키로이드\n- 생명의 보스 반지 상자\n- 생명의 연마석\n- [에테르넬] 남겨진 칼로스의 의지(공통): 14개\n- [에테르넬] 의지의 에테르넬 방어구 상자\n- [익셉셔널] 익셉셔널 해머(눈장식)';
                        break;
                }
                break;

            case '카링':
                switch (diff) {
                    case '이지':
                        content =
                            '<카링(이지) 정보>\n\n- 입장 가능 레벨: 275\n- 몬스터 레벨: 275\n- 어센틱 포스: 230\n- 방어율: 380%\n\n[페이즈 별 체력]\n- 페이즈 1\n  . 궁기, 도올, 혼돈: 각 96조\n- 페이즈 2\n  . 카링: 105조\n- 페이즈 3\n  . 궁기, 도올, 혼돈: 각 126조\n  . 카링: 150조\n\n';
                        content = content + formatMesoPrice(381000000) + '[주요 보상]\n- 솔 에르다의 기운: 200\n- 백옥의 보스 반지 상자 (최상급)\n- [에테르넬] 뒤엉킨 흉수의 고리 조각(공통): 1개';
                        break;
                    case '노말':
                    case '노멀':
                        content =
                            '<카링(노멀) 정보>\n\n- 입장 가능 레벨: 275\n- 몬스터 레벨: 285\n- 어센틱 포스: 330\n- 방어율: 380%\n\n[페이즈 별 체력]\n- 페이즈 1\n  . 궁기, 도올, 혼돈: 각 400조\n- 페이즈 2\n  . 카링: 468조\n- 페이즈 3\n  . 궁기, 도올, 혼돈: 각 512조\n  . 카링: 722조\n\n';
                        content = content + formatMesoPrice(595000000) + '[주요 보상]\n- 솔 에르다의 기운: 300\n- 카링로이드\n- 백옥의 보스 반지 상자 (최상급)\n- 생명의 연마석\n- [에테르넬] 뒤엉킨 흉수의 고리(공통): 5개\n- [칠흑] 혼돈의 칠흑 장신구 상자';
                        break;
                    case '하드':
                    case '카오스':
                        content =
                            '<카링(하드) 정보>\n\n- 입장 가능 레벨: 275\n- 몬스터 레벨: 285\n- 어센틱 포스: 350\n- 방어율: 380%\n\n[페이즈 별 체력]\n- 페이즈 1\n  . 궁기, 도올, 혼돈: 각 920조\n- 페이즈 2\n  . 카링: 1,404조\n- 페이즈 3\n  . 궁기, 도올, 혼돈: 각 1,827조\n  . 카링 2,446조\n\n';
                        content = content + formatMesoPrice(1310000000) + '[주요 보상]\n- 솔 에르다의 기운: 500\n- 카링로이드\n- 생명의 보스 반지 상자\n- 신념의 연마석\n- [에테르넬] 뒤엉킨 흉수의 고리(공통): 7개\n- [에테르넬] 흉수의 에테르넬 방어구 상자\n- [칠흑] 혼돈의 칠흑 장신구 상자';
                        break;
                    case '익스트림':
                    case '익스':
                        content =
                            '<카링(익스트림) 정보>\n\n- 입장 가능 레벨: 275\n- 몬스터 레벨: 285\n- 어센틱 포스: 480\n- 방어율: 380%\n\n[페이즈 별 체력]\n- 페이즈 1\n  . 궁기, 도올, 혼돈: 각 6,063조\n- 페이즈 2\n  . 카링: 6,930조\n- 페이즈 3\n  . 궁기, 도올, 혼돈: 각 6,930조\n  . 카링 8,662조\n\n';
                        content = content + formatMesoPrice(3150000000) + '[주요 보상]\n- 솔 에르다의 기운: 800\n- 카링로이드\n- 생명의 보스 반지 상자\n- 신념의 연마석\n- [에테르넬] 뒤엉킨 흉수의 고리(공통): 18개\n- [에테르넬] 흉수의 에테르넬 방어구 상자\n- [칠흑] 혼돈의 칠흑 장신구 상자\n- [익셉셔널] 익셉셔널 해머(귀고리)';
                        break;
                }
                break;

            case '림보':
                switch (diff) {
                    case '노말':
                    case '노멀':
                        content =
                            '<림보(노멀) 정보>\n\n- 입장 가능 레벨: 285\n- 몬스터 레벨: 285\n- 어센틱 포스: 500\n- 방어율: 정보 없음\n\n[페이즈 별 체력]\n- 페이즈 1\n  . 스펙터 A, 스펙터 B: 합 1,944조\n- 페이즈 2\n  . 스펙터 C, 스펙터 D: 합 972조\n- 페이즈 3\n  . 진리에 도달한 림보 - 흑+백: 합 2,592조\n\n';
                        content = content + formatMesoPrice(900000000) + '[주요 보상]\n- 솔 에르다의 기운: 400\n- 림보로이드\n- 생명의 보스 반지 상자\n- 신념의 연마석\n- [에테르넬] 왜곡된 욕망의 결정: 1개\n- [칠흑] 혼돈의 칠흑 장신구 상자';
                        break;
                    case '하드':
                    case '카오스':
                        content =
                            '<림보(하드) 정보>\n\n- 입장 가능 레벨: 285\n- 몬스터 레벨: 285\n- 어센틱 포스: 500\n- 방어율: 정보 없음\n\n[페이즈 별 체력]\n- 페이즈 1\n  . 스펙터 A, 스펙터 B: 합 3,774조\n- 페이즈 2\n  . 스펙터 C, 스펙터 D: 합 1,887조\n- 페이즈 3\n  . 진리에 도달한 림보 - 흑+백: 합 4,884조\n\n';
                        content =content + formatMesoPrice(1930000000) + '[주요 보상]\n- 솔 에르다의 기운: 550\n- 림보로이드\n- 생명의 보스 반지 상자\n- 신념의 연마석\n- [에테르넬] 왜곡된 욕망의 결정: 2개\n- [에테르넬] 욕망의 에테르넬 방어구 상자\n- [칠흑] 혼돈의 칠흑 장신구 상자\n- [광휘] 근원의 속삭임';
                        break;
                }
                break;

            case '발드릭스':
            case '발드':
                switch (diff) {
                    case '노말':
                    case '노멀':
                        content =
                            '<발드릭스(노멀) 정보>\n\n- 입장 가능 레벨: 290\n- 몬스터 레벨: 290\n- 어센틱 포스: 700\n- 방어율: 정보 없음\n\n[페이즈 별 체력]\n- 페이즈 1\n  . 본체, 하수인, 사념: 합 2,379조\n- 페이즈 2\n  . 정면, 우측면, 좌측면: 합 2,531조\n- 페이즈 3: 4,145조\n\n';
                        content = content + formatMesoPrice(1200000000) + '[주요 보상]\n- 솔 에르다의 기운: 450\n- 발드릭스로이드\n- 생명의 보스 반지 상자\n- 신념의 연마석\n- [에테르넬] 영원한 충성의 흔적: 1개\n- [칠흑] 혼돈의 칠흑 장신구 상자';
                        break;
                    case '하드':
                    case '카오스':
                        content =
                            '<발드릭스(하드) 정보>\n\n- 입장 가능 레벨: 290\n- 몬스터 레벨: 290\n- 어센틱 포스: 700\n- 방어율: 정보 없음\n\n[페이즈 별 체력]\n- 페이즈 1\n  . 본체, 하수인, 사념: 합 5,344조\n- 페이즈 2\n  . 스펙터 C, 스펙터 D: 합 5,684조\n- 페이즈 3: 합 9,309조\n\n';
                        content = content + formatMesoPrice(2160000000) + '[주요 보상]\n- 솔 에르다의 기운: 650\n- 발드릭스로이드\n- 생명의 보스 반지 상자\n- 신념의 연마석\n- [에테르넬] 영원한 충성의 흔적: 2개\n- [에테르넬] 맹세의 에테르넬 방어구 상자\n- [칠흑] 혼돈의 칠흑 장신구 상자\n- [광휘]: 죽음의 맹세';
                        break;
                }
                break;

            case '쌀숭이':
            case '최초의 대적자':
            case '대적자':
            case '최초의대적자':
                switch(diff) {
                    case '이지':
                        content = '<최초의 대적자(이지) 정보>\n\n- 입장 가능 레벨: 270\n- 몬스터 레벨: 270\n- 방어율: 380%\n\n[페이즈 별 체력]\n- 페이즈 1: 171조\n- 페이즈 2: 171조\n- 페이즈 3: 228조\n\n';
                        content = content + formatMesoPrice(361000000) + '[주요 보상]\n- 솔 에르다의 기운: 200\n- 백옥의 보스 반지 상자 (최상급)';
                        break;
                    case '노말':
                    case '노멀':
                        content = '<최초의 대적자(노멀) 정보>\n\n- 입장 가능 레벨: 270\n- 몬스터 레벨: 285\n- 방어율: 380%\n\n[페이즈 별 체력]\n- 페이즈 1: 495조\n- 페이즈 2: 495조\n- 페이즈 3: 660조\n\n';
                        content = content + formatMesoPrice(530000000) + '[주요 보상]\n- 솔 에르다의 기운: 280\n- 대적자로이드\n- 백옥의 보스 반지 상자 (최상급)\n- 생명의 연마석\n- [에테르넬] 이어진 고대의 결의 조각: 4개';
                        break;
                    case '하드':
                    case '카오스':
                        content = '<최초의 대적자(하드) 정보>\n\n- 입장 가능 레벨: 270\n- 몬스터 레벨: 280\n- 방어율: 380%\n\n[페이즈 별 체력]\n- 페이즈 1: 3,135조\n- 페이즈 2: 3,135조\n- 페이즈 3: 4,180조\n\n';
                        content = content + formatMesoPrice(1260000000) + '[주요 보상]\n- 솔 에르다의 기운: 450\n- 대적자로이드\n- 생명의 보스 반지 상자\n- 생명의 연마석\n- [에테르넬] 이어진 고대의 결의 조각: 6개\n- [에테르넬] 고대의 에테르넬 방어구 상자\n- [광휘] 불멸의 유산';
                        break;
                    case '익스트림':
                    case '익스':
                        content = '<최초의 대적자(하드) 정보>\n\n- 입장 가능 레벨: 270\n- 몬스터 레벨: 290\n- 방어율: 380%\n\n[페이즈 별 체력]\n- 페이즈 1: 9,655조\n- 페이즈 2: 9,655조\n- 페이즈 3: 1경 2,870조\n\n';
                        content = content + formatMesoPrice(2920000000) + '[주요 보상]\n- 솔 에르다의 기운: 750\n- 대적자로이드\n- 생명의 보스 반지 상자\n- 생명의 연마석\n- [에테르넬] 이어진 고대의 결의 조각: 16개\n- [에테르넬] 고대의 에테르넬 방어구 상자\n- [광휘] 불멸의 유산\n- [익셉셔널] 익셉셔널 해머(훈장)';
                        break;
                }
                break;

            default:
                success = false;
                content =
                    name +
                    '\n보스명을 잘못 입력하셨습니다. 보스 명령어는 아래의 규칙에 따라 작성하셔야 합니다.\n\n<보스 명령어 사용 방법>\n"/보스(ㅄ or ㅂㅅ) [난이도] [보스명]"\n\n[난이도]: 카오스 / 하드 / 노말 / 노멀 / 이지 / 익스트림 / 익스\n[보스명]: 띄어쓰기를 포함하지 않은 보스명(ex. 가디언 엔젤 슬라임 -> 가디언엔젤슬라임 or 가엔슬)';

                break;
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
    console.log(`${getNowDateTime()} - 심볼1(${start}, ${goal})`);

    let result = {};
    let message = '';

    if (start < 1 || start > 19 || goal < 2 || goal > 20 || start >= goal) {
        result = {
            success: false,
            reault: encodeURIComponent(
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
    console.log(`${getNowDateTime()} - 심볼2(${symbolType}, ${curLev}, ${curAmount}, ${goalLev})`);

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
    console.log(`${getNowDateTime()} - 랜덤채널`);
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
        console.log(`${getNowDateTime()} - 익성비(${curLev}, ${iteration})`);

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

app.get('/seedRing/:mode/:iteration', async (req, res) => {
    try {
        const mode = Number(req.params.mode);
        const iteration = Number(req.params.iteration);
        console.log(`${getNowDateTime()} - 시드링(${mode}, ${iteration})`);

        let result = {};

        if (iteration > 1000) {
            let message = '특수 스킬 반지 시뮬레이션은 최대 1,000회까지만 가능합니다.';
            result = {
                success: false,
                result: encodeURIComponent(message),
            };
        } else {
            let ring_list = [
                {
                    index: 0,
                    cumulativeProb: [0.0211268, 0.0692308, 0.125, 0.1428571],
                    name: '리스트레인트 링',
                    time: [0, 0, 0, 0, 0],
                },
                {
                    index: 1,
                    cumulativeProb: [0.0422536, 0.1384616, 0.125, 0.2857142],
                    name: '컨티뉴어스 링',
                    time: [0, 0, 0, 0, 0],
                },
                {
                    index: 2,
                    cumulativeProb: [0.0704226, 0.2000001, 0.3333333, 0.3650793],
                    name: '웨폰퍼프 - S링',
                    time: [0, 0, 0, 0, 0],
                },
                {
                    index: 3,
                    cumulativeProb: [0.0985916, 0.2615386, 0.4166666, 0.4444444],
                    name: '웨폰퍼프 - I링',
                    time: [0, 0, 0, 0, 0],
                },
                {
                    index: 4,
                    cumulativeProb: [0.1267606, 0.3230771, 0.4999999, 0.5238095],
                    name: '웨폰퍼프 - L링',
                    time: [0, 0, 0, 0, 0],
                },
                {
                    index: 5,
                    cumulativeProb: [0.1549296, 0.3846156, 0.5833332, 0.6031746],
                    name: '웨폰퍼프 - D링',
                    time: [0, 0, 0, 0, 0],
                },
                {
                    index: 6,
                    cumulativeProb: [0.1830986, 0.4461541, 0.6666665, 0.6825397],
                    name: '얼티메이덤 링',
                    time: [0, 0, 0, 0, 0],
                },
                {
                    index: 7,
                    cumulativeProb: [0.2112676, 0.5076926, 0.7499998, 0.7619048],
                    name: '리스크테이커 링',
                    time: [0, 0, 0, 0, 0],
                },
                {
                    index: 8,
                    cumulativeProb: [0.2394366, 0.5692311, 0.8333331, 0.8412699],
                    name: '링 오브 썸',
                    time: [0, 0, 0, 0, 0],
                },
                {
                    index: 9,
                    cumulativeProb: [0.2676056, 0.6307696, 0.9166664, 0.920635],
                    name: '크리데미지 링',
                    time: [0, 0, 0, 0, 0],
                },
                {
                    index: 10,
                    cumulativeProb: [0.2957746, 0.6923081, 1, 1],
                    name: '크라이시스 - HM링',
                    time: [0, 0, 0, 0, 0],
                },
                {
                    index: 11,
                    cumulativeProb: [0.3309859, 0.7076927, 0, 0],
                    name: '버든리프트 링',
                    time: [0, 0, 0, 0, 0],
                },
                {
                    index: 12,
                    cumulativeProb: [0.3661972, 0.7230773, 0, 0],
                    name: '오버패스 링',
                    time: [0, 0, 0, 0, 0],
                },
                {
                    index: 13,
                    cumulativeProb: [0.4014085, 0.7384619, 0, 0],
                    name: '레벨퍼프 - S링',
                    time: [0, 0, 0, 0, 0],
                },
                {
                    index: 14,
                    cumulativeProb: [0.4366198, 0.7538465, 0, 0],
                    name: '레벨퍼프 - I링',
                    time: [0, 0, 0, 0, 0],
                },
                {
                    index: 15,
                    cumulativeProb: [0.4718311, 0.7692311, 0, 0],
                    name: '레벨퍼프 - L링',
                    time: [0, 0, 0, 0, 0],
                },
                {
                    index: 16,
                    cumulativeProb: [0.5070424, 0.7846157, 0, 0],
                    name: '레벨퍼프 - D링',
                    time: [0, 0, 0, 0, 0],
                },
                {
                    index: 17,
                    cumulativeProb: [0.5422537, 0.8000003, 0, 0],
                    name: '헬스컷 링',
                    time: [0, 0, 0, 0, 0],
                },
                {
                    index: 18,
                    cumulativeProb: [0.577465, 0.8153849, 0, 0],
                    name: '크리디펜스 링',
                    time: [0, 0, 0, 0, 0],
                },
                {
                    index: 19,
                    cumulativeProb: [0.6126763, 0.8307695, 0, 0],
                    name: '리밋 링',
                    time: [0, 0, 0, 0, 0],
                },
                {
                    index: 20,
                    cumulativeProb: [0.6478876, 0.8461541, 0, 0],
                    name: '듀라빌리티 링',
                    time: [0, 0, 0, 0, 0],
                },
                {
                    index: 21,
                    cumulativeProb: [0.6830989, 0.8615387, 0, 0],
                    name: '리커버디펜스 링',
                    time: [0, 0, 0, 0, 0],
                },
                {
                    index: 22,
                    cumulativeProb: [0.7183102, 0.8769233, 0, 0],
                    name: '실드스와프 링',
                    time: [0, 0, 0, 0, 0],
                },
                {
                    index: 23,
                    cumulativeProb: [0.7535215, 0.8923079, 0, 0],
                    name: '마나컷 링',
                    time: [0, 0, 0, 0, 0],
                },
                {
                    index: 24,
                    cumulativeProb: [0.7887328, 0.9076925, 0, 0],
                    name: '크라이시스 - H링',
                    time: [0, 0, 0, 0, 0],
                },
                {
                    index: 25,
                    cumulativeProb: [0.8239441, 0.9230771, 0, 0],
                    name: '크라이시스 - M링',
                    time: [0, 0, 0, 0, 0],
                },
                {
                    index: 26,
                    cumulativeProb: [0.8591554, 0.9384617, 0, 0],
                    name: '크리쉬프트 링',
                    time: [0, 0, 0, 0, 0],
                },
                {
                    index: 27,
                    cumulativeProb: [0.8943667, 0.9538463, 0, 0],
                    name: '스탠스쉬프트 링',
                    time: [0, 0, 0, 0, 0],
                },
                {
                    index: 28,
                    cumulativeProb: [0.929578, 0.9692309, 0, 0],
                    name: '리커버스탠스 링',
                    time: [0, 0, 0, 0, 0],
                },
                {
                    index: 29,
                    cumulativeProb: [0.9647893, 0.9846155, 0, 0],
                    name: '스위프트 링',
                    time: [0, 0, 0, 0, 0],
                },
                {
                    index: 30,
                    cumulativeProb: [1, 1, 0, 0],
                    name: '리플렉티브 링',
                    time: [0, 0, 0, 0, 0],
                },
            ];

            let level_list = [
                {index: 0, cumulativeProb: [0.5, 0.4, 0.25, 0]},
                {index: 1, cumulativeProb: [0.91, 0.7, 0.5, 0]},
                {index: 2, cumulativeProb: [1, 0.9, 0.8, 0.65]},
                {index: 3, cumulativeProb: [0, 1, 1, 1]},
            ];
            let randomLevel;

            for (let i = 0; i < iteration; i++) {
                let pick = Math.random();
                let ringPick = Math.random();

                for (let i = 0; i < level_list.length; i++) {
                    if (pick < level_list[i].cumulativeProb[mode]) {
                        randomLevel = level_list[i].index + 1;
                        break;
                    }
                }

                for (const probConfig of ring_list) {
                    if (ringPick < probConfig.cumulativeProb[mode]) {
                        ring_list[probConfig.index].time[randomLevel]++;
                        break;
                    }
                }
            }

            let iteration_locale = AddComma(iteration);
            let ringLabel = '';

            switch (mode) {
                case 0:
                    ringLabel = '녹옥';
                    break;
                case 1:
                    ringLabel = '홍옥';
                    break;
                case 2:
                    ringLabel = '흑옥';
                    break;
                case 3:
                    ringLabel = '백옥';
                    break;
                default:
                    break;
            }

            let message = `<${ringLabel}의 보스 반지 상자 시뮬레이션 결과>\n시도 횟수: ${iteration_locale}회\n\n`;

            for (const ringData of ring_list) {
                for (let i = 1; i <= 4; i++) {
                    if (ringData.time[i] != 0) {
                        message += `${ringData.name} ${i}레벨: ${ringData.time[i]}회\n`;
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

app.get('/sunday', async (req, res) => {
    console.log(`${getNowDateTime()} - 썬데이메이플`);
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
    let date = new Date();
    let dateString = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate() - 1}`;

    console.log(`${getNowDateTime()} - 하이퍼스탯(${characterName}, ${presetNum})`);

    let ocid = await getOcid(characterName);
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
    let date = new Date();
    date.setDate(date.getDate() - 1);
    let dateString = getDateString(date);

    console.log(`${getNowDateTime()} - 성향(${characterName})`);

    let ocid = await getOcid(characterName);
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
            if (e.response == !undefined) {
                console.error(e.response);
                res.status(200).json({
                    success: false,
                    result: e.response
                });
            } else {
                console.error(e);
                res.status(200).json({
                    success: false,
                    result: e
                });
            }
        }
    }
});

app.get('/ability/:characterName', async (req, res) => {
    const url = openAPIBaseUrl + "/character/ability";
    const characterName = req.params.characterName;
    let date = new Date();
    date.setDate(date.getDate() - 1)
    let dateString = getDateString(date);

    console.log(`${getNowDateTime()} - 어빌리티(${characterName})`);

    let ocid = await getOcid(characterName);
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
            if (e.response == !undefined) {
                console.error(e.response);
                res.status(200).json({
                    success: false,
                    result: e.response
                });
            } else {
                console.error(e);
                res.status(200).json({
                    success: false,
                    result: e
                });
            }
        }
    }
});

app.get('/popularity/:characterName', async (req, res) => {
    const url = openAPIBaseUrl + "/character/popularity";
    const characterName = req.params.characterName;
    let date = new Date();
    date.setDate(date.getDate() - 1);
    let dateString = `${getDateString(date)}`;

    console.log(`${getNowDateTime()} - 인기도(${characterName})`);

    let ocid = await getOcid(characterName);
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
            if (e.response == !undefined) {
                console.error(e.response);
                res.status(200).json({
                    success: false,
                    result: e.response
                });
            } else {
                console.error(e);
                res.status(200).json({
                    success: false,
                    result: e
                });
            }
        }
    }
});

app.get('/fightingPower/:characterName', async (req, res) => {
    const url = openAPIBaseUrl + "/character/stat";
    const characterName = req.params.characterName;
    let date = new Date();
    date.setDate(date.getDate() - 1);
    let dateString = getDateString(date);

    console.log(`${getNowDateTime()} - 전투력(${characterName})`);

    let ocid = await getOcid(characterName);
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
            if (e.response == !undefined) {
                console.error(e.response);
                res.status(200).json({
                    success: false,
                    result: e.response
                });
            } else {
                console.error(e);
                res.status(200).json({
                    success: false,
                    result: e
                });
            }
        }
    }
});

app.get('/hexaStat/:characterName', async (req, res) => {
    const url = openAPIBaseUrl + "/character/hexamatrix-stat";
    const characterName = req.params.characterName;
    let date = new Date();
    date.setDate(date.getDate() - 1);
    let dateString = getDateString(date);

    console.log(`${getNowDateTime()} - 헥사스탯(${characterName})`);

    let ocid = await getOcid(characterName);
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

            var json = successJSON(true, message);

            res.status(200).json(json);
        } catch (e) {
            if (e.response == !undefined) {
                console.error(e.response);
                res.status(200).json({
                    success: false,
                    result: e.response
                });
            } else {
                console.error(e);
                res.status(200).json({
                    success: false,
                    result: e
                });
            }
        }
    }
});

app.get("/union/:characterName", async (req, res) => {
    const url = openAPIBaseUrl + "/user/union";
    const characterName = req.params.characterName;
    let date = new Date();
    date.setDate(date.getDate() - 1);
    let dateString = getDateString(date);

    console.log(`${getNowDateTime()} - 유니온(${characterName})`);

    let ocid = await getOcid(characterName);
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

            var json = successJSON(true, message);

            res.status(200).json(json);
        } catch (e) {
            if (e.response == !undefined) {
                console.error(e.response);
                res.status(200).json({
                    success: false,
                    result: e.response
                });
            } else {
                console.error(e);
                res.status(200).json({
                    success: false,
                    result: e
                });
            }
        }
    }
});

// app.get("/info_six/:characterName", async (req, res) => {
//     const url = openAPIBaseUrl + "/character/hexamatrix";
//     const characterName = req.params.characterName;
//     let date = new Date();
//     date.setDate(date.getDate() - 1);
//     let dateString = getDateString(date);
//
//     console.log(`${getNowDateTime()} - HEXA강화(${characterName})`);
//
//     let ocid = await getOcid(characterName);
//     if (ocid == null) {
//         console.log(`${characterName} doesn't exist`);
//
//         res.status(200).json(noOcidJSON(characterName));
//     } else {
//         console.log(`${characterName} exist`);
//         try {
//             const config = {
//                 method: 'get',
//                 url: url + `?ocid=${ocid}`,
//                 headers: {
//                     'accept': 'application/json',
//                     'x-nxopen-api-key': process.env.API_KEY
//                 },
//             };
//             let response = await axios(config);
//             let hexaData = response.data;
//             let hexaCoreArr = hexaData.character_hexa_core_equipment;
//             let hexaCoreRes = {
//                 "스킬 코어": [],
//                 "마스터리 코어": [],
//                 "강화 코어": [],
//                 "공용 코어": []
//             };
//
//             const coreRequirements = {
//                 "스킬 코어": { sol: 150, crack: 4500 },
//                 "마스터리 코어": { sol: 83, crack: 2252 },
//                 "강화 코어": { sol: 123, crack: 3383 },
//                 "공용 코어": { sol: 208, crack: 6268 }
//             };
//
//             const coreCounts = {
//                 "스킬 코어": 0,
//                 "마스터리 코어": 0,
//                 "강화 코어": 0,
//                 "공용 코어": 0
//             };
//
//             let usedSols = 0;
//             let usedCracks = 0;
//             let usedSolsForPublic = 0;
//             let usedCracksForPublic = 0;
//             for(let singleCore of hexaCoreArr) {
//                 let name = singleCore.hexa_core_name;
//                 let lev = Number(singleCore.hexa_core_level);
//                 let evalStep = hexaEvalStep[singleCore.hexa_core_type];
//
//                 let data = {
//                     "name": name,
//                     "lev": lev
//                 };
//                 hexaCoreRes[singleCore.hexa_core_type].push(data);
//
//                 for(let i = 0; i < lev; i++) {
//                     if(singleCore.hexa_core_type == "공용 코어") {
//                         usedSolsForPublic += evalStep["sol"][i];
//                         usedCracksForPublic += evalStep["crack"][i];
//                     }
//                     else {
//                         usedSols += evalStep["sol"][i];
//                         usedCracks += evalStep["crack"][i];
//                     }
//                 }
//             }
//             let solRatio = Number(((usedSols / 969) * 100).toFixed(3));
//             let crackRatio = Number(((usedCracks / 26940) * 100).toFixed(3));
//             let solPublicRatio = Number(((usedSolsForPublic / 208) * 100).toFixed(3));
//             let crackPublicRatio = Number(((usedCracksForPublic / 6268) * 100).toFixed(3));
//
//             let message = `[${characterName}의 HEXA강화]`;
//
//             for(let key in hexaCoreRes) {
//                 message += `\n\n- ${key} -`;
//                 for(let singleData of hexaCoreRes[key]) {
//                     // console.log(singleData["name"]);
//                     // message += `\n${truncateText(singleData["name"])} : Lv.${singleData["lev"]}`;
//                     message += `\n[Lv.${singleData["lev"]}] ${truncateText(singleData["name"])}`;
//                 }
//             }
//
//             message += `\n\n[HEXA강화 진척도(공용코어 제외)]\n- 솔 에르다: ${AddComma(usedSols)}개/${AddComma(969)}개(${solRatio}%)`;
//             message += `\n- 조각: ${AddComma(usedCracks)}개/${AddComma(26940)}개(${crackRatio}%)`;
//             message += `\n\n[HEXA강화 진척도(공용코어)]\n- 솔 에르다: ${AddComma(usedSolsForPublic)}개/${AddComma(208)}개(${solPublicRatio}%)`;
//             message += `\n- 조각: ${AddComma(usedCracksForPublic)}개/${AddComma(6268)}개(${crackPublicRatio}%)`;
//
//             var json = successJSON(true, message);
//
//             res.status(200).json(json);
//         } catch (e) {
//             if (e.response == !undefined) {
//                 console.error(e.response);
//                 res.status(200).json({
//                     success: false,
//                     result: e.response
//                 });
//             } else {
//                 console.error(e);
//                 res.status(200).json({
//                     success: false,
//                     result: e
//                 });
//             }
//         }
//     }
// });

app.get("/info_six/:characterName", async (req, res) => {
    const url = openAPIBaseUrl + "/character/hexamatrix";
    const characterName = req.params.characterName;
    let date = new Date();
    date.setDate(date.getDate() - 1);
    let dateString = getDateString(date);

    console.log(`${getNowDateTime()} - HEXA강화(${characterName})`);

    let ocid = await getOcid(characterName);
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
            let hexaCoreArr = hexaData.character_hexa_core_equipment;
            let hexaCoreRes = {
                "스킬 코어": [],
                "마스터리 코어": [],
                "강화 코어": [],
                "공용 코어": []
            };

            // 코어별 만렙 필요 자원 정의
            const coreRequirements = {
                "스킬 코어": { sol: 150, crack: 4500 },
                "마스터리 코어": { sol: 83, crack: 2252 },
                "강화 코어": { sol: 123, crack: 3383 },
                "공용 코어": { sol: 208, crack: 6268 }
            };

            // 현재 개방 가능한 최대 코어 개수 (수동 관리)
            const maxCoreSlots = {
                "스킬 코어": 2,      // 현재 개방 가능한 스킬 코어 슬롯 수
                "마스터리 코어": 4,   // 현재 개방 가능한 마스터리 코어 슬롯 수
                "강화 코어": 4,      // 현재 개방 가능한 강화 코어 슬롯 수
                "공용 코어": 1       // 현재 개방 가능한 공용 코어 슬롯 수
            };

            // 코어별 개수 카운트
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

            for(let singleCore of hexaCoreArr) {
                let name = singleCore.hexa_core_name;
                let lev = Number(singleCore.hexa_core_level);
                let evalStep = hexaEvalStep[singleCore.hexa_core_type];

                let data = {
                    "name": name,
                    "lev": lev
                };
                hexaCoreRes[singleCore.hexa_core_type].push(data);

                // 코어 개수 카운트
                coreCounts[singleCore.hexa_core_type]++;

                for(let i = 0; i < lev; i++) {
                    if(singleCore.hexa_core_type == "공용 코어") {
                        usedSolsForPublic += evalStep["sol"][i];
                        usedCracksForPublic += evalStep["crack"][i];
                    }
                    else {
                        usedSols += evalStep["sol"][i];
                        usedCracks += evalStep["crack"][i];
                    }
                }
            }

            // 전체 필요 자원 동적 계산 (최대 슬롯 기준)
            let totalRequiredSols = 0;
            let totalRequiredCracks = 0;
            let totalRequiredSolsForPublic = 0;
            let totalRequiredCracksForPublic = 0;

            // 일반 코어들 (스킬, 마스터리, 강화) - 최대 슬롯 수 기준
            for(let coreType of ["스킬 코어", "마스터리 코어", "강화 코어"]) {
                totalRequiredSols += maxCoreSlots[coreType] * coreRequirements[coreType].sol;
                totalRequiredCracks += maxCoreSlots[coreType] * coreRequirements[coreType].crack;
            }

            // 공용 코어 - 최대 슬롯 수 기준
            totalRequiredSolsForPublic = maxCoreSlots["공용 코어"] * coreRequirements["공용 코어"].sol;
            totalRequiredCracksForPublic = maxCoreSlots["공용 코어"] * coreRequirements["공용 코어"].crack;

            let solRatio = Number(((usedSols / totalRequiredSols) * 100).toFixed(3));
            let crackRatio = Number(((usedCracks / totalRequiredCracks) * 100).toFixed(3));
            let solPublicRatio = Number(((usedSolsForPublic / totalRequiredSolsForPublic) * 100).toFixed(3));
            let crackPublicRatio = Number(((usedCracksForPublic / totalRequiredCracksForPublic) * 100).toFixed(3));

            let message = `[${characterName}의 HEXA강화]`;

            for(let key in hexaCoreRes) {
                message += `\n\n- ${key} (${coreCounts[key]}/${maxCoreSlots[key]}개) -`;
                for(let singleData of hexaCoreRes[key]) {
                    message += `\n[Lv.${singleData["lev"]}] ${truncateText(singleData["name"])}`;
                }
            }

            message += `\n\n[HEXA강화 진척도(공용코어 제외)]\n- 솔 에르다: ${AddComma(usedSols)}개/${AddComma(totalRequiredSols)}개(${solRatio}%)`;
            message += `\n- 조각: ${AddComma(usedCracks)}개/${AddComma(totalRequiredCracks)}개(${crackRatio}%)`;

            if (maxCoreSlots["공용 코어"] > 0) {
                message += `\n\n[HEXA강화 진척도(공용코어)]\n- 솔 에르다: ${AddComma(usedSolsForPublic)}개/${AddComma(totalRequiredSolsForPublic)}개(${solPublicRatio}%)`;
                message += `\n- 조각: ${AddComma(usedCracksForPublic)}개/${AddComma(totalRequiredCracksForPublic)}개(${crackPublicRatio}%)`;
            }

            var json = successJSON(true, message);

            res.status(200).json(json);
        } catch (e) {
            if (e.response == !undefined) {
                console.error(e.response);
                res.status(200).json({
                    success: false,
                    result: e.response
                });
            } else {
                console.error(e);
                res.status(200).json({
                    success: false,
                    result: e
                });
            }
        }
    }
});

app.get("/exp_coupon/:type/:lev/:ratio/:expCoupons", async (req, res) => {

    const { type, lev, ratio, expCoupons } = req.params;
    const date = new Date();
    console.log(`${getNowDateTime()} - exp쿠폰(${type}, ${lev}, ${ratio}, ${expCoupons})`);

    try {
        let typeIndex = Number(type);
        if(typeIndex != 1 && typeIndex != 2) {
            let message = `EXP쿠폰의 종류를 정확히 입력해주세요.\n\n일반 EXP 쿠폰: 1\n상급 EXP 쿠폰: 2`;
            let json = successJSON(false, message);
            res.status(200).json(json);
        }
        else {
            let curLev = Number(lev);
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

                var json = successJSON(true, message);

                res.status(200).json(json);
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
    let date = new Date();
    date.setDate(date.getDate() - 1);
    let dateString = getDateString(date);

    console.log(`${getNowDateTime()} - 캐릭터정보(${characterName})`);

    let ocid = await getOcid(characterName);
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

            var json = successJSON(true, message);

            return res.status(200).json(json);
        } catch (e) {
            if (e.response == !undefined) {
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

    let ocid = await getOcid(characterName);
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
                dateString = getDateString(date);
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
            if (e.response == !undefined) {
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


async function getOcid(characterName) {
    let date = new Date();
    if(date.getHours() == 0) {
        return null;
    }
    else {
        try {
            let url = openAPIBaseUrl + `/id?character_name=${encodeURIComponent(characterName)}`;

            const config = {
                method: 'get',
                url: url,
                headers: {
                    'accept': 'application/json',
                    'x-nxopen-api-key': process.env.API_KEY
                },
            };

            let response = await axios(config);
            return response.data.ocid;
        } catch (e) {
            return null;
        }
    }
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

function successJSON(success, result) {
    var json = {
        success: success,
        result: encodeURIComponent(result),
        resultRaw: result
    }

    return json;
}

function getDateString(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getKorDateString(date) {
    return `${date.getFullYear()}년 ${String(date.getMonth() + 1).padStart(2, '0')} ${String(date.getDate()).padStart(2, '0')}일`;
}

function getKorDateStringAndTime(dateString, typeNum) {
    const date = new Date(dateString);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    if(typeNum == 1) return `${year}년 ${month}월 ${day}일 ${hours}시 ${minutes}분`;
    else return `${year}-${month}-${day} ${hours}:${minutes}`;
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

function getNowDateTime() {
    let now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
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
