// ============================================================
// items.js - 物品数据定义（三级节点，不引用任何文件）
// ============================================================
const ITEMS = {
  // 食物类
  RAW_MEAT:       { id:'raw_meat',      name:'生肉',    type:'food',  hp:10,  sick:0.35, hunger:-30, icon:'🥩' },
  COOKED_MEAT:    { id:'cooked_meat',   name:'熟肉',    type:'food',  hp:40,  sick:0,    hunger:-60, icon:'🍖' },
  SPIRIT_HERB:    { id:'spirit_herb',   name:'灵草',    type:'herb',  hp:20,  spirit:5,  icon:'🌿' },
  GOLDEN_FRUIT:   { id:'golden_fruit',  name:'金灵果',  type:'food',  hp:80,  spirit:20, hunger:-50, icon:'🍊' },
  POISONOUS_SHROOM:{ id:'pois_shroom',  name:'毒蘑菇',  type:'food',  hp:-30, sick:0.8,  hunger:-20, icon:'🍄' },

  // 材料类
  STONE:          { id:'stone',         name:'石料',    type:'material', icon:'🪨' },
  WOOD:           { id:'wood',          name:'木材',    type:'material', icon:'🪵' },
  IRON_ORE:       { id:'iron_ore',      name:'铁矿石',  type:'material', icon:'⚙️' },
  SPIRIT_STONE:   { id:'spirit_stone',  name:'灵石',    type:'material', spirit:50, icon:'💎' },
  JADE:           { id:'jade',          name:'玉石',    type:'material', icon:'🟩' },
  FIRE_CRYSTAL:   { id:'fire_crystal',  name:'火晶石',  type:'material', icon:'🔴' },
  BEAST_SKIN:     { id:'beast_skin',    name:'兽皮',    type:'material', icon:'🧶' },
  BONE:           { id:'bone',          name:'兽骨',    type:'material', icon:'🦴' },
  FUR:            { id:'fur',           name:'毛发',    type:'material', icon:'🐑' },

  // 装备类
  IRON_SWORD:     { id:'iron_sword',    name:'铁剑',    type:'weapon', atk:15, icon:'⚔️' },
  SPIRIT_SWORD:   { id:'spirit_sword',  name:'灵剑',    type:'weapon', atk:40, spirit_cost:5, icon:'🗡️' },
  LEATHER_ARMOR:  { id:'leather_armor', name:'皮甲',    type:'armor',  def:10, icon:'🛡️' },
  IRON_ARMOR:     { id:'iron_armor',    name:'铁甲',    type:'armor',  def:25, icon:'🔰' },
  SPIRIT_ROBE:    { id:'spirit_robe',   name:'灵袍',    type:'armor',  def:15, spirit_regen:2, icon:'👘' },

  // 丹药类
  HEAL_PILL:      { id:'heal_pill',     name:'回气丹',  type:'pill',  hp:100, icon:'💊' },
  SPIRIT_PILL:    { id:'spirit_pill',   name:'聚灵丹',  type:'pill',  spirit:80, icon:'🔵' },
  POWER_PILL:     { id:'power_pill',    name:'强体丹',  type:'pill',  atk_buff:10, duration:60, icon:'🟠' },
  IMMUNE_PILL:    { id:'immune_pill',   name:'扶正丹',  type:'pill',  immunity:50, sick:-1, icon:'⚪' },

  // 燃料类
  FIREWOOD:       { id:'firewood',      name:'薪柴',    type:'fuel',  fuel:100, icon:'🔥' },
  COAL:           { id:'coal',          name:'煤炭',    type:'fuel',  fuel:300, icon:'⬛' },
};

// 物品稀有度配置
const ITEM_RARITY = {
  common:   { color:'#aaa',    label:'普通' },
  uncommon: { color:'#4caf50', label:'精良' },
  rare:     { color:'#2196f3', label:'稀有' },
  epic:     { color:'#9c27b0', label:'史诗' },
  legend:   { color:'#ff9800', label:'传说' },
};
