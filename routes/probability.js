const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const router = express.Router();
const taj = require('../utils/time_and_json.js');

router.get('/royal', async (req, res) => {

    const { iteration } = req.query;

    console.log(`${taj.getNowDateTime()} - 로얄스타일(${iteration})`);
    let result = {};

    // let royal_list = [
    //     {
    //         index: 0,
    //         cumulativeProb: 0.025,
    //         name: '[스페셜 라벨] 달걀 마라카스',
    //         time: 0,
    //     },
    //     {
    //         index: 1,
    //         cumulativeProb: 0.055,
    //         name: '[스페셜 라벨] 짤랑짤랑 스타',
    //         time: 0,
    //     },
    //     {
    //         index: 2,
    //         cumulativeProb: 0.087,
    //         name: '[스페셜 라벨] 짤랑 달걀 운동화',
    //         time: 0,
    //     },
    //     {index: 3, cumulativeProb: 0.119, name: '[스페셜 라벨] 룰루 달걀/랄라 달걀', time: 0},
    //     {index: 4, cumulativeProb: 0.15, name: '[스페셜 라벨] 짤랑 달걀 캡/짤랑 반숙 달걀', time: 0},
    //     {index: 5, cumulativeProb: 0.185, name: '쿨톤 동글/웜톤 동글', time: 0},
    //     {index: 6, cumulativeProb: 0.21, name: '아지트 머리띠', time: 0},
    //     {index: 7, cumulativeProb: 0.23, name: '아지트 소년/아지트 소녀', time: 0},
    //     {index: 8, cumulativeProb: 0.255, name: '호신용 스니커즈', time: 0},
    //     {index: 9, cumulativeProb: 0.305, name: '아지트 구두', time: 0},
    //     {index: 10, cumulativeProb: 0.355, name: '깐깐한 마법사', time: 0},
    //     {index: 11, cumulativeProb: 0.405, name: '깐깐 떡볶이 외투/깐깐 떡볶이 코트', time: 0},
    //     {index: 12, cumulativeProb: 0.455, name: '깐깐한 신발/깐깐한 구두', time: 0},
    //     {index: 13, cumulativeProb: 0.485, name: '깐깐한 꼬리표', time: 0},
    //     {index: 14, cumulativeProb: 0.535, name: '깐깐한 색연필', time: 0},
    //     {index: 15, cumulativeProb: 0.565, name: '냄새가 났어!!', time: 0},
    //     {index: 16, cumulativeProb: 0.58, name: '엔젤릭 그레이', time: 0},
    //     {index: 17, cumulativeProb: 0.6, name: '동백검', time: 0},
    //     {index: 18, cumulativeProb: 0.65, name: '동백 송이', time: 0},
    //     {index: 19, cumulativeProb: 0.7, name: '동백 베일', time: 0},
    //     {index: 20, cumulativeProb: 0.75, name: '파깅스', time: 0},
    //     {index: 21, cumulativeProb: 0.8, name: '카키 야상코트', time: 0},
    //     {index: 22, cumulativeProb: 0.85, name: '[30일] 동백검 말풍선반지 교환권', time: 0},
    //     {index: 23, cumulativeProb: 0.9, name: '[30일] 동백검 명찰반지 교환권', time: 0},
    //     {index: 24, cumulativeProb: 0.95, name: '우르르 스태프 이펙트 교환권', time: 0},
    //     {index: 25, cumulativeProb: 1, name: "흑단나무 의자", time: 0},
    // ];

    let royalItemsRaw = [];

    try {
        const url = 'https://maplestory.nexon.com/Guide/CashShop/Probability/RoyalStyle';
        const {data} = await axios.get(url);
        const $ = cheerio.load(data);

        let indexNum = 0;

        $('table tr').each((_, el) => {
            const tds = $(el).find('td');
            let rawName = "", rawProb = "";

            if (tds.length === 3) {
                rawName = tds.eq(1).text().trim();
                rawProb = tds.eq(2).text().trim();
            } else if (tds.length === 2) {
                rawName = tds.eq(0).text().trim();
                rawProb = tds.eq(1).text().trim();
            }

            if(rawName && rawProb && rawProb.includes('%')) {
                royalItemsRaw.push({ index: indexNum, itemName: rawName, probability: rawProb, time: 0 });
                indexNum++;
            }
        });
    } catch (error) {
        console.error('Error fetching data:', error);
    }

    // console.log(royalItemsRaw);

    let cumulative = 0;
    const royal_list = royalItemsRaw.map(({ index, itemName, probability, time }) => {
        const name = cleanItemName(itemName);
        const prob = parseProbability(probability);
        // console.log(prob);
        cumulative += prob;
        const indexNum = index;
        return {
            index: indexNum,
            itemName: name,
            cumulativeProb: parseFloat(cumulative.toFixed(3)),
            time: 0
        };
    });

    // console.log(royal_list);

    if (iteration > 1000000) {
        result = {
            success: false,
            result: encodeURIComponent(
                '로얄스타일 시뮬레이션은 서버 과부하 방지를 위해 1,000,000회까지 가능합니다.'
            ),
        };
    } else {
        for (let i = 0; i < iteration; i++) {
            let pick = Math.random();

            for (const probConfig of royal_list) {
                if (pick < probConfig.cumulativeProb) {
                    royal_list[probConfig.index].time++;
                    break;
                }
            }
        }

        let iteration_locale = AddComma(iteration);
        let royal_list_time_locale;
        let cost = AddComma(iteration * 2200);

        let message = `< 메이플 로얄 스타일 결과 >\n시도 횟수: ${iteration}회\n\n`;

        for (let i = 0; i < royal_list.length; i++) {
            if (royal_list[i].time != 0) {
                royal_list_time_locale = AddComma(royal_list[i].time);
                message = `${message}${royal_list[i].itemName}: ${royal_list_time_locale}회\n`;
            }
        }

        message = `${message}\n총 사용 캐시: ${cost}원`;

        result = {
            success: true,
            resultRaw: message,
            result: encodeURIComponent(message),
        };
    }

    res.status(200).json(result);
});

