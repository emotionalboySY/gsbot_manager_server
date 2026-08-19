const mongoose = require('mongoose');

const exactTimeMessageSchema = new mongoose.Schema({
    year: {
        type: Number,
        required: true,
        min: 2000,
        max: 2100
    },
    month: {
        type: Number,
        required: true,
        min: 1,
        max: 12
    },
    day: {
       type: Number,
       required: true,
       min: 1,
       max: 31
    },
    hour: {
        type: Number,
        required: true,
        min: 0,
        max: 23
    },
    minute: {
        type: Number,
        required: true,
        min: 0,
        max: 59
    },
    message: {
        type: String,
        required: true,
        trim: true,
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// 업데이트 시 updatedAt 자동 갱신
// Mongoose 9 부터 콜백(next) 방식 미들웨어를 받지 않는다. next 를 부르면
// "next is not a function" 으로 save() 가 통째로 실패한다(생성이 전부 400 이었다).
// 오류는 throw 로 알린다 — models/boss.js 의 pre('validate') 와 같은 방식이다.
exactTimeMessageSchema.pre('save', function () {
    this.updatedAt = Date.now();
});

// 날짜 유효성 검증 (2월 30일처럼 달에 없는 날을 막는다)
exactTimeMessageSchema.pre('save', function () {
    const date = new Date(this.year, this.month - 1, this.day);
    if (date.getMonth() !== this.month - 1 || date.getDate() !== this.day) {
        throw new Error('유효하지 않은 날짜입니다.');
    }
});

// JSON 변환 시 한국 시간으로 변환
exactTimeMessageSchema.set('toJSON', {
    transform: function(doc, ret) {
        if (ret.createdAt) {
            ret.createdAt = new Date(ret.createdAt.getTime() + (9 * 60 * 60 * 1000));
        }
        if (ret.updatedAt) {
            ret.updatedAt = new Date(ret.updatedAt.getTime() + (9 * 60 * 60 * 1000));
        }
        return ret;
    }
});

module.exports = mongoose.model('ExactTimeMessage', exactTimeMessageSchema);