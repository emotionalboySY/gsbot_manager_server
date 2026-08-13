const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const router = express.Router();
const mc = require('../utils/main_character.js');
const json = require('../utils/json.js');
const time = require('../utils/time.js');

const helpText = {
    "캐릭터 조회": {
        "본캐": {
            "command": "/본캐 [캐릭터명]",
            "howTo": "[캐릭터명]: 본캐로 지정할 캐릭터명(생략 시 현재 지정된 본캐 조회)\n본캐를 지정하면 캐릭터명을 생략하고 /6차, /히스토리 등을 사용할 수 있습니다."
        },
        "정보": {
            "command": "/정보 [캐릭터명]",
            "howTo": "[캐릭터명]: 기본 정보를 조회할 캐릭터명"
        },
        "랭킹": {
            "command": "/랭킹 [캐릭터명]",
            "howTo": "[캐릭터명]: 랭킹 정보를 조회할 캐릭터명"
        },
        "유니온": {
            "command": "/유니온 [닉네임]",
            "howTo": "[닉네임]: 유니온 정보를 조회할 캐릭터 닉네임"
        },
        "하이퍼스탯": {
            "command": "/하이퍼스탯 [캐릭터명] [프리셋번호]",
            "howTo": "[캐릭터명]: 하이퍼스탯 정보를 조회할 캐릭터명\n[프리셋번호]: 하이퍼스탯 정보를 조회할 프리셋 번호"
        },
        "성향": {
            "command": "/성향 [캐릭터명]",
            "howTo": "[캐릭터명]: 성향 정보를 조회할 캐릭터명"
        },
        "어빌리티": {
            "command": "/어빌리티(어빌) [캐릭터명]",
            "howTo": "[캐릭터명]: 어빌리티 정보를 조회할 캐릭터명"
        },
        "인기도": {
            "command": "/인기도 [캐릭터명]",
            "howTo": "[캐릭터명]: 인기도 정보를 조회할 캐릭터명"
        },
        "전투력": {
            "command": "/전투력 [캐릭터명]",
            "howTo": "[캐릭터명]: 전투력 정보를 조회할 캐릭터명"
        },
        "헥사스탯": {
            "command": "/헥사스탯 [캐릭터명]",
            "howTo": "[캐릭터명]: 헥사스탯 정보를 조회할 캐릭터명"
        },
        "6차": {
            "command": "헥사강화 - /솔에르다(6차) [시작레벨] [목표레벨]\n6차상태 - /솔에르다(6차) [캐릭터명]",
            "howTo": "[시작레벨]: 0 ~ 29 사이의 숫자(0일 땐 코어 개방 포함)\n[목표레벨]: 1 ~ 30 사이의 숫자\n[캐릭터명]: 6차 강화 상태를 조회할 캐릭터명(생략 시 지정된 본캐 조회)"
        },
        "길드멤버랭킹": {
            "command": "/길드랭킹 [월드이름] [길드이름]",
            "howTo": "[월드이름]: 멤버랭킹을 조회할 길드가 속한 월드명\n[길드이름]: 멤버랭킹을 조회할 길드명"
        },
    },
    "히스토리": {
        "히스토리": {
            "command": "/히스토리 [캐릭터명]",
            "howTo": "[캐릭터명]: 경험치와 레벨 히스토리를 조회할 캐릭터명"
        },
        "경험치 히스토리": {
            "command": "/경험치히스토리 [닉네임]",
            "howTo": "[닉네임]: 경험치 획득 기록을 조회할 캐릭터 닉네임"
        },
        "레벨 히스토리": {
            "command": "/레벨히스토리 [닉네임]",
            "howTo": "[닉네임]: 레벨업 기록을 조회할 캐릭터 닉네임"
        },
    },
    "시뮬레이션": {
        "스타포스시뮬": {
            "command": "/스타포스시뮬 [a렙제템을] [n성부터] [m성까지] [스타캐치] [이벤트] [파괴방지]",
            "howTo": "[a렙제템을]: 0 ~ 250 사이의 숫자\n[n성부터]: 1 ~ 29 사이의 숫자\n[m성까지]: 1 ~ 29 사이의 숫자\n[스타캐치]: 스타캐치 적용 - 1 / 스타캐치 미적용 - 0\n[이벤트]: 이벤트 미적용 - 0 / 상시 30% 할인 - 1 / 10성 이하 1+1 강화 - 2 / 21성 이하 파괴확률 30% 감소 - 3 / 샤이닝 스타포스 - 4\n[파괴방지]: 파괴방지 미적용 - 0 / 15 ~ 17성 적용 - 1"
        },
        "타일런트시뮬": {
            "command": "/타일런트시뮬 [n성부터] [m성까지] [스타캐치]",
            "howTo": "[n성부터]: 1 ~ 14 사이의 숫자\n[m성까지]: 1 ~ 14 사이의 숫자\n[스타캐치]: 스타캐치 적용 - 1 / 스타캐치 미적용 - 0"
        },
        "아케인심볼": {
            "command": "/심볼 1 [시작레벨] [목표레벨]",
            "howTo": "[시작레벨]: 1 ~ 20 사이의 숫자\n[목표레벨]: 1 ~ 20 사이의 숫자"
        },
        "어센틱심볼": {
            "command": "심볼 2 [심볼종류] [현재레벨] [현재수치] [목표레벨]",
            "howTo": "[심볼종류]: 여로/츄츄/레헬/알카/모라스/에페/세르니움/아르크스/오디움/도원경/아르테리아/카르시온 중 1개 입력\n[현재레벨]: 1 ~ 20 사이의 숫자\n[현재수치]: 현재 심볼 수치\n[목표 레벨]: 1 ~ 20 사이의 숫자"
        },
        "로얄스타일": {
            "command": "/로얄스타일 [횟수]",
            "howTo": "[횟수]: 1 ~ 1,000,000 사이의 숫자"
        },
        "원더베리": {
            "command": "/원더베리 [횟수]",
            "howTo": "[횟수]: 1 ~ 1,000,000 사이의 숫자"
        },
        "골드애플": {
            "command": "/골드애플 [횟수]",
            "howTo": "[횟수]: 1 ~ 1,000,000 사이의 숫자"
        },
        "플래티넘애플": {
            "command": "/플래티넘애플 [횟수]",
            "howTo": "[횟수]: 1 ~ 1,000,000 사이의 숫자"
        },
        "부티크": {
            "command": "/부티크(부티크기프트) [횟수]",
            "howTo": "[횟수]: 1 ~ 1,000,000 사이의 숫자"
        },
        "녹옥의 보스 반지 상자": {
            "command": "/녹옥 [횟수]",
            "howTo": "[횟수]: 1 ~ 1,000 사이의 숫자"
        },
        "홍옥의 보스 반지 상자": {
            "command": "/홍옥(ㅎㅇ1) [횟수]",
            "howTo": "[횟수]: 1 ~ 1,000 사이의 숫자"
        },
        "흑옥의 보스 반지 상자": {
            "command": "/흑옥(ㅎㅇ2) [횟수]",
            "howTo": "[횟수]: 1 ~ 1,000 사이의 숫자"
        },
        "백옥의 보스 반지 상자": {
            "command": "/백옥 [횟수]",
            "howTo": "[횟수]: 1 ~ 1,000 사이의 숫자"
        },
    },
    "게임 정보": {
        "보스": {
            "command": "/보스 [난이도] [보스명]",
            "howTo": "[난이도]: 카오스 / 하드 / 노말 / 노멀 / 이지\n[보스명]: 띄어쓰기를 포함하지 않은 보스명(ex. 가디언 엔젤 슬라임 -> 가디언엔젤슬라임 or 가엔슬)"
        },
        "이벤트": {
            "command": "/이벤트",
            "howTo": "현재 공식 홈페이지에 등록된 이벤트 리스트를 불러옵니다."
        },
        "캐시샵 공지": {
            "command": "/캐시샵",
            "howTo": "현재 공식 홈페이지에 등록된 캐시샵 공지 리스트를 불러옵니다."
        },
        "선데이": {
            "command": "/선데이(썬데이)"
        },
        "행운의채널": {
            "command": "/행운의채널(채널)"
        },
        "exp쿠폰": {
            "command": "/exp [exp쿠폰타입] [현재레벨] [현재비율] [사용갯수]",
            "howTo": "[exp쿠폰타입]: 일반 - 1, 상급 - 2\n[현재레벨]: 캐릭터의 현재 레벨\n[현재비율]: 캐릭터의 현재 경험치 획득량(%)\n[사용갯수]: 사용할 EXP쿠폰 갯수"
        },
        "익성비": {
            "command": "/익성비 [캐릭터레벨] [사용횟수]",
            "howTo": "[캐릭터레벨]: 익성비를 사용할 캐릭터의 레벨 (141 ~ 299)\n[사용횟수]: 익성비를 사용할 횟수(1 ~ 500)"
        },
    },
    "기타": {
        "뭐먹지": {
            "command": "/뭐먹지"
        },
        "뭐하지": {
            "command": "/뭐하지"
        },
        "vs": {
            "command": "없음(채팅에 vs가 포함된 경우 발동)"
        },
        "제작자": {
            "command": "/제작자"
        },
        "건의": {
            "command": "/건의 [건의내용]",
            "howTo": "[건의내용]: 건의하고 싶은 내용"
        },
        "공지": {
            "command": "/공지"
        },
        "업데이트": {
            "command": "/업데이트"
        },
    },
};

