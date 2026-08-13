// 보스 반지 상자 확률 데이터 (넥슨 확률 공시 페이지에서 추출)
// 각 상자의 source 필드에 원본 URL 이 있다.
//
// 공시 표는 개별 확률(누적 아님)이다. 시뮬레이션에서 누적으로 변환해 쓴다.
// isRing: 레벨은 스킬 반지에만 부여된다("생명의 보스 반지 상자에서 획득하는 반지는
//         3~4레벨이 부여되며..."). 생명의 연마석 처럼 반지가 아닌 아이템은 레벨이 없다.
//
// 확률 합이 100% 가 아닌 것은 공시 표가 반올림 표기이기 때문이다
// (게임산업법 시행령에 따른 표기). 뽑기는 마지막 항목으로 보정한다.

const SEED_RING_BOXES = [
    {
        "mode": 0,
        "name": "녹옥",
        "label": "녹옥의 보스 반지 상자",
        "source": "https://maplestory.nexon.com/Guide/OtherProbability/bossRingBox/ringBoxGreenJade",
        "levels": [
            {
                "level": 1,
                "prob": 50.0
            },
            {
                "level": 2,
                "prob": 41.0
            },
            {
                "level": 3,
                "prob": 9.0
            }
        ],
        "items": [
            {
                "name": "리스트레인트 링",
                "prob": 2.11268,
                "isRing": true
            },
            {
                "name": "컨티뉴어스 링",
                "prob": 2.11268,
                "isRing": true
            },
            {
                "name": "웨폰퍼프 - S링",
                "prob": 2.8169,
                "isRing": true
            },
            {
                "name": "웨폰퍼프 - I링",
                "prob": 2.8169,
                "isRing": true
            },
            {
                "name": "웨폰퍼프 - L링",
                "prob": 2.8169,
                "isRing": true
            },
            {
                "name": "웨폰퍼프 - D링",
                "prob": 2.8169,
                "isRing": true
            },
            {
                "name": "얼티메이덤 링",
                "prob": 2.8169,
                "isRing": true
            },
            {
                "name": "리스크테이커 링",
                "prob": 2.8169,
                "isRing": true
            },
            {
                "name": "링 오브 썸",
                "prob": 2.8169,
                "isRing": true
            },
            {
                "name": "크리데미지 링",
                "prob": 2.8169,
                "isRing": true
            },
            {
                "name": "크라이시스 - HM링",
                "prob": 2.8169,
                "isRing": true
            },
            {
                "name": "버든리프트 링",
                "prob": 3.52113,
                "isRing": true
            },
            {
                "name": "오버패스 링",
                "prob": 3.52113,
                "isRing": true
            },
            {
                "name": "레벨퍼프 - S링",
                "prob": 3.52113,
                "isRing": true
            },
            {
                "name": "레벨퍼프 - I링",
                "prob": 3.52113,
                "isRing": true
            },
            {
                "name": "레벨퍼프 - L링",
                "prob": 3.52113,
                "isRing": true
            },
            {
                "name": "레벨퍼프 - D링",
                "prob": 3.52113,
                "isRing": true
            },
            {
                "name": "헬스컷 링",
                "prob": 3.52113,
                "isRing": true
            },
            {
                "name": "크리디펜스 링",
                "prob": 3.52113,
                "isRing": true
            },
            {
                "name": "리밋 링",
                "prob": 3.52113,
                "isRing": true
            },
            {
                "name": "듀라빌리티 링",
                "prob": 3.52113,
                "isRing": true
            },
            {
                "name": "리커버디펜스 링",
                "prob": 3.52113,
                "isRing": true
            },
            {
                "name": "실드스와프 링",
                "prob": 3.52113,
                "isRing": true
            },
            {
                "name": "마나컷 링",
                "prob": 3.52113,
                "isRing": true
            },
            {
                "name": "크라이시스 - H링",
                "prob": 3.52113,
                "isRing": true
            },
            {
                "name": "크라이시스 - M링",
                "prob": 3.52113,
                "isRing": true
            },
            {
                "name": "크리쉬프트 링",
                "prob": 3.52113,
                "isRing": true
            },
            {
                "name": "스탠스쉬프트 링",
                "prob": 3.52113,
                "isRing": true
            },
            {
                "name": "리커버스텐스 링",
                "prob": 3.52113,
                "isRing": true
            },
            {
                "name": "스위프트 링",
                "prob": 3.52113,
                "isRing": true
            },
            {
                "name": "리플렉티브 링",
                "prob": 3.52113,
                "isRing": true
            }
        ]
    },
    {
        "mode": 1,
        "name": "홍옥",
        "label": "홍옥의 보스 반지 상자",
        "source": "https://maplestory.nexon.com/Guide/OtherProbability/bossRingBox/ringBoxRedJade",
        "levels": [
            {
                "level": 1,
                "prob": 40.0
            },
            {
                "level": 2,
                "prob": 30.0
            },
            {
                "level": 3,
                "prob": 20.0
            },
            {
                "level": 4,
                "prob": 10.0
            }
        ],
        "items": [
            {
                "name": "리스트레인트 링",
                "prob": 6.92308,
                "isRing": true
            },
            {
                "name": "컨티뉴어스 링",
                "prob": 6.92308,
                "isRing": true
            },
            {
                "name": "웨폰퍼프 - S링",
                "prob": 6.15385,
                "isRing": true
            },
            {
                "name": "웨폰퍼프 - I링",
                "prob": 6.15385,
                "isRing": true
            },
            {
                "name": "웨폰퍼프 - L링",
                "prob": 6.15385,
                "isRing": true
            },
            {
                "name": "웨폰퍼프 - D링",
                "prob": 6.15385,
                "isRing": true
            },
            {
                "name": "얼티메이덤 링",
                "prob": 6.15385,
                "isRing": true
            },
            {
                "name": "리스크테이커 링",
                "prob": 6.15385,
                "isRing": true
            },
            {
                "name": "링 오브 썸",
                "prob": 6.15385,
                "isRing": true
            },
            {
                "name": "크리데미지 링",
                "prob": 6.15385,
                "isRing": true
            },
            {
                "name": "크라이시스 - HM링",
                "prob": 6.15385,
                "isRing": true
            },
            {
                "name": "버든리프트 링",
                "prob": 1.53846,
                "isRing": true
            },
            {
                "name": "오버패스 링",
                "prob": 1.53846,
                "isRing": true
            },
            {
                "name": "레벨퍼프 - S링",
                "prob": 1.53846,
                "isRing": true
            },
            {
                "name": "레벨퍼프 - I링",
                "prob": 1.53846,
                "isRing": true
            },
            {
                "name": "레벨퍼프 - L링",
                "prob": 1.53846,
                "isRing": true
            },
            {
                "name": "레벨퍼프 - D링",
                "prob": 1.53846,
                "isRing": true
            },
            {
                "name": "헬스컷 링",
                "prob": 1.53846,
                "isRing": true
            },
            {
                "name": "크리디펜스 링",
                "prob": 1.53846,
                "isRing": true
            },
            {
                "name": "리밋 링",
                "prob": 1.53846,
                "isRing": true
            },
            {
                "name": "듀라빌리티 링",
                "prob": 1.53846,
                "isRing": true
            },
            {
                "name": "리커버디펜스 링",
                "prob": 1.53846,
                "isRing": true
            },
            {
                "name": "실드스와프 링",
                "prob": 1.53846,
                "isRing": true
            },
            {
                "name": "마나컷 링",
                "prob": 1.53846,
                "isRing": true
            },
            {
                "name": "크라이시스 - H링",
                "prob": 1.53846,
                "isRing": true
            },
            {
                "name": "크라이시스 - M링",
                "prob": 1.53846,
                "isRing": true
            },
            {
                "name": "크리쉬프트 링",
                "prob": 1.53846,
                "isRing": true
            },
            {
                "name": "스탠스쉬프트 링",
                "prob": 1.53846,
                "isRing": true
            },
            {
                "name": "리커버스텐스 링",
                "prob": 1.53846,
                "isRing": true
            },
            {
                "name": "스위프트 링",
                "prob": 1.53846,
                "isRing": true
            },
            {
                "name": "리플렉티브 링",
                "prob": 1.53846,
                "isRing": true
            }
        ]
    },
    {
        "mode": 2,
        "name": "흑옥",
        "label": "흑옥의 보스 반지 상자",
        "source": "https://maplestory.nexon.com/Guide/OtherProbability/bossRingBox/ringBoxBlackJade",
        "levels": [
            {
                "level": 1,
                "prob": 25.0
            },
            {
                "level": 2,
                "prob": 25.0
            },
            {
                "level": 3,
                "prob": 30.0
            },
            {
                "level": 4,
                "prob": 20.0
            }
        ],
        "items": [
            {
                "name": "리스트레인트 링",
                "prob": 12.5,
                "isRing": true
            },
            {
                "name": "컨티뉴어스 링",
                "prob": 12.5,
                "isRing": true
            },
            {
                "name": "웨폰퍼프 - S링",
                "prob": 8.33333,
                "isRing": true
            },
            {
                "name": "웨폰퍼프 - I링",
                "prob": 8.33333,
                "isRing": true
            },
            {
                "name": "웨폰퍼프 - L링",
                "prob": 8.33333,
                "isRing": true
            },
            {
                "name": "웨폰퍼프 - D링",
                "prob": 8.33333,
                "isRing": true
            },
            {
                "name": "얼티메이덤 링",
                "prob": 8.33333,
                "isRing": true
            },
            {
                "name": "리스크테이커 링",
                "prob": 8.33333,
                "isRing": true
            },
            {
                "name": "링 오브 썸",
                "prob": 8.33333,
                "isRing": true
            },
            {
                "name": "크리데미지 링",
                "prob": 8.33333,
                "isRing": true
            },
            {
                "name": "크라이시스 - HM링",
                "prob": 8.33333,
                "isRing": true
            }
        ]
    },
    {
        "mode": 3,
        "name": "백옥",
        "label": "백옥의 보스 반지 상자",
        "source": "https://maplestory.nexon.com/Guide/OtherProbability/bossRingBox/ringBoxWhiteJade",
        "levels": [
            {
                "level": 3,
                "prob": 65.0
            },
            {
                "level": 4,
                "prob": 35.0
            }
        ],
        "items": [
            {
                "name": "리스트레인트 링",
                "prob": 14.28571,
                "isRing": true
            },
            {
                "name": "컨티뉴어스 링",
                "prob": 14.28571,
                "isRing": true
            },
            {
                "name": "웨폰퍼프 - S링",
                "prob": 7.93651,
                "isRing": true
            },
            {
                "name": "웨폰퍼프 - I링",
                "prob": 7.93651,
                "isRing": true
            },
            {
                "name": "웨폰퍼프 - L링",
                "prob": 7.93651,
                "isRing": true
            },
            {
                "name": "웨폰퍼프 - D링",
                "prob": 7.93651,
                "isRing": true
            },
            {
                "name": "얼티메이덤 링",
                "prob": 7.93651,
                "isRing": true
            },
            {
                "name": "리스크테이커 링",
                "prob": 7.93651,
                "isRing": true
            },
            {
                "name": "링 오브 썸",
                "prob": 7.93651,
                "isRing": true
            },
            {
                "name": "크리데미지 링",
                "prob": 7.93651,
                "isRing": true
            },
            {
                "name": "크라이시스 - HM링",
                "prob": 7.93651,
                "isRing": true
            }
        ]
    },
    {
        "mode": 4,
        "name": "생명",
        "label": "생명의 보스 반지 상자",
        "source": "https://maplestory.nexon.com/Guide/OtherProbability/bossRingBox/ringBoxLifeJade",
        "levels": [
            {
                "level": 3,
                "prob": 30.0
            },
            {
                "level": 4,
                "prob": 70.0
            }
        ],
        "items": [
            {
                "name": "리스트레인트 링",
                "prob": 14.51613,
                "isRing": true
            },
            {
                "name": "컨티뉴어스 링",
                "prob": 14.51613,
                "isRing": true
            },
            {
                "name": "웨폰퍼프 - S링",
                "prob": 8.06452,
                "isRing": true
            },
            {
                "name": "웨폰퍼프 - I링",
                "prob": 8.06452,
                "isRing": true
            },
            {
                "name": "웨폰퍼프 - L링",
                "prob": 8.06452,
                "isRing": true
            },
            {
                "name": "웨폰퍼프 - D링",
                "prob": 8.06452,
                "isRing": true
            },
            {
                "name": "리스크테이커 링",
                "prob": 8.06452,
                "isRing": true
            },
            {
                "name": "링 오브 썸",
                "prob": 8.06452,
                "isRing": true
            },
            {
                "name": "크리데미지 링",
                "prob": 8.06452,
                "isRing": true
            },
            {
                "name": "생명의 연마석",
                "prob": 14.51613,
                "isRing": false
            }
        ]
    }
];

module.exports = { SEED_RING_BOXES };
