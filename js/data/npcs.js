// ============================================================
// npcs.js - NPC数据（三级节点，不引用任何文件）
// ============================================================

// NPC等级缩放公式（与玩家同体系）
// hp = base_hp * (1 + (level-1)*0.15)
// atk = base_atk * (1 + (level-1)*0.12)
// def = base_def * (1 + (level-1)*0.10)
// xpReward = level * 10 + base_xp
function scaleNPCStat(base, level, factor) {
  return Math.round(base * (1 + (level - 1) * factor));
}

const NPC_TEMPLATES = {
  ELDER: {
    id: 'elder', name: '长老', role: 'teacher',
    icon: '👴', hp: 500, atk: 30, def: 20, level: 5,
    xpReward: 0,   // 友方，击败无奖励
    hostile: false, faction: 'neutral',
    dialogue: {
      greeting: ['小友，修炼之路漫漫，需持之以恒。', '今日可有所悟？'],
      trade:    ['老夫这里有些秘籍，可否有缘？'],
      low_hp:   ['你气色不佳，需多休息。'],
      high_spirit: ['灵气充沛，是个好苗子！'],
    },
    skills: ['basic_qi'],
    shop: ['heal_pill', 'spirit_pill', 'spirit_stone'],
    // 友方遇敌行为：高战力→攻击，低战力→逃跑
    combatBrave: true,
  },

  BLACKSMITH: {
    id: 'blacksmith', name: '铁匠', role: 'trader',
    icon: '🔨', hp: 300, atk: 20, def: 30, level: 3,
    xpReward: 0, hostile: false, faction: 'neutral',
    dialogue: {
      greeting: ['需要打造什么器具吗？', '好铁出好剑，材料要精选！'],
      trade:    ['我能锻造各种铁器。'],
    },
    skills: [],
    shop: ['iron_sword', 'iron_armor', 'iron_ore'],
    combatBrave: true,
  },

  HERBALIST: {
    id: 'herbalist', name: '药农', role: 'trader',
    icon: '🌿', hp: 200, atk: 10, def: 10, level: 1,
    xpReward: 0, hostile: false, faction: 'neutral',
    dialogue: {
      greeting: ['这附近灵草不少，小心采集。', '山中有奇珍，眼尖者得之。'],
      trade:    ['这是我采来的草药，需要吗？'],
    },
    skills: ['basic_qi'],
    shop: ['spirit_herb', 'heal_pill', 'golden_fruit'],
    combatBrave: false,  // 药农→逃跑
  },

  // 野狼（新手最容易击败的怪）
  WILD_WOLF: {
    id: 'wild_wolf', name: '野狼', role: 'enemy',
    icon: '🐺', hp: 40, atk: 6, def: 2, level: 1,
    xpReward: 8, aggroRange: 100,
    hostile: true, faction: 'beast',
    dialogue: { combat: ['嗷呜~'] },
    skills: [],
    loot: [
      { id:'raw_meat', qty:1, chance:0.8 },
      { id:'beast_skin', qty:1, chance:0.3 },
    ],
  },

  // 黄鼠狼精（新手可打的弱怪）
  WEASEL_SPIRIT: {
    id: 'weasel_spirit', name: '黄鼠狼精', role: 'enemy',
    icon: '🦡', hp: 55, atk: 8, def: 3, level: 1,
    xpReward: 12, aggroRange: 120,
    hostile: true, faction: 'beast',
    dialogue: { combat: ['吱吱！'] },
    skills: [],
    loot: [
      { id:'raw_meat', qty:1, chance:0.7 },
      { id:'spirit_herb', qty:1, chance:0.4 },
      { id:'bone', qty:1, chance:0.3 },
    ],
  },

  // 等级1山贼（初级，适合新手练习）
  BANDIT: {
    id: 'bandit', name: '山贼', role: 'enemy',
    icon: '🗡️', hp: 80, atk: 12, def: 5, level: 1,
    xpReward: 15, aggroRange: 150,
    hostile: true, faction: 'bandit',
    dialogue: {
      greeting: ['把钱留下，人可以走！', '识相的乖乖交出灵石！'],
      combat:   ['别想跑！', '今天你别想离开！'],
    },
    skills: [],
    loot: [
      { id:'stone', qty:2, chance:0.8 },
      { id:'iron_ore', qty:1, chance:0.4 },
      { id:'spirit_stone', qty:1, chance:0.1 },
    ],
  },

  // 等级3老山贼（中级）
  BANDIT_CHIEF: {
    id: 'bandit_chief', name: '山贼头目', role: 'enemy',
    icon: '⚔️', hp: 180, atk: 22, def: 12, level: 3,
    xpReward: 40, aggroRange: 160,
    hostile: true, faction: 'bandit',
    dialogue: { combat: ['你胆敢犯我地盘！', '弟兄们，上！'] },
    skills: [],
    loot: [
      { id:'iron_ore', qty:2, chance:0.9 },
      { id:'spirit_stone', qty:1, chance:0.3 },
      { id:'iron_sword', qty:1, chance:0.1 },
    ],
  },

  // 等级1灵兽（初级）
  SPIRIT_BEAST: {
    id: 'spirit_beast', name: '幼灵兽', role: 'enemy',
    icon: '🐱', hp: 100, atk: 14, def: 6, level: 1,
    xpReward: 20, aggroRange: 100,
    hostile: true, faction: 'beast',
    dialogue: { combat: ['...'] },
    skills: [],
    loot: [
      { id:'raw_meat', qty:1, chance:0.9 },
      { id:'beast_skin', qty:1, chance:0.5 },
      { id:'bone', qty:1, chance:0.4 },
    ],
  },

  // 等级3灵兽（中级）
  SPIRIT_BEAST_ELDER: {
    id: 'spirit_beast_elder', name: '灵兽', role: 'enemy',
    icon: '🐯', hp: 250, atk: 28, def: 14, level: 3,
    xpReward: 50, aggroRange: 120,
    hostile: true, faction: 'beast',
    dialogue: { combat: ['ROAR!'] },
    skills: [],
    loot: [
      { id:'raw_meat', qty:2, chance:0.9 },
      { id:'beast_skin', qty:1, chance:0.7 },
      { id:'bone', qty:2, chance:0.6 },
      { id:'spirit_stone', qty:1, chance:0.2 },
    ],
  },

  // 等级5魔兽（高级Boss）
  DEMON_BEAST: {
    id: 'demon_beast', name: '魔化灵兽', role: 'enemy',
    icon: '🐉', hp: 600, atk: 45, def: 25, level: 5,
    xpReward: 120, aggroRange: 180,
    hostile: true, faction: 'beast',
    dialogue: { combat: ['...'] },
    skills: [],
    loot: [
      { id:'beast_skin', qty:3, chance:1.0 },
      { id:'spirit_stone', qty:2, chance:0.5 },
      { id:'fire_crystal', qty:1, chance:0.25 },
    ],
  },

  SECT_DISCIPLE: {
    id: 'sect_disciple', name: '宗门弟子', role: 'ally',
    icon: '🧑', hp: 200, atk: 20, def: 15, level: 2,
    xpReward: 0, hostile: false, faction: 'player_sect',
    dialogue: {
      greeting: ['师兄/师妹好！', '今天修炼很顺利！'],
      help:     ['有任务尽管吩咐。'],
    },
    skills: ['basic_qi'],
    shop: [],
    combatBrave: true,
  },

  ALCHEMIST: {
    id: 'alchemist', name: '炼丹师', role: 'teacher',
    icon: '⚗️', hp: 250, atk: 15, def: 10, level: 4,
    xpReward: 0, hostile: false, faction: 'neutral',
    dialogue: {
      greeting: ['炼丹需要专注与耐心。', '好丹药可以事半功倍。'],
      trade:    ['我可以传授炼丹之法。'],
    },
    skills: [],
    shop: ['heal_pill', 'spirit_pill', 'power_pill', 'immune_pill'],
    combatBrave: false,  // 炼丹师→逃跑
  },
};

// NPC关系网络（影响社交系统）
const NPC_RELATIONS = {
  elder:       { blacksmith: 60, herbalist: 70, alchemist: 80 },
  blacksmith:  { elder: 60, sect_disciple: 50 },
  herbalist:   { elder: 70, alchemist: 65 },
  alchemist:   { elder: 80, herbalist: 65 },
  bandit:      { spirit_beast: -20, elder: -80 },
  spirit_beast:{ bandit: -20 },
  sect_disciple:{ elder: 75, blacksmith: 50 },
};
