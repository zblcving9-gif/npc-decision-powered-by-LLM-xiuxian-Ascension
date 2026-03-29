// ============================================================
// skills.js - 功法数据（三级节点，不引用任何文件）
// ============================================================
const SKILLS = {
  // ── 基础功法 ─────────────────────────────────────────────
  BASIC_QI: {
    id: 'basic_qi', name: '基础吐纳', tier: 1,
    sect: null, // 无门派限制
    desc: '最基础的吐纳功法，修炼速度慢但安全稳固。',
    xpPerTick: 1, spiritGain: 0.5,
    maxStage: 9,
    effects: { hp_max: 20, spirit_max: 10 },
    breakthrough: { item: 'spirit_stone', qty: 1 },
    icon: '🌀',
  },
  FIRE_PATH: {
    id: 'fire_path', name: '炎阳诀', tier: 2,
    sect: 'flame_sect',
    desc: '炎阳门专属功法，修炼后火系攻击力大增，但防御减弱。',
    xpPerTick: 2, spiritGain: 1,
    maxStage: 12,
    effects: { atk: 15, def: -5, fire_atk: 30 },
    breakthrough: { item: 'fire_crystal', qty: 2 },
    icon: '🔥',
  },
  ICE_PATH: {
    id: 'ice_path', name: '玄冰心法', tier: 2,
    sect: 'ice_sect',
    desc: '玄冰门专属功法，减速敌人并提升防御。',
    xpPerTick: 2, spiritGain: 1,
    maxStage: 12,
    effects: { def: 20, speed: -2, ice_def: 25 },
    breakthrough: { item: 'jade', qty: 2 },
    icon: '❄️',
  },
  SWORD_HEART: {
    id: 'sword_heart', name: '剑心通明', tier: 3,
    sect: 'sword_sect',
    desc: '剑宗秘传，大幅提升剑类武器伤害与攻速。',
    xpPerTick: 3, spiritGain: 1.5,
    maxStage: 9,
    effects: { atk: 30, crit_rate: 0.15 },
    breakthrough: { item: 'spirit_sword', qty: 1 },
    icon: '⚔️',
  },
  BODY_REFINE: {
    id: 'body_refine', name: '淬体诀', tier: 2,
    sect: null,
    desc: '专注于锤炼肉身，极大提升生命上限和免疫力。',
    xpPerTick: 1.5, spiritGain: 0.5,
    maxStage: 9,
    effects: { hp_max: 100, immunity: 20, def: 10 },
    breakthrough: { item: 'power_pill', qty: 1 },
    icon: '💪',
  },
  SPIRIT_GATHER: {
    id: 'spirit_gather', name: '聚灵诀', tier: 2,
    sect: null,
    desc: '加速灵力汲取，在高灵力地区修炼速度翻倍。',
    xpPerTick: 2, spiritGain: 2,
    maxStage: 9,
    effects: { spirit_max: 50, spirit_regen: 3 },
    breakthrough: { item: 'spirit_pill', qty: 1 },
    icon: '✨',
  },
};

// 修仙境界定义
const REALMS = [
  { level:1,  name:'练气期',  spiritReq:0,    hpBase:100 },
  { level:2,  name:'练气后期',spiritReq:100,  hpBase:150 },
  { level:3,  name:'筑基初期',spiritReq:300,  hpBase:250 },
  { level:4,  name:'筑基中期',spiritReq:600,  hpBase:400 },
  { level:5,  name:'筑基后期',spiritReq:1000, hpBase:600 },
  { level:6,  name:'金丹初期',spiritReq:2000, hpBase:1000},
  { level:7,  name:'金丹中期',spiritReq:4000, hpBase:1500},
  { level:8,  name:'金丹后期',spiritReq:8000, hpBase:2200},
  { level:9,  name:'元婴初期',spiritReq:15000,hpBase:3500},
  { level:10, name:'元婴后期',spiritReq:30000,hpBase:5000},
];
