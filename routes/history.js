const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const router = express.Router();
const mc = require('../utils/main_character.js');
const taj = require('../utils/time_and_json.js');
const iden = require('../services/identification.js');
const time = require('../utils/time.js');

const CharacterHistory = require('../models/character_history.js');
require('dotenv').config();

const openAPIBaseUrl = "https://open.api.nexon.com/maplestory/v1";

const API_START_DATE = new Date('2023-12-21'); // API 서비스 시작일

router.get('/exp', async (req, res) => {
    const url = openAPIBaseUrl + "/character/basic";
    let { chatRoomName, talkProfileName, characterName } = req.query;
    let date = new Date();

    if (!characterName) {
        characterName = await mc.getMainCharacter(chatRoomName, talkProfileName);
        if (!characterName) {
            let message = `${talkProfileName} <<< 이 톡프로필에 저장된 본캐가 없습니다. \"/본캐 [캐릭터명]\"명령어를 통해 본캐 지정을 하거나, 찾고 싶은 캐릭터 이름을 명령어 뒤에 입력해 주세요.`;
            return res.status(200).json(taj.successJSON(false, message));
        }
    }

    console.log(`${time.getNowDateTime()} - 경험치히스토리(${characterName})`);

    date.setDate(date.getDate() - 6);

    let ocid = await iden.getOcid(characterName);
    if (ocid == null) {
        console.log(`${characterName} doesn't exist in API`);
        res.status(200).json(taj.noOcidJSON(characterName));
    } else {
        console.log(`${characterName} exists in API`);
        try {
            let message = ``;
            let dateString = "";
            let rateArr = [];
            let curLev = 0;
            let curLevLoaded = false;
            message = `[${characterName}의 경험치 히스토리]`;
            for (let i = 0; i < 7; i++) {
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
                        }
                    };
                } else {
                    config = {
                        method: 'get',
                        url: url + `?ocid=${ocid}&date=${dateString}`,
                        headers: {
                            'accept': 'application/json',
                            'x-nxopen-api-key': process.env.API_KEY
                        },
                    };
                }
                if (today.getDay() - date.getDay() == 1 && (today.getHours() >= 0 && today.getHours() < 2)) {
                    message += `\n${dateString}: 현재 정보 갱신중`;
                } else {
                    let response = await axios(config);
                    let basicData = response.data;
                    let lev = basicData.character_level;
                    let exp = basicData.character_exp_rate;
                    let expNum = Number(exp);
                    let levNum = Number(lev);
                    if (exp == null || lev == null) {
                        message += `\n${dateString}: 정보 없음`;
                    } else {
                        message += `\n${dateString}: Lv.${levNum} / ${expNum}%`;
                        if (curLev == 0) {
                            curLev = levNum;
                        }
                        let increasedExp = expNum + ((levNum - curLev) * 100);
                        rateArr.push(increasedExp);
                    }
                }
                date.setDate(date.getDate() + 1);
            }
            let today = new Date();
            if (today.getHours() == 0 || today.getHours() == 1) {
                message += `\n\n매일 오전 0시부터 오전 02시까지는 Nexon OpenAPI 데이터 갱신작업으로 전일 데이터 조회가 불가능합니다. 모든 데이터를 조회하려면 02시 이후에 다시 시도해 주세요.`;
            }
            let expDiff = rateArr[rateArr.length - 1] - rateArr[0];
            if (expDiff == 0) {
                message += `\n\n예상 레벨업 날짜: 계산 불가(경험치 증가율 0%)`;
            } else {
                let expDiffAvg = expDiff / rateArr.length;
                let expToLevUp = 100 - (rateArr[rateArr.length - 1] % 100);
                let dateToLevUp = expToLevUp / expDiffAvg;
                let dateToCalc = new Date();
                dateToCalc.setDate(dateToCalc.getDate() + dateToLevUp);
                let dateToCalcStr = `\n\n예상 레벨업 날짜: ${dateToCalc.getFullYear()}년 ${String(dateToCalc.getMonth() + 1).padStart(2, '0')}월 ${String(dateToCalc.getDate()).padStart(2, '0')}일`;
                message += dateToCalcStr;
            }
            return res.status(200).json(taj.successJSON(true, message));
        } catch (e) {
            console.error(e.response.data.error);
            let message = `name: ${e.response.data.error.name}\nmessage: ${e.response.data.error.message}`;
            return res.status(200).json(taj.successJSON(false, message));
        }
    }
});