router.get('/wonder', async (req, res) => {

    const { iteration } = req.query;

    console.log(`${taj.getNowDateTime()} - 원더베리(${iteration})`);
    let result = {};

    // let wonder_list = [
    //     {index: 0, cumulativeProb: 0.0332, name: '[원더 블랙] 바나나 햄이', time: 0},
    //     {index: 1, cumulativeProb: 0.0664, name: '[원더 블랙] 딸기 꿀이', time: 0},
    //     {index: 2, cumulativeProb: 0.0996, name: '[원더 블랙] 초코 몽이', time: 0},
    //     {index: 3, cumulativeProb: 0.2196, name: '초코코', time: 0},
    //     {index: 4, cumulativeProb: 0.3396, name: '설탕탕', time: 0},
    //     {index: 5, cumulativeProb: 0.4596, name: '보보 유령이', time: 0},
    //     {index: 6, cumulativeProb: 0.5796, name: '노노 유령이', time: 0},
    //     {index: 7, cumulativeProb: 0.6996, name: '파파 유령이', time: 0},
    //     {index: 8, cumulativeProb: 0.8698, name: '고농축 프리미엄 생명의 물', time: 0},
    //     {index: 9, cumulativeProb: 1, name: '오가닉 원더 쿠키', time: 0},
    // ];

    let wonderItemsRaw = [];

    try {
        const url = 'https://maplestory.nexon.com/Guide/CashShop/Probability/WispsWonderBerry';
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        let indexNum = 0;

        const tables = $('table');
        const targetTable = tables.length >= 2 ? tables.eq(1) : tables.eq(0);

        targetTable.find('tr').each((_, el) => {
            const tds = $(el).find('td');
            let rawName = "", rawProb = "";

            if (tds.length === 3) {
                rawName = tds.eq(1).text().trim();
                rawProb = tds.eq(2).text().trim();
            } else if (tds.length === 2) {
                rawName = tds.eq(0).text().trim();
                rawProb = tds.eq(1).text().trim();
            }

            if(rawName && rawProb && rawProb.includes('%')) {
                if(indexNum < 3) {
                    rawName = "[원더 블랙] " + rawName;
                }
                wonderItemsRaw.push({ index: indexNum, itemName: rawName, probability: rawProb, time: 0});
                indexNum++;
            }
        });
    } catch (error) {
        console.error('Error fetching data:', error);
    }

    let cumulative = 0;
    const wonder_list = wonderItemsRaw.map(({ index, itemName, probability, time }) => {
        const name = cleanItemName(itemName);
        const prob = parseProbability(probability);
        cumulative += prob;
        const indexNum = index;
        return {
            index: indexNum,
            itemName: name,
            cumulativeProb: parseFloat(cumulative.toFixed(3)),
            time: 0
        };
    });

    if (iteration > 1000000) {
        result = {
            success: false,
            result: encodeURIComponent(
                '위습의 원더베리 시뮬레이션은 서버 과부하 방지를 위해 1,000,000회까지 가능합니다.'
            ),
        };
    } else {
        for (let i = 0; i < iteration; i++) {
            let pick = Math.random();

            for (const probConfig of wonder_list) {
                if (pick < probConfig.cumulativeProb) {
                    wonder_list[probConfig.index].time++;
                    break;
                }
            }
        }

        let iteration_locale = AddComma(iteration);
        let wonder_list_time_locale;
        let cost = AddComma(iteration * 5400);

        let message = `< 위습의 원더베리 결과 >\n시도 횟수: ${iteration}회\n\n`;

        for (let i = 0; i < wonder_list.length; i++) {
            if (wonder_list[i].time != 0) {
                wonder_list_time_locale = AddComma(wonder_list[i].time);
                message = `${message}${wonder_list[i].itemName}: ${wonder_list_time_locale}회\n`;
            }
        }

        message = `${message}\n총 사용 캐시: ${cost}원`;

        result = {
            success: true,
            resultRaw: message,
            result: encodeURIComponent(message),
        };
    }

    res.status(200).json(result);
});

