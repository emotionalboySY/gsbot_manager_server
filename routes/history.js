const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const router = express.Router();
const mc = require('../utils/main_character.js');
const json = require('../utils/json.js');
const iden = require('../services/identification.js');
const time = require('../utils/time.js');

const CharacterHistory = require('../models/character_history.js');
require('dotenv').config();

const openAPIBaseUrl = "https://open.api.nexon.com/maplestory/v1";

const API_START_DATE = new Date('2023-12-21'); // API 서비스 시작일

// 넥슨 OpenAPI 한 번 호출의 상한. 이 라우트는 조회 일수만큼 순차 호출하므로
// 한 건이 무한정 매달리면 요청 전체가 봇의 재시도 예산(10초)을 넘긴다.
const NEXON_TIMEOUT_MS = 3000;

// 콜드 스캔은 병렬로 돌리되 한꺼번에 몰리지 않게 동시 호출 수를 묶는다.
// 넥슨의 호출량 초과(OPENAPI00007)를 피하면서 왕복 횟수를 줄이는 것이 목적이다.
const NEXON_CONCURRENCY = 10;

// 콜드 스캔의 격자 탐침 개수. 레벨은 시간에 대해 단조증가하므로, API 서비스
// 시작일부터 오늘까지를 이만큼으로 나눠 한 번에 조회하면 "어느 구간에 레벨업이
// 몇 번 있었는지" 가 정해진다. 그 뒤 필요한 구간만 이진탐색으로 좁힌다.
const PROBE_COUNT = 32;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

let nexonRunning = 0;
const nexonWaiters = [];

async function acquireNexonSlot() {
    while (nexonRunning >= NEXON_CONCURRENCY) {
        await new Promise((resolve) => nexonWaiters.push(resolve));
    }
    nexonRunning++;
}

function releaseNexonSlot() {
    nexonRunning--;
    const next = nexonWaiters.shift();
    if (next) next();
}

/**
 * 같은 캐릭터의 스캔이 동시에 두 번 돌지 않게 한다.
 *
 * 봇은 1.5초에 응답을 끊고 동기로 한 번 더 온다. 예전엔 그 재시도가 전체 스캔을
 * 처음부터 새로 시작해 넥슨 호출이 두 배가 됐고, 늦게 끝난 쪽이 characterName
 * 유니크 인덱스에 부딪혀 E11000 원문이 사용자에게 그대로 나갔다(실측 재현).
 * 진행 중인 작업이 있으면 그 결과를 같이 기다린다.
 */
const inFlightScans = new Map();

function once(key, fn) {
    const running = inFlightScans.get(key);
    if (running) return running;

    const promise = Promise.resolve().then(fn).finally(() => inFlightScans.delete(key));
    inFlightScans.set(key, promise);
    return promise;
}

