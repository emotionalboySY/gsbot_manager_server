const express = require('express');
const router = express.Router();
const time = require('../utils/time.js');
const json = require('../utils/json.js');

const orderSheet = require('../utils/order_sheet.js');
const cashProbability = require('../utils/cash_probability.js');

const orderSheetLabel = orderSheet.labelOf;

function renderOrderSheetList() {
    const usage = `[게임 주문서 시뮬레이션]\n/주문서 [번호 또는 이름] [횟수]\n- 횟수를 생략하면 1회, 최대 ${orderSheet.MAX_ITERATION}회`;
    let plain = usage;
    let markdown = `## 게임 주문서 시뮬레이션\n\n/주문서 [번호 또는 이름] [횟수]\n- 횟수를 생략하면 1회, 최대 ${orderSheet.MAX_ITERATION}회`;

    let category = null;
    orderSheet.ORDER_SHEETS.forEach((scroll, i) => {
        if (scroll.category !== category) {
            category = scroll.category;
            plain += `\n\n[${category}]`;
            markdown += `\n\n### ${category}`;
        }
        plain += `\n${i + 1}. ${orderSheetLabel(scroll)}`;
        markdown += `\n${i + 1}. ${orderSheetLabel(scroll)}`;
    });
    return { plain, markdown };
}

function renderOrderSheetResult(scroll, iteration, result) {
    const label = orderSheetLabel(scroll);
    const totals = [...result.totals.entries()]
        .map(([option, amount]) => `${option} +${AddComma(amount)}`);

    if (iteration === 1) {
        const gained = result.rolls[0];
        const body = gained === null ? "실패" : `성공 — ${gained.join(", ")}`;
        const oneNotes = orderSheet.groupNotesOf(scroll);
        const noteText = oneNotes.length > 0 ? `\n\n${oneNotes.map((n) => `※ ${n}`).join("\n")}` : "";
        return {
            plain: `[${label}] 1회\n\n${body}${noteText}`,
            markdown: `## ${label}\n\n1회\n\n${body}${noteText}`
        };
    }

    const summary = `성공 ${result.success}회 / 실패 ${result.fail}회`;
    const details = [...result.counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([option, count]) => `${option} × ${count}`);

    let plain = `[${label}] ${iteration}회\n\n${summary}`;
    let markdown = `## ${label}\n\n${iteration}회 · ${summary}`;
    const notes = orderSheet.groupNotesOf(scroll);

    if (totals.length > 0) {
        plain += `\n\n[붙은 옵션 합계]\n${totals.join("\n")}`;
        markdown += `\n\n### 붙은 옵션 합계\n${totals.map((t) => `- ${t}`).join("\n")}`;
    }
    if (details.length > 0) {
        plain += `\n\n[세부 내역]\n${details.join("\n")}`;
        markdown += `\n\n### 세부 내역\n${details.map((d) => `- ${d}`).join("\n")}`;
    }
    if (notes.length > 0) {
        plain += `\n\n${notes.map((n) => `※ ${n}`).join("\n")}`;
        markdown += `\n\n${notes.map((n) => `> ${n}`).join("\n")}`;
    }
    return { plain, markdown };
}

// 게임 주문서 시뮬레이션. 잠재능력 부여 스크롤류·기타는 옵션 부여가 아니라 대상에서 제외했다.
router.get('/orderSheet', async (req, res) => {
    const query = typeof req.query.query === 'string' ? req.query.query.trim() : '';
    const iterationRaw = req.query.iteration;

    console.log(`${time.getNowDateTime()} - 주문서(${query || '목록'}, ${iterationRaw || 1})`);

    if (!query) {
        const { plain, markdown } = renderOrderSheetList();
        return res.status(200).json(json.successWithMarkdown(plain, markdown));
    }

    let iteration = 1;
    if (iterationRaw !== undefined && iterationRaw !== '') {
        iteration = Number(iterationRaw);
        if (!Number.isInteger(iteration) || iteration < 1) {
            return res.status(200).json(json.failure(`횟수는 1 이상의 정수로 입력해 주세요.`));
        }
        if (iteration > orderSheet.MAX_ITERATION) {
            return res.status(200).json(json.failure(`한 번에 최대 ${orderSheet.MAX_ITERATION}회까지 가능합니다.`));
        }
    }

    const found = orderSheet.findScroll(query);
    if (!found.scroll) {
        if (found.candidates && found.candidates.length > 0) {
            const list = found.candidates
                .map((c) => `${c.number}. ${orderSheetLabel(c.scroll)}`)
                .join("\n");
            return res.status(200).json(json.failure(`"${query}" 에 해당하는 주문서가 여러 개입니다. 번호로 선택해 주세요.\n\n${list}`));
        }
        return res.status(200).json(json.failure(`"${query}" 에 해당하는 주문서를 찾을 수 없습니다.\n전체 목록은 /주문서 로 확인하세요.`));
    }

    const result = orderSheet.simulate(found.scroll, iteration);
    const { plain, markdown } = renderOrderSheetResult(found.scroll, iteration, result);
    return res.status(200).json(json.successWithMarkdown(plain, markdown));
});


