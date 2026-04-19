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
    },
    description: {
        type: String,
        default: null
    }
}, { _id: false });

// 특수 아이템 서브스키마
const SpecialItemsSchema = new mongoose.Schema({
    yeomyeong: [{   // 여명
        type: String
    }],
    chilheuk: [{    // 칠흑
        type: String
    }],
    absolab: [{     // 앱솔랩스
        type: String
    }],
    arcane: [{      // 아케인셰이드
        type: String
    }],
    eternal: [{     // 에테르넬
        type: String
    }],
    gwanghwi: [{    // 광휘
        type: String
    }],
    exceptional: [{ // 익셉셔널
        type: String
    }]
}, { _id: false });

// 해방 재료 서브스키마
// - genesis와 destiny는 동시에 가질 수 없음 (XOR)
// - astra는 위 두 가지와 공존 가능
const LiberationMaterialsSchema = new mongoose.Schema({
    genesis: [{   // 제네시스 해방 재료
        type: String
    }],
    destiny: [{   // 데스티니 해방 재료
        type: String
    }],
    astra: [{     // 아스트라 보조무기 해방 재료
        type: String
    }]
}, { _id: false });

LiberationMaterialsSchema.pre('validate', function(next) {
    if (this.genesis?.length > 0 && this.destiny?.length > 0) {
        return next(new Error('제네시스와 데스티니 해방 재료는 동시에 가질 수 없습니다.'));
    }
    next();
});

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
    },
    liberationMaterials: {
        type: LiberationMaterialsSchema,
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
    imageName: {
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