router.get('/goldApple', async (req, res) => {

    const { iteration } = req.query;

    console.log(`${taj.getNowDateTime()} - 골드애플(${iteration})`);
    let result = [];

    let goldItemsRaw = [];

    try {
        const url = `https://maplestory.nexon.com/Guide/CashShop/Probability/GoldApple`;
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        let indexNum = 0;

        $('table tr').each((_, el) => {
            const tds = $(el).find('td');
            let rawName = "", rawProb = "";

            if (tds.length === 3) {
                rawName = tds.eq(1).text().trim();
                rawProb = tds.eq(2).text().trim();
            } else if (tds.length === 2) {
                rawName = tds.eq(0).text().trim();
                rawProb = tds.eq(1).text().trim();
            }

            if(rawName && rawProb && rawProb.includes('%')) {
                goldItemsRaw.push({ index: indexNum, itemName: rawName, probability: rawProb, time: 0});
                indexNum++;
            }
        });
    } catch (error) {
        console.error('Error fetching data:', error);
    }

    let cumulative = 0;
    const gold_list = goldItemsRaw.map(({ index, itemName, probability, time}) => {
        const name = itemName;
        const prob = parseProbability(probability);
        cumulative += prob;
        const indexNum = index;
        return {
            index: indexNum,
            itemName: name,
            cumulativeProb: parseFloat(cumulative.toFixed(6)),
            time: 0
        };
    });

    if (iteration > 1000000) {
        result = {
            success: false,
            resultRaw: `골드애플 시뮬레이션은 서버 과부하 방지를 위해 1,000,000회까지 가능합니다.`,
            result: encodeURIComponent(`골드애플 시뮬레이션은 서버 과부하 방지를 위해 1,000,000회까지 가능합니다.`),
        };
    } else {
        for (let i = 0; i < iteration; i++) {
            let pick = Math.random();

            for (const probConfig of gold_list) {
                if (pick < probConfig.cumulativeProb) {
                    gold_list[probConfig.index].time++;
                    break;
                }
            }
        }

        let iteration_locale = AddComma(iteration);
        let gold_list_time_locale;
        let cost = AddComma(iteration * 540);

        let message = `< 골드애플 결과 >\n시도 횟수: ${iteration}회\n\n`;

        for (let i = 0; i < gold_list.length; i++) {
            if (gold_list[i].time != 0) {
                gold_list_time_locale = AddComma(gold_list[i].time);
                message = `${message}${gold_list[i].itemName}: ${gold_list_time_locale}회\n`;
            }
        }

        message = `${message}\n총 사용 캐시: ${cost}원\n(1개당 540원 기준)`;

        result = {
            success: true,
            resultRaw: message,
            result: encodeURIComponent(message),
        };
    }

    res.status(200).json(result);
});

