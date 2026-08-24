// 베리 농장 입장 효율 계산.
//
// 농장이 1회에 주는 경험치는 레벨 구간마다 정해진 절대값이라, 레벨이 오르면
// "경험치 바의 몇 %를 채우는가"가 확 달라진다. 그래서 N회 입장 결과는
// 한 번의 나눗셈으로 나오지 않고 레벨을 넘길 때마다 다시 세야 한다.
// EXP쿠폰 계산(index.js)이 이미 같은 모양으로 돌고 있고, 여기서는 레벨 안에서
// 소모량이 일정하다는 점을 이용해 레벨당 한 번만 계산한다 — 입장 횟수가
// 10만이어도 도는 횟수는 남은 레벨 수만큼이다.

const expTable = require('../utils/exp_table.js');
const berryFarm = require('../utils/berry_farm.js');

// 만렙. 표는 Lv.299 → 300 까지만 있다.
const MAX_LEVEL = expTable.MAX_LEVEL + 1;

// 입력으로 받을 수 있는 입장 횟수의 상한. 어차피 만렙에서 멈추므로 계산량
// 때문이 아니라, 오타로 들어온 값을 그대로 되뇌지 않으려고 둔다.
const MAX_ENTRIES = 1000000;

/** 멈춘 이유 — 호출부가 문구를 고르는 데 쓴다. */
const STOP = {
    DONE: 'done',           // 입장 횟수를 다 씀
    MAX_LEVEL: 'maxLevel',  // 만렙 도달
    FARM_RANGE: 'farmRange' // 농장 입장 가능 레벨을 넘김
};

/** 레벨과 경험치 비율(%)로 현재까지 쌓인 경험치. */
function expAt(level, ratio) {
    const levelExp = expTable.expForLevel(level);
    if (levelExp === null) return null;
    return Math.floor((levelExp * ratio) / 100);
}

/** 1회 입장 정보. 입장할 수 없는 레벨이면 null. */
function singleEntry(farm, level) {
    const pct = berryFarm.pctAt(farm, level);
    if (pct === null) return null;
    return {
        farmKey: farm.key,
        farmName: farm.name,
        level: Number(level),
        pct,
        exp: berryFarm.expPerEntry(farm, level),
        levelExp: expTable.expForLevel(level)
    };
}

/** 해당 레벨에서 입장 가능한 농장을 1회 획득 경험치 내림차순으로. */
function compareAt(level) {
    const lev = Number(level);
    return berryFarm
        .farmsForLevel(lev)
        .map((farm) => singleEntry(farm, lev))
        .filter((entry) => entry !== null)
        .sort((a, b) => b.exp - a.exp);
}

/**
 * 농장 N회 입장 시뮬레이션.
 *
 * 누적 경험치는 만렙까지의 총량(약 8,509조)을 넘지 못하고 그 값은 아직
 * Number.MAX_SAFE_INTEGER 안쪽이다. 만렙에서 멈추는 것이 정밀도를 지키는
 * 역할까지 겸하고 있으므로 그 종료 조건을 빼면 안 된다.
 */
function simulate(farm, startLevel, startRatio, entries) {
    const level = Number(startLevel);
    const ratio = Number(startRatio);
    const total = Number(entries);

    let nowLevel = level;
    let nowExp = expAt(level, ratio);
    let left = total;
    let gained = 0;
    let stop = STOP.DONE;

    while (left > 0) {
        if (nowLevel >= MAX_LEVEL) {
            stop = STOP.MAX_LEVEL;
            break;
        }
        const perEntry = berryFarm.expPerEntry(farm, nowLevel);
        if (perEntry === null || perEntry <= 0) {
            stop = STOP.FARM_RANGE;
            break;
        }

        const levelExp = expTable.expForLevel(nowLevel);
        const remain = levelExp - nowExp;
        // 저레벨 구간에서는 1회 입장이 그 레벨 요구량의 100배를 넘는다. 넘친
        // 경험치만으로 다음 레벨이 이미 차 있으면 remain 이 음수가 되는데,
        // 그대로 두면 음수 횟수를 곱해 경험치를 도로 깎고 입장 횟수를 되돌려
        // 준다. 0 으로 잡아 입장 없이 레벨만 올리게 한다.
        const needed = Math.max(0, Math.ceil(remain / perEntry));

        if (needed > left) {
            // 이번 레벨 안에서 끝난다
            nowExp += left * perEntry;
            gained += left * perEntry;
            left = 0;
            break;
        }

        // 레벨업. 넘친 경험치는 다음 레벨로 넘어간다.
        nowExp += needed * perEntry;
        gained += needed * perEntry;
        left -= needed;
        nowExp -= levelExp;
        nowLevel += 1;
    }

    // 마지막 1회로 다음 레벨 요구량을 몇 배씩 넘겨 버리는 경우가 있다.
    // 저레벨 황금딸기는 1회가 그 레벨 요구량의 100배를 넘기도 한다. 입장
    // 횟수를 다 썼더라도 넘친 경험치만으로 오르는 레벨은 계속 올려야 한다.
    // 이걸 빼면 경험치 비율이 100%를 훌쩍 넘은 채로 결과가 나온다.
    while (nowLevel < MAX_LEVEL) {
        const levelExp = expTable.expForLevel(nowLevel);
        if (levelExp === null || nowExp < levelExp) break;
        nowExp -= levelExp;
        nowLevel += 1;
    }
    if (nowLevel >= MAX_LEVEL) {
        nowExp = 0;
        stop = STOP.MAX_LEVEL;
    }

    const endLevelExp = expTable.expForLevel(nowLevel);
    const endRatio = endLevelExp === null ? 0 : (nowExp / endLevelExp) * 100;

    return {
        farmKey: farm.key,
        farmName: farm.name,
        startLevel: level,
        startRatio: ratio,
        endLevel: nowLevel,
        endRatio: Number(endRatio.toFixed(3)),
        levelsGained: nowLevel - level,
        entries: total,
        entriesUsed: total - left,
        entriesLeft: left,
        gainedExp: gained,
        stop
    };
}

