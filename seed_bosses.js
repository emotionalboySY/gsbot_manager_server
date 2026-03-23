const mongoose = require('mongoose');
const Boss = require('./models/boss');
require('dotenv').config();

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/gsbot_db';

const bossData = [
  {
    name: '가디언엔젤슬라임',
    aliases: ['가엔슬'],
    entryLevel: 215,
    availableDifficulties: ['노말', '카오스'],
    difficulties: {
      '노말': {
        monsterLevel: 220,
        defenseRate: 300,
        phases: [{ phaseNumber: 1, hp: 5000000000000 }],
        rewards: {
          crystalPrice: 47800000,
          items: ['녹옥의 보스 반지 상자(하급)'],
          specialItems: { yeomyeong: ['가디언 엔젤 링'] }
        }
      },
      '카오스': {
        monsterLevel: 250,
        defenseRate: 300,
        phases: [{ phaseNumber: 1, hp: 90000000000000 }],
        rewards: {
          crystalPrice: 161000000,
          solErda: 70,
          items: ['흑옥의 보스 반지 상자(상급)'],
          specialItems: { yeomyeong: ['가디언 엔젤 링'] }
        }
      }
    }
  },
  {
    name: '스우',
    aliases: [],
    entryLevel: 190,
    availableDifficulties: ['노말', '하드', '익스트림'],
    difficulties: {
      '노말': {
        monsterLevel: 210,
        defenseRate: 300,
        phases: [
          { phaseNumber: 1, hp: 470000000000 },
          { phaseNumber: 2, hp: 470000000000 },
          { phaseNumber: 3, hp: 630000000000 }
        ],
        rewards: {
          crystalPrice: 31400000,
          items: ['특수형 에너지 코어(S급): 1~3개', '녹옥의 보스 반지 상자(하급)'],
          specialItems: {}
        }
      },
      '하드': {
        monsterLevel: 210,
        defenseRate: 300,
        phases: [
          { phaseNumber: 1, hp: 10000000000000 },
          { phaseNumber: 2, hp: 10000000000000 },
          { phaseNumber: 3, hp: 13500000000000 }
        ],
        rewards: {
          crystalPrice: 119000000,
          solErda: 50,
          items: ['특수형 에너지 코어(S급): 2~4개', '스우로이드', '홍옥의 보스 반지 상자(중급)'],
          specialItems: {
            absolab: ['앱솔랩스 장비 상자'],
            chilheuk: ['루즈 컨트롤 머신 마크', '손상된 블랙 하트']
          }
        }
      },
      '익스트림': {
        monsterLevel: 285,
        defenseRate: 380,
        phases: [
          { phaseNumber: 1, hp: 545000000000000, shield: 2700000000000 },
          { phaseNumber: 2, hp: 545000000000000 },
          { phaseNumber: 3, hp: 720000000000000 }
        ],
        rewards: {
          crystalPrice: 392000000,
          solErda: 280,
          items: ['섬멸병기 스우로이드', '백옥의 보스 반지 상자(최상급)'],
          specialItems: {
            chilheuk: ['컴플리트 언더컨트롤', '루즈 컨트롤 머신 마크', '손상된 블랙 하트']
          }
        }
      }
    }
  },
  {
    name: '데미안',
    aliases: ['데먄'],
    entryLevel: 190,
    availableDifficulties: ['노말', '하드'],
    difficulties: {
      '노말': {
        monsterLevel: 210,
        defenseRate: 300,
        phases: [
          { phaseNumber: 1, hp: 840000000000 },
          { phaseNumber: 2, hp: 360000000000 }
        ],
        rewards: {
          crystalPrice: 32900000,
          items: ['뒤틀린 낙인의 영혼석: 1~3개', '루인 포스실드', '녹옥의 보스 반지 상자(하급)'],
          specialItems: {}
        }
      },
      '하드': {
        monsterLevel: 210,
        defenseRate: 300,
        phases: [
          { phaseNumber: 1, hp: 25200000000000 },
          { phaseNumber: 2, hp: 10800000000000 }
        ],
        rewards: {
          crystalPrice: 113000000,
          solErda: 50,
          items: ['뒤틀린 낙인의 영혼석: 2~4개', '데미안로이드', '루인 포스실드', '홍옥의 보스 반지 상자(중급)'],
          specialItems: {
            absolab: ['앱솔랩스 장비 상자'],
            chilheuk: ['마력이 깃든 안대']
          }
        }
      }
    }
  },
  {
    name: '루시드',
    aliases: ['루시'],
    entryLevel: 220,
    availableDifficulties: ['이지', '노말', '하드'],
    difficulties: {
      '이지': {
        monsterLevel: 230,
        defenseRate: 300,
        arcaneForce: 360,
        phases: [
          { phaseNumber: 1, hp: 6000000000000 },
          { phaseNumber: 2, hp: 6000000000000 }
        ],
        rewards: {
          crystalPrice: 49000000,
          items: ['녹옥의 보스 반지 상자(하급)'],
          specialItems: {}
        }
      },
      '노말': {
        monsterLevel: 230,
        defenseRate: 300,
        arcaneForce: 360,
        phases: [
          { phaseNumber: 1, hp: 12000000000000 },
          { phaseNumber: 2, hp: 12000000000000 }
        ],
        rewards: {
          crystalPrice: 58600000,
          items: ['나비날개 물방울석: 1~2개', '녹옥의 보스 반지 상자(하급)'],
          specialItems: { yeomyeong: ['트와일라이트 마크'] }
        }
      },
      '하드': {
        monsterLevel: 230,
        defenseRate: 300,
        arcaneForce: 360,
        phases: [
          { phaseNumber: 1, hp: 50800000000000 },
          { phaseNumber: 2, hp: 54000000000000 },
          { phaseNumber: 3, hp: 12800000000000 }
        ],
        rewards: {
          crystalPrice: 135000000,
          solErda: 50,
          items: ['루시드로이드', '나비날개 물방울석: 2~3개', '홍옥의 보스 반지 상자(중급)'],
          specialItems: {
            arcane: ['아케인셰이드 장비 상자'],
            yeomyeong: ['트와일라이트 마크'],
            chilheuk: ['몽환의 벨트']
          }
        }
      }
    }
  },
  {
    name: '윌',
    aliases: [],
    entryLevel: 235,
    availableDifficulties: ['이지', '노말', '하드'],
    difficulties: {
      '이지': {
        monsterLevel: 235,
        defenseRate: 300,
        arcaneForce: 560,
        phases: [
          { phaseNumber: 1, hp: 5600000000000 },
          { phaseNumber: 2, hp: 4200000000000 },
          { phaseNumber: 3, hp: 7000000000000 }
        ],
        rewards: {
          crystalPrice: 53100000,
          items: ['녹옥의 보스 반지 상자(하급)'],
          specialItems: {}
        }
      },
      '노말': {
        monsterLevel: 250,
        defenseRate: 300,
        arcaneForce: 760,
        phases: [
          { phaseNumber: 1, hp: 8400000000000 },
          { phaseNumber: 2, hp: 6300000000000 },
          { phaseNumber: 3, hp: 10500000000000 }
        ],
        rewards: {
          crystalPrice: 67600000,
          items: ['코브웹 물방울석: 1~2개', '녹옥의 보스 반지 상자(하급)'],
          specialItems: { yeomyeong: ['트와일라이트 마크'] }
        }
      },
      '하드': {
        monsterLevel: 250,
        defenseRate: 300,
        arcaneForce: 760,
        phases: [
          { phaseNumber: 1, hp: 42000000000000 },
          { phaseNumber: 2, hp: 31500000000000 },
          { phaseNumber: 3, hp: 52500000000000 }
        ],
        rewards: {
          crystalPrice: 165000000,
          solErda: 50,
          items: ['거울 세계의 코어 젬스톤: 1개', '코브웹 물방울석: 2~3개', '홍옥의 보스 반지 상자(중급)'],
          specialItems: {
            arcane: ['아케인셰이드 장비 상자'],
            yeomyeong: ['트와일라이트 마크'],
            chilheuk: ['저주받은 마도서 교환권']
          }
        }
      }
    }
  },
  {
    name: '더스크',
    aliases: [],
    entryLevel: 245,
    availableDifficulties: ['노말', '카오스'],
    difficulties: {
      '노말': {
        monsterLevel: 255,
        defenseRate: 300,
        arcaneForce: 730,
        phases: [{ phaseNumber: 1, hp: 25500000000000 }],
        rewards: {
          crystalPrice: 72400000,
          items: ['염원의 불꽃: 14개', '녹옥의 보스 반지 상자(하급)'],
          specialItems: { yeomyeong: ['에스텔라 이어링'] }
        }
      },
      '카오스': {
        monsterLevel: 255,
        defenseRate: 300,
        arcaneForce: 730,
        phases: [{ phaseNumber: 1, hp: 127500000000000 }],
        rewards: {
          crystalPrice: 150000000,
          solErda: 100,
          items: ['염원의 불꽃: 14개', '흑옥의 보스 반지 상자(상급)'],
          specialItems: {
            arcane: ['아케인셰이드 장비 상자'],
            yeomyeong: ['에스텔라 이어링'],
            chilheuk: ['거대한 공포']
          }
        }
      }
    }
  },
  {
    name: '듄켈',
    aliases: [],
    entryLevel: 255,
    availableDifficulties: ['노말', '하드'],
    difficulties: {
      '노말': {
        monsterLevel: 265,
        defenseRate: 300,
        arcaneForce: 850,
        phases: [{ phaseNumber: 1, hp: 26000000000000 }],
        rewards: {
          crystalPrice: 78100000,
          items: ['염원의 불꽃: 16개', '녹옥의 보스 반지 상자(하급)'],
          specialItems: { yeomyeong: ['에스텔라 이어링'] }
        }
      },
      '하드': {
        monsterLevel: 265,
        defenseRate: 300,
        arcaneForce: 850,
        phases: [{ phaseNumber: 1, hp: 157500000000000 }],
        rewards: {
          crystalPrice: 177000000,
          solErda: 120,
          items: ['염원의 불꽃: 14개', '흑옥의 보스 반지 상자(상급)'],
          specialItems: {
            arcane: ['아케인셰이드 장비 상자'],
            yeomyeong: ['에스텔라 이어링'],
            chilheuk: ['커맨더 포스 이어링']
          }
        }
      }
    }
  },
  {
    name: '진힐라',
    aliases: ['지닐라'],
    entryLevel: 250,
    availableDifficulties: ['노말', '하드'],
    difficulties: {
      '노말': {
        monsterLevel: 250,
        defenseRate: 300,
        arcaneForce: 820,
        phases: [
          { phaseNumber: 1, hp: 22000000000000 },
          { phaseNumber: 2, hp: 22000000000000 },
          { phaseNumber: 3, hp: 22000000000000 },
          { phaseNumber: 4, hp: 22000000000000 }
        ],
        rewards: {
          crystalPrice: 153000000,
          solErda: 70,
          items: ['홍옥의 보스 반지 상자(중급)'],
          specialItems: {
            arcane: ['아케인셰이드 장비 상자'],
            yeomyeong: ['데이브레이크 펜던트']
          }
        }
      },
      '하드': {
        monsterLevel: 250,
        defenseRate: 300,
        arcaneForce: 900,
        phases: [
          { phaseNumber: 1, hp: 44000000000000 },
          { phaseNumber: 2, hp: 44000000000000 },
          { phaseNumber: 3, hp: 44000000000000 },
          { phaseNumber: 4, hp: 44000000000000 }
        ],
        rewards: {
          crystalPrice: 200000000,
          solErda: 120,
          items: ['어두운 힘의 기운: 3개', '흑옥의 보스 반지 상자(상급)'],
          specialItems: {
            arcane: ['아케인셰이드 장비 상자'],
            yeomyeong: ['데이브레이크 펜던트'],
            chilheuk: ['고통의 근원']
          }
        }
      }
    }
  },
  {
    name: '선택받은세렌',
    aliases: ['세렌'],
    entryLevel: 260,
    availableDifficulties: ['노말', '하드', '익스트림'],
    difficulties: {
      '노말': {
        monsterLevel: 270,
        defenseRate: 380,
        phases: [
          { phaseNumber: 1, hp: 52500000000000, authenticForce: 150 },
          { phaseNumber: 2, hp: 155400000000000, authenticForce: 200 }
        ],
        rewards: {
          crystalPrice: 295000000,
          solErda: 150,
          items: ['미트라의 코어 젬스톤', '흑옥의 보스 반지 상자(상급)'],
          specialItems: { yeomyeong: ['데이브레이크 펜던트'] }
        }
      },
      '하드': {
        monsterLevel: 275,
        defenseRate: 380,
        phases: [
          { phaseNumber: 1, hp: 126000000000000, authenticForce: 150 },
          { phaseNumber: 2, hp: 357000000000000, authenticForce: 200 }
        ],
        rewards: {
          crystalPrice: 440000000,
          solErda: 220,
          items: ['미트라의 코어 젬스톤', '백옥의 보스 반지 상자(최상급)'],
          specialItems: {
            yeomyeong: ['데이브레이크 펜던트'],
            chilheuk: ['미트라의 분노']
          }
        }
      },
      '익스트림': {
        monsterLevel: 275,
        defenseRate: 380,
        phases: [
          { phaseNumber: 1, hp: 1320000000000000, monsterLevel: 275, authenticForce: 150 },
          { phaseNumber: 2, hp: 5160000000000000, monsterLevel: 280, authenticForce: 200 }
        ],
        rewards: {
          crystalPrice: 2420000000,
          solErda: 560,
          items: ['미트라의 코어 젬스톤', '백옥의 보스 반지 상자(최상급)'],
          specialItems: {
            yeomyeong: ['데이브레이크 펜던트'],
            chilheuk: ['미트라의 분노'],
            exceptional: ['익셉셔널 해머(얼굴장식)']
          }
        }
      }
    }
  },
  {
    name: '검은마법사',
    aliases: ['검마'],
    entryLevel: 255,
    availableDifficulties: ['하드', '익스트림'],
    difficulties: {
      '하드': {
        monsterLevel: 265,
        defenseRate: 300,
        arcaneForce: 1320,
        phases: [
          { phaseNumber: 1, hp: 63000000000000, shield: 750000000000, monsterLevel: 265 },
          { phaseNumber: 2, hp: 115500000000000, shield: 2200000000000, monsterLevel: 275 },
          { phaseNumber: 3, hp: 157500000000000, shield: 3500000000000, monsterLevel: 275 },
          { phaseNumber: 4, hp: 136500000000000, shield: 3000000000000, monsterLevel: 275 }
        ],
        rewards: {
          crystalPrice: 1000000000,
          solErda: 300,
          items: ['(해방) 어둠의 흔적: 600', '백옥의 보스 반지 상자(최상급)'],
          specialItems: { chilheuk: ['창세의 뱃지'] }
        }
      },
      '익스트림': {
        monsterLevel: 275,
        defenseRate: 300,
        arcaneForce: 1320,
        phases: [
          { phaseNumber: 1, hp: 1180000000000000, shield: 42000000000000, monsterLevel: 275 },
          { phaseNumber: 2, hp: 1191000000000000, shield: 42000000000000, monsterLevel: 280 },
          { phaseNumber: 3, hp: 1285000000000000, shield: 60000000000000, monsterLevel: 280 },
          { phaseNumber: 4, hp: 1155000000000000, shield: 52000000000000, monsterLevel: 280 }
        ],
        rewards: {
          crystalPrice: 9200000000,
          solErda: 600,
          items: ['(해방) 어둠의 흔적: 600', '백옥의 보스 반지 상자(최상급)'],
          specialItems: {
            chilheuk: ['창세의 뱃지'],
            exceptional: ['익셉셔널 해머(벨트)']
          }
        }
      }
    }
  },
  {
    name: '칼로스',
    aliases: [],
    entryLevel: 265,
    availableDifficulties: ['이지', '노말', '카오스', '익스트림'],
    difficulties: {
      '이지': {
        monsterLevel: 270,
        defenseRate: 330,
        authenticForce: 200,
        phases: [
          { phaseNumber: 1, hp: 94500000000000 },
          { phaseNumber: 2, hp: 262500000000000 }
        ],
        rewards: {
          crystalPrice: 345000000,
          solErda: 200,
          items: ['백옥의 보스 반지 상자(최상급)'],
          specialItems: {}
        }
      },
      '노말': {
        monsterLevel: 275,
        defenseRate: 330,
        authenticForce: 200,
        phases: [
          { phaseNumber: 1, hp: 336000000000000, monsterLevel: 275 },
          { phaseNumber: 2, hp: 720000000000000, monsterLevel: 280 }
        ],
        rewards: {
          crystalPrice: 510000000,
          solErda: 250,
          items: ['니키로이드', '백옥의 보스 반지 상자(최상급)', '생명의 연마석'],
          specialItems: {
            eternal: ['남겨진 칼로스의 의지 조각(공통): 3개']
          }
        }
      },
      '카오스': {
        monsterLevel: 285,
        defenseRate: 380,
        authenticForce: 330,
        phases: [
          { phaseNumber: 1, hp: 1066000000000000 },
          { phaseNumber: 2, hp: 4016000000000000 }
        ],
        rewards: {
          crystalPrice: 1120000000,
          solErda: 400,
          items: ['니키로이드', '생명의 보스 반지 상자', '생명의 연마석'],
          specialItems: {
            eternal: ['남겨진 칼로스의 의지(공통): 5개', '의지의 에테르넬 방어구 상자']
          }
        }
      },
      '익스트림': {
        monsterLevel: 285,
        defenseRate: 380,
        authenticForce: 440,
        phases: [
          { phaseNumber: 1, hp: 5970000000000000 },
          { phaseNumber: 2, hp: 15498000000000000 }
        ],
        rewards: {
          crystalPrice: 2700000000,
          solErda: 700,
          items: ['니키로이드', '생명의 보스 반지 상자', '생명의 연마석'],
          specialItems: {
            eternal: ['남겨진 칼로스의 의지(공통): 14개', '의지의 에테르넬 방어구 상자'],
            exceptional: ['익셉셔널 해머(눈장식)']
          }
        }
      }
    }
  },
  {
    name: '카링',
    aliases: [],
    entryLevel: 275,
    availableDifficulties: ['이지', '노말', '하드', '익스트림'],
    difficulties: {
      '이지': {
        monsterLevel: 275,
        defenseRate: 380,
        authenticForce: 230,
        phases: [
          { phaseNumber: 1, hp: 288000000000000 },
          { phaseNumber: 2, hp: 105000000000000 },
          { phaseNumber: 3, hp: 528000000000000 }
        ],
        rewards: {
          crystalPrice: 381000000,
          solErda: 200,
          items: ['백옥의 보스 반지 상자(최상급)'],
          specialItems: {
            eternal: ['뒤엉킨 흉수의 고리 조각(공통): 1개']
          }
        }
      },
      '노말': {
        monsterLevel: 285,
        defenseRate: 380,
        authenticForce: 330,
        phases: [
          { phaseNumber: 1, hp: 1200000000000000 },
          { phaseNumber: 2, hp: 468000000000000 },
          { phaseNumber: 3, hp: 2258000000000000 }
        ],
        rewards: {
          crystalPrice: 595000000,
          solErda: 300,
          items: ['카링로이드', '백옥의 보스 반지 상자(최상급)', '생명의 연마석'],
          specialItems: {
            eternal: ['뒤엉킨 흉수의 고리(공통): 5개'],
            chilheuk: ['혼돈의 칠흑 장신구 상자']
          }
        }
      },
      '하드': {
        monsterLevel: 285,
        defenseRate: 380,
        authenticForce: 350,
        phases: [
          { phaseNumber: 1, hp: 2760000000000000 },
          { phaseNumber: 2, hp: 1404000000000000 },
          { phaseNumber: 3, hp: 7927000000000000 }
        ],
        rewards: {
          crystalPrice: 1310000000,
          solErda: 500,
          items: ['카링로이드', '생명의 보스 반지 상자', '신념의 연마석'],
          specialItems: {
            eternal: ['뒤엉킨 흉수의 고리(공통): 7개', '흉수의 에테르넬 방어구 상자'],
            chilheuk: ['혼돈의 칠흑 장신구 상자']
          }
        }
      },
      '익스트림': {
        monsterLevel: 285,
        defenseRate: 380,
        authenticForce: 480,
        phases: [
          { phaseNumber: 1, hp: 18189000000000000 },
          { phaseNumber: 2, hp: 6930000000000000 },
          { phaseNumber: 3, hp: 29452000000000000 }
        ],
        rewards: {
          crystalPrice: 3150000000,
          solErda: 800,
          items: ['카링로이드', '생명의 보스 반지 상자', '신념의 연마석'],
          specialItems: {
            eternal: ['뒤엉킨 흉수의 고리(공통): 18개', '흉수의 에테르넬 방어구 상자'],
            chilheuk: ['혼돈의 칠흑 장신구 상자'],
            exceptional: ['익셉셔널 해머(귀고리)']
          }
        }
      }
    }
  },
  {
    name: '림보',
    aliases: [],
    entryLevel: 285,
    availableDifficulties: ['노말', '하드'],
    difficulties: {
      '노말': {
        monsterLevel: 285,
        defenseRate: 300,
        authenticForce: 500,
        phases: [
          { phaseNumber: 1, hp: 1944000000000000 },
          { phaseNumber: 2, hp: 972000000000000 },
          { phaseNumber: 3, hp: 2592000000000000 }
        ],
        rewards: {
          crystalPrice: 900000000,
          solErda: 400,
          items: ['림보로이드', '생명의 보스 반지 상자', '신념의 연마석'],
          specialItems: {
            eternal: ['왜곡된 욕망의 결정: 1개'],
            chilheuk: ['혼돈의 칠흑 장신구 상자']
          }
        }
      },
      '하드': {
        monsterLevel: 285,
        defenseRate: 300,
        authenticForce: 500,
        phases: [
          { phaseNumber: 1, hp: 3774000000000000 },
          { phaseNumber: 2, hp: 1887000000000000 },
          { phaseNumber: 3, hp: 4884000000000000 }
        ],
        rewards: {
          crystalPrice: 1930000000,
          solErda: 550,
          items: ['림보로이드', '생명의 보스 반지 상자', '신념의 연마석'],
          specialItems: {
            eternal: ['왜곡된 욕망의 결정: 2개', '욕망의 에테르넬 방어구 상자'],
            chilheuk: ['혼돈의 칠흑 장신구 상자'],
            gwanghwi: ['근원의 속삭임']
          }
        }
      }
    }
  },
  {
    name: '발드릭스',
    aliases: ['발드'],
    entryLevel: 290,
    availableDifficulties: ['노말', '하드'],
    difficulties: {
      '노말': {
        monsterLevel: 290,
        defenseRate: 300,
        authenticForce: 700,
        phases: [
          { phaseNumber: 1, hp: 2379000000000000 },
          { phaseNumber: 2, hp: 2531000000000000 },
          { phaseNumber: 3, hp: 4145000000000000 }
        ],
        rewards: {
          crystalPrice: 1200000000,
          solErda: 450,
          items: ['발드릭스로이드', '생명의 보스 반지 상자', '신념의 연마석'],
          specialItems: {
            eternal: ['영원한 충성의 흔적: 1개'],
            chilheuk: ['혼돈의 칠흑 장신구 상자']
          }
        }
      },
      '하드': {
        monsterLevel: 290,
        defenseRate: 300,
        authenticForce: 700,
        phases: [
          { phaseNumber: 1, hp: 5344000000000000 },
          { phaseNumber: 2, hp: 5684000000000000 },
          { phaseNumber: 3, hp: 9309000000000000 }
        ],
        rewards: {
          crystalPrice: 2160000000,
          solErda: 650,
          items: ['발드릭스로이드', '생명의 보스 반지 상자', '신념의 연마석'],
          specialItems: {
            eternal: ['영원한 충성의 흔적: 2개', '맹세의 에테르넬 방어구 상자'],
            chilheuk: ['혼돈의 칠흑 장신구 상자'],
            gwanghwi: ['죽음의 맹세']
          }
        }
      }
    }
  },
  {
    name: '최초의대적자',
    aliases: ['대적자', '쌀숭이'],
    entryLevel: 270,
    availableDifficulties: ['이지', '노말', '하드', '익스트림'],
    difficulties: {
      '이지': {
        monsterLevel: 270,
        defenseRate: 380,
        phases: [
          { phaseNumber: 1, hp: 171000000000000 },
          { phaseNumber: 2, hp: 171000000000000 },
          { phaseNumber: 3, hp: 228000000000000 }
        ],
        rewards: {
          crystalPrice: 361000000,
          solErda: 200,
          items: ['백옥의 보스 반지 상자(최상급)'],
          specialItems: {}
        }
      },
      '노말': {
        monsterLevel: 285,
        defenseRate: 380,
        phases: [
          { phaseNumber: 1, hp: 495000000000000 },
          { phaseNumber: 2, hp: 495000000000000 },
          { phaseNumber: 3, hp: 660000000000000 }
        ],
        rewards: {
          crystalPrice: 530000000,
          solErda: 280,
          items: ['대적자로이드', '백옥의 보스 반지 상자(최상급)', '생명의 연마석'],
          specialItems: {
            eternal: ['이어진 고대의 결의 조각: 4개']
          }
        }
      },
      '하드': {
        monsterLevel: 280,
        defenseRate: 380,
        phases: [
          { phaseNumber: 1, hp: 3135000000000000 },
          { phaseNumber: 2, hp: 3135000000000000 },
          { phaseNumber: 3, hp: 4180000000000000 }
        ],
        rewards: {
          crystalPrice: 1260000000,
          solErda: 450,
          items: ['대적자로이드', '생명의 보스 반지 상자', '생명의 연마석'],
          specialItems: {
            eternal: ['이어진 고대의 결의 조각: 6개', '고대의 에테르넬 방어구 상자'],
            gwanghwi: ['불멸의 유산']
          }
        }
      },
      '익스트림': {
        monsterLevel: 290,
        defenseRate: 380,
        phases: [
          { phaseNumber: 1, hp: 9655000000000000 },
          { phaseNumber: 2, hp: 9655000000000000 },
          { phaseNumber: 3, hp: 12870000000000000 }
        ],
        rewards: {
          crystalPrice: 2920000000,
          solErda: 750,
          items: ['대적자로이드', '생명의 보스 반지 상자', '생명의 연마석'],
          specialItems: {
            eternal: ['이어진 고대의 결의 조각: 16개', '고대의 에테르넬 방어구 상자'],
            gwanghwi: ['불멸의 유산'],
            exceptional: ['익셉셔널 해머(훈장)']
          }
        }
      }
    }
  }
];

async function seed() {
  try {
    await mongoose.connect(mongoURI);
    console.log('MongoDB 연결 성공');

    // 기존 보스 데이터 삭제
    const deleted = await Boss.deleteMany({});
    console.log(`기존 보스 데이터 ${deleted.deletedCount}개 삭제`);

    // 새 데이터 삽입
    const result = await Boss.insertMany(bossData);
    console.log(`보스 데이터 ${result.length}개 삽입 완료`);

    result.forEach(boss => {
      console.log(`  - ${boss.name} (${boss.availableDifficulties.join(', ')})`);
    });

  } catch (err) {
    console.error('데이터 삽입 실패:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB 연결 종료');
  }
}

seed();
