const axios = require('axios');
const cheerio = require('cheerio');

const BASE = 'https://maplestory.nexon.com/Guide/CashShop/Probability';

// 캐시샵 확률형 아이템. 확률은 공시 페이지에서 실시간으로 읽어온다.
// cleanName    : 아이템명 정리 적용 여부 (로얄·원더베리 표기가 지저분하다)
// feverEvery   : N 회마다 1개를 더 준다 (부티크 기프트의 피버 타임)
// quantityUnit : 아이템명에 든 수량을 합산해 안내한다 (예: "달콤 생일 케이크 30개")
const CASH_BOXES = {
    royal:         { label: '메이플 로얄 스타일', url: `${BASE}/RoyalStyle`,       unitCost: 2200, cleanName: true },
    wonder:        { label: '위습의 원더베리',    url: `${BASE}/WispsWonderBerry`, unitCost: 5400, cleanName: true },
    goldApple:     { label: '골드애플',          url: `${BASE}/GoldApple`,        unitCost: 540 },
    platinumApple: { label: '플래티넘애플',       url: `${BASE}/PlatinumApple`,    unitCost: 3500 },
    boutique:      { label: '부티크 기프트',      url: `${BASE}/BoutiqueGift`,     unitCost: 3300,
                     feverEvery: 10, quantityUnit: '달콤 생일 케이크' }
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
const cache = new Map();   // url -> { items, fetchedAt }

function parseProbability(percentText) {
    return parseFloat(String(percentText).replace('%', ''));
}

/**
 * 공시 표에서 (아이템명, 확률%) 을 읽는다.
 * 표 구조가 페이지마다 조금 달라 열 개수로 분기한다.
 * @returns {Promise<Array<{name: string, prob: number}>>} 빈 배열이면 스크래핑 실패
 */
async function fetchItems(url, cleanName) {
    const cached = cache.get(url);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        return cached.items;
    }

    const { data } = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(data);
    const items = [];

    $('table tr').each((_, el) => {
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

    // 빈 결과를 캐시하면 장애가 10분 동안 굳는다
    if (items.length > 0) {
        cache.set(url, { items, fetchedAt: Date.now() });
    }
    return items;
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
 * feverEvery 가 있으면 N 번째 뽑기마다 같은 아이템을 하나 더 준다.
 */
function simulate(items, iteration, box) {
    const counts = new Map();
    const feverEvery = box && box.feverEvery ? box.feverEvery : 0;
    let sinceFever = 1;

    for (let i = 0; i < iteration; i++) {
        const item = pick(items);
        let gained = 1;

        if (feverEvery > 0) {
            if (sinceFever === feverEvery) {
                gained = 2;
                sinceFever = 1;
            } else {
                sinceFever++;
            }
        }
        counts.set(item.name, (counts.get(item.name) || 0) + gained);
    }
    return counts;
}

/** 아이템명에 든 수량(예: "달콤 생일 케이크 30개")을 합산한다 */
function totalQuantity(counts) {
    let total = 0;
    for (const [name, count] of counts) {
        const m = name.match(/\d+/);
        if (m) total += Number(m[0]) * count;
    }
    return total;
}

module.exports = { CASH_BOXES, MAX_ITERATION, fetchItems, simulate, totalQuantity };
