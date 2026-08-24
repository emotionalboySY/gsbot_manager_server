const express = require('express');
const axios = require('axios');
const router = express.Router();

const time = require('../utils/time.js');
const json = require('../utils/json.js');
const iden = require('../services/identification.js');
const mc = require('../utils/main_character.js');
const berryFarm = require('../utils/berry_farm.js');
const calc = require('../services/berry_calculator.js');
const { RULE, toKoreanUnit } = require('../utils/format.js');

require('dotenv').config();

const openAPIBaseUrl = "https://open.api.nexon.com/maplestory/v1";

// 어느 농장에도 들어갈 수 없는 레벨일 때 보여줄 안내. 표에서 직접 만든다.
function farmRangeGuide() {
    return berryFarm.FARMS
        .map((farm) => `${farm.name}: Lv.${farm.minLevel}~${farm.maxLevel}`)
        .join("\n");
}

function ratioText(value) {
    return `${Number(value).toFixed(3)}%`;
}

/** 입력 검증 — 통과하면 null, 아니면 실패 메시지. */
function validateLevel(level) {
    if (!Number.isInteger(level)) return "레벨은 정수로 입력해 주세요.";
    if (level < 1 || level > calc.MAX_LEVEL) return `레벨은 1 이상 ${calc.MAX_LEVEL} 이하로 입력해 주세요.`;
    return null;
}

function validateRatio(ratio) {
    if (!Number.isFinite(ratio)) return "경험치 비율은 숫자로 입력해 주세요.";
    if (ratio < 0 || ratio >= 100) return "경험치 비율은 0 이상 100 미만으로 입력해 주세요.";
    return null;
}

