function APIUnavailable() {
    let str = "현재 NEXON OpenAPI 서버 점검 및 업데이트 시간으로 로드가 불가능합니다. 오전 01시 이후에 재시도해 주세요.";
    return {
        success: false,
        result: encodeURIComponent(str),
        resultRaw: str
    };
}

function noOcid(name) {
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

function noOGuildId(name) {
    var str = "";
    str = `API 서버에서 길드 [${name}]에 대한 id를 가져올 수 없습니다.\n(데이터 누락일 수 있으니, 재시도 해보시기 바랍니다.)`;
    return {
        success: false,
        result: encodeURIComponent(str),
        resultRaw: str
    };
}

function noWorldName(name) {
    let str = "게임 내에 존재하지 않는 월드 이름입니다.";
    return {
        success: false,
        result: encodeURIComponent(str),
        resultRaw: str
    };
}

function success(result) {
    return {
        success: true,
        result: encodeURIComponent(result),
        resultRaw: result
    };
}

function failure(result) {
    return {
        success: false,
        resultRaw: result,
        result: encodeURIComponent(result),
    };
}

module.exports = {
    noOcid,
    success,
    APIUnavailable,
    noOGuildId,
    noWorldName,
    failure
};