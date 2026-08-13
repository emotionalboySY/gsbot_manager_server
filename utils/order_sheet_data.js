// 게임 주문서 확률 데이터 (넥슨 확률 공시 페이지에서 추출)
// https://maplestory.nexon.com/Guide/OtherProbability/game/gameOrderSheet
// 잠재능력 부여 스크롤류와 기타(이노센트 주문서)는 옵션 부여가 아니라 제외했다.
//
// type "normal"  : 성공 시 baseOptions 가 항상 붙고 options 중 하나가 확률로 붙는다
// type "chaos"   : 성공 시 옵션 그룹별로 수치를 하나씩 뽑는다 (기존 옵션을 조정하는 주문서)
//
// 표기 오류 보정: 공시 페이지의 "공력력 +10" 은 "공격력 +10" 의 오타라 바로잡았다.

const ORDER_SHEETS = [
    {
        "category": "매지컬 주문서류",
        "name": "매지컬 한손무기 공격력 주문서 매지컬 두손무기 공격력 주문서",
        "displayName": "매지컬 한손/두손무기 공격력 주문서",
        "successRate": 100.0,
        "type": "normal",
        "baseOptions": [
            "올스탯 +3"
        ],
        "options": [
            {
                "option": "공격력 +9",
                "prob": 50.0
            },
            {
                "option": "공격력 +10",
                "prob": 40.0
            },
            {
                "option": "공격력 +11",
                "prob": 10.0
            }
        ]
    },
    {
        "category": "매지컬 주문서류",
        "name": "매지컬 한손무기 공격력 주문서 50% 매지컬 두손무기 공격력 주문서 50%",
        "displayName": "매지컬 한손/두손무기 공격력 주문서 50%",
        "successRate": 50.0,
        "type": "normal",
        "baseOptions": [
            "올스탯 +3"
        ],
        "options": [
            {
                "option": "공격력 +9",
                "prob": 50.0
            },
            {
                "option": "공격력 +10",
                "prob": 40.0
            },
            {
                "option": "공격력 +11",
                "prob": 10.0
            }
        ]
    },
    {
        "category": "매지컬 주문서류",
        "name": "매지컬 한손무기 마력 주문서",
        "successRate": 100.0,
        "type": "normal",
        "baseOptions": [
            "올스탯 +3"
        ],
        "options": [
            {
                "option": "마력 +9",
                "prob": 50.0
            },
            {
                "option": "마력 +10",
                "prob": 40.0
            },
            {
                "option": "마력 +11",
                "prob": 10.0
            }
        ]
    },
    {
        "category": "매지컬 주문서류",
        "name": "매지컬 한손무기 마력 주문서 50%",
        "successRate": 50.0,
        "type": "normal",
        "baseOptions": [
            "올스탯 +3"
        ],
        "options": [
            {
                "option": "마력 +9",
                "prob": 50.0
            },
            {
                "option": "마력 +10",
                "prob": 40.0
            },
            {
                "option": "마력 +11",
                "prob": 10.0
            }
        ]
    },
    {
        "category": "놀라운 긍정의 혼돈 주문서류",
        "name": "놀라운 긍정의 혼돈 주문서 100%",
        "successRate": 100.0,
        "type": "chaos",
        "groups": [
            {
                "label": "공격력/마력/STR/DEX/INT/LUK/방어력/이동속도/점프력",
                "outcomes": [
                    {
                        "value": "+0",
                        "prob": 18.3827
                    },
                    {
                        "value": "+1",
                        "prob": 33.0081
                    },
                    {
                        "value": "+2",
                        "prob": 23.8669
                    },
                    {
                        "value": "+3",
                        "prob": 13.8661
                    },
                    {
                        "value": "+4",
                        "prob": 4.9438
                    },
                    {
                        "value": "+6",
                        "prob": 5.9324
                    }
                ]
            },
            {
                "label": "최대 HP/최대 MP",
                "outcomes": [
                    {
                        "value": "+0",
                        "prob": 18.3827
                    },
                    {
                        "value": "+10",
                        "prob": 33.0081
                    },
                    {
                        "value": "+20",
                        "prob": 23.8669
                    },
                    {
                        "value": "+30",
                        "prob": 13.8661
                    },
                    {
                        "value": "+40",
                        "prob": 4.9438
                    },
                    {
                        "value": "+60",
                        "prob": 5.9324
                    }
                ]
            }
        ]
    },
    {
        "category": "악세서리 주문서류",
        "name": "미라클 악세서리 공격력 주문서 50%",
        "successRate": 50.0,
        "type": "normal",
        "baseOptions": [],
        "options": [
            {
                "option": "공격력 +1",
                "prob": 50.0
            },
            {
                "option": "공격력 +2",
                "prob": 30.0
            },
            {
                "option": "공격력 +3",
                "prob": 15.0
            },
            {
                "option": "공격력 +4",
                "prob": 5.0
            }
        ]
    },
    {
        "category": "악세서리 주문서류",
        "name": "미라클 악세서리 마력 주문서 50%",
        "successRate": 50.0,
        "type": "normal",
        "baseOptions": [],
        "options": [
            {
                "option": "마력 +1",
                "prob": 50.0
            },
            {
                "option": "마력 +2",
                "prob": 30.0
            },
            {
                "option": "마력 +3",
                "prob": 15.0
            },
            {
                "option": "마력 +4",
                "prob": 5.0
            }
        ]
    },
    {
        "category": "악세서리 주문서류",
        "name": "프리미엄 악세서리 공격력 주문서 100%",
        "successRate": 100.0,
        "type": "normal",
        "baseOptions": [],
        "options": [
            {
                "option": "공격력 +4",
                "prob": 85.0
            },
            {
                "option": "공격력 +5",
                "prob": 15.0
            }
        ]
    },
    {
        "category": "악세서리 주문서류",
        "name": "프리미엄 악세서리 공격력 주문서 50%",
        "successRate": 50.0,
        "type": "normal",
        "baseOptions": [],
        "options": [
            {
                "option": "공격력 +4",
                "prob": 85.0
            },
            {
                "option": "공격력 +5",
                "prob": 15.0
            }
        ]
    },
    {
        "category": "악세서리 주문서류",
        "name": "프리미엄 악세서리 마력 주문서 100%",
        "successRate": 100.0,
        "type": "normal",
        "baseOptions": [],
        "options": [
            {
                "option": "마력 +4",
                "prob": 85.0
            },
            {
                "option": "마력 +5",
                "prob": 15.0
            }
        ]
    },
    {
        "category": "악세서리 주문서류",
        "name": "프리미엄 악세서리 마력 주문서 50%",
        "successRate": 50.0,
        "type": "normal",
        "baseOptions": [],
        "options": [
            {
                "option": "마력 +4",
                "prob": 85.0
            },
            {
                "option": "마력 +5",
                "prob": 15.0
            }
        ]
    },
    {
        "category": "악세서리 주문서류",
        "name": "악세서리 공격력 주문서 100%",
        "successRate": 100.0,
        "type": "normal",
        "baseOptions": [],
        "options": [
            {
                "option": "공격력 +2",
                "prob": 70.0
            },
            {
                "option": "공격력 +3",
                "prob": 20.0
            },
            {
                "option": "공격력 +4",
                "prob": 10.0
            }
        ]
    },
    {
        "category": "악세서리 주문서류",
        "name": "악세서리 마력 주문서 100%",
        "successRate": 100.0,
        "type": "normal",
        "baseOptions": [],
        "options": [
            {
                "option": "마력 +2",
                "prob": 70.0
            },
            {
                "option": "마력 +3",
                "prob": 20.0
            },
            {
                "option": "마력 +4",
                "prob": 10.0
            }
        ]
    },
    {
        "category": "악세서리 주문서류",
        "name": "악세서리 공격력 주문서 70%",
        "successRate": 70.0,
        "type": "normal",
        "baseOptions": [],
        "options": [
            {
                "option": "공격력 +1",
                "prob": 50.0
            },
            {
                "option": "공격력 +2",
                "prob": 50.0
            }
        ]
    },
    {
        "category": "악세서리 주문서류",
        "name": "악세서리 마력 주문서 70%",
        "successRate": 70.0,
        "type": "normal",
        "baseOptions": [],
        "options": [
            {
                "option": "마력 +1",
                "prob": 50.0
            },
            {
                "option": "마력 +2",
                "prob": 50.0
            }
        ]
    },
    {
        "category": "방어구 주문서류",
        "name": "미라클 방어구 공격력 주문서 50%",
        "successRate": 50.0,
        "type": "normal",
        "baseOptions": [],
        "options": [
            {
                "option": "공격력 +2",
                "prob": 70.0
            },
            {
                "option": "공격력 +3",
                "prob": 30.0
            }
        ]
    },
    {
        "category": "방어구 주문서류",
        "name": "미라클 방어구 마력 주문서 50%",
        "successRate": 50.0,
        "type": "normal",
        "baseOptions": [],
        "options": [
            {
                "option": "마력 +2",
                "prob": 70.0
            },
            {
                "option": "마력 +3",
                "prob": 30.0
            }
        ]
    },
    {
        "category": "방어구 주문서류",
        "name": "방어구 공격력 주문서 70%",
        "successRate": 70.0,
        "type": "normal",
        "baseOptions": [],
        "options": [
            {
                "option": "공격력 +1",
                "prob": 50.0
            },
            {
                "option": "공격력 +2",
                "prob": 50.0
            }
        ]
    },
    {
        "category": "방어구 주문서류",
        "name": "방어구 마력 주문서 70%",
        "successRate": 70.0,
        "type": "normal",
        "baseOptions": [],
        "options": [
            {
                "option": "마력 +1",
                "prob": 50.0
            },
            {
                "option": "마력 +2",
                "prob": 50.0
            }
        ]
    },
    {
        "category": "펫 장비 주문서류",
        "name": "프리미엄 펫 장비 공격력 주문서 100%",
        "successRate": 100.0,
        "type": "normal",
        "baseOptions": [],
        "options": [
            {
                "option": "공격력 +4",
                "prob": 85.0
            },
            {
                "option": "공격력 +5",
                "prob": 15.0
            }
        ]
    },
    {
        "category": "펫 장비 주문서류",
        "name": "프리미엄 펫 장비 공격력 주문서 50%",
        "successRate": 50.0,
        "type": "normal",
        "baseOptions": [],
        "options": [
            {
                "option": "공격력 +4",
                "prob": 85.0
            },
            {
                "option": "공격력 +5",
                "prob": 15.0
            }
        ]
    },
    {
        "category": "펫 장비 주문서류",
        "name": "프리미엄 펫 장비 마력 주문서 100%",
        "successRate": 100.0,
        "type": "normal",
        "baseOptions": [],
        "options": [
            {
                "option": "마력 +4",
                "prob": 85.0
            },
            {
                "option": "마력 +5",
                "prob": 15.0
            }
        ]
    },
    {
        "category": "펫 장비 주문서류",
        "name": "프리미엄 펫 장비 마력 주문서 50%",
        "successRate": 50.0,
        "type": "normal",
        "baseOptions": [],
        "options": [
            {
                "option": "마력 +4",
                "prob": 85.0
            },
            {
                "option": "마력 +5",
                "prob": 15.0
            }
        ]
    },
    {
        "category": "펫 장비 주문서류",
        "name": "펫장비 공격력 주문서 100%",
        "successRate": 100.0,
        "type": "normal",
        "baseOptions": [],
        "options": [
            {
                "option": "공격력 +2",
                "prob": 70.0
            },
            {
                "option": "공격력 +3",
                "prob": 20.0
            },
            {
                "option": "공격력 +4",
                "prob": 10.0
            }
        ]
    },
    {
        "category": "펫 장비 주문서류",
        "name": "펫장비 마력 주문서 100%",
        "successRate": 100.0,
        "type": "normal",
        "baseOptions": [],
        "options": [
            {
                "option": "마력 +2",
                "prob": 70.0
            },
            {
                "option": "마력 +3",
                "prob": 20.0
            },
            {
                "option": "마력 +4",
                "prob": 10.0
            }
        ]
    }
];

module.exports = { ORDER_SHEETS };
