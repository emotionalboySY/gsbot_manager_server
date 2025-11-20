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

module.exports = {
    getDateStringForAPI,
    getKorDateString,
    getKorDateStringAndTime,
    getNowDateTime,
    isSameDate
};