router.get('/platinumApple', async (req, res) => {

    const { iteration } = req.query;

    console.log(`${taj.getNowDateTime()} - 플래티넘애플(${iteration})`);
    let result = [];

    let platinumItemsRaw = [];

    try {
        const url = `https://maplestory.nexon.com/Guide/CashShop/Probability/PlatinumApple`;
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        let indexNum = 0;

        $('table tr').each((_, el) => {
            const tds = $(el).find('td');
            let rawName = "", rawProb = "";

            if (tds.length === 3) {
                rawName = tds.eq(1).text().trim();
                rawProb = tds.eq(2).text().trim();
            } else if (tds.length === 2) {
                rawName = tds.eq(0).text().trim();
                rawProb = tds.eq(1).text().trim();
            }

            if(rawName && rawProb && rawProb.includes('%')) {
                platinumItemsRaw.push({ index: indexNum, itemName: rawName, probability: rawProb, time: 0});
                indexNum++;
            }
        });
    } catch (error) {
        console.error('Error fetching data:', error);
    }

    let cumulative = 0;
    const platinum_list = platinumItemsRaw.map(({ index, itemName, probability, time}) => {
        const name = itemName;
        const prob = parseProbability(probability);
        cumulative += prob;
        const indexNum = index;
        return {
            index: indexNum,
            itemName: name,
            cumulativeProb: parseFloat(cumulative.toFixed(6)),
            time: 0
        };
    });

    if (iteration > 1000000) {
        result = {
            success: false,
            resultRaw: `플래티넘애플 시뮬레이션은 서버 과부하 방지를 위해 1,000,000회까지 가능합니다.`,
            result: encodeURIComponent(`플래티넘애플 시뮬레이션은 서버 과부하 방지를 위해 1,000,000회까지 가능합니다.`),
        };
    } else {
        for (let i = 0; i < iteration; i++) {
            let pick = Math.random();

            for (const probConfig of platinum_list) {
                if (pick < probConfig.cumulativeProb) {
                    platinum_list[probConfig.index].time++;
                    break;
                }
            }
        }

        let iteration_locale = AddComma(iteration);
        let platinum_list_time_locale;
        let cost = AddComma(iteration * 3500);

        let message = `< 골드애플 결과 >\n시도 횟수: ${iteration}회\n\n`;

        for (let i = 0; i < platinum_list.length; i++) {
            if (platinum_list[i].time != 0) {
                platinum_list_time_locale = AddComma(platinum_list[i].time);
                message = `${message}${platinum_list[i].itemName}: ${platinum_list_time_locale}회\n`;
            }
        }

        message = `${message}\n총 사용 캐시: ${cost}원\n(1개당 3,500원 기준)`;

        result = {
            success: true,
            resultRaw: message,
            result: encodeURIComponent(message),
        };
    }

    res.status(200).json(result);
});

