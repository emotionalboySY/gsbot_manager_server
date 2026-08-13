const axios = require('axios');
const cheerio = require('cheerio');

require('dotenv').config();

const openAPIBaseUrl = "https://open.api.nexon.com/maplestory/v1";

const availableWorldName = [
    "스카니아",
    "베라",
    "루나",
    "제니스",
    "크로아",
    "유니온",
    "엘리시움",
    "이노시스",
    "레드",
    "오로라",
    "아케인",
    "노바",
    "에오스",
    "헬리오스",
    "챌린저스",
    "챌린저스2",
    "챌린저스3",
    "챌린저스4"
];

async function getOcid(characterName) {
    let date = new Date();
    try {
        let url = openAPIBaseUrl + `/id?character_name=${encodeURIComponent(characterName)}`;

        const config = {
            method: 'get',
            url: url,
            headers: {
                'accept': 'application/json',
                'x-nxopen-api-key': process.env.API_KEY
            },
        };

        let response = await axios(config);
        return response.data.ocid;
    } catch (e) {
        console.log(e.message);
        return null;
    }
}

async function getOGuildId(worldName, guildName) {
    let date = new Date();
    if (!availableWorldName.includes(worldName)) {
        return 0;
    } else {
        try {
            let url = openAPIBaseUrl + `/guild/id?guild_name=${encodeURIComponent(guildName)}&world_name=${encodeURIComponent(worldName)}`;

            const config = {
                method: 'get',
                url: url,
                headers: {
                    'accept': 'application/json',
                    'x-nxopen-api-key': process.env.API_KEY
                },
            };

            let response = await axios(config);
            return response.data.oguild_id;
        } catch (e) {
            console.log(e.message);
            return 1;
        }
    }
}

/**
 * 캐릭터 직업명을 가져온다. 실패해도 호출부가 계속 진행할 수 있도록 null 을 돌려준다
 * (직업은 제목 장식이라 이것 때문에 조회 전체가 실패하면 안 된다).
 */
async function getCharacterClass(ocid) {
    try {
        const config = {
            method: 'get',
            url: openAPIBaseUrl + `/character/basic?ocid=${ocid}`,
            headers: {
                'accept': 'application/json',
                'x-nxopen-api-key': process.env.API_KEY
            },
        };

        const response = await axios(config);
        return response.data.character_class || null;
    } catch (e) {
        console.log(`직업 조회 실패: ${e.message}`);
        return null;
    }
}

/** "엽이감성 - 패스파인더" 형태의 제목. 직업을 못 가져오면 닉네임만 쓴다. */
function characterTitle(characterName, characterClass) {
    return characterClass ? `${characterName} - ${characterClass}` : `${characterName}`;
}

module.exports = {
    getOcid,
    getOGuildId,
    getCharacterClass,
    characterTitle
};