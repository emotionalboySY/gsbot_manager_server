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

// Nexon OpenAPI 에러 코드 → 한국어 메시지 매핑
const NEXON_ERROR_MESSAGES = {
    'OPENAPI00001': '서버 내부 오류',
    'OPENAPI00002': '권한이 없는 경우',
    'OPENAPI00003': '유효하지 않은 식별자',
    'OPENAPI00004': '파라미터 누락 또는 유효하지 않음',
    'OPENAPI00005': '유효하지 않은 API KEY',
    'OPENAPI00006': '유효하지 않은 게임 또는 API PATH',
    'OPENAPI00007': 'API 호출량 초과',
    'OPENAPI00009': '데이터 준비 중',
    'OPENAPI00010': '게임 점검 중',
    'OPENAPI00011': 'API 점검 중'
};

// Nexon OpenAPI 에러 응답을 사용자 친화적 메시지로 변환
function nexonAPIError(e) {
    if (e.response && e.response.data && e.response.data.error) {
        const errorInfo = e.response.data.error;
        const errorName = errorInfo.name;
        const description = NEXON_ERROR_MESSAGES[errorName] || errorInfo.message;
        const str = `Nexon OpenAPI 오류가 발생했습니다.\n\n[${errorName}] ${description}`;
        return {
            success: false,
            result: encodeURIComponent(str),
            resultRaw: str
        };
    }
    const str = `서버 오류가 발생했습니다.\n\n${e.message || e}`;
    return {
        success: false,
        result: encodeURIComponent(str),
        resultRaw: str
    };
}

module.exports = {
    noOcid,
    success,
    APIUnavailable,
    noOGuildId,
    noWorldName,
    failure,
    nexonAPIError
};