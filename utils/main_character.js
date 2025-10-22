const MainCharacter = require('../models/main_character.js');
require('dotenv').config();

async function getMainCharacter(chatRoomName, talkProfileName) {
    try {
        const characterData = await MainCharacter.findOne({
            "chatRoomName": chatRoomName,
            "talkProfileName": talkProfileName
        }).lean();

        if (characterData) {
            console.log(`${talkProfileName}에 지정된 본캐 닉네임 발견: ${characterData.characterName}`);
            return characterData.characterName;
        } else {
            console.log(`${talkProfileName}에 지정된 본캐 없음`);
            return null;
        }
    } catch (error) {
        console.log(`본캐 지정 여부 검색 중 오류 발생: `, error);
        throw error;
    }
}

async function setMainCharacter(chatRoomName, talkProfileName, characterName) {
    try {
        const checkExistProfileName = await MainCharacter.findOne({
            "chatRoomName": chatRoomName,
            "talkProfileName": talkProfileName
        });

        if (checkExistProfileName) {
            const updatedData = await MainCharacter.findOneAndUpdate(
                {
                    "chatRoomName": chatRoomName,
                    "talkProfileName": talkProfileName,
                },
                {
                    "$set": {
                        "characterName": characterName
                    }
                },
                {
                    "new": true
                },
            );
        } else {
            const newMainCharacter = new MainCharacter({
                chatRoomName,
                talkProfileName,
                characterName
            });
            const savedData = await newMainCharacter.save();
        }
        console.log(`${talkProfileName}에 본캐 지정 완료: ${characterName}`);
        return true;
    } catch (error) {
        console.log(`본캐 지정 중 오류 발생: `, error.message);
        return false;
    }
}

module.exports = {getMainCharacter, setMainCharacter};