/**
 * 목표 레벨 0% 까지 필요한 입장 횟수.
 *
 * 레벨마다 넘친 경험치가 다음 레벨로 넘어가므로 레벨별 필요 횟수를 따로
 * 올림해서 더하면 실제보다 많이 나온다. 넘긴 값을 이어서 센다.
 */
function entriesToReach(farm, startLevel, startRatio, targetLevel) {
    const level = Number(startLevel);
    const ratio = Number(startRatio);
    const target = Number(targetLevel);

    let nowLevel = level;
    let nowExp = expAt(level, ratio);
    let entries = 0;

    while (nowLevel < target) {
        if (nowLevel >= MAX_LEVEL) {
            return { reachable: false, entries, blockedAt: nowLevel, reason: STOP.MAX_LEVEL };
        }
        const perEntry = berryFarm.expPerEntry(farm, nowLevel);
        if (perEntry === null || perEntry <= 0) {
            return { reachable: false, entries, blockedAt: nowLevel, reason: STOP.FARM_RANGE };
        }

        const levelExp = expTable.expForLevel(nowLevel);
        // simulate 와 같은 이유로 0 에서 자른다 — 넘친 경험치가 다음 레벨을
        // 이미 채웠으면 입장 없이 레벨만 오른다.
        const needed = Math.max(0, Math.ceil((levelExp - nowExp) / perEntry));
        entries += needed;
        nowExp += needed * perEntry - levelExp;
        nowLevel += 1;
    }

    return { reachable: true, entries, blockedAt: null, reason: null };
}

/**
 * 시작점에서 끝점까지 얼마나 올랐는지를 레벨 눈금으로 환산한다.
 *
 * 경험치 바를 100 눈금으로 보고 시작 지점부터 끝 지점까지의 칸 수를 센다.
 * Lv.250 50% → Lv.252 44.207% 이면 (100-50) + 100 + 44.207 = 194.207,
 * 즉 1레벨 94.21% 다.
 *
 * 레벨마다 요구 경험치가 다르고 5레벨 경계에서 두 배로 뛰므로 "1.94 레벨치
 * 경험치" 라는 뜻은 아니다. 게임이 레벨과 %로 보여주니 체감과 맞을 뿐이고,
 * 실제 양은 gainedExp 가 답한다.
 */
function levelGain(result) {
    const levels = result.endLevel - result.startLevel;
    const total = levels === 0
        ? result.endRatio - result.startRatio
        : (100 - result.startRatio) + (levels - 1) * 100 + result.endRatio;

    return {
        // 눈금으로 한 레벨을 못 채웠으면 레벨 부분을 빼고 % 만 쓴다.
        // Lv.259 90% → Lv.260 0.392% 는 레벨이 오르긴 했어도 진행은
        // 10.39% 뿐이라 "+0레벨 10.39%" 로 적으면 오히려 읽기 나쁘다.
        levels: Math.floor(total / 100),
        ratio: total >= 100 ? total % 100 : total
    };
}

/** levelGain 을 사람이 읽는 한 줄로. */
function levelGainText(result) {
    const gain = levelGain(result);
    const ratio = gain.ratio.toFixed(2);
    return gain.levels > 0 ? `+${gain.levels}레벨 ${ratio}%` : `+${ratio}%`;
}

module.exports = {
    MAX_LEVEL,
    MAX_ENTRIES,
    STOP,
    expAt,
    singleEntry,
    compareAt,
    simulate,
    entriesToReach,
    levelGain,
    levelGainText
};