const HELP_USAGE = `<명령어 사용 방법>
- "/[명령어]"의 형태로 사용
- 모든 명령어는 초성만으로도 호출할 수 있습니다.
- 명령어 뒤 파라미터는 모두 띄어쓰기로 구분
- 자세한 사용법: /도움말 [분류명] 또는 /도움말 [명령어]`;

/** 분류명 목록과 각 분류에 속한 명령어 이름만 보여준다 (전체를 다 뿌리면 너무 길다) */
function renderHelpOverview() {
    let plain = HELP_USAGE;
    let markdown = `## 명령어 도움말\n\n${HELP_USAGE}`;

    for (const category of Object.keys(helpText)) {
        const names = Object.keys(helpText[category]).join(" · ");
        plain += `\n\n[${category}]\n${names}`;
        markdown += `\n\n### ${category}\n${names}`;
    }
    return { plain, markdown };
}

/** 명령어 한 건의 상세 */
function renderHelpEntry(name, entry, index) {
    const head = index ? `${index}. ${name}` : name;
    let plain = `${head}\n  명령어: ${entry.command}`;
    let markdown = `**${head}**\n${entry.command}`;
    if (entry.howTo !== undefined) {
        plain += `\n${entry.howTo}`;
        markdown += `\n${entry.howTo}`;
    }
    return { plain, markdown };
}

