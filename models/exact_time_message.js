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
exactTimeMessageSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// 날짜 유효성 검증
exactTimeMessageSchema.pre('save', function (next) {
    const date = new Date(this.year, this.month - 1, this.day);
    if (date.getMonth() !== this.month - 1 || date.getDate() !== this.day) {
        next(new Error('유효하지 않은 날짜입니다.'));
    } else {
        next();
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