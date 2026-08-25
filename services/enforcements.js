/**
 * 스타포스·타일런트 강화 시뮬레이션 로직단.
 *
 * 확률표와 비용식, 검증, 시뮬 실행까지만 한다. 표현은 하지 않는다.
 * 봇은 presenters/enforcements.js 로 텍스트를 만들고, 메이플링(웹)은 같은
 * 결과를 JSON 으로 받아 브라우저에서 다시 돌릴 수도 있다 — 확률표를 여기
 * 한곳에 모아 둔 이유다.
 *
 * 반환 형태
 *   성공 → { ok: true, ... }
 *   실패 → { ok: false, reason, message }
 *
 * reason 은 전송단이 분기할 수 있는 기계용 코드다. 봇은 badParams 일 때
 * 명령어 사용법을 대신 보여준다.
 */

// ── 타일런트(슈페리얼) 확률표 ─────────────────────────────────────────
const TYRANT = {
    //            0   1   2   3   4   5   6   7   8   9  10  11  12  13
    success:    [50, 50, 45, 40, 40, 40, 40, 40, 40, 37, 35, 35,  3,  2],
    break:      [ 0,  0,  0,  0,  0, 1.8, 3, 4.2, 6, 9.5, 13, 16.3, 48.5, 49],
    successStarCatch: [52.5, 52.5, 47.25, 42, 42, 42, 42, 42, 42, 38.85, 36.75, 36.75, 3.15, 2.1],
    breakStarCatch:   [0, 0, 0, 0, 0, 1.74, 2.9, 4.06, 5.8, 9.22, 12.65, 15.86, 48.43, 48.95],
    costPerAttempt: 55832200,
    // 서버 과부하 방지 상한. 14성 이상은 성공 확률이 3% 아래라 시도 횟수가 급격히 는다.
    maxStar: 14,
    inputMax: 15
};

// ── 스타포스 확률표 ───────────────────────────────────────────────────
const STAR_FORCE = {
    //            0   1   2   3   4   5   6   7   8   9  10  11  12  13  14   15   16   17   18   19    20     21  22  23  24  25    26  27    28    29
    success:    [95, 90, 85, 85, 80, 75, 70, 65, 60, 55, 50, 45, 40, 35, 30,  30,  30,  15,  15,  15,   30,    15, 15, 10, 10, 10,    7,  5,    3,    1],
    break:      [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 2.1, 2.1, 6.8, 6.8, 8.5, 10.5, 12.75, 17, 18, 18, 18, 18.6, 19, 19.4, 19.8],
    maxStar: 29,
    // 파괴되면 12성으로 떨어진다
    brokenTo: 12
};

const EVENT = { NONE: 0, DISCOUNT: 1, ONE_PLUS_ONE: 2, LESS_BREAK: 3, SHINING: 4 };

function roundTo(num, digits) {
    const factor = Math.pow(10, digits);
    return Math.round(num * factor) / factor;
}

function fail(reason, message) {
    return { ok: false, reason, message };
}

/** 강화 단계별 비용 계수. 단계마다 분모가 달라 비용 곡선이 꺾인다. */
function costDenominator(force) {
    switch (true) {
        case force <= 9:  return { denominator: 36, exponent: 1 };
        case force == 10: return { denominator: 571, exponent: 2.7 };
        case force == 11: return { denominator: 374, exponent: 2.7 };
        case force == 12: return { denominator: 214, exponent: 2.7 };
        case force == 13: return { denominator: 157, exponent: 2.7 };
        case force == 14: return { denominator: 107, exponent: 2.7 };
        case force == 15 || force == 16: return { denominator: 200, exponent: 2.7 };
        case force == 17: return { denominator: 150, exponent: 2.7 };
        case force == 18: return { denominator: 70, exponent: 2.7 };
        case force == 19: return { denominator: 45, exponent: 2.7 };
        case force == 20: return { denominator: 200, exponent: 2.7 };
        case force == 21: return { denominator: 125, exponent: 2.7 };
        default:          return { denominator: 200, exponent: 2.7 };
    }
}

/**
 * 타일런트(슈페리얼) 강화.
 * 연속 2회 실패하면 찬스 타임으로 다음 시도가 무조건 성공한다.
 */
function superial(startRaw, goalRaw, isStarCatchRaw) {
    const start = Number(startRaw);
    const goal = Number(goalRaw);
    const isStarCatch = Number(isStarCatchRaw);

    const inRange = (v) => Number.isFinite(v) && v >= 0 && v <= TYRANT.inputMax;
    if (!inRange(start) || !inRange(goal) || (isStarCatch !== 0 && isStarCatch !== 1)) {
        return fail('badParams', `입력값이 올바르지 않습니다.`);
    }
    if (start >= TYRANT.maxStar || goal == TYRANT.inputMax) {
        return fail('overLimit',
            `타일런트 시뮬레이션은 서버 과부하 방지를 위해 ${TYRANT.maxStar}성까지만 가능합니다.\n\n다시 시도해 주세요.`);
    }
    if (start >= goal) {
        return fail('goalNotHigher',
            `타일런트 시뮬레이션의 목표 강화 수치는 시작 강화 수치보다 항상 높아야 합니다.\n\n다시 시도해 주세요.`);
    }

    const successTable = isStarCatch ? TYRANT.successStarCatch : TYRANT.success;
    const breakTable = isStarCatch ? TYRANT.breakStarCatch : TYRANT.break;

    let curLev = start;
    let totalCost = 0;
    let successCount = 0, failureCount = 0, brokenCount = 0, chanceCount = 0;
    let failStack = 0;

    while (curLev < goal) {
        let curSuccess = successTable[curLev] / 100;
        const curBreak = breakTable[curLev] / 100;

        // 연속 2회 실패하면 찬스 타임 — 다음 한 번은 무조건 성공
        if (failStack == 2) {
            curSuccess = 1;
            chanceCount++;
        }

        if (Math.random() <= curSuccess) {
            curLev++;
            successCount++;
            failStack = 0;
        } else if (Math.random() <= curBreak) {
            curLev = 0;
            brokenCount++;
        } else {
            curLev--;
            if (curLev < 0) curLev = 0;
            failureCount++;
            failStack++;
        }
        totalCost += TYRANT.costPerAttempt;
    }

    return {
        ok: true,
        start, goal, isStarCatch,
        successCount, failureCount, brokenCount, chanceCount,
        totalCost
    };
}