router.get('/exp', async (req, res) => {
    const url = openAPIBaseUrl + "/character/basic";
    let { chatRoomName, talkProfileName, characterName, days } = req.query;
    const asSection = !!req.query.section;   // 합본(/히스토리)에서 소제목으로 낼지
    let date = new Date();

    // 조회 일수 파싱(기본 7일). 1 이상 정수만 허용
    let daysNum = Number.parseInt(days, 10);
    if (!Number.isFinite(daysNum) || daysNum < 1) {
        daysNum = 7;
    }

    if (!characterName) {
        characterName = await mc.getMainCharacter(chatRoomName, talkProfileName);
        if (!characterName) {
            let message = `${talkProfileName} <<< 이 톡프로필에 저장된 본캐가 없습니다. \"/본캐 [캐릭터명]\"명령어를 통해 본캐 지정을 하거나, 찾고 싶은 캐릭터 이름을 명령어 뒤에 입력해 주세요.`;
            return res.status(200).json(json.failure(message));
        }
    }

    console.log(`${time.getNowDateTime()} - 경험치히스토리(${characterName}, ${daysNum}일)`);

    date.setDate(date.getDate() - (daysNum - 1));

    let ocid = await iden.getOcid(characterName);
    if (ocid == null) {
        console.log(`${characterName} doesn't exist in API`);
        res.status(200).json(json.noOcid(characterName));
    } else {
        console.log(`${characterName} exists in API`);
        const characterClass = await iden.getCharacterClass(ocid);
        try {
            let message = ``;
            let dateString = "";
            let rateArr = [];
            let curLev = 0;
            let curLevLoaded = false;
            let expRows = [];   // 마크다운 표용 행 수집
            const title = iden.characterTitle(characterName, characterClass);
            message = asSection ? `[경험치]` : `[${title}]\n\n[경험치]`;
            for (let i = 0; i < daysNum; i++) {
                dateString = time.getDateStringForAPI(date);
                let config = {};
                let today = new Date();
                if (date.getYear() == today.getYear() && date.getMonth() == today.getMonth() && date.getDay() == today.getDay()) {
                    config = {
                        method: 'get',
                        url: url + `?ocid=${ocid}`,
                        headers: {
                            'accept': 'application/json',
                            'x-nxopen-api-key': process.env.API_KEY
                        },
                        timeout: NEXON_TIMEOUT_MS
                    };
                } else {
                    config = {
                        method: 'get',
                        url: url + `?ocid=${ocid}&date=${dateString}`,
                        headers: {
                            'accept': 'application/json',
                            'x-nxopen-api-key': process.env.API_KEY
                        },
                        timeout: NEXON_TIMEOUT_MS
                    };
                }
                if (today.getDay() - date.getDay() == 1 && (today.getHours() >= 0 && today.getHours() < 2)) {
                    message += `\n${dateString}: 현재 정보 갱신중`;
                    expRows.push({ "date": dateString, "lev": null, "exp": null, "note": "갱신중" });
                } else {
                    let response = await axios(config);
                    let basicData = response.data;
                    let lev = basicData.character_level;
                    let exp = basicData.character_exp_rate;
                    let expNum = Number(exp);
                    let levNum = Number(lev);
                    if (exp == null || lev == null) {
                        message += `\n${dateString}: 정보 없음`;
                        expRows.push({ "date": dateString, "lev": null, "exp": null, "note": "정보 없음" });
                    } else {
                        message += `\n${dateString}: Lv.${levNum} / ${expNum}%`;
                        expRows.push({ "date": dateString, "lev": levNum, "exp": expNum, "note": null });
                        if (curLev == 0) {
                            curLev = levNum;
                        }
                        let increasedExp = expNum + ((levNum - curLev) * 100);
                        rateArr.push(increasedExp);
                    }
                }
                date.setDate(date.getDate() + 1);
            }
            let levUpText = "";
            let expDiff = rateArr[rateArr.length - 1] - rateArr[0];
            if (expDiff == 0) {
                levUpText = "계산 불가(경험치 증가율 0%)";
                message += `\n\n예상 레벨업 날짜: ${levUpText}`;
            } else {
                let expDiffAvg = expDiff / rateArr.length;
                let expToLevUp = 100 - (rateArr[rateArr.length - 1] % 100);
                let dateToLevUp = expToLevUp / expDiffAvg;
                let dateToCalc = new Date();
                dateToCalc.setDate(dateToCalc.getDate() + dateToLevUp);
                levUpText = `${dateToCalc.getFullYear()}년 ${String(dateToCalc.getMonth() + 1).padStart(2, '0')}월 ${String(dateToCalc.getDate()).padStart(2, '0')}일`;
                message += `\n\n예상 레벨업 날짜: ${levUpText}`;
            }
            return res.status(200).json(json.successWithMarkdown(
                message,
                expHistoryMarkdown(title, expRows, levUpText, asSection),
                { characterName, characterClass, title }
            ));
        } catch (e) {
            // 타임아웃·연결 실패 같은 네트워크 레벨 에러에는 e.response 가 없다.
            // 예전엔 여기서 e.response.data 를 그냥 읽어 catch 자체가 TypeError 를
            // 내고 진짜 원인이 지워졌다. json.nexonAPIError 가 두 경우를 다 다룬다.
            console.error(`경험치 히스토리 조회 실패(${characterName}):`, e.response ? e.response.data : e.message);
            return res.status(200).json(json.nexonAPIError(e));
        }
    }
});

