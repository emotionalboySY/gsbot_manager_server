const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const router = express.Router();
const {differenceInDays} = require("date-fns");
const mc = require('../utils/main_character.js');
const taj = require('../utils/time_and_json.js');
const iden = require('../services/identification.js');
const time = require('../utils/time.js');

require('dotenv').config();

const openAPIBaseUrl = "https://open.api.nexon.com/maplestory/v1";

router.get("/character", async (req, res) => {

    const { characterName } = req.query;
    let date = new Date();
    date.setDate(date.getDate() - 1);
    let dateString = time.getDateString(date);

    console.log(`${time.getNowDateTime()} - 랭킹(${characterName})`);

    let ocid = await iden.getOcid(characterName);
    if (ocid == null) {
        console.log(`${characterName} doesn't exist`);

        res.status(200).json(taj.noOcidJSON(characterName));
    } else {
        console.log(`${characterName} exist`);
        let message = `[${characterName}의 랭킹 정보]\n\n`;
        try {
            let url = openAPIBaseUrl + "/character/basic";
            let config = {
                method: 'get',
                url: url + `?ocid=${ocid}&date=${dateString}`,
                headers: {
                    'accept': 'application/json',
                    'x-nxopen-api-key': process.env.API_KEY
                },
            };

            let response = await axios(config);

            let world_name = response.data.world_name;
            let class_name = response.data.character_class;
            let sub_class_name = determineClass(class_name);
            let job_string = "";
            if(sub_class_name == "전체 전직") {
                job_string = `${class_name}-${sub_class_name}`;
            } else {
                job_string = `${sub_class_name}-${class_name}`;
            }

            // 전체 랭킹
            url = openAPIBaseUrl + "/ranking/overall";
            config = {
                method: 'get',
                url: url + `?ocid=${ocid}&date=${dateString}`,
                headers: {
                    'accept': 'application/json',
                    'x-nxopen-api-key': process.env.API_KEY
                },
            };
            response = await axios(config);
            if(response.data.ranking.length === 0) {
                message += `종합 랭킹(전체): 정보 없음`;
            }
            else {
                let ranking_all = response.data.ranking[0].ranking;
                message += `종합 랭킹(전체): ${AddComma(ranking_all)}위`;
            }

            // 월드 랭킹
            config = {
                method: 'get',
                url: url + `?ocid=${ocid}&date=${dateString}&world_name=${encodeURIComponent(world_name)}`,
                headers: {
                    'accept': 'application/json',
                    'x-nxopen-api-key': process.env.API_KEY
                }
            }
            response = await axios(config);
            if(response.data.ranking.length === 0) {
                message += `\n종합 랭킹(월드): 정보 없음`;
            }
            else {
                let ranking_world = response.data.ranking[0].ranking;
                message += `\n종합 랭킹(월드): ${AddComma(ranking_world)}위`;
            }

            // 직업 전체 랭킹
            config = {
                method: 'get',
                url: url + `?ocid=${ocid}&date=${dateString}&class=${encodeURIComponent(job_string)}`,
                headers: {
                    'accept': 'application/json',
                    'x-nxopen-api-key': process.env.API_KEY
                }
            };
            response = await axios(config);
            if(response.data.ranking.length === 0) {
                message += `\n\n직업 랭킹(전체): 정보 없음`;
            }
            else {
                let ranking_class_all = response.data.ranking[0].ranking;
                message += `\n\n직업 랭킹(전체): ${AddComma(ranking_class_all)}위`;
            }

            // 직업 월드 랭킹
            config = {
                method: 'get',
                url: url + `?ocid=${ocid}&date=${dateString}&class=${encodeURIComponent(job_string)}&world_name=${encodeURIComponent(world_name)}`,
                headers: {
                    'accept': 'application/json',
                    'x-nxopen-api-key': process.env.API_KEY
                }
            };
            response = await axios(config);
            if(response.data.ranking.length === 0) {
                message += `\n직업 랭킹(월드): 정보 없음`;
            }
            else {
                let ranking_class_world = response.data.ranking[0].ranking;
                message += `\n직업 랭킹(월드): ${AddComma(ranking_class_world)}위`;
            }

            // 유니온 전체 랭킹
            url = openAPIBaseUrl + "/ranking/union";
            config = {
                method: 'get',
                url: url + `?ocid=${ocid}&date=${dateString}`,
                headers: {
                    'accept': 'application/json',
                    'x-nxopen-api-key': process.env.API_KEY
                }
            }
            response = await axios(config);
            if(response.data.ranking.length === 0) {
                message += `\n\n유니온 랭킹(전체): 정보 없음`;
            }
            let ranking_union_all = response.data.ranking[0].ranking;
            message += `\n\n유니온 랭킹(전체): ${AddComma(ranking_union_all)}위`;

            // 유니온 월드 랭킹
            config = {
                method: 'get',
                url: url + `?ocid=${ocid}&date=${dateString}&world_name=${encodeURIComponent(world_name)}`,
                headers: {
                    'accept': 'application/json',
                    'x-nxopen-api-key': process.env.API_KEY
                }
            }
            response = await axios(config);
            if(response.data.ranking.length === 0) {
                message += `\n유니온 랭킹(월드): 정보 없음`;
            }
            else {
                let ranking_union_world = response.data.ranking[0].ranking;
                message += `\n유니온 랭킹(월드): ${AddComma(ranking_union_world)}위`;
            }

            // 업적 랭킹
            url = openAPIBaseUrl + "/ranking/achievement";
            config = {
                method: 'get',
                url: url + `?ocid=${ocid}&date=${dateString}`,
                headers: {
                    'accept': 'application/json',
                    'x-nxopen-api-key': process.env.API_KEY
                }
            }
            response = await axios(config);
            if(response.data.ranking.length === 0) {
                message += `\n\n업적 랭킹: 정보 없음`;
            }
            else {
                let ranking_trophy = response.data.ranking[0].ranking;
                message += `\n\n업적 랭킹: ${AddComma(ranking_trophy)}위`;
            }

            return res.status(200).json(taj.successJSON(true, message));
        } catch (e) {
            if (e.response) {
                console.error("error occurred with response");
                console.error(e.response);
                return res.status(200).json({
                    success: false,
                    result: e.response
                });
            } else {
                console.error("error occurred with no response");
                console.error(e);
                return res.status(200).json({
                    success: false,
                    result: e
                });
            }
        }
    }
});