// 캐시샵 확률형 아이템 5종. 확률은 넥슨 공시 페이지에서 실시간으로 읽어온다.
// 5개 라우트가 URL·라벨·단가만 다른 동일 구조였다.
Object.keys(cashProbability.CASH_BOXES).forEach((key) => {
    router.get(`/${key}`, async (req, res) => {
        const box = cashProbability.CASH_BOXES[key];
        const iteration = Number(req.query.iteration);

        console.log(`${time.getNowDateTime()} - ${box.label}(${req.query.iteration})`);

        if (!Number.isInteger(iteration) || iteration < 1) {
            return res.status(200).json(json.failure(`횟수는 1 이상의 정수로 입력해 주세요.`));
        }
        if (iteration > cashProbability.MAX_ITERATION) {
            return res.status(200).json(json.failure(
                `${box.label} 시뮬레이션은 서버 과부하 방지를 위해 ${AddComma(cashProbability.MAX_ITERATION)}회까지 가능합니다.`));
        }

        let items;
        try {
            items = await cashProbability.fetchItems(box.url, box.cleanName);
        } catch (e) {
            console.error(`${box.label} 확률 조회 실패: ${e.message}`);
            return res.status(200).json(json.failure(
                `${box.label} 확률 정보를 넥슨에서 가져오지 못했습니다. 잠시 후 다시 시도해 주세요.`));
        }

        // 예전에는 스크래핑이 실패해도 빈 목록으로 진행해 "시도 횟수"만 찍힌
        // 성공 응답이 나갔다. 넥슨이 페이지를 바꿔도 아무도 눈치채지 못하던 원인이다.
        if (items.length === 0) {
            return res.status(200).json(json.failure(
                `${box.label} 확률 표를 읽지 못했습니다. 공시 페이지 구조가 바뀌었을 수 있습니다.`));
        }

        const counts = cashProbability.simulate(items, iteration, box);
        const rows = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
        const cost = AddComma(iteration * box.unitCost);

        let message = `< ${box.label} 결과 >\n시도 횟수: ${AddComma(iteration)}회\n`;
        let markdown = `## ${box.label}\n\n시도 횟수: ${AddComma(iteration)}회\n`;
        for (const [name, count] of rows) {
            message += `\n${name}: ${AddComma(count)}회`;
            markdown += `\n- ${name}: ${AddComma(count)}회`;
        }

        let footer = `\n\n총 사용 캐시: ${cost}원\n(1개당 ${AddComma(box.unitCost)}원 기준)`;
        if (box.quantityUnit) {
            footer += `\n${box.quantityUnit}를 총 ${AddComma(cashProbability.totalQuantity(counts))}개 얻었어요!`;
        }
        if (box.feverEvery) {
            footer += `\n※ ${box.feverEvery}회마다 1개를 더 받는 피버 타임이 반영되어 있습니다.`;
        }

        return res.status(200).json(json.successWithMarkdown(message + footer, markdown + footer));
    });
});

function AddComma(data_value) {
    var txtNumber = '' + data_value; // 입력된 값을 문자열 변수에 저장합니다.

    if (isNaN(txtNumber) || txtNumber == '') {
        // 숫자 형태의 값이 정상적으로 입력되었는지 확인합니다.
        return;
    } else {
        var rxSplit = new RegExp('([0-9])([0-9][0-9][0-9][,.])'); // 정규식 형태 생성
        var arrNumber = txtNumber.split('.'); // 입력받은 숫자를 . 기준으로 나눔. (정수부와 소수부분으로 분리)
        arrNumber[0] += '.'; // 정수부 끝에 소수점 추가

        do {
            arrNumber[0] = arrNumber[0].replace(rxSplit, '$1,$2'); // 정수부에서 rxSplit 패턴과 일치하는 부분을 찾아 replace 처리
        } while (rxSplit.test(arrNumber[0])); // 정규식 패턴 rxSplit 가 정수부 내에 있는지 확인하고 있다면 true 반환. 루프 반복.

        if (arrNumber.length > 1) {
            // txtNumber를 마침표(.)로 분리한 부분이 2개 이상이라면 (즉 소수점 부분도 있다면)
            return arrNumber.join(''); // 배열을 그대로 합칩. (join 함수에 인자가 있으면 인자를 구분값으로 두고 합침)
        } else {
            // txtNumber 길이가 1이라면 정수부만 있다는 의미.
            return arrNumber[0].split('.')[0]; // 위에서 정수부 끝에 붙여준 마침표(.)를 그대로 제거함.
        }
    }
}



module.exports = router;