function validateEntries(entries) {
    if (!Number.isInteger(entries)) return "입장 횟수는 정수로 입력해 주세요.";
    if (entries < 1) return "입장 횟수는 1 이상으로 입력해 주세요.";
    if (entries > calc.MAX_ENTRIES) {
        return `입장 횟수는 ${calc.MAX_ENTRIES.toLocaleString("ko-KR")}회까지 입력할 수 있습니다.`;
    }
    return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 데이터 조회 — 앱에서 쓴다

/** 농장 목록과 입장 가능 레벨. 앱의 농장 선택기가 이걸로 그려진다. */
router.get('/farms', (req, res) => {
    return res.status(200).json(berryFarm.FARMS.map((farm) => ({
        key: farm.key,
        name: farm.name,
        aliases: berryFarm.displayAliases(farm),
        minLevel: farm.minLevel,
        maxLevel: farm.maxLevel
    })));
});

/**
 * 특정 레벨에서 입장 가능한 농장을 1회 획득 경험치 순으로.
 *
 * entries 를 주면 농장마다 그 횟수만큼 돌린 결과까지 함께 담는다. 앱의 비교
 * 화면이 농장 수만큼 요청을 나눠 보내지 않도록 여기서 한 번에 끝낸다.
 */
router.get('/compare', (req, res) => {
    const level = Number(req.query.level);
    const ratio = req.query.ratio === undefined || req.query.ratio === "" ? 0 : Number(req.query.ratio);
    const hasEntries = req.query.entries !== undefined && req.query.entries !== "";
    const entries = hasEntries ? Number(req.query.entries) : null;

    const error = validateLevel(level)
        || validateRatio(ratio)
        || (hasEntries ? validateEntries(entries) : null);
    if (error) return res.status(400).json({ message: error });

    const farms = calc.compareAt(level).map((entry) => {
        if (!hasEntries) return entry;
        const farm = berryFarm.FARM_BY_KEY.get(entry.farmKey);
        return Object.assign({}, entry, { simulation: calc.simulate(farm, level, ratio, entries) });
    });

    // 횟수를 받았으면 실제로 번 경험치 순으로 다시 세운다. 만렙이나 농장
    // 입장 상한에 걸려 횟수를 다 못 쓰는 농장이 있어 1회 경험치 순서와
    // 달라질 수 있다.
    if (hasEntries) farms.sort((a, b) => b.simulation.gainedExp - a.simulation.gainedExp);

    return res.status(200).json({ level, ratio, entries, farms });
});

/** N회 입장 시뮬레이션. */
router.get('/simulate', (req, res) => {
    const farm = berryFarm.farmOf(req.query.farm);
    if (!farm) return res.status(400).json({ message: "농장을 찾을 수 없습니다." });

    const level = Number(req.query.level);
    const ratio = req.query.ratio === undefined ? 0 : Number(req.query.ratio);
    const entries = Number(req.query.entries);

    const error = validateLevel(level) || validateRatio(ratio) || validateEntries(entries);
    if (error) return res.status(400).json({ message: error });

    if (berryFarm.pctAt(farm, level) === null) {
        return res.status(400).json({
            message: `${farm.name}은 Lv.${farm.minLevel}~${farm.maxLevel} 구간에서만 입장할 수 있습니다.`
        });
    }

    return res.status(200).json(calc.simulate(farm, level, ratio, entries));
});

/** 목표 레벨까지 필요한 입장 횟수. */
router.get('/required', (req, res) => {
    const farm = berryFarm.farmOf(req.query.farm);
    if (!farm) return res.status(400).json({ message: "농장을 찾을 수 없습니다." });

    const level = Number(req.query.level);
    const ratio = req.query.ratio === undefined ? 0 : Number(req.query.ratio);
    const target = Number(req.query.target);

    const error = validateLevel(level) || validateRatio(ratio) || validateLevel(target);
    if (error) return res.status(400).json({ message: error });
    if (target <= level) {
        return res.status(400).json({ message: "목표 레벨은 현재 레벨보다 높아야 합니다." });
    }

    const result = calc.entriesToReach(farm, level, ratio, target);
    return res.status(200).json(Object.assign({
        farmKey: farm.key,
        farmName: farm.name,
        startLevel: level,
        startRatio: ratio,
        targetLevel: target
    }, result));
});

// ─────────────────────────────────────────────────────────────────────────────
// 캐릭터 기준 계산 — 봇의 /농장 명령어가 쓴다.
//
// 인자 개수로 기능이 갈린다.
//   /농장 [횟수|목표]        본캐
//   /농장 [닉네임] [횟수|목표]
//
// 농장은 지정하지 않는다. 예전에는 첫 인자가 농장 이름일 수 있게 했는데,
// "크림슨"(Lv.282) · "딸기농장"(Lv.215) · "블루베리"(Lv.286) 처럼 농장 이름과
// 똑같은 캐릭터가 실제로 있어서 닉네임인지 농장인지 가릴 방법이 없었다.
// 게다가 그 캐릭터들이 하필 농장 입장 가능 레벨대라 어느 쪽으로 읽어도
// 그럴듯한 답이 나온다 — 조용히 틀린 결과를 주는 모양이라 아예 없앴다.
// 대신 입장할 수 있는 농장을 전부 보여준다.

/** 요약 줄. 두 모드가 같은 머리를 쓴다. */
function characterHeader(characterName, level, ratio) {
    return `캐릭터: ${characterName}\n현재: Lv.${level} (${ratioText(ratio)})`;
}

/** N회 입장 — 농장 하나치 본문. */
function entriesBlock(farm, level, ratio, entries, index, total) {
    const one = calc.singleEntry(farm, level);
    const result = calc.simulate(farm, level, ratio, entries);
    // 농장이 하나뿐인 레벨에서는 번호가 의미 없다
    const title = total > 1 ? `${index + 1}. ${farm.name}` : farm.name;

    const lines = [
        title,
        `1회 ${one.pct}% · ${toKoreanUnit(one.exp)}`,
        `→ Lv.${result.endLevel} (${ratioText(result.endRatio)})`,
        `${calc.levelGainText(result)} · +${toKoreanUnit(result.gainedExp)}`
    ];
    return { text: lines.join("\n"), result };
}

/** 목표 레벨 — 농장 하나치 본문. */
function targetBlock(farm, level, ratio, target, index, total) {
    const need = calc.entriesToReach(farm, level, ratio, target);
    const title = total > 1 ? `${index + 1}. ${farm.name}` : farm.name;

    if (need.reachable) {
        // 카카오톡은 고정폭 글꼴이 아니라 공백으로 자릿수를 맞춰 봐야 어긋난다.
        // 이름과 횟수를 구분자로 끊는 편이 읽기 낫다.
        return { text: `${title} — ${need.entries.toLocaleString("ko-KR")}회`, need };
    }

    // 닿는 데까지의 횟수와 어디서 막히는지를 같이 준다. 그냥 "불가" 만
    // 주면 얼마나 모자란 것인지 알 수 없다.
    const why = need.reason === calc.STOP.FARM_RANGE
        ? `Lv.${farm.maxLevel}까지만 입장 가능`
        : `만렙`;
    return {
        text: `${title} — 도달 불가\n` +
            `Lv.${need.blockedAt}까지 ${need.entries.toLocaleString("ko-KR")}회 (${why})`,
        need
    };
}

async function handleCharacterCalc(req, res) {
    const { chatRoomName, talkProfileName } = req.query;
    const hasTarget = req.query.target !== undefined && req.query.target !== "";
    const entries = Number(req.query.entries);
    const target = Number(req.query.target);

    let characterName = req.params.characterName;

    // 닉네임을 생략하면 이 톡프로필에 지정된 본캐로 본다. /히스토리 등과 같은 흐름.
    if (!characterName) {
        if (!chatRoomName || !talkProfileName) {
            return res.status(200).json(json.failure("조회할 캐릭터를 알 수 없습니다."));
        }
        characterName = await mc.getMainCharacter(chatRoomName, talkProfileName);
        if (!characterName) {
            return res.status(200).json(json.failure(
                `${talkProfileName} <<< 이 톡프로필에 저장된 본캐가 없습니다.\n` +
                `"/본캐 [캐릭터명]" 으로 지정하거나, /농장 [닉네임] [횟수] 형태로 입력해 주세요.`));
        }
    }

    console.log(`${time.getNowDateTime()} - 농장(${characterName}, ${hasTarget ? target + "레벨까지" : entries + "회"})`);

    const error = hasTarget ? validateLevel(target) : validateEntries(entries);
    if (error) return res.status(200).json(json.failure(error));

    const ocid = await iden.getOcid(characterName);
    if (ocid == null) return res.status(200).json(json.noOcid(characterName));

    let level;
    let ratio;
    try {
        const response = await axios({
            method: 'get',
            url: `${openAPIBaseUrl}/character/basic?ocid=${ocid}`,
            headers: {
                'accept': 'application/json',
                'x-nxopen-api-key': process.env.API_KEY
            }
        });
        level = Number(response.data.character_level);
        ratio = Number(response.data.character_exp_rate);
    } catch (e) {
        return res.status(200).json(json.nexonAPIError(e));
    }

    const available = berryFarm.farmsForLevel(level);
    if (available.length === 0) {
        return res.status(200).json(json.failure(
            `${characterName}(Lv.${level})이 입장할 수 있는 농장이 없습니다.\n\n${farmRangeGuide()}`));
    }

    const header = characterHeader(characterName, level, ratio);

    if (hasTarget) {
        if (target <= level) {
            return res.status(200).json(json.failure(
                `목표 레벨은 현재 레벨(${level})보다 높아야 합니다.`));
        }

        // 적게 드는 순. 못 닿는 농장은 뒤로 민다.
        const blocks = available
            .map((farm, i) => targetBlock(farm, level, ratio, target, i, available.length))
            .sort((a, b) => {
                if (a.need.reachable !== b.need.reachable) return a.need.reachable ? -1 : 1;
                return a.need.entries - b.need.entries;
            });

        // 정렬 뒤에 번호를 다시 매긴다 — 위에서 붙인 것은 원래 순서 기준이다.
        const numbered = blocks.map((block, i) => (available.length > 1
            ? block.text.replace(/^\d+\. /, `${i + 1}. `)
            : block.text));

        const note = "※ 한 농장만 계속 돌렸을 때 기준입니다.";
        const plain = `[베리 농장] ${target}레벨까지\n\n${header}\n\n${RULE}\n\n` +
            `${numbered.join("\n")}\n\n${note}`;
        const markdown = `## 베리 농장 — ${target}레벨까지\n\n` +
            `- 캐릭터: ${characterName}\n- 현재: Lv.${level} (${ratioText(ratio)})\n\n${RULE}\n\n` +
            `${numbered.map((t) => `- ${t.replace(/\n/g, "\n  ")}`).join("\n")}\n\n${note}`;

        return res.status(200).json(json.successWithMarkdown(plain, markdown));
    }

    // 실제로 번 경험치 순. 만렙이나 입장 상한에 걸려 횟수를 다 못 쓰는 농장이
    // 있어 1회 경험치 순서와 달라질 수 있다.
    const blocks = available
        .map((farm, i) => Object.assign(entriesBlock(farm, level, ratio, entries, i, available.length), { farm }))
        .sort((a, b) => b.result.gainedExp - a.result.gainedExp);

    const numbered = blocks.map((block, i) => (available.length > 1
        ? block.text.replace(/^\d+\. /, `${i + 1}. `)
        : block.text));

    // 횟수를 다 못 쓴 농장이 있으면 왜인지 아래에 모아 적는다
    const notes = blocks
        .filter((block) => block.result.entriesLeft > 0)
        .map((block) => {
            const left = block.result.entriesLeft.toLocaleString("ko-KR");
            const used = block.result.entriesUsed.toLocaleString("ko-KR");
            return block.result.stop === calc.STOP.MAX_LEVEL
                ? `※ ${block.farm.name}은 만렙에 도달해 ${used}회만 쓰고 ${left}회가 남았습니다.`
                : `※ ${block.farm.name}은 Lv.${block.farm.maxLevel}까지 입장할 수 있어 ${used}회만 쓰고 ${left}회가 남았습니다.`;
        });
    const noteText = notes.length > 0 ? `\n\n${notes.join("\n")}` : "";

    const plain = `[베리 농장] ${entries.toLocaleString("ko-KR")}회 입장\n\n` +
        `${header}\n\n${RULE}\n\n${numbered.join("\n\n")}${noteText}`;
    const markdown = `## 베리 농장 — ${entries.toLocaleString("ko-KR")}회 입장\n\n` +
        `- 캐릭터: ${characterName}\n- 현재: Lv.${level} (${ratioText(ratio)})\n\n${RULE}\n\n` +
        `${numbered.map((t) => t.split("\n").map((line, i) => (i === 0 ? `**${line}**` : `- ${line}`)).join("\n")).join("\n\n")}${noteText}`;

    return res.status(200).json(json.successWithMarkdown(plain, markdown));
}

// 닉네임이 있으면 그 캐릭터, 없으면 본캐. /info_six 등과 같은 방식.
router.get('/character', handleCharacterCalc);
router.get('/character/:characterName', handleCharacterCalc);

module.exports = router;