// 최적화된 라우터 (전체 기간 지원)
router.get('/level', async (req, res) => {

    let { chatRoomName, talkProfileName, characterName, limit } = req.query;
    const asSection = !!req.query.section;   // 합본(/히스토리)에서 소제목으로 낼지

    // 표시 갯수 파싱(기본 10건). "all"이면 전체 반환
    let limitNum;
    if (typeof limit === 'string' && limit.toLowerCase() === 'all') {
        limitNum = Infinity;
    } else {
        limitNum = Number.parseInt(limit, 10);
        if (!Number.isFinite(limitNum) || limitNum < 1) {
            limitNum = 10;
        }
    }
    const sliceHistory = (arr) => arr.slice(0, limitNum === Infinity ? arr.length : limitNum);

    if (!characterName) {
        characterName = await mc.getMainCharacter(chatRoomName, talkProfileName);
        if (!characterName) {
            let message = `${talkProfileName} <<< 이 프로필에 저장된 본캐가 없습니다. \"/본캐 [캐릭터명]\"명령어를 통해 본캐 지정을 하거나, 찾고 싶은 캐릭터 이름을 명령어 뒤에 입력해 주세요.`;
            return res.status(200).json(json.failure(message));
        }
    }

    console.log(`${time.getNowDateTime()} - 레벨히스토리(${characterName}, limit=${limitNum === Infinity ? 'all' : limitNum})`);

    try {
        const ocid = await iden.getOcid(characterName);
        if (ocid == null) {
            return res.status(200).json(json.noOcid(characterName));
        }

        const characterClass = await iden.getCharacterClass(ocid);

        // 스캔은 캐릭터당 하나만 돈다. 봇의 재시도가 같이 들어와도 새 스캔을
        // 시작하지 않고 진행 중인 것의 결과를 함께 받는다.
        const levHistory = await once(characterName, () => resolveLevHistory(characterName, ocid));

        return res.status(200).json(levelHistoryResponse(characterName, characterClass, sliceHistory(levHistory), asSection));
    } catch (error) {
        console.error('레벨 히스토리 조회 중 오류:', error);
        return res.status(200).json(json.failure(error.message || '레벨 히스토리를 불러오는데 실패했습니다.'));
    }
});

/**
 * DB 를 읽고, 없거나 오늘 아직 안 봤으면 채운 뒤 levHistory 를 돌려준다.
 * 캐릭터당 한 번만 돌도록 once() 를 거쳐 호출한다.
 */
