// ============================================================
// biomes.js - 地形/灵力分布数据（三级节点，不引用任何文件）
// ============================================================

// 地形类型定义
const BIOME_TYPES = {
  PLAIN: {
    id: 'plain', name: '平原', color: '#7cb87c',
    spiritBase: 0.4,
    resources: [
      { id:'wood',      weight:30 },
      { id:'stone',     weight:20 },
      { id:'spirit_herb', weight:15 },
      { id:'raw_meat',  weight:10 },
    ],
    moveSpeed: 1.0,
    desc: '地势平坦，灵力普通，适合初学者。',
  },
  FOREST: {
    id: 'forest', name: '灵林', color: '#2e7d32',
    spiritBase: 0.7,
    resources: [
      { id:'wood',        weight:40 },
      { id:'spirit_herb', weight:30 },
      { id:'golden_fruit',weight:10 },
      { id:'beast_skin',  weight:15 },
      { id:'raw_meat',    weight:20 },
    ],
    moveSpeed: 0.75,
    desc: '灵木苍翠，灵力较浓，适合修炼灵系功法。',
  },
  MOUNTAIN: {
    id: 'mountain', name: '灵山', color: '#78909c',
    spiritBase: 0.85,
    resources: [
      { id:'stone',       weight:40 },
      { id:'iron_ore',    weight:25 },
      { id:'jade',        weight:10 },
      { id:'fire_crystal',weight:8 },
      { id:'spirit_stone',weight:12 },
    ],
    moveSpeed: 0.6,
    desc: '山势险峻，矿脉丰富，灵石常现于此。',
  },
  VOLCANO: {
    id: 'volcano', name: '火焰山', color: '#bf360c',
    spiritBase: 0.9,
    resources: [
      { id:'fire_crystal',weight:40 },
      { id:'iron_ore',    weight:20 },
      { id:'coal',        weight:30 },
      { id:'spirit_stone',weight:10 },
    ],
    moveSpeed: 0.7,
    fireBonus: 1.5, // 火系功法修炼加成
    desc: '炽热之地，火系灵力极强，适合火属性修炼。',
  },
  LAKE: {
    id: 'lake', name: '灵湖', color: '#1565c0',
    spiritBase: 0.75,
    resources: [
      { id:'jade',        weight:20 },
      { id:'spirit_herb', weight:25 },
      { id:'spirit_stone',weight:15 },
    ],
    moveSpeed: 0.5,
    iceBonus: 1.4,
    desc: '清灵之地，水系灵力充沛，冰系功法在此修炼事半功倍。',
  },
  DESERT: {
    id: 'desert', name: '荒漠', color: '#f9a825',
    spiritBase: 0.2,
    resources: [
      { id:'stone',  weight:30 },
      { id:'bone',   weight:20 },
      { id:'coal',   weight:15 },
    ],
    moveSpeed: 0.8,
    desc: '灵气稀薄，修炼艰难，但磨砺心志有助于突破瓶颈。',
    hardshipBonus: 0.2, // 突破成功率额外加成
  },
  RUINS: {
    id: 'ruins', name: '古迹', color: '#6d4c41',
    spiritBase: 1.0,
    resources: [
      { id:'spirit_stone',weight:30 },
      { id:'jade',        weight:20 },
      { id:'iron_ore',    weight:15 },
    ],
    moveSpeed: 0.8,
    dangerLevel: 3,
    desc: '上古修士遗留之地，灵力极强，但危机四伏。',
  },
};

// 地图区域配置（区块坐标 → 地形类型）
// 地图大小 20×20 区块，每块64px
function getBiomeAt(tileX, tileY) {
  // 简单噪声算法，根据坐标决定地形
  const cx = tileX - 10, cy = tileY - 10;
  const dist = Math.sqrt(cx*cx + cy*cy);

  if (dist < 3)  return BIOME_TYPES.PLAIN;
  if (tileX > 15 && tileY > 15) return BIOME_TYPES.RUINS;
  if (tileX > 14) return BIOME_TYPES.VOLCANO;
  if (tileY > 14) return BIOME_TYPES.LAKE;
  if (tileX < 4 && tileY < 4)   return BIOME_TYPES.DESERT;
  if (dist < 8)  return BIOME_TYPES.FOREST;
  return BIOME_TYPES.MOUNTAIN;
}

// 获取坐标的灵力值（0~1），受地形和已建造聚灵阵影响
function getBaseSpiritAt(worldX, worldY) {
  const tileX = Math.floor(worldX / 64);
  const tileY = Math.floor(worldY / 64);
  return getBiomeAt(tileX, tileY).spiritBase;
}
