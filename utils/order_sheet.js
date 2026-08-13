const { ORDER_SHEETS } = require('./order_sheet_data.js');

const MAX_ITERATION = 20;

/** 공백·대소문자를 무시해 채팅으로 입력하기 쉽게 한다 */
function normalize(text) {
    return String(text).replace(/\s+/g, '').toLowerCase();
}

function displayNameOf(scroll) {
    return scroll.displayName || scroll.name;
}

/** 목록에 보이는 이름. 이름에 성공률이 없으면 붙인다 — 검색도 이 이름으로 되어야 한다. */
function labelOf(scroll) {
    const name = displayNameOf(scroll);
    return /\d+%$/.test(name) ? name : `${name} ${scroll.successRate}%`;
}

// 혼돈 주문서의 옵션 그룹명이 너무 길어 결과가 읽히지 않는다. 짧게 줄이고 각주로 설명한다.
const GROUP_SHORT_LABEL = {
    "공격력/마력/STR/DEX/INT/LUK/방어력/이동속도/점프력": "일반 옵션",
    "최대 HP/최대 MP": "최대 HP/MP"
};

function groupLabelOf(label) {
    return GROUP_SHORT_LABEL[label] || label;
}

/** 줄여 쓴 그룹명이 무엇을 가리키는지 알려주는 각주 */
function groupNotesOf(scroll) {
    if (scroll.type !== "chaos") return [];
    return scroll.groups
        .filter((g) => GROUP_SHORT_LABEL[g.label])
        .map((g) => `${GROUP_SHORT_LABEL[g.label]} = ${g.label}`);
}

/**
 * 번호 우선, 그 다음 이름으로 찾는다.
 * 이름은 완전일치 → 앞부분 일치 → 부분 일치 순으로 좁히고,
 * 끝까지 여러 개면 후보를 돌려줘 사용자가 고르게 한다.
 */
function findScroll(query) {
    const trimmed = String(query).trim();

    if (/^\d+$/.test(trimmed)) {
        const index = Number(trimmed) - 1;
        if (index >= 0 && index < ORDER_SHEETS.length) {
            return { scroll: ORDER_SHEETS[index], number: index + 1 };
        }
        return { candidates: [] };
    }

    const target = normalize(trimmed);
    const withNumber = ORDER_SHEETS.map((scroll, i) => ({ scroll, number: i + 1 }));
    const names = (entry) => [
        normalize(entry.scroll.name),
        normalize(displayNameOf(entry.scroll)),
        normalize(labelOf(entry.scroll))
    ];

    for (const match of [
        (entry) => names(entry).some((n) => n === target),
        (entry) => names(entry).some((n) => n.startsWith(target)),
        (entry) => names(entry).some((n) => n.indexOf(target) >= 0)
    ]) {
        const hits = withNumber.filter(match);
        if (hits.length === 1) return hits[0];
        if (hits.length > 1) return { candidates: hits };
    }
    return { candidates: [] };
}

/** 누적 확률로 하나를 뽑는다 */
function pick(outcomes) {
    const roll = Math.random() * 100;
    let cumulative = 0;
    for (const outcome of outcomes) {
        cumulative += outcome.prob;
        if (roll < cumulative) return outcome;
    }
    return outcomes[outcomes.length - 1];   // 반올림 오차 보정
}

/** "공격력 +9" → { label: "공격력", amount: 9 } */
function parseOption(text) {
    const m = String(text).match(/^(.*?)\s*\+(\d+)$/);
    if (!m) return { label: String(text), amount: null };
    return { label: m[1].trim(), amount: Number(m[2]) };
}

function addTo(totals, label, amount) {
    if (amount === null) {
        totals.set(label, (totals.get(label) || 0));
        return;
    }
    totals.set(label, (totals.get(label) || 0) + amount);
}

/**
 * @returns {{ success: number, fail: number, rolls: string[][], totals: Map, order: string[] }}
 */
function simulate(scroll, iteration) {
    const totals = new Map();
    const counts = new Map();
    const rolls = [];
    let success = 0;
    let fail = 0;

    for (let i = 0; i < iteration; i++) {
        if (Math.random() * 100 >= scroll.successRate) {
            fail++;
            rolls.push(null);
            continue;
        }
        success++;

        const gained = [];
        if (scroll.type === 'chaos') {
            for (const group of scroll.groups) {
                const outcome = pick(group.outcomes);
                const label = groupLabelOf(group.label);
                gained.push(`${label} ${outcome.value}`);
                addTo(totals, label, Number(String(outcome.value).replace('+', '')));
            }
        } else {
            for (const base of scroll.baseOptions || []) {
                gained.push(base);
                const parsed = parseOption(base);
                addTo(totals, parsed.label, parsed.amount);
            }
            const outcome = pick(scroll.options);
            gained.push(outcome.option);
            const parsed = parseOption(outcome.option);
            addTo(totals, parsed.label, parsed.amount);
        }

        for (const g of gained) counts.set(g, (counts.get(g) || 0) + 1);
        rolls.push(gained);
    }

    return { success, fail, rolls, totals, counts };
}

module.exports = { ORDER_SHEETS, MAX_ITERATION, findScroll, simulate, displayNameOf, labelOf, groupNotesOf, normalize };
