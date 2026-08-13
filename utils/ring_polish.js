// 반지 연마 시뮬레이션
//
// 연마석을 n 개 쓰면 성공 확률과 소모 메소가 n 에 비례한다.
//   4 → 5레벨: n 개 = 성공 10n%, 메소 5억 × n   (최대 10개 = 100%)
//   5 → 6레벨: n 개 = 성공  5n%, 메소 10억 × n  (최대 20개 = 100%)
//
// 한 번 성공하면 반지가 올라가므로 더 시도할 이유가 없다.
// 따라서 성공하는 순간 멈추고, 그때까지 쓴 연마석·메소를 집계한다.

const EOK = 100000000;   // 1억

const POLISH_TABLE = {
    4: { to: 5, maxStones: 10, probPerStone: 10, mesoPerStone: 5 * EOK },
    5: { to: 6, maxStones: 20, probPerStone: 5,  mesoPerStone: 10 * EOK }
};

const MAX_ATTEMPTS = 20;

function findPolish(level) {
    return POLISH_TABLE[level] || null;
}

function successRateOf(polish, stones) {
    return Math.min(polish.probPerStone * stones, 100);
}

function mesoPerAttemptOf(polish, stones) {
    return polish.mesoPerStone * stones;
}

/**
 * 성공할 때까지(또는 시도 횟수를 다 쓸 때까지) 연마한다.
 * @returns {{ succeeded: boolean, attempts: number, stonesUsed: number, mesoUsed: number }}
 */
function simulate(polish, stones, maxAttempts) {
    const rate = successRateOf(polish, stones);
    const mesoPerAttempt = mesoPerAttemptOf(polish, stones);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        if (Math.random() * 100 < rate) {
            return {
                succeeded: true,
                attempts: attempt,
                stonesUsed: stones * attempt,
                mesoUsed: mesoPerAttempt * attempt
            };
        }
    }
    return {
        succeeded: false,
        attempts: maxAttempts,
        stonesUsed: stones * maxAttempts,
        mesoUsed: mesoPerAttempt * maxAttempts
    };
}

/** 메소는 억 단위로 보여준다 */
function toEok(meso) {
    return meso / EOK;
}

module.exports = { POLISH_TABLE, MAX_ATTEMPTS, findPolish, successRateOf, mesoPerAttemptOf, simulate, toEok };
