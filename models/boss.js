const mongoose = require('mongoose');

// 페이즈 서브스키마
const PhaseSchema = new mongoose.Schema({
    phaseNumber: {
        type: Number,
        required: true,
        min: 1
    },
    hp: {
        type: Number,
        required: true,
        min: 0
    },
    shield: {
        type: Number,
        default: null,
        min: 0
    },
    monsterLevel: {
        type: Number,
        default: null,
        min: 1
    },
    authenticForce: {
        type: Number,
        default: null,
        min: 0
    }
}, { _id: false });

// 특수 아이템 서브스키마
const SpecialItemsSchema = new mongoose.Schema({
    chilheuk: [{
        type: String
    }],
    eternal: [{
        type: String
    }],
    gwanghwi: [{
        type: String
    }],
    guarantee: [{
        type: String
    }],
    exceptional: [{
        type: String
    }]
}, { _id: false });

// 보상 서브스키마
const RewardsSchema = new mongoose.Schema({
    crystalPrice: {
        type: Number,
        required: true,
        min: 0
    },
    solErda: {
        type: Number,
        default: null,
        min: 0
    },
    items: [{
        type: String,
        required: true
    }],
    specialItems: {
        type: SpecialItemsSchema,
        default: () => ({})
    }
}, { _id: false });

// 난이도 서브스키마
const DifficultySchema = new mongoose.Schema({
    monsterLevel: {
        type: Number,
        required: true,
        min: 1
    },
    defenseRate: {
        type: Number,
        required: true,
        min: 0
    },
    arcaneForce: {
        type: Number,
        default: null,
        min: 0
    },
    authenticForce: {
        type: Number,
        default: null,
        min: 0
    },
    phases: {
        type: [PhaseSchema],
        required: true,
        validate: {
            validator: function(phases) {
                return phases.length > 0;
            },
            message: '최소 1개의 페이즈가 필요합니다.'
        }
    },
    rewards: {
        type: RewardsSchema,
        required: true
    }
}, { _id: false });

// 메인 보스 스키마
const BossSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true
    },
    aliases: {
        type: [String],
        default: [],
        index: true
    },
    entryLevel: {
        type: Number,
        required: true,
        min: 1,
        index: true
    },
    availableDifficulties: {
        type: [String],
        required: true,
        enum: ['이지', '노말', '하드', '카오스', '익스트림'],
        validate: {
            validator: function(difficulties) {
                return difficulties.length > 0;
            },
            message: '최소 1개의 난이도가 필요합니다.'
        }
    },
    difficulties: {
        type: Map,
        of: DifficultySchema,
        required: true
    },
    imageUrl: {
        type: String,
        default: null
    }
}, {
    timestamps: true,
    collection: 'bosses'
});

// 텍스트 검색을 위한 인덱스
BossSchema.index({
    name: 'text',
    aliases: 'text'
});

// 인스턴스 메서드
BossSchema.methods.getDifficulty = function(difficulty) {
    return this.difficulties.get(difficulty);
};

module.exports = mongoose.model('Boss', BossSchema);