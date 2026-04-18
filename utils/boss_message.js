// 보스 메시지 템플릿 렌더링 유틸

const KOREAN_UNITS = ['', '만', '억', '조', '경', '해'];
const SPECIAL_ITEM_LABELS = {
    yeomyeong: '[여명]',
    chilheuk: '[칠흑]',
    absolab: '[앱솔]',
    arcane: '[아케인]',
    eternal: '[에테르넬]',
    gwanghwi: '[광휘]',
    exceptional: '[익셉셔널]'
};

const DEFAULT_TEMPLATE = `◆ {보스명} ({난이도}) ◆
입장 Lv.{입장레벨}

{페이즈정보}

◆ 주요 보상 ◆
결정석 {결정석가격_한글} ({결정석가격}메소){?솔에르다}
솔 에르다 {솔에르다}{/솔에르다}{?아이템목록}

{아이템목록}{/아이템목록}{?특수아이템목록}

{특수아이템목록}{/특수아이템목록}`;

// HP 숫자를 한국어 단위로 변환 (경, 조, 억)
function formatHp(hp) {
    if (!hp || hp <= 0) return '0';
    const gyeong = Math.floor(hp / 10000000000000000);
    const jo = Math.floor((hp % 10000000000000000) / 1000000000000);
    const eok = Math.floor((hp % 1000000000000) / 100000000);

    const parts = [];
    if (gyeong > 0) parts.push(`${gyeong.toLocaleString('ko-KR')}경`);
    if (jo > 0) parts.push(`${jo.toLocaleString('ko-KR')}조`);
    if (eok > 0) parts.push(`${eok.toLocaleString('ko-KR')}억`);

    return parts.join(' ') || '0';
}

// 한국식 숫자 표기 (만 단위 이상)
function toKoreanNumber(num) {
    if (num === null || num === undefined) return '';
    const abs = Math.abs(Math.trunc(num));
    if (abs < 10000) return abs.toLocaleString('ko-KR');

    const digits = String(abs);
    const groups = [];
    let rest = digits;
    while (rest.length > 4) {
        groups.unshift(rest.slice(-4));
        rest = rest.slice(0, -4);
    }
    if (rest.length > 0) groups.unshift(rest);

    if (groups.length > KOREAN_UNITS.length) return abs.toLocaleString('ko-KR');

    const parts = [];
    for (let i = 0; i < groups.length; i++) {
        const groupValue = parseInt(groups[i], 10);
        if (groupValue === 0) continue;
        const unitIdx = groups.length - 1 - i;
        const unit = KOREAN_UNITS[unitIdx];
        const formatted = String(groupValue).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        parts.push(`${formatted}${unit}`);
    }

    return parts.join(' ');
}

// 페이즈 정보 블록 렌더링
function renderPhaseInfo(diffData) {
    const phases = diffData.phases || [];
    const hasPhaseSpecificInfo = phases.some(p => p.monsterLevel || p.authenticForce || p.shield);
    const isSinglePhase = phases.length === 1;
    const fmt = (v) => v.toLocaleString('ko-KR');

    const lines = [];

    if (isSinglePhase) {
        const phase = phases[0];
        const stats = [`Lv.${diffData.monsterLevel}`, `방어율 ${diffData.defenseRate}%`];
        if (diffData.arcaneForce) stats.push(`아케인 ${fmt(diffData.arcaneForce)}`);
        if (diffData.authenticForce) stats.push(`어센틱 ${fmt(diffData.authenticForce)}`);
        lines.push(`▪ 단일 페이즈`);
        lines.push(`  ${stats.join(' · ')}`);
        const hp = [`HP ${formatHp(phase.hp)}`];
        if (phase.shield) hp.push(`방어막 ${formatHp(phase.shield)}`);
        lines.push(`  ${hp.join(' · ')}`);
        return lines.join('\n');
    }

    const hasPhaseMonsterLevel = phases.some(p => p.monsterLevel);
    const hasPhaseAuthForce = phases.some(p => p.authenticForce);

    // 공통 블록
    const common = [];
    if (!hasPhaseMonsterLevel || !hasPhaseSpecificInfo) common.push(`Lv.${diffData.monsterLevel}`);
    common.push(`방어율 ${diffData.defenseRate}%`);
    if (diffData.arcaneForce) common.push(`아케인 ${fmt(diffData.arcaneForce)}`);
    if (!hasPhaseAuthForce && diffData.authenticForce) common.push(`어센틱 ${fmt(diffData.authenticForce)}`);
    lines.push(`▪ 공통`);
    lines.push(`  ${common.join(' · ')}`);

    for (const phase of phases) {
        lines.push('');
        lines.push(`▪ 페이즈 ${phase.phaseNumber}`);
        const parts = [];
        if (phase.monsterLevel) parts.push(`Lv.${phase.monsterLevel}`);
        if (phase.description) {
            parts.push(phase.description);
        } else {
            parts.push(`HP ${formatHp(phase.hp)}`);
        }
        if (phase.shield) parts.push(`방어막 ${formatHp(phase.shield)}`);
        if (phase.authenticForce) parts.push(`어센틱 ${fmt(phase.authenticForce)}`);
        lines.push(`  ${parts.join(' · ')}`);
    }

    return lines.join('\n');
}

