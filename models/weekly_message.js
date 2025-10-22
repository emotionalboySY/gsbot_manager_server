const mongoose = require('mongoose');

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
weeklyMessageSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
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