router.get('/boutique', async (req, res) => {

    const { iteration } = req.query;

    console.log(`${taj.getNowDateTime()} - 부티크기프트(${iteration})`);
    let result = [];

    let boutiqueItemsRaw = [];

    try {
        const url = `https://maplestory.nexon.com/Guide/CashShop/Probability/BoutiqueGift`;
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        let indexNum = 0;

        $('table tr').each((_, el) => {
            const tds = $(el).find('td');
            let rawName = "", rawProb = "";

            if (tds.length === 3) {
                rawName = tds.eq(1).text().trim();
                rawProb = tds.eq(2).text().trim();
            } else if (tds.length === 2) {
                rawName = tds.eq(0).text().trim();
                rawProb = tds.eq(1).text().trim();
            }

            if(rawName && rawProb && rawProb.includes('%')) {
                boutiqueItemsRaw.push({ index: indexNum, itemName: rawName, probability: rawProb, time: 0, fever: 0});
                indexNum++;
            }
        });
    } catch (error) {
        console.error('Error fetching data:', error);
    }

    let cumulative = 0;
    const boutique_list = boutiqueItemsRaw.map(({ index, itemName, probability, time, fever}) => {
        const name = itemName;
        const prob = parseProbability(probability);
        cumulative += prob;
        const indexNum = index;
        const feverNum = fever;
        return {
            index: indexNum,
            itemName: name,
            cumulativeProb: parseFloat(cumulative.toFixed(6)),
            time: 0,
            fever: feverNum
        };
    });

    if (iteration > 1000000) {
        result = {
            success: false,
            resultRaw: `부티크기프트 시뮬레이션은 서버 과부하 방지를 위해 1,000,000회까지 가능합니다.`,
            result: encodeURIComponent(`부티크기프트 시뮬레이션은 서버 과부하 방지를 위해 1,000,000회까지 가능합니다.`),
        };
    } else {
        let feverTime = 1;
        for (let i = 0; i < iteration; i++) {
            let pick = Math.random();

            for (const probConfig of boutique_list) {
                if (pick < probConfig.cumulativeProb) {
                    boutique_list[probConfig.index].time++;
                    if(feverTime == 10) {
                        boutique_list[probConfig.index].time++;
                        boutique_list[probConfig.index].fever++;
                        feverTime = 1;
                    } else {
                        feverTime++;
                    }
                    break;
                }
            }
        }

        let iteration_locale = AddComma(iteration);
        let boutique_list_time_locale;
        let cost = AddComma(iteration * 3300);

        let message = `< 부티크 기프트 결과 >\n시도 횟수: ${iteration}회\n\n`;

        let totalAmount = 0;

        for (let i = 0; i < boutique_list.length; i++) {
            if (boutique_list[i].time != 0) {
                let name = boutique_list[i].itemName;
                let amountRaw = name.match(/\d+/);
                let amount = amountRaw ? parseInt(amountRaw[0], 10) : 0;
                totalAmount += (amount * boutique_list[i].time);
                boutique_list_time_locale = AddComma(boutique_list[i].time);
                message = `${message}${boutique_list[i].itemName}: ${boutique_list_time_locale}회\n`;
                if(boutique_list[i].fever != 0) {
                    message = `${message}(피버 타임으로 2배 획득: ${boutique_list[i].fever}회)\n`;
                }
            }
        }

        message = `${message}\n총 사용 캐시: ${cost}원\n(1개당 3,300원 기준)\n달콤 생일 케이크를 총 ${AddComma(totalAmount)}개 얻었어요!`;

        result = {
            success: true,
            resultRaw: message,
            result: encodeURIComponent(message),
        };
    }

    res.status(200).json(result);
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

function cleanItemName(name) {
    return name
        .replace(/\([^)]*\)/g, '')              // 괄호 및 괄호 안 제거
        .replace(/\s*\/\s*/g, '/')              // 슬래시 앞뒤 공백 제거
        .replace(/](?! )/g, '] ')               // 대괄호 뒤 공백 없으면 추가
        .replace(/\s+/g, ' ')                   // 중복 공백 제거
        .trim();
}

function parseProbability(percentStr) {
    return parseFloat(percentStr.replace('%', '')) / 100;
}

module.exports = router;