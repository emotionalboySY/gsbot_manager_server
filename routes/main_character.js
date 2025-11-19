const express = require('express');
const mc = require('../utils/main_character.js');
const router = express.Router();

require('dotenv').config();

router.get('/get/:chatRoomName/:talkProfileName', async (req, res) => {
    const talkProfileName = req.params.talkProfileName;
    const chatRoomName = req.params.chatRoomName;

    console.log(`${getNowDateTime()} - 본캐찾기(${talkProfileName})`);

    let result = await mc.getMainCharacter(chatRoomName, talkProfileName);

    let message = "";
    let success = true;

    if(result) {
        message = `${talkProfileName} <<< 이 닉네임에 본캐로 지정된 캐릭터는 ${result}입니다.`;
    } else {
        message = `현재 ${talkProfileName} <<< 이 닉네임에 본캐로 지정된 캐릭터가 없습니다.`;
        success = false;
    }

    return res.status(200).json(successJSON(success, message));
});

router.post('/set', async (req, res) => {
    const { chatRoomName, talkProfileName, characterName } = req.body;

    console.log(`${getNowDateTime()} - 본캐지정(${talkProfileName} > ${characterName})`);

    let result = await mc.setMainCharacter(chatRoomName, talkProfileName, characterName);

    let message = "";
    let success = true;

    if(result) {
        message = `본캐 지정이 완료되었습니다.\n\n톡방 닉네임: ${talkProfileName}\n캐릭터: ${characterName}`;
    } else {
        message = `본캐 지정에 실패했습니다.\n잠시 후 다시 시도해 주세요.`;
        success = false;
    }

    return res.status(200).json(successJSON(success, message));
})

function successJSON(success, result) {
    var json = {
        success: success,
        result: encodeURIComponent(result),
        resultRaw: result
    }

    return json;
}

function getNowDateTime() {
    let now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
}

module.exports = router;