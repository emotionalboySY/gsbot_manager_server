const { SEED_RING_BOXES } = require('./seed_ring_data.js');

const MAX_ITERATION = 1000;

function findBox(mode) {
    return SEED_RING_BOXES.find((box) => box.mode === mode) || null;
}

/**
 * 개별 확률 목록에서 하나를 뽑는다.
 * 공시 표가 반올림 표기라 합이 정확히 100% 가 아니므로, 넘치면 마지막 항목으로 보정한다.
 */
function pick(entries) {
    const roll = Math.random() * 100;
    let cumulative = 0;
    for (const entry of entries) {
        cumulative += entry.prob;
        if (roll < cumulative) return entry;
    }
    return entries[entries.length - 1];
}

/**
 * 상자를 iteration 번 열어 결과를 집계한다.
 * 데이터(SEED_RING_BOXES)는 읽기만 하고 카운터는 호출마다 새로 만든다 —
 * 데이터에 카운터를 섞어두면 모듈 스코프로 올리는 순간 요청 간에 값이 누적된다.
 *
 * @returns {Map<string, Map<number|null, number>>} 아이템명 → (레벨 → 횟수). 반지가 아니면 레벨 키가 null
 */
function simulate(box, iteration) {
    const counts = new Map();

    for (let i = 0; i < iteration; i++) {
        const item = pick(box.items);
        // 레벨은 스킬 반지에만 부여된다
        const level = item.isRing ? pick(box.levels).level : null;

        if (!counts.has(item.name)) counts.set(item.name, new Map());
        const byLevel = counts.get(item.name);
        byLevel.set(level, (byLevel.get(level) || 0) + 1);
    }
    return counts;
}

/** 많이 나온 순으로 펼친다 */
function flatten(counts) {
    const rows = [];
    for (const [name, byLevel] of counts) {
        for (const [level, count] of byLevel) {
            rows.push({ name, level, count });
        }
    }
    rows.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name) || (a.level || 0) - (b.level || 0));
    return rows;
}

module.exports = { SEED_RING_BOXES, MAX_ITERATION, findBox, simulate, flatten };
