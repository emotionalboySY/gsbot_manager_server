// 결과와 요약을 눈으로 가르는 구분선.
//
// 마크다운의 --- 는 카카오톡에서 가로선으로 렌더링되지 않고 문자 그대로 보인다.
// 렌더링 여부와 무관하게 선으로 보이는 문자를 쓴다.
const RULE = "──────────";


// 경험치처럼 자리수가 큰 값을 조/억 단위로 줄여 읽는다. 8740932065809 는
// "8조 7409억"이 된다. 카카오톡 한 줄에 원본 숫자를 그대로 흘리면 자리수를
// 세게 되므로 요약에는 이쪽을 쓰고, 정확한 값이 필요한 자리에만 원본을 쓴다.
const KOREAN_UNITS = [
    { value: 1000000000000, label: "조" },
    { value: 100000000, label: "억" },
    { value: 10000, label: "만" }
];

function toKoreanUnit(value, maxParts) {
    const limit = maxParts || 2;
    let rest = Math.floor(Math.abs(Number(value) || 0));
    const sign = Number(value) < 0 ? "-" : "";
    const parts = [];

    for (let i = 0; i < KOREAN_UNITS.length && parts.length < limit; i++) {
        const unit = KOREAN_UNITS[i];
        const amount = Math.floor(rest / unit.value);
        if (amount > 0) {
            parts.push(`${amount.toLocaleString("ko-KR")}${unit.label}`);
            rest -= amount * unit.value;
        } else if (parts.length > 0) {
            // 앞 단위가 잡힌 뒤의 0 자리는 건너뛰되 자리수는 유지한다
            continue;
        }
    }

    if (parts.length === 0) return `${sign}${rest.toLocaleString("ko-KR")}`;
    return sign + parts.join(" ");
}

module.exports = { RULE, toKoreanUnit };
