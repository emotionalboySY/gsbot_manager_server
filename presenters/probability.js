/**
 * 확률·시뮬레이션 봇 메시지 구성단.
 *
 * services/probability.js 가 돌려준 결과를 카카오톡용 텍스트로 옮긴다.
 * 계산은 하지 않는다 — 여기서 값을 다시 만지면 봇과 웹의 숫자가 갈라진다.
 *
 * 모든 함수는 { plain, markdown } 을 돌려준다. 방에 따라 봇이 골라 쓴다.
 */
const { RULE, addComma } = require('../utils/format.js');
const ringPolishUtil = require('../utils/ring_polish.js');

/** 주문서 전체 목록 + 사용법 */
function orderSheetList(data) {
    const usage = `/주문서 [번호 또는 이름] [횟수]\n- 횟수를 생략하면 1회, 최대 ${data.maxIteration}회`;
    let plain = `[게임 주문서 시뮬레이션]\n${usage}`;
    let markdown = `## 게임 주문서 시뮬레이션\n\n${usage}`;

    let category = null;
    for (const scroll of data.scrolls) {
        if (scroll.category !== category) {
            category = scroll.category;
            plain += `\n\n[${category}]`;
            markdown += `\n\n### ${category}`;
        }
        plain += `\n${scroll.number}. ${scroll.label}`;
        markdown += `\n${scroll.number}. ${scroll.label}`;
    }
    return { plain, markdown };
}

/** 주문서 시뮬 결과. 1회일 때는 뽑힌 옵션을 그대로, 여러 번이면 집계해서 보여준다. */
function orderSheetResult(data) {
    const { label, iteration, notes, result } = data;
    const noteText = notes.length > 0 ? `\n\n${notes.map((n) => `※ ${n}`).join("\n")}` : "";

    if (iteration === 1) {
        const gained = result.rolls[0];
        const body = gained === null ? "실패" : `성공 — ${gained.join(", ")}`;
        return {
            plain: `[${label}] 1회\n\n${body}${noteText}`,
            markdown: `## ${label}\n\n1회\n\n${body}${noteText}`
        };
    }

    const summary = `성공 ${result.success}회 / 실패 ${result.fail}회`;
    const details = [...result.counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([option, count]) => `${option} × ${count}`);
    const totals = [...result.totals.entries()]
        .map(([option, amount]) => `${option} +${addComma(amount)}`);

    // 세부 내역을 먼저, 합계를 구분선 뒤에 둔다 — 캐시샵 시뮬과 같은 흐름
    let plain = `[${label}] ${iteration}회\n\n${summary}`;
    let markdown = `## ${label}\n\n${iteration}회 · ${summary}`;

    if (details.length > 0) {
        plain += `\n\n[세부 내역]\n${details.join("\n")}`;
        markdown += `\n\n### 세부 내역\n${details.map((d) => `- ${d}`).join("\n")}`;
    }
    if (totals.length > 0) {
        plain += `\n\n${RULE}\n[붙은 옵션 합계]\n${totals.join("\n")}`;
        markdown += `\n\n${RULE}\n\n### 붙은 옵션 합계\n${totals.map((t) => `- ${t}`).join("\n")}`;
    }
    if (notes.length > 0) {
        plain += `\n\n${notes.map((n) => `※ ${n}`).join("\n")}`;
        markdown += `\n\n${notes.map((n) => `> ${n}`).join("\n")}`;
    }
    return { plain, markdown };
}

/** 반지 연마 결과 */
function ringPolishResult(data) {
    const { level, polish, stones, attempts, rate, mesoPerAttempt, result } = data;

    const head = [
        `연마석 ${addComma(stones)}개 · 성공 확률 ${rate}%`,
        `1회당 ${addComma(ringPolishUtil.toEok(mesoPerAttempt))}억 메소 · 최대 ${attempts}회 시도`
    ];
    const outcome = result.succeeded
        ? `${result.attempts}회 만에 성공했습니다!`
        : `${attempts}회 모두 실패했습니다.`;
    const spent = [
        `사용한 연마석: ${addComma(result.stonesUsed)}개`,
        `사용한 메소: ${addComma(ringPolishUtil.toEok(result.mesoUsed))}억`
    ];

    const title = `반지 연마 Lv.${level} → Lv.${polish.to}`;
    return {
        plain: `[${title}]\n${head.join("\n")}\n\n${RULE}\n${outcome}\n${spent.join("\n")}`,
        markdown: `## ${title}\n\n${head.map((h) => `- ${h}`).join("\n")}\n\n${RULE}\n\n**${outcome}**\n\n${spent.map((v) => `- ${v}`).join("\n")}`
    };
}

/** 캐시샵 확률형 아이템 결과. 뽑기 내역과 비용 요약을 구분선으로 가른다. */
function cashBoxResult(data) {
    const { box, iteration, rows, cost, totalQuantity } = data;
    const costText = addComma(cost);

    let message = `< ${box.label} 결과 >\n시도 횟수: ${addComma(iteration)}회\n`;
    let markdown = `## ${box.label}\n\n시도 횟수: ${addComma(iteration)}회\n`;
    for (const { name, count } of rows) {
        message += `\n${name}: ${addComma(count)}회`;
        markdown += `\n- ${name}: ${addComma(count)}회`;
    }

    const plainLines = [`총 사용 캐시: ${costText}원`, `(1개당 ${addComma(box.unitCost)}원 기준)`];
    const markdownLines = [`1개당 ${addComma(box.unitCost)}원 기준`];

    if (box.quantityUnit) {
        const line = `${box.quantityUnit}를 총 ${addComma(totalQuantity)}개 얻었어요!`;
        plainLines.push(line);
        markdownLines.push(line);
    }
    if (box.feverEvery) {
        const line = `${box.feverEvery}회마다 1개를 더 받는 피버 타임이 반영되어 있습니다.`;
        plainLines.push(`※ ${line}`);
        markdownLines.push(line);
    }

    // 마크다운에서 부가 설명을 그냥 줄바꿈으로 이으면 한 문단으로 합쳐질 수 있어
    // (CommonMark 의 soft break) 목록으로 낸다.
    const plainFooter = plainLines.join("\n");
    const markdownFooter = `**총 사용 캐시: ${costText}원**\n\n` + markdownLines.map((l) => `- ${l}`).join("\n");

    return {
        plain: `${message}\n\n${RULE}\n${plainFooter}`,
        markdown: `${markdown}\n\n${RULE}\n\n${markdownFooter}`
    };
}

module.exports = { orderSheetList, orderSheetResult, ringPolishResult, cashBoxResult };
