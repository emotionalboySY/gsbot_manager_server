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

module.exports = {
    getOcid,
    getOGuildId
};