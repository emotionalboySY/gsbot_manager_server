const axios = require('axios');
const cheerio = require('cheerio');

require('dotenv').config();

const openAPIBaseUrl = "https://open.api.nexon.com/maplestory/v1";

const availableWorldName = [
    "스카니아",
    "베라",
    "루나",
    "제니스",
    "크로아",
    "유니온",
    "엘리시움",
    "이노시스",
    "레드",
    "오로라",
    "아케인",
    "노바",
    "에오스",
    "헬리오스",
    "챌린저스",
    "챌린저스2",
    "챌린저스3",
    "챌린저스4"
];

async function getOcid(characterName) {
    let date = new Date();
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
        console.log(e.message);
        return null;
    }
}

async function getOGuildId(worldName, guildName) {
    let date = new Date();
    if (!availableWorldName.includes(worldName)) {
        return 0;
    } else {
        try {
            let url = openAPIBaseUrl + `/guild/id?guild_name=${encodeURIComponent(guildName)}&world_name=${encodeURIComponent(worldName)}`;

            const config = {
                method: 'get',
                url: url,
                headers: {
                    'accept': 'application/json',
                    'x-nxopen-api-key': process.env.API_KEY
                },
            };

            let response = await axios(config);
            return response.data.oguild_id;
        } catch (e) {
            console.log(e.message);
            return 1;
        }
    }
}

function APIUnavailable() {
    let str = "현재 NEXON OpenAPI 서버 점검 및 업데이트 시간으로 로드가 불가능합니다. 오전 01시 이후에 재시도해 주세요.";
    return {
        success: false,
        result: encodeURIComponent(str),
        resultRaw: str
    };
}

function noOcidJSON(name) {
    var str = "";
    let date = new Date();
    if (date.getHours() == 0) {
        str = `현재 NEXON OpenAPI 서버 점검 및 업데이트 시간으로 로드가 불가능합니다. 오전 01시 이후에 재시도해 주세요.`;
    }
    str = `API 서버에서 ${name}에 대한 id를 가져올 수 없습니다.\n(데이터 누락일 수 있으니, 재시도 해보시기 바랍니다.)`;
    return {
        success: false,
        result: encodeURIComponent(str),
        resultRaw: str
    };
}

function noOGuildIdJSON(name) {
    var str = "";
    str = `API 서버에서 길드 [${name}]에 대한 id를 가져올 수 없습니다.\n(데이터 누락일 수 있으니, 재시도 해보시기 바랍니다.)`;
    return {
        success: false,
        result: encodeURIComponent(str),
        resultRaw: str
    };
}

function noWorldNameJSON(name) {
    let str = "게임 내에 존재하지 않는 월드 이름입니다.";
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

function getDateStringForAPI(date) {
    let useDate = new Date(date);
    return `${useDate.getFullYear()}-${String(useDate.getMonth() + 1).padStart(2, '0')}-${String(useDate.getDate()).padStart(2, '0')}`;
}

function getKorDateString(date) {
    return `${date.getFullYear()}년 ${String(date.getMonth() + 1).padStart(2, '0')}월 ${String(date.getDate()).padStart(2, '0')}일`;
}

function getKorDateStringAndTime(dateString, typeNum) {
    const date = new Date(dateString);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    if (typeNum == 1) return `${year}년 ${month}월 ${day}일 ${hours}시 ${minutes}분`;
    else return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function getNowDateTime() {
    let now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
}

function isSameDate(baseDate, comDate) {
    if (baseDate.getFullYear() == comDate.getFullYear() && baseDate.getMonth() == comDate.getMonth() && baseDate.getDate() == comDate.getDate()) {
        return true;
    } else return false;
}

function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

module.exports = {
    getOcid,
    getOGuildId,
    noOcidJSON,
    successJSON,
    getDateStringForAPI,
    getKorDateString,
    getKorDateStringAndTime,
    getNowDateTime,
    isSameDate,
    sleep,
    APIUnavailable,
    noOGuildIdJSON,
    noWorldNameJSON
};