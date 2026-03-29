// ============================================================
// recipes.js - 合成配方数据（三级节点，不引用任何文件）
// ============================================================
const RECIPES = [
  // ── 食物烹饪 ──────────────────────────────────────────────
  {
    id: 'cook_meat',
    name: '烤肉',
    category: 'cooking',
    requireFire: true,
    inputs:  [{ id:'raw_meat', qty:1 }],
    output:  { id:'cooked_meat', qty:1 },
    time: 5,
    desc: '靠近火源，将生肉烤熟',
  },

  // ── 基础制作 ──────────────────────────────────────────────
  {
    id: 'make_firewood',
    name: '制作薪柴',
    category: 'craft',
    inputs:  [{ id:'wood', qty:2 }],
    output:  { id:'firewood', qty:3 },
    time: 2,
  },
  {
    id: 'make_leather_armor',
    name: '制作皮甲',
    category: 'craft',
    inputs:  [{ id:'beast_skin', qty:4 }, { id:'bone', qty:2 }],
    output:  { id:'leather_armor', qty:1 },
    time: 8,
  },
  {
    id: 'make_iron_sword',
    name: '锻造铁剑',
    category: 'forge',
    requireBuilding: 'forge',
    inputs:  [{ id:'iron_ore', qty:3 }, { id:'wood', qty:1 }],
    output:  { id:'iron_sword', qty:1 },
    time: 12,
  },
  {
    id: 'make_iron_armor',
    name: '锻造铁甲',
    category: 'forge',
    requireBuilding: 'forge',
    inputs:  [{ id:'iron_ore', qty:5 }, { id:'beast_skin', qty:2 }],
    output:  { id:'iron_armor', qty:1 },
    time: 18,
  },

  // ── 炼丹 ──────────────────────────────────────────────────
  {
    id: 'refine_heal_pill',
    name: '炼制回气丹',
    category: 'alchemy',
    requireBuilding: 'alchemy_furnace',
    inputs:  [{ id:'spirit_herb', qty:3 }, { id:'spirit_stone', qty:1 }],
    output:  { id:'heal_pill', qty:2 },
    time: 20,
    spiritCost: 10,
  },
  {
    id: 'refine_spirit_pill',
    name: '炼制聚灵丹',
    category: 'alchemy',
    requireBuilding: 'alchemy_furnace',
    inputs:  [{ id:'spirit_stone', qty:2 }, { id:'jade', qty:1 }],
    output:  { id:'spirit_pill', qty:1 },
    time: 30,
    spiritCost: 20,
  },
  {
    id: 'refine_power_pill',
    name: '炼制强体丹',
    category: 'alchemy',
    requireBuilding: 'alchemy_furnace',
    inputs:  [{ id:'fire_crystal', qty:1 }, { id:'spirit_herb', qty:2 }, { id:'bone', qty:1 }],
    output:  { id:'power_pill', qty:1 },
    time: 25,
    spiritCost: 15,
  },
  {
    id: 'refine_immune_pill',
    name: '炼制扶正丹',
    category: 'alchemy',
    requireBuilding: 'alchemy_furnace',
    inputs:  [{ id:'jade', qty:2 }, { id:'spirit_herb', qty:4 }],
    output:  { id:'immune_pill', qty:1 },
    time: 30,
    spiritCost: 15,
  },

  // ── 灵器锻造 ──────────────────────────────────────────────
  {
    id: 'forge_spirit_sword',
    name: '炼制灵剑',
    category: 'spirit_forge',
    requireBuilding: 'spirit_forge',
    inputs:  [{ id:'iron_sword', qty:1 }, { id:'spirit_stone', qty:3 }, { id:'fire_crystal', qty:2 }],
    output:  { id:'spirit_sword', qty:1 },
    time: 60,
    spiritCost: 50,
    minLevel: 10,
  },
  {
    id: 'forge_spirit_robe',
    name: '炼制灵袍',
    category: 'spirit_forge',
    requireBuilding: 'spirit_forge',
    inputs:  [{ id:'jade', qty:3 }, { id:'beast_skin', qty:3 }, { id:'spirit_stone', qty:2 }],
    output:  { id:'spirit_robe', qty:1 },
    time: 50,
    spiritCost: 40,
    minLevel: 8,
  },
];