// 일반 아이템 목록 (한 줄에 하나씩, 불릿 접두)
function renderItems(items) {
    if (!items || items.length === 0) return '';
    return items.map(item => `• ${item}`).join('\n');
}

// 특수 아이템 목록 (카테고리 라벨 포함)
function renderSpecialItems(specialItems) {
    if (!specialItems) return '';
    const lines = [];
    for (const [category, label] of Object.entries(SPECIAL_ITEM_LABELS)) {
        const itemList = specialItems[category] || (specialItems.get && specialItems.get(category));
        if (itemList && itemList.length > 0) {
            for (const item of itemList) {
                lines.push(`${label} ${item}`);
            }
        }
    }
    return lines.join('\n');
}

// 변수 컨텍스트 빌드
function buildContext(bossName, entryLevel, displayDiff, diffData) {
    const rewards = diffData.rewards || {};
    const specialItems = rewards.specialItems
        ? (rewards.specialItems.toJSON ? rewards.specialItems.toJSON() : rewards.specialItems)
        : {};

    return {
        '보스명': bossName,
        '난이도': displayDiff,
        '입장레벨': entryLevel,
        '몬스터레벨': diffData.monsterLevel,
        '방어율': diffData.defenseRate,
        '아케인포스': diffData.arcaneForce ?? '',
        '어센틱포스': diffData.authenticForce ?? '',
        '결정석가격': (rewards.crystalPrice ?? 0).toLocaleString('ko-KR'),
        '결정석가격_한글': toKoreanNumber(rewards.crystalPrice ?? 0),
        '솔에르다': rewards.solErda ?? '',
        '페이즈정보': renderPhaseInfo(diffData),
        '아이템목록': renderItems(rewards.items),
        '특수아이템목록': renderSpecialItems(specialItems)
    };
}

// 템플릿 렌더링: 조건 블록 -> 변수 치환
function renderTemplate(template, context) {
    if (!template) return '';

    // 조건 블록 {?변수}내용{/변수}
    let result = template.replace(/\{\?([^}\/]+)\}([\s\S]*?)\{\/\1\}/g, (match, key, content) => {
        const val = context[key.trim()];
        const isEmpty =
            val === null ||
            val === undefined ||
            val === '' ||
            (typeof val === 'number' && val === 0) ||
            (Array.isArray(val) && val.length === 0);
        if (isEmpty) return '';
        return content;
    });

    // 변수 치환 {변수}
    result = result.replace(/\{([^?\/{}][^{}]*)\}/g, (match, key) => {
        const trimmed = key.trim();
        if (!Object.prototype.hasOwnProperty.call(context, trimmed)) return match;
        const val = context[trimmed];
        if (val === null || val === undefined) return '';
        return String(val);
    });

    return result;
}

function renderBossMessage(template, bossName, entryLevel, displayDiff, diffData) {
    const ctx = buildContext(bossName, entryLevel, displayDiff, diffData);
    return renderTemplate(template, ctx);
}

// 예약어 메타 정보 (UI 노출용)
const RESERVED_KEYWORDS = [
    { key: '보스명', label: '보스 이름', sample: '검은마법사' },
    { key: '난이도', label: '난이도', sample: '하드' },
    { key: '입장레벨', label: '입장 가능 레벨', sample: 255 },
    { key: '몬스터레벨', label: '몬스터 레벨', sample: 265 },
    { key: '방어율', label: '방어율(%)', sample: 300 },
    { key: '아케인포스', label: '아케인 포스 (없으면 빈 문자열)', sample: 1320 },
    { key: '어센틱포스', label: '어센틱 포스 (없으면 빈 문자열)', sample: '' },
    { key: '결정석가격', label: '결정석 가격 (천 단위 콤마)', sample: '1,000,000,000' },
    { key: '결정석가격_한글', label: '결정석 가격 (한국식 표기)', sample: '10억' },
    { key: '솔에르다', label: '솔 에르다의 기운 (없으면 빈 문자열)', sample: 300 },
    { key: '페이즈정보', label: '페이즈 정보 블록 (자동 렌더링)', sample: '- 단일 페이즈\n…' },
    { key: '아이템목록', label: '일반 아이템 목록 (줄바꿈 구분)', sample: '백옥의 보스 반지 상자(최상급)' },
    { key: '특수아이템목록', label: '특수 아이템 목록 (카테고리 라벨 포함)', sample: '[칠흑] 창세의 뱃지' }
];

module.exports = {
    DEFAULT_TEMPLATE,
    SPECIAL_ITEM_LABELS,
    RESERVED_KEYWORDS,
    formatHp,
    toKoreanNumber,
    renderPhaseInfo,
    renderItems,
    renderSpecialItems,
    buildContext,
    renderTemplate,
    renderBossMessage
};
