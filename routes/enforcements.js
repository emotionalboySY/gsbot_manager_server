const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const router = express.Router();
const mc = require('../utils/main_character.js');
const taj = require('../utils/time_and_json.js');

router.get('/superial', (req, res) => {

    const { start, goal, isStarCatch } = req.query;

    console.log(`${taj.getNowDateTime()} - 스타포스시뮬(슈페리얼, ${start}, ${goal}, ${isStarCatch})`);

    let success = false;
    let successM = '명령어 실행 결과: ';
    let content = '';

    // 스타캐치 없는 시뮬레이션 확률
    const proTSuccess = [50, 50, 45, 40, 40, 40, 40, 40, 40, 37, 35, 35, 3, 2];
    const proTBreak = [0, 0, 0, 0, 0, 1.8, 3, 4.2, 6, 9.5, 13, 16.3, 48.5, 49];
    // 스타캐치 있는 시뮬레이션 확률
    const proTSuccessSC = [
        52.5, 52.5, 47.25, 42, 42, 42, 42, 42, 42, 38.85, 36.75, 36.75, 3.15, 2.1,
    ];
    const proTBreakSC = [0, 0, 0, 0, 0, 1.74, 2.9, 4.06, 5.8, 9.22, 12.65, 15.86, 48.43, 48.95];

    // 각 parameter 값이 정해진 범위에 맞는지 검사 - 맞다면 강화 진행, 틀리면 오류 메시지 전송
    if (
        start >= 0 &&
        start <= 15 &&
        goal >= 0 &&
        goal <= 15 &&
        (isStarCatch == 0 || isStarCatch == 1)
    ) {
        // 시뮬레이션 진행을 위한 초기 변수 설정
        let curLev = start;
        let totalCost = 0;
        let curCost = 55832200;
        let sCount = 0;
        let fCount = 0;
        let bCount = 0;
        let cCount = 0;
        let curSuccess, curBreak;
        let failStack = 0;

        // 결과 전달을 위한 string 변수 선언
        let isStarCatchS;

        // 스타캐치 적용 여부에 대한 string 결정
        if (isStarCatch == 1) {
            isStarCatchS = '적용';
        } else isStarCatchS = '미적용';

        // 시작 또는 목표 강화단계가 14를 초과한다면, 과부하 방지 메시지 전송
        if (start >= 14 || goal == 15) {
            success = false;
            content =
                '타일런트 시뮬레이션은 서버 과부하 방지를 위해 14성까지만 가능합니다.\n\n다시 시도해 주세요.';
        } else if (start >= goal) {
            success = false;
            content =
                '타일런트 시뮬레이션의 목표 강화 수치는 시작 강화 수치보다 항상 높아야 합니다.\n\n다시 시도해 주세요.';
        } else {
            success = true;
            // ************ 강화 시뮬레이션 시작 ************
            while (curLev < goal) {
                // 스타캐치가 적용된다면, 스타캐치가 적용된 확률로 설정
                if (isStarCatch) {
                    curSuccess = proTSuccessSC[curLev] / 100;
                    curBreak = proTBreakSC[curLev] / 100;
                } else {
                    curSuccess = proTSuccess[curLev] / 100;
                    curBreak = proTBreak[curLev] / 100;
                }
                // 연속 2회 실패한다면, 찬스타임으로 성공확률 100%
                if (failStack == 2) {
                    curSuccess = 1;
                    cCount++;
                }
                // 랜덤값이 성공확률수치보다 낮다면 성공 후 성공횟수 1 증가
                if (Math.random() <= curSuccess) {
                    curLev++;
                    sCount++;
                    failStack = 0;
                }
                // 랜덤값이 성공확률수치보다 높다면 실패 또는 파괴 여부 결정
                else {
                    // 랜덤값이 파괴확률수치보다 낮다면 레벨은 0, 파괴횟수 1 증가
                    if (Math.random() <= curBreak) {
                        curLev = 0;
                        bCount++;
                    }
                    // 랜덤값이 파괴확률수치보다 높다면 레벨은 1 감소, 레벨이 0이라면 감소하지 않음, 실패횟수 1 증가, 연속실패횟수 1 증가
                    else {
                        curLev--;
                        if (curLev < 0) {
                            curLev = 0;
                        }
                        fCount++;
                        failStack++;
                    }
                }
                // 강화 시도 시 마다 정해진 비용을 총 비용에 추가
                totalCost = totalCost + curCost;
            }
            // ************ 강화 시뮬레이션 종료 ************
            //const totalCostLocale = Number(totalCost).toLocaleString("ko");    // 총 비용을 한국식 숫자 표기에 맞게 변경
            const totalCostLocaleT = AddComma(totalCost);

            // 전송할 message 변수에 각각의 강화 결과 추가
            content = '<타일런트 시뮬레이션 완료>\n';
            content = content + start + '성부터 ' + goal + '성까지 진행\n';
            content = content + '스타캐치 적용 여부: ' + isStarCatchS + '\n\n';
            content = content + '성공 횟수: ' + sCount + '회\n';
            content = content + '실패 횟수: ' + fCount + '회\n';
            content = content + '찬스 타임: ' + cCount + '회\n';
            content = content + '파괴 횟수: ' + bCount + '회\n\n';
            content = content + '총 강화 비용: ' + totalCostLocaleT + '메소';
        }
    }
    // 각 parameter 값 중 하나라도 정상 범위로 입력되지 않은 경우, 오류 메시지 전송
    else {
        success = false;
        content =
            '명령어를 잘못 입력하셨습니다. 타일런트시뮬 명령어는 아래의 규칙에 따라 작성하셔야 합니다.\n\n<타일런트시뮬 명령어 사용 방법>\n"/타일런트시뮬 [n성부터] [m성까지] [스타캐치]"\n\n[n성부터]: 1 ~ 14 사이의 숫자\n[m성까지]: 1 ~ 14 사이의 숫자\n[스타캐치]: 스타캐치 적용 - 1 / 스타캐치 미적용 - 0\n\n타일런트 시뮬레이션은 서버 과부하 방지를 위해 14성까지만 가능합니다.';
    }

    if (success) {
        successM = `${successM}성공`;
    } else {
        successM = `${successM}실패`;
    }

    res.status(200).json({
        resultRaw: `${successM}\n\n${content}`,
        result: encodeURIComponent(`${successM}\n\n${content}`),
    });
});