async function resolveLevHistory(characterName, ocid) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const characterHistory = await findLevHistoryatDB(characterName);

    // DB 에 없거나, 있어도 이력이 비어 있으면 전체 조회한다.
    if (!characterHistory || !characterHistory.levHistory || characterHistory.levHistory.length === 0) {
        console.log('DB에 데이터 없음 - 전체 조회 시작');
        const fullHistory = await getLast10LevelUps(ocid);

        // new + save 는 같은 캐릭터가 이미 있으면 characterName 유니크 인덱스에
        // 걸려 E11000 을 낸다. upsert 로 두면 경합이 새어나가도 조용히 덮어쓴다.
        const saved = await CharacterHistory.findOneAndUpdate(
            { characterName },
            {
                characterName,
                levHistory: fullHistory.map((item) => ({
                    lev: item.level,
                    date: new Date(item.date + 'T00:00:00.000Z')
                })),
                updatedDate: today
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        console.log('DB에 저장 완료');
        return saved.levHistory;
    }

    const updatedDate = new Date(characterHistory.updatedDate);
    updatedDate.setHours(0, 0, 0, 0);

    if (differenceInDays(updatedDate, today) === 0) {
        console.log('오늘 이미 체크함 - 캐시 반환');
        return characterHistory.levHistory;
    }

    const todayData = await callCharacterAPI(ocid);
    const curLev = todayData.data.character_level;
    const lastLev = characterHistory.levHistory[0]?.lev || 0;

    if (curLev === lastLev) {
        console.log('레벨 변화 없음 - updatedDate만 업데이트');
        characterHistory.updatedDate = today;
        await characterHistory.save();
        return characterHistory.levHistory;
    }

    console.log(`레벨 변화 감지: ${lastLev} -> ${curLev}`);

    // findLevelUpsInRange 는 최신순으로 돌려준다. levHistory 도 최신순이라 그대로 앞에 붙인다.
    const newLevelUps = await findLevelUpsInRange(
        updatedDate, today, lastLev, curLev, makeLevelReader(ocid), curLev - lastLev
    );

    const newHistoryItems = newLevelUps.map((item) => ({
        lev: item.level,
        date: new Date(item.date + 'T00:00:00.000Z')
    }));

    const merged = [...newHistoryItems, ...characterHistory.levHistory];

    characterHistory.levHistory = Array.from(
        new Map(
            merged.map((item) => [
                `${item.date.toISOString().split('T')[0]}-${item.lev}`,
                item
            ])
        ).values()
    );
    characterHistory.updatedDate = today;

    await characterHistory.save();
    console.log('증분 업데이트 완료');

    return characterHistory.levHistory;
}

function differenceInDays(date1, date2) {
    return Math.floor((date2 - date1) / (1000 * 60 * 60 * 24));
}

/////////////////////////////////////////////////////////
// 레벨히스토리 조회를 위한 함수들

// 마크다운을 렌더링하는 방(오픈채팅 그룹방)용 출력.
// 표는 렌더링을 지원하지 않는 클라이언트(맥 카카오톡 등)에서 파이프가 그대로 노출돼
// 평문보다 나빠지므로 쓰지 않는다. 목록은 렌더링 여부와 무관하게 읽힌다.
// section=1 이면 합본(/히스토리)용 소제목으로 낸다.
// 합본에서 "OO의 경험치 히스토리 / OO의 레벨 히스토리" 로 이름이 두 번 나오면 어색하다.
function expHistoryMarkdown(title, rows, levUpText, asSection) {
    let md = asSection ? `### 경험치\n` : `## ${title}\n\n### 경험치\n`;
    for (const row of rows) {
        md += row.note
            ? `\n- ${row.date} — ${row.note}`
            : `\n- ${row.date} — Lv.${row.lev} / ${row.exp}%`;
    }
    md += `\n\n**예상 레벨업 날짜:** ${levUpText}`;
    return md;
}

function levHistoryRows(levHistory) {
    return levHistory.map((item) => {
        const date = item.date;
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        return { "date": `${year}-${month}-${day}`, "lev": item.lev };
    });
}

function levelHistoryMarkdown(title, levHistory, asSection) {
    let md = asSection ? `### 레벨\n` : `## ${title}\n\n### 레벨\n`;
    for (const row of levHistoryRows(levHistory)) {
        md += `\n- ${row.date} — Lv.${row.lev}`;
    }
    return md;
}

function levelHistoryResponse(characterName, characterClass, levHistory, asSection) {
    const title = iden.characterTitle(characterName, characterClass);
    const header = asSection ? `[레벨]` : `[${title}]\n\n[레벨]`;
    const plain = `${header}\n` + combineLevHistories(levHistory);
    return json.successWithMarkdown(
        plain,
        levelHistoryMarkdown(title, levHistory, asSection),
        { characterName, characterClass, title }
    );
}

function combineLevHistories(levHistory) { // levHistory를 출력용으로 텍스트 가공
    let result = "";
    // console.log(levHistory.length);
    for (let iter = 0; iter < levHistory.length; iter++) {
        // console.log(iter);
        // console.log(levHistory[iter]);
        // const dateStr = levHistory[iter].date.toISOString().split('T')[0];
        const date = levHistory[iter].date;
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        let singleLine = `\n${dateStr} - Lv.${levHistory[iter].lev}`;
        result += singleLine;
    }
    // console.log(result);

    return result;
}

async function findLevHistoryatDB(characterName) { // MongoDB에서 characterName으로 되어 있는 레이블 찾아서 데이터 가져오기
    try {
        const character = await CharacterHistory.findOne({
            characterName
        });

        if(!character) {
            // console.log('캐릭터 저장되지 않음. 새로 추가해야함');
            return null;
        }

        // console.log(`저장된 캐릭터 정보 발견: ${character.characterName}`);

        // levHistory가 비어있어도 character 객체는 반환
        // (나중에 업데이트할 수 있도록)

        return character;
    } catch (error) {
        console.log('캐릭터 DB 저장여부를 확인하는 도중 오류 발생: ', error);
        throw error;
    }
}

// API URL 생성 함수 (오늘 날짜면 date 파라미터 제외)
function buildAPIUrl(ocid, date = null) {
    const baseUrl = openAPIBaseUrl + "/character/basic";
    let url = `${baseUrl}?ocid=${ocid}`;

    if (date) {
        url += `&date=${time.getDateStringForAPI(date)}`;
    }

    return url;
}

// API 호출 함수 (오늘 날짜 처리 포함)
async function callCharacterAPI(ocid, date = null) {
    const config = {
        method: 'get',
        url: buildAPIUrl(ocid, date),
        headers: {
            'accept': 'application/json',
            'x-nxopen-api-key': process.env.API_KEY
        },
        timeout: NEXON_TIMEOUT_MS
    };

    let response;

    await acquireNexonSlot();
    try {
        response = await axios(config);
    } catch (e) {
        // axios 에러에 e.data 는 없다(e.response.data 다). 예전엔 이 줄이 TypeError 를
        // 내면서 진짜 원인을 지웠고, 안 터졌더라도 undefined 를 돌려줘 호출부가
        // todayData.data.character_level 에서 터졌다. 제대로 남기고 그대로 올려보낸다.
        console.error(`캐릭터 조회 실패(ocid=${ocid}, date=${date || '오늘'}):`, e.response ? e.response.data : e.message);
        throw e;
    } finally {
        releaseNexonSlot();
    }
    return response;
}

/**
 * 날짜 -> 레벨 조회기. 한 번의 스캔 안에서 같은 날짜를 두 번 묻지 않는다.
 * 격자 탐침이 이미 본 날짜를 이진탐색이 다시 묻는 일이 잦아 캐시가 크게 듣는다.
 * 프라미스를 담아두므로 동시에 같은 날짜를 물어도 요청은 한 번만 나간다.
 */
function makeLevelReader(ocid) {
    const cache = new Map();

    // 이 스캔이 실제로 넥슨을 몇 번 쳤는지. 전역 카운터로 재면 동시에 도는 다른
    // 캐릭터의 호출까지 섞여 들어온다(그렇게 재다가 4배로 잘못 읽었다).
    readLevel.fetches = 0;

    function readLevel(date) {
        const key = date === null ? '' : time.getDateStringForAPI(date);
        if (!cache.has(key)) {
            readLevel.fetches++;
            cache.set(
                key,
                callCharacterAPI(ocid, date === null ? null : key)
                    .then((response) => Number(response.data.character_level) || 0)
            );
        }
        return cache.get(key);
    }

    return readLevel;
}

/**
 * 최근 레벨업 이력을 찾는다. DB 에 아무것도 없을 때만 도는 콜드 경로다.
 *
 * 예전에는 오늘부터 하루·이틀·나흘… 뒤로 점프하며 레벨이 바뀐 구간을 찾고 그때마다
 * 이진탐색을 돌렸다. 전부 순차라 넥슨을 50여 회 줄줄이 치게 되고, 한 번에 150ms 씩만
 * 잡아도 9초가 걸렸다(EC2 실측 8.9~9.8초). 봇의 재시도 예산이 10초라 첫 조회는
 * 거의 매번 타임아웃이었다.
 *
 * 레벨은 시간에 대해 단조증가한다. 그래서 서비스 시작일부터 오늘까지를 PROBE_COUNT
 * 개 지점으로 나눠 한 번에 병렬 조회하면, 어느 구간에 레벨업이 몇 번 있었는지가 그
 * 자체로 정해진다. 그 뒤 필요한 구간만 이진탐색으로 좁히는데 구간끼리는 서로 독립이라
 * 이것도 동시에 돌린다.
 */
async function getLast10LevelUps(ocid, want = 10) {
    const readLevel = makeLevelReader(ocid);

    const today = startOfDay(new Date());
    const spanDays = differenceInDays(API_START_DATE, today);
    if (spanDays <= 1) return [];

    // 1) 격자 지점의 레벨을 한꺼번에 조회한다.
    const probeDates = [];
    for (let i = 0; i < PROBE_COUNT; i++) {
        const d = new Date(API_START_DATE);
        d.setDate(d.getDate() + Math.round((spanDays * i) / PROBE_COUNT));
        probeDates.push(startOfDay(d));
    }
    probeDates.push(today);

    const lastIndex = probeDates.length - 1;
    const probeLevels = await Promise.all(probeDates.map((d, i) =>
        // 마지막 지점은 오늘이라 date 파라미터 없이 현재 정보를 쓴다(전일 데이터
        // 갱신 중이면 오늘 날짜 조회가 비어 오기 때문).
        readLevel(i === lastIndex ? null : d)
    ));

    // 2) 레벨이 오른 구간만, 최신 것부터 후보로 모은다.
    const candidates = [];
    for (let i = lastIndex; i > 0; i--) {
        if (probeLevels[i] > probeLevels[i - 1]) {
            candidates.push({
                start: probeDates[i - 1],
                end: probeDates[i],
                startLev: probeLevels[i - 1],
                endLev: probeLevels[i]
            });
        }
    }

    // 3) 필요한 만큼만 좁힌다. 같은 날 여러 번 오른 레벨업은 한 건으로 접히므로
    //    구간이 약속한 수보다 적게 나올 수 있다. 모자라면 다음 구간을 더 본다.
    const levelUps = [];
    let cursor = 0;

    while (levelUps.length < want && cursor < candidates.length) {
        const batch = [];
        let expected = 0;

        while (cursor < candidates.length && expected < want - levelUps.length) {
            const candidate = candidates[cursor++];
            batch.push(candidate);
            expected += candidate.endLev - candidate.startLev;
        }

        const found = await Promise.all(batch.map((c) =>
            findLevelUpsInRange(c.start, c.end, c.startLev, c.endLev, readLevel, want - levelUps.length)
        ));

        for (const inRange of found) {
            for (const levelUp of inRange) {
                if (levelUps.length >= want) break;
                levelUps.push(levelUp);
            }
            if (levelUps.length >= want) break;
        }
    }

    console.log(`Total API calls: ${readLevel.fetches}`);
    return levelUps;
}

/**
 * 구간 안의 레벨업 날짜를 최신 것부터 최대 want 개 돌려준다.
 *
 * 하루 단위로 자른다. 예전에는 (start+end)/2 를 그대로 중간값으로 썼는데, 간격이
 * 홀수 일이면 정오가 섞이고 differenceInDays 의 floor 와 맞물려 아직 이틀 폭인
 * 구간에서 탐색이 끝나버렸다. 그러면 실제보다 하루 뒤가 답으로 나온다(넥슨에 직접
 * 물어 확인). 자정으로 맞추면 남은 폭이 정확히 하루일 때만 끝나므로 end 가 그
 * 레벨에 처음 도달한 날이 된다.
 *
 * want 를 받는 이유: 구간에 레벨업이 want 보다 훨씬 많이 들어 있을 수 있다(신규
 * 캐릭터가 한 달 만에 200 레벨을 올린 경우 등). 그때 전부 열거하면 쓰지도 않을
 * 날짜를 찾느라 호출이 폭증한다(실측 최대 247회). 필요한 수보다 많이 든 구간은
 * 새쪽 절반부터 순서대로 파고들어 want 개를 채우면 멈춘다. 반대로 구간이 want
 * 이하로 작으면 어차피 다 봐야 하므로 양쪽을 동시에 돌린다.
 */
async function findLevelUpsInRange(start, end, startLev, endLev, readLevel, want) {
    if (want <= 0 || endLev <= startLev) return [];

    const startDay = startOfDay(start);
    const endDay = startOfDay(end);
    const gapDays = Math.round((endDay.getTime() - startDay.getTime()) / MS_PER_DAY);

    if (gapDays <= 1) {
        return [{ date: time.getDateStringForAPI(endDay), level: endLev }];
    }

    const midDate = new Date(startDay.getTime() + Math.floor(gapDays / 2) * MS_PER_DAY);
    const midLev = await readLevel(midDate);

    if (endLev - startLev <= want) {
        // 다 봐야 하는 구간이면 좌·우가 서로 기다릴 이유가 없다.
        const [newer, older] = await Promise.all([
            findLevelUpsInRange(midDate, end, midLev, endLev, readLevel, want),
            findLevelUpsInRange(start, midDate, startLev, midLev, readLevel, want)
        ]);
        return [...newer, ...older];
    }

    // 새쪽(오른쪽)이 먼저다. 채워지면 옛쪽은 보지 않는다.
    const newer = await findLevelUpsInRange(midDate, end, midLev, endLev, readLevel, want);
    if (newer.length >= want) return newer;

    const older = await findLevelUpsInRange(start, midDate, startLev, midLev, readLevel, want - newer.length);
    return [...newer, ...older];
}

// 끝
/////////////////////////////////////////////////////////

module.exports = router;