/**
 * 스타포스 강화.
 * @param isEvent 0 미적용 / 1 상시 30% 할인 / 2 10성까지 1+1 / 3 21성 이하 파괴확률 30% 감소 / 4 샤이닝
 * @param isBreakShield 1 이면 15~18성 구간에서 비용 3배를 내고 파괴를 막는다
 */
function starForce(itemLevRaw, startForceRaw, goalForceRaw, isStarCatchRaw, isEventRaw, isBreakShieldRaw) {
    const itemLev = Number(itemLevRaw);
    const startForce = Number(startForceRaw);
    const isStarCatch = Number(isStarCatchRaw);
    const isEvent = Number(isEventRaw);
    const isBreakShield = Number(isBreakShieldRaw);
    let goalForce = Number(goalForceRaw);

    const levelOk = (itemLev >= 138 && itemLev <= 200) || itemLev == 250;
    const paramsOk =
        levelOk &&
        Number.isFinite(startForce) && startForce >= 0 && startForce <= 28 &&
        Number.isFinite(goalForce) && goalForce >= 0 && goalForce <= STAR_FORCE.maxStar &&
        (isStarCatch === 0 || isStarCatch === 1) &&
        isEvent >= 0 && isEvent <= 4 &&
        (isBreakShield === 0 || isBreakShield === 1);

    if (!paramsOk) {
        return fail('badParams', `입력값이 올바르지 않습니다.`);
    }

    // 목표가 상한을 넘으면 상한으로 깎고 그 사실을 알린다
    let isOutofBound = false;
    if (goalForce > STAR_FORCE.maxStar) {
        goalForce = STAR_FORCE.maxStar;
        isOutofBound = true;
    }

    if (startForce >= STAR_FORCE.maxStar || goalForce > STAR_FORCE.maxStar) {
        return fail('overLimit',
            `스타포스 시뮬레이션은 서버 과부하 방지를 위해 ${STAR_FORCE.maxStar}성까지만 가능합니다.\n\n다시 시도해 주세요.`);
    }
    if (goalForce <= startForce) {
        return fail('goalNotHigher',
            `스타포스 시뮬레이션의 목표 달성 수치는 시작 수치보다 항상 커야 합니다.\n\n다시 시도해 주세요.`);
    }

    let curForce = startForce;
    let totalCost = 0;
    let successCount = 0, failureCount = 0, brokenCount = 0;

    while (curForce < goalForce) {
        let curSuccess, curBreak;
        if (isStarCatch) {
            curSuccess = roundTo((STAR_FORCE.success[curForce] / 100) * 1.05, 4);
            // 스타캐치는 성공 확률만 올린다. 아래 식은 (1-p) 가 약분되어 원래 파괴
            // 확률과 같아지지만, 반올림 결과를 유지하려고 원식 그대로 둔다.
            curBreak = roundTo((1 - curSuccess) * (STAR_FORCE.break[curForce] / 100 / (1 - curSuccess)), 4);
        } else {
            curSuccess = STAR_FORCE.success[curForce] / 100;
            curBreak = STAR_FORCE.break[curForce] / 100;
        }

        // 파괴 확률 30% 감소 (성공 확률은 오르지 않는다)
        if (isEvent == EVENT.LESS_BREAK || isEvent == EVENT.SHINING) {
            curBreak = roundTo(curBreak * 0.7, 4);
        }

        const { denominator, exponent } = costDenominator(curForce);
        const rawCost = 1000 + (Math.pow(itemLev, 3) * Math.pow(curForce + 1, exponent) / denominator);
        const curCost = roundTo(rawCost, -2);
        const disCost = roundTo(rawCost * 0.7, -2);

        let resCost = (isEvent == EVENT.DISCOUNT || isEvent == EVENT.SHINING) ? disCost : curCost;

        // 파괴방지: 비용 3배를 내고 파괴 확률을 0 으로 만든다
        if (isBreakShield == 1 && curForce >= 15 && curForce <= 18) {
            resCost += curCost * 2;
            curBreak = 0;
        }

        if (Math.random() <= curSuccess) {
            // 1+1 이벤트는 10성까지 한 번에 2단계 오른다
            if (isEvent == EVENT.ONE_PLUS_ONE && curForce <= 10) {
                curForce += 2;
            } else {
                curForce++;
            }
            successCount++;
        } else if (Math.random() <= curBreak) {
            curForce = STAR_FORCE.brokenTo;
            brokenCount++;
        } else {
            failureCount++;
        }

        totalCost += resCost;
    }

    return {
        ok: true,
        itemLev, startForce, goalForce, isStarCatch, isEvent, isBreakShield,
        successCount, failureCount, brokenCount,
        totalCost, isOutofBound
    };
}

module.exports = { TYRANT, STAR_FORCE, EVENT, superial, starForce };
