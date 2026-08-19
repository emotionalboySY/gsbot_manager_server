const mongoose = require('mongoose');

const dailyMessageSchema = new mongoose.Schema({
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
        maxlength: 1000
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
dailyMessageSchema.pre('save', function () {
    this.updatedAt = Date.now();
});

// JSON 변환 시 한국 시간으로 변환
dailyMessageSchema.set('toJSON', {
    transform: function(doc, ret) {
        // UTC 시간을 한국 시간으로 변환 (UTC+9)
        if (ret.createdAt) {
            ret.createdAt = new Date(ret.createdAt.getTime() + (9 * 60 * 60 * 1000));
        }
        if (ret.updatedAt) {
            ret.updatedAt = new Date(ret.updatedAt.getTime() + (9 * 60 * 60 * 1000));
        }
        return ret;
    }
});

// 복합 인덱스 생성 (시간 + 분)
dailyMessageSchema.index({ hour: 1, minute: 1 });

module.exports = mongoose.model('DailyMessage', dailyMessageSchema);