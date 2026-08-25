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
    STAR_FORCE, TYRANT, EVENT, RECOVERY,
    starForceOdds, tyrantOdds, restoreCost,
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

// ── 파괴 방지 구간 ────────────────────────────────────────────────────
// 인게임 안내는 "15성, 16성, 17성 장비로 강화를 시도할 때" 다. 18성에도 걸리던
// 시절이 있어(2026-08-25 수정) 경계를 못박아 둔다.
for (let star = 14; star <= 19; star++) {
    const shielded = star >= 15 && star <= 17;
    const odds = starForceOdds(160, star, 0, EVENT.NONE, 1);
    const plain = STAR_FORCE.break[star] / 100;
    expect(`파괴방지 ${star}성`, odds.destroy, shielded ? 0 : plain);
}

// ── 파괴 복구 ─────────────────────────────────────────────────────────
// 나무위키 "파괴 장비 복구 필요 재화" 원본 표. 코드는 레벨 세제곱 계수로
// 계산하므로, 그 계산이 이 표를 재현하는지 본다.
//
// 허용 오차가 1% 로 넉넉한 이유가 있다. 이 표는 레벨 세제곱에 잘 비례하지만
// 완전히는 아니다 — 20성 행을 보면 140제는 계수가 1466.8 이하여야 하고 200제는
// 1468.8 이상이어야 해서, 유효숫자 반올림을 감안해도 하나의 계수로 둘 다 맞출
// 수 없다. 출처 쪽 잡음이라 이쪽에서 없앨 수 있는 오차가 아니다.
// 최소제곱으로 맞춘 계수의 실제 최대 오차는 0.5% 다.
const RESTORE_TABLE = [
    { star: 15, items: 1, meso: { 140: 1.49e8, 160: 2.22e8, 200: 4.33e8, 250: 8.46e8 } },
    { star: 16, items: 1, meso: { 140: 3.59e8, 160: 5.35e8, 200: 10.5e8, 250: 20.4e8 } },
    { star: 17, items: 1, meso: { 140: 6.06e8, 160: 9.04e8, 200: 17.7e8, 250: 34.5e8 } },
    { star: 18, items: 1, meso: { 140: 13.8e8, 160: 20.6e8, 200: 40.1e8, 250: 78.3e8 } },
    { star: 19, items: 2, meso: { 140: 22.8e8, 160: 34.1e8, 200: 66.5e8, 250: 130e8 } },
    { star: 20, items: 2, meso: { 140: 40.2e8, 160: 60e8, 200: 118e8, 250: 229e8 } },
    { star: 21, items: 3, meso: { 140: 50.5e8, 160: 75.4e8, 200: 148e8, 250: 288e8 } },
    { star: 22, items: 4, meso: { 140: 82.9e8, 160: 124e8, 200: 242e8, 250: 473e8 } }
];
const RESTORE_TOLERANCE = 0.01;

for (const row of RESTORE_TABLE) {
    for (const [levText, published] of Object.entries(row.meso)) {
        const itemLev = Number(levText);
        const got = restoreCost(itemLev, row.star, RECOVERY.PREVIOUS);
        checked++;
        if (got.items !== row.items) {
            failures.push(`복구 ${row.star}성 ${itemLev}제 장비 개수: ${got.items} / 기대 ${row.items}`);
        }
        checked++;
        const error = Math.abs(got.meso - published) / published;
        if (error > RESTORE_TOLERANCE) {
            failures.push(
                `복구 ${row.star}성 ${itemLev}제 메소: ${got.meso} / 공시 ${published} (오차 ${(error * 100).toFixed(2)}%)`
            );
        }
    }
}

// 22성이 상한. 그 위에서 파괴되면 22성까지만 되돌아간다
for (const star of [23, 25, 29]) {
    const got = restoreCost(160, star, RECOVERY.PREVIOUS);
    expect(`복구 상한 ${star}성 → 성수`, got.toStar, RESTORE_TABLE[RESTORE_TABLE.length - 1].star);
    expect(`복구 상한 ${star}성 → 장비`, got.items, 4);
}

// 재료 하나만 쓰는 12성 복구는 메소가 들지 않는다
for (const star of [15, 20, 29]) {
    const got = restoreCost(160, star, RECOVERY.TWELVE);
    expect(`12성 복구 ${star}성 → 성수`, got.toStar, 12);
    expect(`12성 복구 ${star}성 → 장비`, got.items, 1);
    expect(`12성 복구 ${star}성 → 메소`, got.meso, 0);
}

console.log(`검증 항목: ${checked}개`);
if (failures.length > 0) {
    console.error(`\n불일치 ${failures.length}건:`);
    for (const f of failures) console.error('  ' + f);
    process.exit(1);
}
console.log('실제 굴러가는 확률이 공시표와 일치합니다.');