// 최적화된 라우터 (전체 기간 지원)
router.get('/level', async (req, res) => {

    let { chatRoomName, talkProfileName, characterName } = req.query;

    if (!characterName) {
        characterName = await mc.getMainCharacter(chatRoomName, talkProfileName);
        if (!characterName) {
            let message = `${talkProfileName} <<< 이 프로필에 저장된 본캐가 없습니다. \"/본캐 [캐릭터명]\"명령어를 통해 본캐 지정을 하거나, 찾고 싶은 캐릭터 이름을 명령어 뒤에 입력해 주세요.`;
            return res.status(200).json(taj.successJSON(false, message));
        }
    }

    console.log(`${time.getNowDateTime()} - 레벨히스토리(${characterName})`);

    try {
        let levHistory = [];
        let message = `[${characterName}의 레벨 히스토리]\n`;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // ocid 조회
        const ocid = await iden.getOcid(characterName);
        if (ocid == null) {
            return res.status(200).json(taj.noOcidJSON(characterName));
        }

        // 1. 기존 데이터 있는지 조회
        let characterHistory = await findLevHistoryatDB(characterName);

        if (!characterHistory) {
            // 2. DB에 없으면 전체 조회 후 저장
            console.log(`DB에 데이터 없음 - 전체 조회 시작`);
            const fullHistory = await getLast10LevelUps(ocid);

            characterHistory = new CharacterHistory({
                characterName,
                levHistory: fullHistory.map(item => ({
                    lev: item.level,
                    date: new Date(item.date + 'T00:00:00.000Z'),
                })),
                updatedDate: today
            });

            await characterHistory.save();
            console.log('DB에 저장 완료');

            message = message + combineLevHistories(characterHistory.levHistory.slice(0, 10));
            return res.status(200).json(taj.successJSON(true, message));
        }

        // 3. DB에 있지만 levHistory가 비어 있는 경우 처리
        if(!characterHistory.levHistory || characterHistory.levHistory.length === 0) {
            console.log(`levHistory 비어 있음 - 전체 조회 시작`);
            const fullHistory = await getLast10LevelUps(ocid);

            characterHistory.levHistory = fullHistory.map(item => ({
                lev: item.level,
                date: new Date(item.date + 'T00:00:00.000Z'),
            }));
            characterHistory.updatedDate = today;

            await characterHistory.save();
            console.log('levHistory 업데이트 완료');

            message = message + characterHistory.levHistory.slice(0, 10);
            return res.status(200).json(taj.successJSON(true, message));
        }

        const updatedDate = new Date(characterHistory.updatedDate);
        updatedDate.setHours(0, 0, 0, 0);

        const daysDiff = differenceInDays(updatedDate, today);

        if (daysDiff === 0) {
            console.log('오늘 이미 체크함 - 캐시 반환');
            message = message + combineLevHistories(characterHistory.levHistory.slice(0, 10));
            return res.status(200).json(taj.successJSON(true, message));
        }

        const todayData = await callCharacterAPI(ocid);
        const curLev = todayData.data.character_level;
        const lastLev = characterHistory.levHistory[0]?.lev || 0;

        if (curLev === lastLev) {
            console.log(`레벨 변화 없음 - updatedDate만 업데이트`);
            characterHistory.updatedDate = today;
            await characterHistory.save();

            message = message + combineLevHistories(characterHistory.levHistory.slice(0, 10));
            return res.status(200).json(taj.successJSON(true, message));
        }

        console.log(`레벨 변화 감지: ${lastLev} -> ${curLev}`);

        const newLevelUps = await findAllLevelUpsInRange(updatedDate, today, lastLev, curLev, ocid);

        const newHistoryItems = newLevelUps.reverse().map(item => ({
            lev: item.level,
            date: new Date(item.date + 'T00:00:00.000Z')
        }));

        characterHistory.levHistory = [
            ...newHistoryItems,
            ...characterHistory.levHistory
        ];

        const uniqueHistory = Array.from(
            new Map(
                characterHistory.levHistory.map(item => [
                    `${item.date.toISOString().split('T')[0]}-${item.lev}`,
                    item
                ])
            ).values()
        );

        characterHistory.levHistory = uniqueHistory;
        characterHistory.updatedDate = today;

        await characterHistory.save();
        console.log('증분 업데이트 완료');

        message = message + combineLevHistories(characterHistory.levHistory.slice(0, 10));
        return res.status(200).json(taj.successJSON(true, message));
    } catch (error) {
        console.error('레벨 히스토리 조회 중 오류:', error);
        return res.status(200).json({
            success: false,
            result: error.message || '레벨 히스토리를 불러오는데 실패했습니다.'
        });
    }
});

