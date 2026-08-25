const axios = require('axios');
const cheerio = require('cheerio');

const BASE = 'https://maplestory.nexon.com/Guide/CashShop/Probability';

// 캐시샵 확률형 아이템. 확률은 공시 페이지에서 실시간으로 읽어온다.
// cleanName  : 아이템명 정리 적용 여부 (로얄·원더베리 표기가 지저분하다)
// feverEvery : N 회마다 별도의 "피버 타임 확률" 표에서 뽑는다
// sumQuantity: 아이템명에 든 수량을 합산해 안내한다 (구성품 이름은 주기적으로
//              바뀌므로 이름을 박아두지 않고 표에서 뽑아낸다)
const CASH_BOXES = {
    royal:         { label: '메이플 로얄 스타일', url: `${BASE}/RoyalStyle`,       unitCost: 2200, cleanName: true },
    wonder:        { label: '위습의 원더베리',    url: `${BASE}/WispsWonderBerry`, unitCost: 5400, cleanName: true },
    goldApple:     { label: '골드애플',          url: `${BASE}/GoldApple`,        unitCost: 540 },
    platinumApple: { label: '플래티넘애플',       url: `${BASE}/PlatinumApple`,    unitCost: 3500 },
    boutique:      { label: '부티크 기프트',      url: `${BASE}/BoutiqueGift`,     unitCost: 3300,
                     feverEvery: 10, sumQuantity: true }
};

function cleanItemName(name) {
    return name
        .replace(/\([^)]*\)/g, '')      // 괄호 및 괄호 안 제거
        .replace(/\s*\/\s*/g, '/')      // 슬래시 앞뒤 공백 제거
        .replace(/](?! )/g, '] ')        // 대괄호 뒤 공백 없으면 추가
        .replace(/\s+/g, ' ')            // 중복 공백 제거
        .trim();
}

const MAX_ITERATION = 1000000;

// 확률 공시는 자주 바뀌지 않는데 명령마다 페이지를 새로 긁으면 응답이 느리고
// 넥슨 쪽 부하도 는다. 짧게 캐시한다.
const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map();   // url -> { tables, fetchedAt }

function parseProbability(percentText) {
    return parseFloat(String(percentText).replace('%', ''));
}

/** 표 바로 앞의 제목성 텍스트. 기간 표기와 "피버 타임 확률" 이 여기 붙는다. */
function headingOf($, table) {
    let prev = $(table).prev();
    for (let i = 0; i < 4 && prev.length; i++) {
        const text = prev.text().trim().replace(/\s+/g, ' ');
        if (text) return text;
        prev = prev.prev();
    }
    return '';
}

/** 표 하나에서 (아이템명, 확률%) 을 읽는다. 표 구조가 페이지마다 조금 달라 열 개수로 분기한다. */
function parseRows($, table, cleanName) {
    const items = [];
    $(table).find('tr').each((_, el) => {
        const tds = $(el).find('td');
        let name = '';
        let prob = '';

        if (tds.length === 3) {
            name = tds.eq(1).text().trim();
            prob = tds.eq(2).text().trim();
        } else if (tds.length === 2) {
            name = tds.eq(0).text().trim();
            prob = tds.eq(1).text().trim();
        }

        if (name && prob && prob.includes('%')) {
            items.push({ name: cleanName ? cleanItemName(name) : name, prob: parseProbability(prob) });
        }
    });
    return items;
}

