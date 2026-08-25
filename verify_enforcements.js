/**
 * 강화 확률 검증 — 시뮬이 실제로 굴리는 확률이 공시표와 같은가.
 *
 * 실행: npm run verify:enforce
 *
 * 이걸 두는 이유가 있다. 2026-08-25 이전까지 시뮬은 성공 판정에서 떨어진 뒤
 * 파괴를 따로 굴리면서 공시표의 **절대** 파괴 확률을 그대로 둘째 난수에
 * 넣고 있었다. 그래서 실제 파괴 확률이 (1 - 성공률) 배로 깎였다.
 * 22성이면 17% 가 14.45% 로 굴러갔고 비용 기댓값이 25% 낮게 나왔다.
 *
 * 눈으로는 안 보이는 종류의 오차다(난수라 "원래 이런가 보다" 로 넘어간다).
 * 그래서 확률을 직접 꺼내 표와 대조한다.
 */
const {
    STAR_FORCE, TYRANT, EVENT, starForceOdds, tyrantOdds,
} = require('./services/enforcements.js');

const EPSILON = 1e-12;
let checked = 0;
const failures = [];

function expect(label, actual, expected) {
    checked++;
    if (Math.abs(actual - expected) > EPSILON) {
        failures.push(`${label}: 실제 ${actual} / 기대 ${expected}`);
    }
}

// ── 스타포스: 이벤트·파괴방지 없으면 파괴 확률이 공시표 그대로여야 한다 ──
for (let star = 0; star <= STAR_FORCE.maxStar; star++) {
    const odds = starForceOdds(160, star, 0, EVENT.NONE, 0);
    expect(`스타포스 ${star}성 성공`, odds.success, STAR_FORCE.success[star] / 100);
    expect(`스타포스 ${star}성 파괴`, odds.destroy, STAR_FORCE.break[star] / 100);
    expect(`스타포스 ${star}성 합`, odds.success + odds.destroy + (1 - odds.success - odds.destroy), 1);
}

// ── 스타포스 스타캐치: 성공은 1.05배, 파괴는 재정규화 ──
// 공시 15성 스타캐치: 성공 31.5 / 유지 66.45 / 파괴 2.06
{
    const odds = starForceOdds(160, 15, 1, EVENT.NONE, 0);
    expect('스타캐치 15성 성공', Math.round(odds.success * 10000) / 100, 31.5);
    expect('스타캐치 15성 파괴', Math.round(odds.destroy * 10000) / 100, 2.06);
    expect('스타캐치 15성 유지', Math.round((1 - odds.success - odds.destroy) * 10000) / 100, 66.45);
}

// ── 파괴방지 구간은 파괴 확률 0 ──
for (let star = 15; star <= 18; star++) {
    expect(`파괴방지 ${star}성`, starForceOdds(160, star, 0, EVENT.NONE, 1).destroy, 0);
}

// ── 파괴 30% 감소 이벤트 ──
for (const event of [EVENT.LESS_BREAK, EVENT.SHINING]) {
    for (const star of [17, 22, 25]) {
        const plain = starForceOdds(160, star, 0, EVENT.NONE, 0).destroy;
        const reduced = starForceOdds(160, star, 0, event, 0).destroy;
        expect(`이벤트 ${event} ${star}성 파괴 30% 감소`, Math.round(reduced / plain * 1000) / 1000, 0.7);
    }
}

// ── 타일런트: 두 확률표 모두 그대로여야 한다 ──
for (const isStarCatch of [0, 1]) {
    const breakTable = isStarCatch ? TYRANT.breakStarCatch : TYRANT.break;
    const successTable = isStarCatch ? TYRANT.successStarCatch : TYRANT.success;
    for (let star = 0; star < TYRANT.maxStar; star++) {
        const odds = tyrantOdds(star, isStarCatch);
        expect(`타일런트 ${star}성 성공 (sc=${isStarCatch})`, odds.success, successTable[star] / 100);
        expect(`타일런트 ${star}성 파괴 (sc=${isStarCatch})`, odds.destroy, breakTable[star] / 100);
    }
}

console.log(`검증 항목: ${checked}개`);
if (failures.length > 0) {
    console.error(`\n불일치 ${failures.length}건:`);
    for (const f of failures) console.error('  ' + f);
    process.exit(1);
}
console.log('실제 굴러가는 확률이 공시표와 일치합니다.');