function renderHelpCategory(category) {
    let plain = `[${category}]`;
    let markdown = `## ${category}`;
    let index = 1;

    for (const [name, entry] of Object.entries(helpText[category])) {
        const rendered = renderHelpEntry(name, entry, index++);
        plain += `\n\n${rendered.plain}`;
        markdown += `\n\n${rendered.markdown}`;
    }
    return { plain, markdown };
}

/** 분류명 → 명령어명 순으로 찾는다. 공백을 무시해 "게임정보" 로도 찾히게 한다. */
function findHelpTarget(query) {
    const normalize = (text) => String(text).replace(/\s+/g, "").toLowerCase();
    const target = normalize(query);

    for (const category of Object.keys(helpText)) {
        if (normalize(category) === target) return { type: "category", category };
    }
    for (const category of Object.keys(helpText)) {
        for (const name of Object.keys(helpText[category])) {
            if (normalize(name) === target) {
                return { type: "entry", category, name, entry: helpText[category][name] };
            }
        }
    }
    return null;
}

router.get('/help', async (req, res) => {
    const query = typeof req.query.query === 'string' ? req.query.query.trim() : '';
    console.log(`${time.getNowDateTime()} - 도움말${query ? `(${query})` : ''}`);

    try {
        if (!query) {
            const { plain, markdown } = renderHelpOverview();
            return res.status(200).json(json.successWithMarkdown(plain, markdown));
        }

        const found = findHelpTarget(query);
        if (found === null) {
            const categories = Object.keys(helpText).join(" · ");
            return res.status(200).json(json.failure(
                `"${query}" 에 해당하는 분류나 명령어를 찾을 수 없습니다.\n\n분류: ${categories}\n전체 목록은 /도움말 로 확인하세요.`
            ));
        }

        const { plain, markdown } = found.type === "category"
            ? renderHelpCategory(found.category)
            : renderHelpEntry(found.name, found.entry, null);

        return res.status(200).json(json.successWithMarkdown(plain, markdown));
    } catch (e) {
        console.log(e);
        return res.status(200).json(json.failure(`서버 오류입니다. 관리자에게 문의하세요\n- 오류: ${e.message}`));
    }
});

module.exports = router;