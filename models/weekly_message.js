const mongoose = require('mongoose');
const scheduledChangeSchema = require('./scheduled_change');

const weeklyMessageSchema = new mongoose.Schema({
    dayOfWeek: {
        type: String,
        required: true,
        enum: ['일', '월', '화', '수', '목', '금', '토'],
        index: true
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
    // 관리자가 붙이는 이름. 봇이 로드 결과 목록에 적는다. 없으면 본문 첫 줄을 쓴다
    title: {
        type: String,
        trim: true,
        maxlength: 100,
        default: ''
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // 변경 예약. at 순으로 적용되고 적용된 항목은 빠진다
    scheduledChanges: {
        type: [scheduledChangeSchema],
        default: []
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
weeklyMessageSchema.pre('save', function () {
    this.updatedAt = Date.now();
});

// JSON 변환 시 한국 시간으로 변환
weeklyMessageSchema.set('toJSON', {
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

// 복합 인덱스 생성 (요일 + 시간 + 분)
weeklyMessageSchema.index({ dayOfWeek: 1, hour: 1, minute: 1 });

module.exports = mongoose.model('WeeklyMessage', weeklyMessageSchema);