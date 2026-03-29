// ============================================================
// constants.js - 全局配置常量（二级节点，不引用其他二级节点）
// ============================================================

const C = {
  // 画布与地图
  CANVAS_W: 1280,
  CANVAS_H: 720,
  TILE_SIZE: 64,
  MAP_TILES_X: 25,
  MAP_TILES_Y: 20,
  MAP_BOUND_PAD: 16,   // 边界内边距（实体半径）

  // 物理引擎
  GRAVITY: 0,        // 俯视角，无重力
  FPS: 60,
  PHYSICS_STEP: 1000 / 60,

  // 玩家基础属性
  PLAYER_SPEED: 180,
  SPRINT_SPEED: 340,        // 跑步速度
  SPRINT_HUNGER_COST: 0.03, // 跑步饥饿消耗/tick
  SPRINT_STAMINA_MAX: 100,  // 体力值上限
  SPRINT_STAMINA_DECAY: 0.4,// 跑步体力消耗/tick
  SPRINT_STAMINA_REGEN: 0.15,// 体力恢复/tick（非跑步时）
  PLAYER_HP_MAX: 100,
  PLAYER_SPIRIT_MAX: 100,
  PLAYER_HUNGER_MAX: 100,
  PLAYER_IMMUNITY_MAX: 100,
  PLAYER_RADIUS: 16,

  // 战斗
  ATK_COOLDOWN: 500,       // ms
  DODGE_DIST: 60,
  CRIT_MULTIPLIER: 2.0,
  KNOCKBACK_FORCE: 8,
  PROJECTILE_SPEED: 5,

  // 采集
  GATHER_TIME: 2000,       // ms
  GATHER_RADIUS: 50,
  RESOURCE_REGEN_TIME: 30000, // ms

  // 建造
  BUILD_RADIUS: 120,

  // 饥饿 & 健康
  HUNGER_DECAY: 0.008,     // 每tick消耗
  HP_REGEN_RATE: 0.02,
  SICK_THRESHOLD: 0.5,     // 生病触发阈值

  // 修炼
  CULTIVATE_TICK: 1000,    // ms per tick
  SPIRIT_REGEN_BASE: 0.5,

  // 天气
  WEATHER_CHANGE_MIN: 30000,
  WEATHER_CHANGE_MAX: 90000,

  // NPC AI
  NPC_PATROL_SPEED: 60,
  NPC_CHASE_SPEED: 120,
  NPC_SOCIAL_RADIUS: 200,
  NPC_AGGRO_RADIUS: 150,
  NPC_CHAT_COOLDOWN: 15000,

  // UI
  HOTBAR_SLOTS: 8,
  INV_ROWS: 5,
  INV_COLS: 8,
  FONT_MAIN: '14px "微软雅黑", sans-serif',
  FONT_TITLE: 'bold 18px "微软雅黑", sans-serif',

  // 阿里云 Qwen API
  QWEN_API_URL: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
  QWEN_MODEL: 'qwen-turbo',

  // 颜色主题
  COLOR: {
    HP:       '#f44336',
    SPIRIT:   '#2196f3',
    HUNGER:   '#ff9800',
    IMMUNITY: '#4caf50',
    XP:       '#9c27b0',
    GOLD:     '#ffd700',
    BG:       '#1a1a2e',
    PANEL:    'rgba(20,20,40,0.88)',
    BORDER:   '#4a4a7a',
    TEXT:     '#e0e0e0',
    HOVER:    'rgba(255,255,255,0.12)',
  },

  // 门派定义
  SECTS: {
    flame_sect: { name:'炎阳门', color:'#f44336', icon:'🔥', bonus:'fire_atk' },
    ice_sect:   { name:'玄冰宗', color:'#03a9f4', icon:'❄️', bonus:'def'      },
    sword_sect: { name:'剑宗',   color:'#9c27b0', icon:'⚔️', bonus:'crit_rate'},
    nature_sect:{ name:'自然派', color:'#4caf50', icon:'🌿', bonus:'hp_regen' },
  },

  // 天气类型
  WEATHER_TYPES: ['sunny','cloudy','rain','storm','fog','snow','spirit_tide'],
};