router.get('/starForce', (req, res) => {

    const { itemLev, startForce, goalForce, isStarCatch, isEvent, isBreakShield } = req.query;

    console.log(`${taj.getNowDateTime()} - 스타포스시뮬(${itemLev}, ${startForce}, ${goalForce}, ${isStarCatch}, ${isEvent}, ${isBreakShield})`);

    let success = false;
    let successM = '명령어 실행 결과: ';
    let content = '';

    // 스타캐치 없는 시뮬레이션 확률
    ////////////////////  0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14,  15,  16,  17,  18,  19,   20,    21, 22, 23, 24, 25,   26, 27,   28,   29
    const proNSuccess = [95, 90, 85, 85, 80, 75, 70, 65, 60, 55, 50, 45, 40, 35, 30,  30,  30,  15,  15,  15,   30,    15, 15, 10, 10, 10,    7,  5,    3,    1];
    const proNBreak =   [ 0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0, 2.1, 2.1, 6.8, 6.8, 8.5, 10.5, 12.75, 17, 18, 18, 18, 18.6, 19, 19.4, 19.8];

    if (
        ((itemLev >= 138 && itemLev <= 200) || itemLev == 250) &&
        startForce >= 0 &&
        startForce <= 28 &&
        goalForce >= 0 &&
        goalForce <= 29 &&
        (isStarCatch == 0 || isStarCatch == 1) &&
        isEvent >= 0 &&
        isEvent <= 4 &&
        (isBreakShield == 0 || isBreakShield == 1)
    ) {
        success = true;
        // 시뮬레이션 진행을 위한 초기 변수 설정
        let forceLimit = 29;
        let curForce = startForce;
        let curSuccess, curBreak;
        let successCount = 0;
        let failureCount = 0;
        let brokenCount = 0;
        let totalCostN = 0;
        let curCost, costA, costB, curCostRound;
        let disCost, disCostRound;
        let resCost;
        let isOutofBound = false;

        // 결과 전달을 위한 string 변수 선언
        let isStarCatchS, isEventS, isBreakShieldS;

        // 입력된 목표 스타포스 수치가 최대 강화 가능 수치보다 높으면, 목표 스타포스 수치를 최대 강화 가능 수치로 설정
        if (goalForce > forceLimit) {
            goalForce = forceLimit;
            isOutofBound = true;
        }

        // 스타캐치, 이벤트, 파괴방지 적용 여부에 대한 string 결정
        if (isStarCatch == 1) {
            isStarCatchS = '적용';
        } else isStarCatchS = '미적용';

        switch (isEvent) {
            case 1:
                isEventS = '상시 30% 할인';
                break;
            case 2:
                isEventS = '10성까지 1+1 강화';
                break;
            case 3:
                isEventS = '21성 이하에서 파괴 확률 30% 감소';
                break;
            case 4:
                isEventS = '샤이닝 스타포스';
                break;
            default:
                isEventS = '미적용';
                break;
        }

        switch (isBreakShield) {
            case 1:
                isBreakShieldS = '15 ~ 18성 적용';
                break;
            default:
                isBreakShieldS = '미적용';
                break;
        }

        // 시작 또는 목표 강화 단계가 29를 초과한다면, 과부하 방지 메시지 전송
        if (startForce >= 29 || goalForce > 29) {
            success = false;
            content =
                '스타포스 시뮬레이션은 서버 과부하 방지를 위해 29성까지만 가능합니다.\n\n다시 시도해 주세요.';
        }
        // 목표 강화 단계가 시작 강화 단계보다 작거나 같다면, 오류 메시지 전송
        else if (goalForce <= startForce) {
            success = false;
            content =
                '스타포스 시뮬레이션의 목표 달성 수치는 시작 수치보다 항상 커야 합니다.\n\n다시 시도해 주세요.';
        } else {
            // ************ 강화 시뮬레이션 시작 ************
            while (curForce < goalForce) {
                // ********** 강화 확률 설정 시작 **********
                // 스타캐치가 적용된다면, 스타캐치가 적용된 확률로 설정
                if (isStarCatch) {
                    curSuccess = roundTo((proNSuccess[curForce] / 100) * 1.05, 4);
                    curBreak = roundTo((1 - curSuccess) * (proNBreak[curForce] / 100 / (1 - curSuccess)), 4);
                } else {
                    curSuccess = proNSuccess[curForce] / 100;
                    curBreak = proNBreak[curForce] / 100;
                }

                // 파괴 확률 30% 감소를 적용한 경우 21성까지에 한해 파괴 확률 30% 감소(성공 확률이 늘어나지는 않음)
                if (isEvent == 3 || isEvent == 4) {
                    curBreak = roundTo(curBreak * 0.7, 4);
                }
                // ********** 강화 확률 설정 종료 **********

                // ********** 강화 비용 설정 시작 **********
                let denominator = 0;
                let exponent = 2.7;

                // 현재 강화 단계에 따른 강화 비용 설정 및 100의 자리까지 반올림
                switch (true) {
                    case curForce <= 9:
                        denominator = 36;
                        exponent = 1;
                        break;
                    case curForce == 10:
                        denominator = 571;
                        break;
                    case curForce == 11:
                        denominator = 374;
                        break;
                    case curForce == 12:
                        denominator = 214;
                        break;
                    case curForce == 13:
                        denominator = 157;
                        break;
                    case curForce == 14:
                        denominator = 107;
                        break;
                    case curForce == 15 || curForce == 16:
                        denominator = 200;
                        break;
                    case curForce == 17:
                        denominator = 150;
                        break;
                    case curForce == 18:
                        denominator = 70;
                        break;
                    case curForce == 19:
                        denominator = 45;
                        break;
                    case curForce == 20:
                        denominator = 200;
                        break;
                    case curForce == 21:
                        denominator = 125;
                        break;
                    default:
                        denominator = 200;
                        break;
                }
                curCost = 1000 + (Math.pow(itemLev, 3) * Math.pow(curForce + 1, exponent) / denominator);
                curCostRound = roundTo(curCost, -2);

                // 스타포스 30% 할인 적용 중인 경우의 할인 가격 계산 및 반올림
                disCost = curCost * 0.7;
                disCostRound = roundTo(disCost, -2);

                // 반올림된 값을 다시 원래 변수에 저장
                curCost = curCostRound;
                disCost = disCostRound;

                // 30% 상시 할인 또는 샤이닝 스타포스를 적용한 경우 강화 비용에 할인된 비용을 적용.
                if (isEvent == 1 || isEvent == 4) {
                    resCost = disCost;
                } else {
                    resCost = curCost;
                }

                // 파괴방지 옵션이 15 ~ 18로 적용되어 있는 경우의 비용 계산. 현재 비용에 기존 비용 x2를 추가 및 파괴 확률 0으로 변경.
                if (isBreakShield == 1 && curForce >= 15 && curForce <= 18) {
                    resCost += curCost * 2;
                    curBreak = 0;
                }
                // ********** 강화 비용 설정 종료 **********

                // console.log(`------\n현재 레벨: ${curForce}\n성공 확률: ${curSuccess}\n파괴 확률: ${curBreak}\n강화 비용: ${resCost}`);

                // ********** 강화 시작 **********
                if (Math.random() <= curSuccess) {
                    // 10성까지 1+1 이벤트 적용 중인 경우, 성공 시 강화 수치 2 증가.
                    if (isEvent == 2 && curForce <= 10) {
                        curForce += 2;
                    } else curForce++;
                    successCount++;

                    // console.log(`\n강화 성공 >>> ${curForce}성\n`);
                }
                // 실패 후 파괴된다면, 강화 수치 12로 초기화 및 파괴 횟수 증가.
                else if (Math.random() <= curBreak) {
                    curForce = 12;
                    brokenCount++;
                    // console.log(`\n강화 실패(파괴) >>> ${curForce}성\n`);
                }
                // 단순 실패라면 현재 강화 수치 유지하고, 실패 횟수 증가
                else {
                    failureCount++;
                    // console.log(`\n강화 실패 >>> ${curForce}성\n`);
                }

                totalCostN = totalCostN + resCost;
            }

            // ************ 강화 시뮬레이션 종료 ************

            // 총 강화 비용을 한국식 숫자 표기에 맞게 설정
            const totalCostLocaleN = AddComma(totalCostN);

            // 전송할 메시지 구성
            content = '<스타포스 시뮬레이션 완료>\n\n';
            if (isOutofBound) {
                message =
                    message +
                    '(시뮬레이션 목표 강화 수치가 아이템 레벨 제한에 맞지 않아 조정되었습니다.)\n\n';
            }
            content = content + itemLev + '레벨 아이템을\n';
            content = content + startForce + '성부터 ' + goalForce + '성까지 진행\n';
            content = content + '스타캐치 적용 여부: ' + isStarCatchS + '\n';
            content = content + '이벤트 적용 여부: ' + isEventS + '\n';
            content = content + '파괴방지 적용 여부: ' + isBreakShieldS + '\n\n';
            content = content + '성공 횟수: ' + successCount + '회\n';
            content = content + '실패 횟수: ' + failureCount + '회\n';
            content = content + '파괴 횟수: ' + brokenCount + '회\n\n';
            content = content + '총 강화 비용: ' + totalCostLocaleN + '메소';
        }
    }
    // 각 parameter 값 중 하나라도 정상 범위로 입력되지 않은 경우, 오류 메시지 전송
    else {
        success = false;
        content =
            '명령어를 잘못 입력하셨습니다. 스타포스시뮬 명령어는 아래의 규칙에 따라 작성하셔야 합니다.\n\n<스타포스시뮬 명령어 사용 방법>\n"/스타포스시뮬 [a렙제템을] [n성부터] [m성까지] [스타캐치] [이벤트] [파괴방지]"\n\n[a렙제템을]: 0 ~ 250 사이의 숫자\n[n성부터]: 1 ~ 29 사이의 숫자\n[m성까지]: 1 ~ 29 사이의 숫자\n[스타캐치]: 스타캐치 적용 - 1 / 스타캐치 미적용 - 0\n[이벤트]: 이벤트 미적용 - 0 / 상시 30% 할인 - 1 / 10성까지 1+1 강화 - 2 / 21성 이하 파괴확률 30% 감소 - 3 / 샤이닝 스타포스 - 4\n[파괴방지]: 파괴방지 미적용 - 0 / 15 ~ 18성 적용 - 1\n\n스타포스 시뮬레이션은 서버 과부하 방지를 위해 29성까지만 가능합니다.';
    }

    if (success) {
        successM = `${successM}성공`;
    } else {
        successM = `${successM}실패`;
    }

    res.status(200).json({
        resultRaw: `${successM}\n\n${content}`,
        result: encodeURIComponent(`${successM}\n\n${content}`),
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

function roundTo(num, digits) {
    const factor = Math.pow(10, digits);
    // console.log(`num: ${num}`);
    // console.log(`digits: ${digits}`);
    // console.log(`factor: ${factor}`);
    // console.log(Math.round(num * factor) / factor);
    return Math.round(num * factor) / factor;
}

module.exports = router;