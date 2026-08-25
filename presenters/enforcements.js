/**
 * 강화 시뮬레이션 봇 메시지 구성단.
 *
 * services/enforcements.js 의 결과를 카카오톡용 텍스트로 옮긴다.
 * 계산은 하지 않는다.
 */
const { addComma } = require('../utils/format.js');

// 명령어 사용법은 카카오톡 전용 문구다. 로직단이 아니라 여기 둔다 —
// 웹에는 슬래시 명령어가 없으므로 그대로 쓸 수 없다.
const TYRANT_USAGE =
    '명령어를 잘못 입력하셨습니다. 타일런트시뮬 명령어는 아래의 규칙에 따라 작성하셔야 합니다.\n\n' +
    '<타일런트시뮬 명령어 사용 방법>\n"/타일런트시뮬 [n성부터] [m성까지] [스타캐치]"\n\n' +
    '[n성부터]: 1 ~ 14 사이의 숫자\n[m성까지]: 1 ~ 14 사이의 숫자\n' +
    '[스타캐치]: 스타캐치 적용 - 1 / 스타캐치 미적용 - 0\n\n' +
    '타일런트 시뮬레이션은 서버 과부하 방지를 위해 14성까지만 가능합니다.';

const STAR_FORCE_USAGE =
    '명령어를 잘못 입력하셨습니다. 스타포스시뮬 명령어는 아래의 규칙에 따라 작성하셔야 합니다.\n\n' +
    '<스타포스시뮬 명령어 사용 방법>\n"/스타포스시뮬 [a렙제템을] [n성부터] [m성까지] [스타캐치] [이벤트] [파괴방지]"\n\n' +
    '[a렙제템을]: 0 ~ 250 사이의 숫자\n[n성부터]: 1 ~ 29 사이의 숫자\n[m성까지]: 1 ~ 29 사이의 숫자\n' +
    '[스타캐치]: 스타캐치 적용 - 1 / 스타캐치 미적용 - 0\n' +
    '[이벤트]: 이벤트 미적용 - 0 / 상시 30% 할인 - 1 / 10성까지 1+1 강화 - 2 / 21성 이하 파괴확률 30% 감소 - 3 / 샤이닝 스타포스 - 4\n' +
    '[파괴방지]: 파괴방지 미적용 - 0 / 15 ~ 18성 적용 - 1\n\n' +
    '스타포스 시뮬레이션은 서버 과부하 방지를 위해 29성까지만 가능합니다.';

const EVENT_LABEL = {
    1: '상시 30% 할인',
    2: '10성까지 1+1 강화',
    3: '21성 이하에서 파괴 확률 30% 감소',
    4: '샤이닝 스타포스'
};

const appliedLabel = (v) => (v == 1 ? '적용' : '미적용');

/** 실패 응답. 파라미터 오류면 사용법을, 아니면 로직단이 준 문장을 그대로 쓴다. */
function failure(data, usage) {
    return data.reason === 'badParams' ? usage : data.message;
}

function superialFailure(data) {
    return failure(data, TYRANT_USAGE);
}

function starForceFailure(data) {
    return failure(data, STAR_FORCE_USAGE);
}

function superialResult(data) {
    return '<타일런트 시뮬레이션 완료>\n' +
        `${data.start}성부터 ${data.goal}성까지 진행\n` +
        `스타캐치 적용 여부: ${appliedLabel(data.isStarCatch)}\n\n` +
        `성공 횟수: ${data.successCount}회\n` +
        `실패 횟수: ${data.failureCount}회\n` +
        `찬스 타임: ${data.chanceCount}회\n` +
        `파괴 횟수: ${data.brokenCount}회\n\n` +
        `총 강화 비용: ${addComma(data.totalCost)}메소`;
}

function starForceResult(data) {
    let content = '<스타포스 시뮬레이션 완료>\n\n';
    if (data.isOutofBound) {
        content += '(시뮬레이션 목표 강화 수치가 아이템 레벨 제한에 맞지 않아 조정되었습니다.)\n\n';
    }
    return content +
        `${data.itemLev}레벨 아이템을\n` +
        `${data.startForce}성부터 ${data.goalForce}성까지 진행\n` +
        `스타캐치 적용 여부: ${appliedLabel(data.isStarCatch)}\n` +
        `이벤트 적용 여부: ${EVENT_LABEL[data.isEvent] || '미적용'}\n` +
        `파괴방지 적용 여부: ${data.isBreakShield == 1 ? '15 ~ 18성 적용' : '미적용'}\n\n` +
        `성공 횟수: ${data.successCount}회\n` +
        `실패 횟수: ${data.failureCount}회\n` +
        `파괴 횟수: ${data.brokenCount}회\n\n` +
        `총 강화 비용: ${addComma(data.totalCost)}메소`;
}

module.exports = { superialResult, superialFailure, starForceResult, starForceFailure };
