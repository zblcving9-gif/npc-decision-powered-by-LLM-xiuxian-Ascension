// ============================================================
// buildings.js - 建筑数据（三级节点，不引用任何文件）
// ============================================================
const BUILDING_TEMPLATES = {
  CAMPFIRE: {
    id: 'campfire', name: '篝火', icon: '🔥',
    w: 32, h: 32,
    cost: [{ id:'wood', qty:3 }, { id:'stone', qty:2 }],
    buildTime: 3,
    isFireSource: true, fireRadius: 80,
    fuelMax: 300, fuelCurrent: 0,
    desc: '提供火源，可用于烤肉。需要添加薪柴维持燃烧。',
    category: 'basic',
  },

  SHELTER: {
    id: 'shelter', name: '茅屋', icon: '🏠',
    w: 80, h: 60,
    cost: [{ id:'wood', qty:10 }, { id:'stone', qty:5 }],
    buildTime: 15,
    isSpawnPoint: true,
    weatherProtection: 0.7,
    desc: '基础居所，可在此休息恢复体力，并遮风避雨。',
    category: 'basic',
  },

  FORGE: {
    id: 'forge', name: '铁匠铺', icon: '⚒️',
    w: 80, h: 70,
    cost: [{ id:'stone', qty:15 }, { id:'iron_ore', qty:8 }, { id:'wood', qty:5 }],
    buildTime: 25,
    enablesRecipes: ['make_iron_sword', 'make_iron_armor'],
    desc: '可以锻造铁制武器和防具。',
    category: 'production',
  },

  ALCHEMY_FURNACE: {
    id: 'alchemy_furnace', name: '炼丹炉', icon: '⚗️',
    w: 60, h: 60,
    cost: [{ id:'stone', qty:10 }, { id:'fire_crystal', qty:3 }, { id:'jade', qty:2 }],
    buildTime: 30,
    enablesRecipes: ['refine_heal_pill','refine_spirit_pill','refine_power_pill','refine_immune_pill'],
    spiritAmplify: 1.2,
    desc: '用于炼制各类丹药，需要消耗灵力。',
    category: 'production',
  },

  SPIRIT_FORGE: {
    id: 'spirit_forge', name: '灵器炉', icon: '🔮',
    w: 70, h: 70,
    cost: [{ id:'spirit_stone', qty:5 }, { id:'iron_ore', qty:10 }, { id:'jade', qty:3 }, { id:'fire_crystal', qty:3 }],
    buildTime: 50,
    enablesRecipes: ['forge_spirit_sword','forge_spirit_robe'],
    minRealmLevel: 3,
    desc: '高阶灵器锻造，需要筑基境以上才可使用。',
    category: 'advanced',
  },

  SPIRIT_ARRAY: {
    id: 'spirit_array', name: '聚灵阵', icon: '✨',
    w: 100, h: 100,
    cost: [{ id:'spirit_stone', qty:8 }, { id:'jade', qty:5 }, { id:'stone', qty:20 }],
    buildTime: 40,
    spiritBonus: 0.5, // 提升周围50%灵力浓度
    auraRadius: 200,
    desc: '汇聚天地灵气，提升周围区域的灵力浓度，加快修炼速度。',
    category: 'spiritual',
  },

  SECT_HALL: {
    id: 'sect_hall', name: '宗门大殿', icon: '🏯',
    w: 120, h: 100,
    cost: [{ id:'wood', qty:30 }, { id:'stone', qty:30 }, { id:'jade', qty:5 }, { id:'spirit_stone', qty:5 }],
    buildTime: 60,
    isSectBuilding: true,
    memberCapacity: 10,
    desc: '门派核心建筑，可招募弟子、制定门规。',
    category: 'sect',
  },

  WATCHTOWER: {
    id: 'watchtower', name: '望楼', icon: '🗼',
    w: 40, h: 80,
    cost: [{ id:'wood', qty:8 }, { id:'stone', qty:5 }],
    buildTime: 10,
    sightRadius: 300,
    desc: '提升视野范围，可以提前发现敌人。',
    category: 'defense',
  },

  STORAGE: {
    id: 'storage', name: '储藏室', icon: '📦',
    w: 70, h: 50,
    cost: [{ id:'wood', qty:12 }, { id:'stone', qty:6 }],
    buildTime: 12,
    extraInventory: 50,
    desc: '扩大物品存储上限。',
    category: 'utility',
  },
};

// 建筑分类
const BUILDING_CATEGORIES = {
  basic:      { label:'基础设施', color:'#8bc34a' },
  production: { label:'生产建筑', color:'#ff9800' },
  advanced:   { label:'高阶建筑', color:'#9c27b0' },
  spiritual:  { label:'灵法阵法', color:'#03a9f4' },
  sect:       { label:'门派建设', color:'#f44336' },
  defense:    { label:'防御工事', color:'#607d8b' },
  utility:    { label:'实用设施', color:'#795548' },
};
