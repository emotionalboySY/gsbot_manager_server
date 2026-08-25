/**
 * 확률·시뮬레이션 로직단.
 *
 * 입력 검증과 시뮬 실행까지만 하고 표현은 하지 않는다.
 * 봇은 presenters/probability.js 로 텍스트를 만들어 쓰고,
 * 메이플링(웹)은 같은 결과를 JSON 그대로 내보낸다.
 *
 * 반환 형태
 *   성공 → { ok: true, ... }
 *   실패 → { ok: false, message }
 *
 * message 는 그대로 사용자에게 보여도 되는 문장이다. 검증 실패 문구는 봇과 웹이
 * 똑같아야 하므로 여기 둔다 — 전송단마다 따로 쓰면 두 벌이 되어 갈라진다.
 * 화면에서 다르게 그려야 하는 값(주문서 후보 목록 등)은 message 와 별개로
 * 구조화된 필드를 함께 돌려준다.
 */
const orderSheetUtil = require('../utils/order_sheet.js');
const ringPolishUtil = require('../utils/ring_polish.js');
const cashProbability = require('../utils/cash_probability.js');

function fail(message, extra) {
    return Object.assign({ ok: false, message }, extra || {});
}

/** 주문서 전체 목록. 번호는 1-based 로, 검색에 쓰이는 번호와 같다. */
function orderSheetList() {
    return {
        ok: true,
        maxIteration: orderSheetUtil.MAX_ITERATION,
        scrolls: orderSheetUtil.ORDER_SHEETS.map((scroll, i) => ({
            number: i + 1,
            category: scroll.category,
            label: orderSheetUtil.labelOf(scroll)
        }))
    };
}

/**
 * 주문서 시뮬레이션.
 * @param {string} query 번호 또는 이름
 * @param {*} iterationRaw 생략 가능. 비어 있으면 1회
 */
function orderSheet(query, iterationRaw) {
    let iteration = 1;
    if (iterationRaw !== undefined && iterationRaw !== '') {
        iteration = Number(iterationRaw);
        if (!Number.isInteger(iteration) || iteration < 1) {
            return fail(`횟수는 1 이상의 정수로 입력해 주세요.`);
        }
        if (iteration > orderSheetUtil.MAX_ITERATION) {
            return fail(`한 번에 최대 ${orderSheetUtil.MAX_ITERATION}회까지 가능합니다.`);
        }
    }

    const found = orderSheetUtil.findScroll(query);
    if (!found.scroll) {
        // 후보가 여럿이면 목록을 함께 준다. 웹은 이걸로 선택 UI 를 그리면 된다.
        if (found.candidates && found.candidates.length > 0) {
            const candidates = found.candidates.map((c) => ({
                number: c.number,
                label: orderSheetUtil.labelOf(c.scroll)
            }));
            const list = candidates.map((c) => `${c.number}. ${c.label}`).join("\n");
            return fail(
                `"${query}" 에 해당하는 주문서가 여러 개입니다. 번호로 선택해 주세요.\n\n${list}`,
                { candidates }
            );
        }
        return fail(`"${query}" 에 해당하는 주문서를 찾을 수 없습니다.\n전체 목록은 /주문서 로 확인하세요.`);
    }

    return {
        ok: true,
        scroll: found.scroll,
        label: orderSheetUtil.labelOf(found.scroll),
        notes: orderSheetUtil.groupNotesOf(found.scroll),
        iteration,
        result: orderSheetUtil.simulate(found.scroll, iteration)
    };
}

/** 반지 연마 시뮬레이션. 성공하면 그 자리에서 멈춘다. */
function ringPolish(levelRaw, stonesRaw, attemptsRaw) {
    const level = Number(levelRaw);
    const stones = Number(stonesRaw);
    const attempts = Number(attemptsRaw);

    const polish = Number.isInteger(level) ? ringPolishUtil.findPolish(level) : null;
    if (polish === null) {
        const levels = Object.keys(ringPolishUtil.POLISH_TABLE).join(", ");
        return fail(`연마 가능한 반지 레벨은 ${levels} 입니다.\n\n/연마석 [반지레벨] [연마석개수] [시도횟수]`);
    }
    if (!Number.isInteger(stones) || stones < 0 || stones > polish.maxStones) {
        return fail(`${level}→${polish.to}레벨 연마의 연마석 개수는 0 ~ ${polish.maxStones}개 사이의 정수입니다.`);
    }
    if (!Number.isInteger(attempts) || attempts < 1 || attempts > ringPolishUtil.MAX_ATTEMPTS) {
        return fail(`시도 횟수는 1 ~ ${ringPolishUtil.MAX_ATTEMPTS}회 사이의 정수입니다.`);
    }

    return {
        ok: true,
        level,
        polish,
        stones,
        attempts,
        rate: ringPolishUtil.successRateOf(polish, stones),
        mesoPerAttempt: ringPolishUtil.mesoPerAttemptOf(polish, stones),
        result: ringPolishUtil.simulate(polish, stones, attempts)
    };
}

const CASH_BOX_KEYS = Object.keys(cashProbability.CASH_BOXES);

/**
 * 캐시샵 확률형 아이템. 확률은 넥슨 공시 페이지에서 실시간으로 읽는다.
 * 스크래핑이 걸린 자리라 유일하게 async 다.
 */
async function cashBox(key, iterationRaw) {
    const box = cashProbability.CASH_BOXES[key];
    if (!box) return fail(`알 수 없는 상자입니다.`);

    const iteration = Number(iterationRaw);
    if (!Number.isInteger(iteration) || iteration < 1) {
        return fail(`횟수는 1 이상의 정수로 입력해 주세요.`);
    }
    if (iteration > cashProbability.MAX_ITERATION) {
        return fail(`${box.label} 시뮬레이션은 서버 과부하 방지를 위해 ${cashProbability.MAX_ITERATION.toLocaleString("ko-KR")}회까지 가능합니다.`);
    }

    let items;
    try {
        items = await cashProbability.fetchItems(box.url, box.cleanName);
    } catch (e) {
        console.error(`${box.label} 확률 조회 실패: ${e.message}`);
        return fail(`${box.label} 확률 정보를 넥슨에서 가져오지 못했습니다. 잠시 후 다시 시도해 주세요.`);
    }

    // 예전에는 스크래핑이 실패해도 빈 목록으로 진행해 "시도 횟수"만 찍힌
    // 성공 응답이 나갔다. 넥슨이 페이지를 바꿔도 아무도 눈치채지 못하던 원인이다.
    if (items.length === 0) {
        return fail(`${box.label} 확률 표를 읽지 못했습니다. 공시 페이지 구조가 바뀌었을 수 있습니다.`);
    }

    const counts = cashProbability.simulate(items, iteration, box);
    return {
        ok: true,
        box,
        iteration,
        rows: [...counts.entries()]
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
            .map(([name, count]) => ({ name, count })),
        cost: iteration * box.unitCost,
        totalQuantity: box.quantityUnit ? cashProbability.totalQuantity(counts) : null
    };
}

module.exports = {
    CASH_BOXES: cashProbability.CASH_BOXES,
    CASH_BOX_KEYS,
    orderSheetList,
    orderSheet,
    ringPolish,
    cashBox
};
