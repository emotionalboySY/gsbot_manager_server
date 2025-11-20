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

function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

module.exports = {
    noOcidJSON,
    successJSON,
    sleep,
    APIUnavailable,
    noOGuildIdJSON,
    noWorldNameJSON
};