function differenceInDays(date1, date2) {
    return Math.floor((date2 - date1) / (1000 * 60 * 60 * 24));
}

/////////////////////////////////////////////////////////
// 레벨히스토리 조회를 위한 함수들

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
        }
    };

    let response;

    try {
        response = await axios(config);
    } catch (e) {
        console.error(e.data.error);
    }
    return response;
}

async function getLast10LevelUps(ocid) {
    const levelUps = [];
    let curDate = new Date();
    curDate.setHours(0, 0, 0, 0);
    let apiCallCount = 0;

    // 현재 레벨 확인
    const current = await callCharacterAPI(ocid);
    apiCallCount++;
    let curLev = current.data.character_level;

    // 뒤로 점프하면서 레벨업 지점 찾기
    let jumpDays = 1;

    while(levelUps.length < 10 && curDate > API_START_DATE) {
        // 1. 점프하면서 레벨이 바뀐 구간 찾기
        let testDate = new Date(curDate);
        testDate.setDate(testDate.getDate() - jumpDays);

        const test = await callCharacterAPI(ocid, time.getDateStringForAPI(testDate));
        apiCallCount++;

        if (test.data.character_level < curLev) {
            // console.log(`현재 탐색 중인 날짜(${time.getDateStringForAPI(testDate)}의 레벨이 현재 레벨 보다 낮음`);
            // console.log(`start: ${time.getDateStringForAPI(testDate)}\nend: ${time.getDateStringForAPI(curDate)}\ncurLev: ${curLev}로 이진탐색 시작`);
            const foundLevelUps = await findAllLevelUpsInRange(
                testDate,
                curDate,
                test.data.character_level,
                curLev,
                ocid
            );

            for (const lu of foundLevelUps.reverse()) {
                if (levelUps.length >= 10) break;
                levelUps.push(lu);
            }

            if(levelUps.length >= 10) break;

            // console.log(levelUpDate);
            // console.log(curLev);


            curDate = new Date(testDate);
            curLev = test.data.character_level;
            jumpDays = 1;
        } else {
            curDate = testDate;
            jumpDays *= 2;
        }
    }

    console.log(`Total API calls: ${apiCallCount}`);
    return levelUps;
}

async function findAllLevelUpsInRange(start, end, startLev, endLev, ocid) {
    const result = [];

    if (differenceInDays(start, end) <= 1) {
        const endDateStr = time.getDateStringForAPI(end);
        result.push({
            date: endDateStr,
            level: endLev
        });
        return result;
    }

    const midDate = new Date((start.getTime() + end.getTime()) / 2);
    const midData = await callCharacterAPI(ocid, time.getDateStringForAPI(midDate));

    if(midData.data.character_level > startLev) {
        const leftResults = await findAllLevelUpsInRange(
            start, midDate, startLev, midData.data.character_level, ocid
        );
        result.push(...leftResults);
    }

    if(endLev > midData.data.character_level) {
        const rightResults = await findAllLevelUpsInRange(
            midDate, end, midData.data.character_level, endLev, ocid
        );
        result.push(...rightResults);
    }

    return result;
}

// 끝
/////////////////////////////////////////////////////////

module.exports = router;