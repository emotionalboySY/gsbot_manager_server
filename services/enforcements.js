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

/**
 * 한 번 시도할 때의 결과 확률.
 *
 * 공시표의 파괴 확률은 **절대값** 이다 (성공 + 유지 + 파괴 = 100%). 그런데
 * 진행 판정은 성공 판정에서 떨어진 뒤 파괴를 따로 굴리는 2단 구조라, 둘째
 * 난수에 넣을 값은 "실패했다는 전제 하의 파괴율" 이어야 한다. 절대값을 그대로
 * 넣으면 실제 파괴 확률이 (1 - 성공률) 배로 깎인다.
 *
 *   15성: 2.1% 를 그대로 넣으면 0.7 x 2.1 = 1.47% 로 굴러간다
 *
 * 나눠 두면 스타캐치의 공시 재정규화까지 저절로 맞는다.
 *
 *   (1 - 0.315) x (2.1 / 0.7) = 2.055%   ← 공시 2.06%
 *
 * 이 나눗셈 결과가 3/8/10/15/20% 처럼 딱 떨어지는 것은 우연이 아니다. 공시
 * 파괴율 자체가 이 값에 (1 - 성공률) 을 곱해 만들어진 것이다.
 */
function breakGivenFail(absoluteBreakPct, baseSuccessPct) {
    if (!(absoluteBreakPct > 0)) return 0;
    const rest = 1 - baseSuccessPct / 100;
    return rest > 0 ? (absoluteBreakPct / 100) / rest : 0;
}

/**
 * 스타포스 한 단계의 확률과 비용. 성수마다 고정이므로 시뮬 루프 밖에서
 * 한 번만 만들어 쓴다.
 */
function starForceOdds(itemLev, star, isStarCatch, isEvent, isBreakShield) {
    const baseSuccess = STAR_FORCE.success[star] / 100;
    // 스타캐치는 성공 확률만 올린다
    const success = isStarCatch ? roundTo(baseSuccess * 1.05, 4) : baseSuccess;

    let breakOnFail = breakGivenFail(STAR_FORCE.break[star], STAR_FORCE.success[star]);
    // 파괴 확률 30% 감소 (성공 확률은 오르지 않는다)
    if (isEvent == EVENT.LESS_BREAK || isEvent == EVENT.SHINING) {
        breakOnFail = roundTo(breakOnFail * 0.7, 4);
    }

    const { denominator, exponent } = costDenominator(star);
    const rawCost = 1000 + (Math.pow(itemLev, 3) * Math.pow(star + 1, exponent) / denominator);
    const baseCost = roundTo(rawCost, -2);
    let cost = (isEvent == EVENT.DISCOUNT || isEvent == EVENT.SHINING)
        ? roundTo(rawCost * 0.7, -2)
        : baseCost;

    // 파괴방지: 비용을 더 내고 파괴 확률을 0 으로 만든다.
    // 추가분은 "할인 전" 비용 기준이라, 할인 이벤트와 겹쳐도 할인가의 3배가
    // 아니라 (할인가 + 할인전가 x 2) 가 된다.
    if (isBreakShield == 1 && star >= 15 && star <= 18) {
        cost += baseCost * 2;
        breakOnFail = 0;
    }

    return {
        success,
        breakOnFail,
        cost,
        // 실제로 이번 시도에서 파괴될 확률. 공시표와 대조할 때 쓴다
        destroy: (1 - success) * breakOnFail
    };
}

/** 타일런트 한 단계의 확률. 비용은 단계와 무관하게 정액이다 */
function tyrantOdds(star, isStarCatch) {
    const successTable = isStarCatch ? TYRANT.successStarCatch : TYRANT.success;
    const breakTable = isStarCatch ? TYRANT.breakStarCatch : TYRANT.break;
    const success = successTable[star] / 100;
    // 스타캐치표는 이미 재정규화된 값이라 같은 표끼리 나누면 맞는다
    const breakOnFail = breakGivenFail(breakTable[star], successTable[star]);
    return { success, breakOnFail, destroy: (1 - success) * breakOnFail };
}

// 강화 단계별 비용 계수. 단계마다 분모가 달라 비용 곡선이 꺾인다.
// switch 문이었는데 표로 폈다 — 브라우저에서 같은 비용을 계산하려면 내보낼 수
// 있는 데이터여야 한다. 인덱스가 강화 단계다.
const COST_TABLE = (() => {
    const table = [];
    for (let force = 0; force <= STAR_FORCE.maxStar; force++) {
        if (force <= 9) { table.push({ denominator: 36, exponent: 1 }); continue; }
        const byStar = { 10: 571, 11: 374, 12: 214, 13: 157, 14: 107,
                         15: 200, 16: 200, 17: 150, 18: 70, 19: 45, 20: 200, 21: 125 };
        table.push({ denominator: byStar[force] || 200, exponent: 2.7 });
    }
    return table;
})();

const DEFAULT_COST = { denominator: 200, exponent: 2.7 };

function costDenominator(force) {
    return COST_TABLE[force] || DEFAULT_COST;
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

    // 확률은 성수마다 고정이라 루프 밖에서 한 번만 만든다
    const odds = [];
    for (let star = 0; star < goal; star++) odds.push(tyrantOdds(star, isStarCatch));

    let curLev = start;
    let totalCost = 0;
    let successCount = 0, failureCount = 0, brokenCount = 0, chanceCount = 0;
    let failStack = 0;

    while (curLev < goal) {
        const { success, breakOnFail } = odds[curLev];
        let curSuccess = success;

        // 연속 2회 실패하면 찬스 타임 — 다음 한 번은 무조건 성공.
        // 성공 확률이 1 이 되므로 이 시도에서는 파괴도 일어나지 않는다.
        if (failStack == 2) {
            curSuccess = 1;
            chanceCount++;
        }

        if (Math.random() <= curSuccess) {
            curLev++;
            successCount++;
            failStack = 0;
        } else if (Math.random() <= breakOnFail) {
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

    // 확률·비용은 성수마다 고정이라 루프 밖에서 한 번만 만든다
    const odds = [];
    for (let star = 0; star < goalForce; star++) {
        odds.push(starForceOdds(itemLev, star, isStarCatch, isEvent, isBreakShield));
    }

    let curForce = startForce;
    let totalCost = 0;
    let successCount = 0, failureCount = 0, brokenCount = 0;

    while (curForce < goalForce) {
        const { success: curSuccess, breakOnFail, cost: resCost } = odds[curForce];

        if (Math.random() <= curSuccess) {
            // 1+1 이벤트는 10성까지 한 번에 2단계 오른다
            if (isEvent == EVENT.ONE_PLUS_ONE && curForce <= 10) {
                curForce += 2;
            } else {
                curForce++;
            }
            successCount++;
        } else if (Math.random() <= breakOnFail) {
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

module.exports = {
    TYRANT, STAR_FORCE, EVENT, COST_TABLE,
    breakGivenFail, starForceOdds, tyrantOdds,
    superial, starForce
};
