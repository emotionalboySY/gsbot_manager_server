const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const router = express.Router();
const taj = require('../utils/time_and_json.js');

router.get('/event', async (req, res) => {
    console.log(`${taj.getNowDateTime()} - 이벤트`);
    const url = openAPIBaseUrl + "/notice-event";
    let date = new Date();
    date.setDate(date.getDate() - 1);
    let dateString = getDateString(date);

    console.log(`${date.toLocaleString()} - 이벤트 리스트`);

    try {
        const config = {
            method: 'get',
            url: url,
            headers: {
                'accept': 'application/json',
                'x-nxopen-api-key': process.env.API_KEY
            },
        };
        let response = await axios(config);
        let eventList = response.data.event_notice;

        let eventListString = "";
        for(const obj of eventList) {
            let title = obj.title;
            let url = obj.url;
            let startDate = getKorDateStringAndTime(obj.date_event_start, 2);
            let endDate = getKorDateStringAndTime(obj.date_event_end, 2);
            eventListString += `────────────────\n${title}\n${startDate} - ${endDate}\n${url}\n`;
        }
        eventListString += "────────────────";

        res.status(200).json(successJSON(true, eventListString));
    } catch (e) {
        if (e.response == !undefined) {
            console.error(e.response);
            res.status(200).json({
                success: false,
                result: e.response
            });
        } else {
            console.error(e);
            res.status(200).json({
                success: false,
                result: e
            });
        }
    }
});

router.get('/cashShop', async (req, res) => {
    console.log(`${taj.getNowDateTime()} - 캐시샵공지`);
    const url = openAPIBaseUrl + "/notice-cashshop";
    let date = new Date();
    date.setDate(date.getDate() - 1);
    let dateString = getDateString(date);

    console.log(`${date.toLocaleString()} - 캐시샵 공지 리스트`);

    try {
        const config = {
            method: 'get',
            url: url,
            headers: {
                'accept': 'application/json',
                'x-nxopen-api-key': process.env.API_KEY
            },
        };
        let response = await axios(config);
        let cashshopList = response.data.cashshop_notice;

        let cashshopListString = "";
        for(const obj of cashshopList) {
            let title = obj.title;
            let url = obj.url;
            if(obj.date_sale_start == undefined) {
                let dateString = "상시판매";
                cashshopListString += `────────────────\n${title}\n${dateString}\n${url}\n`;
            }
            else {
                let startDate = getKorDateStringAndTime(obj.date_sale_start, 2);
                let endDate = getKorDateStringAndTime(obj.date_sale_end, 2);
                cashshopListString += `────────────────\n${title}\n${startDate} - ${endDate}\n${url}\n`;
            }
        }
        cashshopListString += "────────────────";

        res.status(200).json(successJSON(true, cashshopListString));
    } catch (e) {
        if (e.response == !undefined) {
            console.error(e.response);
            res.status(200).json({
                success: false,
                result: e.response
            });
        } else {
            console.error(e);
            res.status(200).json({
                success: false,
                result: e
            });
        }
    }
});

router.get("/notice", async (req, res) => {
    const url = openAPIBaseUrl + "/notice";
    let date = new Date();
    date.setDate(date.getDate() - 1);
    let dateString = getDateString(date);

    console.log(`${taj.getNowDateTime()} - 공지사항 리스트`);

    try {
        const config = {
            method: 'get',
            url: url,
            headers: {
                'accept': 'application/json',
                'x-nxopen-api-key': process.env.API_KEY
            },
        };
        let response = await axios(config);
        let noticeList = response.data.notice;

        let noticeListString = "";
        for(const obj of noticeList) {
            let title = obj.title;
            let url = obj.url;
            let date = getKorDateStringAndTime(obj.date, 1);
            noticeListString += `────────────────\n${title}\n${date}\n${url}\n`;
        }
        noticeListString += "────────────────";

        res.status(200).json(successJSON(true, noticeListString));
    } catch (e) {
        if (e.response == !undefined) {
            console.error(e.response);
            res.status(200).json({
                success: false,
                result: e.response
            });
        } else {
            console.error(e);
            res.status(200).json({
                success: false,
                result: e
            });
        }
    }
});

router.get("/update", async (req, res) => {
    const url = openAPIBaseUrl + "/notice-update";
    let date = new Date();
    date.setDate(date.getDate() - 1);
    let dateString = getDateString(date);

    console.log(`${taj.getNowDateTime()} - 업데이트 리스트`);

    try {
        const config = {
            method: 'get',
            url: url,
            headers: {
                'accept': 'application/json',
                'x-nxopen-api-key': process.env.API_KEY
            },
        };
        let response = await axios(config);
        let updateList = response.data.update_notice;

        let updateListString = "";
        for(const obj of updateList) {
            let title = obj.title;
            let url = obj.url;
            let date = getKorDateStringAndTime(obj.date, 1);
            updateListString += `────────────────\n${title}\n${date}\n${url}\n`;
        }
        updateListString += "────────────────";

        res.status(200).json(successJSON(true, updateListString));
    } catch (e) {
        if (e.response == !undefined) {
            console.error(e.response);
            res.status(200).json({
                success: false,
                result: e.response
            });
        } else {
            console.error(e);
            res.status(200).json({
                success: false,
                result: e
            });
        }
    }
});

function getDateString(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getKorDateString(date) {
    return `${date.getFullYear()}년 ${String(date.getMonth() + 1).padStart(2, '0')} ${String(date.getDate()).padStart(2, '0')}일`;
}

function getKorDateStringAndTime(dateString, typeNum) {
    const date = new Date(dateString);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    if(typeNum == 1) return `${year}년 ${month}월 ${day}일 ${hours}시 ${minutes}분`;
    else return `${year}-${month}-${day} ${hours}:${minutes}`;
}

module.exports = router;