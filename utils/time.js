function getDateStringForAPI(date) {
    let useDate = new Date(date);
    return `${useDate.getFullYear()}-${String(useDate.getMonth() + 1).padStart(2, '0')}-${String(useDate.getDate()).padStart(2, '0')}`;
}

function getKorDateString(date) {
    return `${date.getFullYear()}년 ${String(date.getMonth() + 1).padStart(2, '0')}월 ${String(date.getDate()).padStart(2, '0')}일`;
}

function getKorDateStringAndTime(dateString, typeNum) {
    const date = new Date(dateString);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    if (typeNum == 1) return `${year}년 ${month}월 ${day}일 ${hours}시 ${minutes}분`;
    else return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function getNowDateTime() {
    let now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
}

function isSameDate(baseDate, comDate) {
    if (baseDate.getFullYear() == comDate.getFullYear() && baseDate.getMonth() == comDate.getMonth() && baseDate.getDate() == comDate.getDate()) {
        return true;
    } else return false;
}

// Nexon OpenAPI 호출용 날짜 문자열 반환
// 0시~1시에는 갱신 작업으로 전일 데이터를 불러올 수 없어 2일 전 날짜를 사용
function getAPIDateString() {
    let date = new Date();
    console.log(date);
    if (date.getHours() === 0) {
        date.setDate(date.getDate() - 2);
    } else {
        date.setDate(date.getDate() - 1);
    }
    console.log(date);
    return getDateStringForAPI(date);
}

// 현재 Nexon OpenAPI 갱신 시간(0시~1시)인지 확인
function isAPIUpdateTime() {
    return new Date().getHours() === 0;
}

module.exports = {
    getDateStringForAPI,
    getKorDateString,
    getKorDateStringAndTime,
    getNowDateTime,
    isSameDate,
    getAPIDateString,
    isAPIUpdateTime
};