/** 제목에서 처음 나오는 날짜. "<2026-06-25 오전 10시 이후>" → 적용 시작일 */
function startDateOf(heading) {
    const m = String(heading).match(/(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return null;
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/**
 * 지금 적용 중인 표를 고른다.
 *
 * 공시 페이지는 확률이 바뀌면 지난 기간 표를 지우지 않고 아래에 새 표를 덧붙인다.
 * 예전에는 표를 전부 이어 붙여 읽었는데, 뽑기가 0~100 누적으로 고르는 탓에
 * 첫 표만 쓰이고 나머지는 영원히 나오지 않았다 — 즉 끝난 기간의 확률로 돌았다.
 *
 * 시작일이 오늘보다 앞선 표 중 가장 나중 것을 쓴다. 미리 공지된 미래 표는 걸러진다.
 */
function pickCurrent(tables, now) {
    if (tables.length <= 1) return tables[0] || null;

    const dated = tables
        .map((table) => ({ table, start: startDateOf(table.heading) }))
        .filter((x) => x.start !== null && x.start <= now)
        .sort((a, b) => b.start - a.start);

    if (dated.length > 0) return dated[0].table;
    return tables[tables.length - 1];   // 날짜를 못 읽으면 가장 나중 표
}

/**
 * 공시 페이지에서 표를 읽어 일반 확률표와 피버 확률표로 가른다.
 * @returns {Promise<{normal: Array, fever: Array|null}>} normal 이 비면 스크래핑 실패
 */
async function fetchTables(url, cleanName, now) {
    const cached = cache.get(url);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        return cached.tables;
    }

    const { data } = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(data);

    const parsed = [];
    $('table').each((_, el) => {
        const items = parseRows($, el, cleanName);
        if (items.length > 0) parsed.push({ heading: headingOf($, el), items });
    });

    const feverTables = parsed.filter((t) => t.heading.includes('피버'));
    const normalTables = parsed.filter((t) => !t.heading.includes('피버'));

    const current = pickCurrent(normalTables, now || new Date());
    const tables = {
        normal: current ? current.items : [],
        fever: feverTables.length > 0 ? pickCurrent(feverTables, now || new Date()).items : null
    };

    // 빈 결과를 캐시하면 장애가 10분 동안 굳는다
    if (tables.normal.length > 0) {
        cache.set(url, { tables, fetchedAt: Date.now() });
    }
    return tables;
}

/** 공시 표가 반올림 표기라 합이 정확히 100% 가 아니다. 넘치면 마지막 항목으로 보정한다. */
function pick(items) {
    const roll = Math.random() * 100;
    let cumulative = 0;
    for (const item of items) {
        cumulative += item.prob;
        if (roll < cumulative) return item;
    }
    return items[items.length - 1];
}

/**
 * @returns {Map<string, number>} 아이템명 → 획득 개수
 *
 * feverEvery 가 있으면 N 번째 뽑기는 피버 확률표에서 뽑는다. 예전에는 일반 표에서
 * 뽑은 것을 2배로 셌는데, 공시에는 "10회마다 피버 타임 확률에 따라" 라고 적혀 있다 —
 * 수량이 아니라 확률표가 통째로 바뀐다.
 */
function simulate(tables, iteration, box) {
    const counts = new Map();
    const feverEvery = box && box.feverEvery ? box.feverEvery : 0;
    const canFever = feverEvery > 0 && tables.fever && tables.fever.length > 0;
    let sinceFever = 1;

    for (let i = 0; i < iteration; i++) {
        let item;
        if (canFever && sinceFever === feverEvery) {
            item = pick(tables.fever);
            sinceFever = 1;
        } else {
            item = pick(tables.normal);
            if (canFever) sinceFever++;
        }
        counts.set(item.name, (counts.get(item.name) || 0) + 1);
    }
    return counts;
}

/**
 * 아이템명이 모두 "<구성품> N개" 꼴이면 <구성품> 을 돌려준다.
 * 구성품 종류는 주기적으로 바뀌므로 이름을 코드에 박아두지 않는다.
 */
function deriveQuantityUnit(items) {
    const units = new Set();
    for (const item of items) {
        const m = String(item.name).match(/^(.*?)\s*\d+개$/);
        if (!m) return null;
        units.add(m[1].trim());
    }
    return units.size === 1 ? [...units][0] : null;
}

/** 아이템명에 든 수량(예: "부티크 티켓 10개")을 합산한다 */
function totalQuantity(counts) {
    let total = 0;
    for (const [name, count] of counts) {
        const m = name.match(/\d+/);
        if (m) total += Number(m[0]) * count;
    }
    return total;
}

module.exports = {
    CASH_BOXES, MAX_ITERATION,
    fetchTables, simulate, totalQuantity, deriveQuantityUnit,
    // 표 선택 규칙은 단독으로 검증할 수 있어야 한다
    pickCurrent, startDateOf
};