router.get('/guild/:worldName/:guildName', async (req, res) => {
    const url = `${openAPIBaseUrl}/guild/basic`;
    const worldName = req.params.worldName;
    const guildName = req.params.guildName;

    let date = new Date();
    console.log(`${time.getNowDateTime()} - 길드멤버랭킹(${worldName}, ${guildName})`);

    let oguild_id = await iden.getOGuildId(worldName, guildName);
    if(oguild_id == 0) {
        console.log(`${worldName}은 존재하지 않는 월드 이름임`);
        return res.status(200).json(taj.noWorldNameJSON(worldName));
    } else if (oguild_id == 1) {
        console.log(`${guildName} 길드에 대한 id 가져오기 실패`);
        return res.status(200).json(taj.noOGuildIdJSON(guildName));
    } else {
        console.log(`${worldName}월드에서 ${guildName} 길드 id 조회됨`);
        try {
            let message = ``;
            message = `[${worldName}-${guildName}길드 멤버랭킹]\n`;
            const config = {
                method: 'get',
                url: `${url}?oguild_id=${oguild_id}`,
                headers: {
                    'accept': 'application/json',
                    'x-nxopen-api-key': process.env.API_KEY
                }
            };
            let response = await axios(config);
            let basicData = response.data;
            let memberList = basicData.guild_member;
            // console.log(memberList);

            let memberListWithData = [];

            for(let singleCharacterName of memberList) {
                let ocid = await iden.getOcid(singleCharacterName);
                if(ocid == null) {
                    continue;
                } else {
                    let characterConfig = {
                        method: 'get',
                        url: `${openAPIBaseUrl}/character/basic?ocid=${ocid}`,
                        headers: {
                            'accept': 'application/json',
                            'x-nxopen-api-key': process.env.API_KEY
                        }
                    };

                    response = await axios(characterConfig);
                    basicData = response.data;
                    let lev = Number(basicData.character_level);
                    let exp = Number(basicData.character_exp_rate);
                    if (exp == null || lev == null) {
                        continue;
                    } else {
                        let singleData = {
                            characterName: singleCharacterName,
                            expRate: exp,
                            level: lev
                        };
                        memberListWithData.push(singleData);
                        // console.log(`데이터 추가: ${singleData.characterName} - ${singleData.level} - ${singleData.expRate}`);
                    }
                }
            }

            memberListWithData.sort((a, b) => {
                if (b.level !== a.level) {
                    return b.level - a.level;
                }
                return b.expRate - a.expRate;
            });

            let ordering = 1;
            for(let singleElement of memberListWithData) {
                message += `\n${ordering++}: ${singleElement.characterName} - Lev.${singleElement.level}(${singleElement.expRate}%)`;
            }

            return res.status(200).json(taj.successJSON(true, message));
        } catch (e) {
            console.error(e.response.data.error);
            let message = `name: ${e.response.data.error.name}\nmessage: ${e.response.data.error.message}`;
            return res.status(200).json(taj.successJSON(false, message));
        }
    }
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