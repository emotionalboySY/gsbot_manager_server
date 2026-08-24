const express = require('express');
const axios = require('axios');
const router = express.Router();

const time = require('../utils/time.js');
const json = require('../utils/json.js');
const iden = require('../services/identification.js');
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

/** 시뮬레이션이 입장 횟수를 다 쓰지 못하고 멈춘 이유. 다 썼으면 빈 문자열. */
function stopNote(result, farm) {
    if (result.entriesLeft <= 0) return "";
    if (result.stop === calc.STOP.MAX_LEVEL) {
        return `\n\n만렙에 도달해 ${result.entriesLeft.toLocaleString("ko-KR")}회가 남았습니다.`;
    }
    if (result.stop === calc.STOP.FARM_RANGE) {
        return `\n\n${farm.name}은 Lv.${farm.maxLevel}까지 입장할 수 있어 ` +
            `${result.entriesLeft.toLocaleString("ko-KR")}회가 남았습니다.`;
    }
    return "";
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
// 인자를 몇 개 받았느냐로 기능이 갈린다. 농장을 지정하면 그 농장 하나를
// 자세히, 생략하면 그 레벨에서 들어갈 수 있는 농장을 전부 비교한다.

router.get('/character/:characterName', async (req, res) => {
    const { characterName } = req.params;
    const entries = Number(req.query.entries);
    const farmText = req.query.farm;

    console.log(`${time.getNowDateTime()} - 농장(${farmText || "전체"}, ${characterName}, ${entries})`);

    const entriesError = validateEntries(entries);
    if (entriesError) return res.status(200).json(json.failure(entriesError));

    let farm = null;
    if (farmText !== undefined && farmText !== "") {
        farm = berryFarm.farmOf(farmText);
        if (!farm) {
            return res.status(200).json(json.failure(
                `[${farmText}]는 알 수 없는 농장입니다.\n\n${farmRangeGuide()}`));
        }
    }

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
    if (farm && berryFarm.pctAt(farm, level) === null) {
        return res.status(200).json(json.failure(
            `${characterName}(Lv.${level})은 ${farm.name}에 입장할 수 없습니다.\n` +
            `${farm.name}: Lv.${farm.minLevel}~${farm.maxLevel}`));
    }

    const header = `캐릭터: ${characterName}\n현재: Lv.${level} (${ratioText(ratio)})`;
    const countText = `${entries.toLocaleString("ko-KR")}회 입장`;

    if (farm) {
        const one = calc.singleEntry(farm, level);
        const result = calc.simulate(farm, level, ratio, entries);
        const note = stopNote(result, farm);

        const plain =
            `[${farm.name} 입장 계산]\n\n` +
            `${header}\n` +
            `1회 입장: ${one.pct}% · ${toKoreanUnit(one.exp)}\n\n` +
            `${RULE}\n\n` +
            `${countText} 후\n` +
            `Lv.${result.endLevel} (${ratioText(result.endRatio)})\n\n` +
            `획득 경험치: ${toKoreanUnit(result.gainedExp)}` +
            (result.levelsGained > 0 ? `\n레벨업: +${result.levelsGained}` : "") +
            note;

        const markdown =
            `## ${farm.name} 입장 계산\n\n` +
            `- 캐릭터: ${characterName}\n` +
            `- 현재: Lv.${level} (${ratioText(ratio)})\n` +
            `- 1회 입장: ${one.pct}% · ${toKoreanUnit(one.exp)}\n\n` +
            `${RULE}\n\n` +
            `**${countText} 후 Lv.${result.endLevel} (${ratioText(result.endRatio)})**\n\n` +
            `- 획득 경험치: ${toKoreanUnit(result.gainedExp)}\n` +
            `- 레벨업: +${result.levelsGained}` +
            note;

        return res.status(200).json(json.successWithMarkdown(plain, markdown));
    }

    // 농장을 지정하지 않았을 때 — 입장 가능한 농장 전부를 같은 조건으로 돌린다
    const results = available
        .map((each) => ({ farm: each, one: calc.singleEntry(each, level), sim: calc.simulate(each, level, ratio, entries) }))
        .sort((a, b) => b.sim.gainedExp - a.sim.gainedExp);

    const lines = results.map((row, i) =>
        `${i + 1}. ${row.farm.name}\n` +
        `   Lv.${row.sim.endLevel} (${ratioText(row.sim.endRatio)}) · +${toKoreanUnit(row.sim.gainedExp)}`);

    const mdLines = results.map((row, i) =>
        `${i + 1}. **${row.farm.name}** — Lv.${row.sim.endLevel} (${ratioText(row.sim.endRatio)}) · +${toKoreanUnit(row.sim.gainedExp)}`);

    const plain =
        `[베리 농장 입장 계산]\n\n` +
        `${header}\n${countText} 기준\n\n` +
        `${RULE}\n\n` +
        `${lines.join("\n")}`;

    const markdown =
        `## 베리 농장 입장 계산\n\n` +
        `- 캐릭터: ${characterName}\n` +
        `- 현재: Lv.${level} (${ratioText(ratio)})\n` +
        `- ${countText} 기준\n\n` +
        `${RULE}\n\n` +
        `${mdLines.join("\n")}`;

    return res.status(200).json(json.successWithMarkdown(plain, markdown));
});

module.exports = router;
