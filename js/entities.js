// ============================================================
// entities.js - 角色/NPC实体管理（二级节点）
// 引用三级节点：data/npcs.js, data/skills.js
// ============================================================

const Entities = (() => {
  // 玩家状态
  const player = {
    id: 'player',
    x: 400, y: 300,
    hp: C.PLAYER_HP_MAX, hpMax: C.PLAYER_HP_MAX,
    spirit: 50, spiritMax: C.PLAYER_SPIRIT_MAX,
    hunger: C.PLAYER_HUNGER_MAX, hungerMax: C.PLAYER_HUNGER_MAX,
    immunity: C.PLAYER_IMMUNITY_MAX, immunityMax: C.PLAYER_IMMUNITY_MAX,
    sick: false, sickTimer: 0, sickLevel: 0,
    atk: 10, def: 5, speed: C.PLAYER_SPEED,
    level: 1, realmIdx: 0, xp: 0, xpMax: 100,
    spiritTotal: 0,    // 总修炼灵力量（决定境界）
    cultSkillId: 'basic_qi', // 当前修炼功法
    cultStage: 1,           // 当前功法阶段
    cultXp: 0,
    buffList: [],           // [{ type, value, timer }]
    atkCooldown: 0,
    weapon: null,           // 当前装备武器item
    armor: null,            // 当前装备防具item
    sectId: null,
    inventory: [],          // [{ id, qty }]
    gold: 0,
    facing: { x:1, y:0 },
    moving: false,
    sprinting: false,
    stamina: C.SPRINT_STAMINA_MAX, staminaMax: C.SPRINT_STAMINA_MAX,
    gatherTarget: null,
    gatherTimer: 0,
    inBuilding: null,
    nearFire: false,
    fireRange: false,
    atBuilding: null,
  };

  // NPC列表
  const npcs = [];

  // 子弹/投射物列表
  const projectiles = [];

  function init() {
    _spawnNPCs();
  }

  function _spawnNPCs() {
    const spawns = [
      { tpl:'ELDER',          x:320,  y:280 },
      { tpl:'BLACKSMITH',     x:500,  y:320 },
      { tpl:'HERBALIST',      x:200,  y:450 },
      { tpl:'ALCHEMIST',      x:620,  y:250 },
      { tpl:'SECT_DISCIPLE',  x:370,  y:380 },
      // Lv1 野狼（最近，新手最容易打的怪）
      { tpl:'WILD_WOLF',     x:500,  y:180 },
      { tpl:'WILD_WOLF',     x:580,  y:250 },
      { tpl:'WILD_WOLF',     x:450,  y:450 },
      // Lv1 黄鼠狼精（新手区）
      { tpl:'WEASEL_SPIRIT', x:600,  y:400 },
      { tpl:'WEASEL_SPIRIT', x:350,  y:200 },
      // Lv1 山贼（近玩家，新手可打）
      { tpl:'BANDIT',         x:700,  y:200 },
      { tpl:'BANDIT',         x:750,  y:320 },
      // Lv3 山贼头目（较远）
      { tpl:'BANDIT_CHIEF',   x:1000, y:200 },
      // Lv1 幼灵兽（新手区）
      { tpl:'SPIRIT_BEAST',   x:800,  y:500 },
      { tpl:'SPIRIT_BEAST',   x:650,  y:550 },
      // Lv3 灵兽（中区）
      { tpl:'SPIRIT_BEAST_ELDER', x:1200, y:400 },
      { tpl:'SPIRIT_BEAST_ELDER', x:1100, y:600 },
      // Lv5 魔化灵兽（远区Boss）
      { tpl:'DEMON_BEAST',    x:1400, y:900 },
    ];
    for (const s of spawns) {
      const tpl = NPC_TEMPLATES[s.tpl];
      if (!tpl) continue;
      const npc = {
        id: Utils.uid('npc'),
        tplId: s.tpl,
        ...JSON.parse(JSON.stringify(tpl)),
        x: s.x, y: s.y,
        hpMax: tpl.hp,
        vx: 0, vy: 0,
        state: 'patrol',
        patrolTimer: Utils.randFloat(2000, 5000),
        patrolTarget: { x: s.x + Utils.randInt(-80,80), y: s.y + Utils.randInt(-80,80) },
        socialTimer: Utils.randFloat(5000, 15000),
        chatCooldown: 0,
        target: null,
        respawnX: s.x, respawnY: s.y,
        alive: true,
        respawnTimer: 0,
        relation: {},
        buffList: [],
        atkCooldown: 0,
        aggro: false,
        fleeTimer: 0,   // 逃跑计时器
      };
      npcs.push(npc);
      Physics.addCircle(npc.id, npc.x, npc.y, 14, { isStatic: false });
    }
  }

  // ── 玩家属性更新 ────────────────────────────────────────
  function updatePlayer(dt, keys, camX, camY, weatherCfg, spiritAtPos) {
    _handleBuffs(player, dt);
    _updateHunger(dt);
    _updateSick(dt);
    _updateHpRegen(dt, spiritAtPos);
    _updateSpiritRegen(dt, spiritAtPos, weatherCfg);
    _handleMovement(dt, keys, weatherCfg);
    _updateAtkCooldown(dt);
  }

  function _handleMovement(dt, keys, weatherCfg) {
    let dx = 0, dy = 0;
    if (keys['ArrowUp'] || keys['w'] || keys['W'])    dy -= 1;
    if (keys['ArrowDown'] || keys['s'] || keys['S'])  dy += 1;
    if (keys['ArrowLeft'] || keys['a'] || keys['A'])  dx -= 1;
    if (keys['ArrowRight'] || keys['d'] || keys['D']) dx += 1;

    player.moving = dx !== 0 || dy !== 0;
    const n = player.moving ? Utils.normalize(dx, dy) : { x: 0, y: 0 };
    if (player.moving) {
      player.facing = n;
    }

    // 跑步判定：按住Shift + 有体力 + 在移动
    const wantSprint = !!keys['Shift'] && player.moving && player.stamina > 0;
    player.sprinting = wantSprint;

    // 体力更新
    if (wantSprint) {
      player.stamina = Utils.clamp(player.stamina - C.SPRINT_STAMINA_DECAY * dt / 16, 0, player.staminaMax);
    } else {
      player.stamina = Utils.clamp(player.stamina + C.SPRINT_STAMINA_REGEN * dt / 16, 0, player.staminaMax);
    }

    let spd = wantSprint ? C.SPRINT_SPEED : player.speed;
    spd *= (weatherCfg.moveMul || 1);
    // 饥饿减速
    if (player.hunger < 20) spd *= 0.6;
    // 生病减速
    if (player.sick) spd *= 0.75;

    // 跑步额外消耗饥饿
    if (wantSprint) {
      player.hunger = Utils.clamp(player.hunger - C.SPRINT_HUNGER_COST * dt / 16, 0, player.hungerMax);
    }

    // 获取装备加成
    const weaponAtk = player.weapon ? (player.weapon.atk || 0) : 0;
    const armorDef  = player.armor  ? (player.armor.def  || 0) : 0;
    player.atk = 10 + weaponAtk + getBuffValue(player, 'atk');
    player.def = 5  + armorDef  + getBuffValue(player, 'def');

    // 基于dt的手动位置计算，绕过物理velocity惯性问题
    const moveX = n.x * spd * dt / 1000;
    const moveY = n.y * spd * dt / 1000;
    const mapW = C.MAP_TILES_X * C.TILE_SIZE;
    const mapH = C.MAP_TILES_Y * C.TILE_SIZE;
    const pad = C.MAP_BOUND_PAD;
    const nx = Utils.clamp(player.x + moveX, pad, mapW - pad);
    const ny = Utils.clamp(player.y + moveY, pad, mapH - pad);
    player.x = nx; player.y = ny;
    Physics.setPos('player', nx, ny);
    Physics.setVelocity('player', 0, 0); // 清除物理速度
  }

  function _updateHunger(dt) {
    player.hunger = Utils.clamp(player.hunger - C.HUNGER_DECAY * dt / 16, 0, player.hungerMax);
    if (player.hunger <= 0) {
      player.hp = Utils.clamp(player.hp - 0.05 * dt / 16, 0, player.hpMax);
    }
    // 饥饿降低免疫力
    if (player.hunger < 30) {
      player.immunity = Utils.clamp(player.immunity - 0.002 * dt / 16, 0, player.immunityMax);
    }
  }

  function _updateSick(dt) {
    if (player.sick) {
      player.sickTimer += dt;
      player.hp = Utils.clamp(player.hp - 0.03 * dt/16, 0, player.hpMax);
      player.immunity = Utils.clamp(player.immunity - 0.001 * dt/16, 0, player.immunityMax);
      if (player.sickTimer > 30000 && player.immunity > 50) {
        player.sick = false; player.sickTimer = 0;
        Utils.notify('病情好转', '#4caf50');
      }
    } else {
      // 免疫力自然恢复
      player.immunity = Utils.clamp(player.immunity + 0.001 * dt/16, 0, player.immunityMax);
    }
  }

  function _updateHpRegen(dt, spiritAtPos) {
    if (player.hp < player.hpMax && !player.sick) {
      const regenRate = C.HP_REGEN_RATE * (1 + spiritAtPos * 0.5) * (player.immunity / 100);
      player.hp = Utils.clamp(player.hp + regenRate * dt/60, 0, player.hpMax);
    }
  }

  function _updateSpiritRegen(dt, spiritAtPos, weatherCfg) {
    const base = C.SPIRIT_REGEN_BASE;
    const regen = base * spiritAtPos * (weatherCfg.spiritMul || 1);
    player.spirit = Utils.clamp(player.spirit + regen * dt/1000, 0, player.spiritMax);
  }

  function _updateAtkCooldown(dt) {
    if (player.atkCooldown > 0) player.atkCooldown -= dt;
  }

  function _handleBuffs(entity, dt) {
    for (let i = entity.buffList.length - 1; i >= 0; i--) {
      entity.buffList[i].timer -= dt / 1000;
      if (entity.buffList[i].timer <= 0) entity.buffList.splice(i, 1);
    }
  }

  function getBuffValue(entity, type) {
    return entity.buffList
      .filter(b => b.type === type)
      .reduce((s, b) => s + b.value, 0);
  }

  function addBuff(entity, type, value, duration) {
    entity.buffList.push({ type, value, timer: duration });
  }

  // ── NPC AI更新 ──────────────────────────────────────────
  function updateNPCs(dt, weatherCfg) {
    for (const npc of npcs) {
      if (!npc.alive) {
        npc.respawnTimer += dt;
        if (npc.respawnTimer > 20000) {
          npc.alive = true;
          npc.hp = npc.hpMax;
          npc.x = npc.respawnX; npc.y = npc.respawnY;
          Physics.setPos(npc.id, npc.x, npc.y);
          npc.respawnTimer = 0;
        }
        continue;
      }

      _handleBuffs(npc, dt);

      if (npc.hostile) {
        _aiHostile(npc, dt, weatherCfg);
      } else {
        _aiFriendly(npc, dt);
      }

      // 同步物理位置 + 边界夹取
      const pos = Physics.getPos(npc.id);
      if (pos) {
        const mapW = C.MAP_TILES_X * C.TILE_SIZE;
        const mapH = C.MAP_TILES_Y * C.TILE_SIZE;
        const pad = C.MAP_BOUND_PAD;
        const cx = Utils.clamp(pos.x, pad, mapW - pad);
        const cy = Utils.clamp(pos.y, pad, mapH - pad);
        npc.x = cx; npc.y = cy;
        if (pos.x !== cx || pos.y !== cy) {
          Physics.setPos(npc.id, cx, cy);
        }
      }
      if (npc.atkCooldown > 0) npc.atkCooldown -= dt;
    }
  }

  function _aiHostile(npc, dt, weatherCfg) {
    const dToPlayer = Utils.dist(npc, player);
    const aggRange = npc.aggroRange || C.NPC_AGGRO_RADIUS;

    // 寻找最近的攻击目标（玩家 或 附近友方NPC）
    let bestTarget = null, bestDist = aggRange;
    if (dToPlayer < aggRange) { bestTarget = player; bestDist = dToPlayer; }
    for (const other of npcs) {
      if (!other.alive || other.hostile || other === npc) continue;
      const d = Utils.dist(npc, other);
      if (d < bestDist) { bestTarget = other; bestDist = d; }
    }

    if (bestTarget) {
      npc.state = 'chase';
      npc.target = bestTarget;
    } else if (npc.state === 'chase' && bestDist > aggRange * 1.5) {
      npc.state = 'patrol';
      npc.target = null;
    }

    if (npc.state === 'chase' && npc.target) {
      const t = npc.target;
      const dToTarget = Utils.dist(npc, t);
      const n = Utils.normalize(t.x - npc.x, t.y - npc.y);
      const spd = C.NPC_CHASE_SPEED * (weatherCfg.moveMul||1) / 60;
      Physics.setVelocity(npc.id, n.x * spd, n.y * spd);

      // 近战攻击
      if (dToTarget < 36 && npc.atkCooldown <= 0) {
        npc.atkCooldown = 1200;
        _npcAttackTarget(npc, t);
      }
    } else {
      _patrol(npc, dt);
    }
  }

  function _aiFriendly(npc, dt) {
    // Bug3修复：检测附近敌对单位，决定战斗或逃跑
    const threatRange = 200;
    let nearestThreat = null, nearestThreatDist = Infinity;
    for (const other of npcs) {
      if (!other.alive || !other.hostile) continue;
      const d = Utils.dist(npc, other);
      if (d < threatRange && d < nearestThreatDist) {
        nearestThreat = other; nearestThreatDist = d;
      }
    }
    // 也检查玩家附近无威胁（玩家不是威胁）

    if (nearestThreat) {
      if (npc.combatBrave) {
        // 勇敢NPC：追击并攻击威胁
        const n = Utils.normalize(nearestThreat.x - npc.x, nearestThreat.y - npc.y);
        const spd = C.NPC_CHASE_SPEED * 0.8 / 60;
        Physics.setVelocity(npc.id, n.x * spd, n.y * spd);
        if (nearestThreatDist < 40 && npc.atkCooldown <= 0) {
          npc.atkCooldown = 1500;
          _npcAttackTarget(npc, nearestThreat);
        }
      } else {
        // 胆小NPC：向远离威胁的方向逃跑
        const n = Utils.normalize(npc.x - nearestThreat.x, npc.y - nearestThreat.y);
        const spd = C.NPC_CHASE_SPEED * 1.1 / 60;
        Physics.setVelocity(npc.id, n.x * spd, n.y * spd);
        npc.fleeTimer = 3000; // 持续逃跑3秒
      }
      return; // 遇敌时不做社交
    }

    // 无威胁：正常巡逻+社交
    _patrol(npc, dt);
    npc.socialTimer -= dt;
    if (npc.socialTimer <= 0) {
      npc.socialTimer = Utils.randFloat(8000, 20000);
      _npcSocialInteraction(npc);
    }
  }

  function _patrol(npc, dt) {
    npc.patrolTimer -= dt;
    if (npc.patrolTimer <= 0) {
      npc.patrolTimer = Utils.randFloat(3000, 7000);
      npc.patrolTarget = {
        x: npc.respawnX + Utils.randInt(-100, 100),
        y: npc.respawnY + Utils.randInt(-100, 100),
      };
    }
    const dx = npc.patrolTarget.x - npc.x;
    const dy = npc.patrolTarget.y - npc.y;
    const d  = Math.hypot(dx, dy);
    if (d > 10) {
      const spd = C.NPC_PATROL_SPEED / 60;
      Physics.setVelocity(npc.id, (dx/d)*spd, (dy/d)*spd);
    } else {
      Physics.setVelocity(npc.id, 0, 0);
    }
  }

  // 通用NPC攻击：可攻击玩家或友方NPC
  function _npcAttackTarget(npc, target) {
    const targetDef = target.def || 0;
    const dmg = Math.max(1, npc.atk - targetDef + Utils.randInt(-3, 3));
    target.hp = Math.max(0, (target.hp || 0) - dmg);
    Utils.addFloatingText(target.x, (target.y || 0) - 20, `-${dmg}`, '#f44336');
    // 友方NPC被打死
    if (target !== player && target.hp <= 0) {
      target.alive = false;
      target.respawnTimer = 0;
      Utils.notify(`${target.name} 被击倒！`, '#f44336');
      Utils.addWorldLog('⚠️危急', `${target.name} 被击倒了！`, 'combat');
    }
  }

  function _npcAttackPlayer(npc) {
    _npcAttackTarget(npc, player);
  }

  function _npcSocialInteraction(npc) {
    for (const other of npcs) {
      if (other === npc || !other.alive) continue;
      const d = Utils.dist(npc, other);
      if (d < C.NPC_SOCIAL_RADIUS) {
        // 同阵营增加好感
        if (npc.faction === other.faction) {
          npc.relation[other.id] = (npc.relation[other.id] || 50) + Utils.randInt(1, 5);
          npc.relation[other.id] = Utils.clamp(npc.relation[other.id], 0, 100);
        }
      }
    }
  }

  // 玩家攻击
  function playerAttack() {
    if (player.atkCooldown > 0) return;
    player.atkCooldown = C.ATK_COOLDOWN;

    const range = 50;
    const fx = player.x + player.facing.x * range;
    const fy = player.y + player.facing.y * range;

    for (const npc of npcs) {
      if (!npc.alive || !npc.hostile) continue;
      if (Math.hypot(npc.x - fx, npc.y - fy) < 40) {
        const isCrit = Math.random() < (0.05 + getBuffValue(player, 'crit_rate'));
        let dmg = Math.max(1, player.atk - npc.def + Utils.randInt(-3, 3));
        if (isCrit) { dmg = Math.floor(dmg * C.CRIT_MULTIPLIER); }
        npc.hp -= dmg;

        // 击退
        const kn = Utils.normalize(npc.x - player.x, npc.y - player.y);
        Physics.applyImpulse(npc.id, kn.x * C.KNOCKBACK_FORCE * 0.001, kn.y * C.KNOCKBACK_FORCE * 0.001);

        Utils.addFloatingText(npc.x, npc.y - 20, isCrit ? `暴击 ${dmg}!` : `-${dmg}`,
          isCrit ? '#ff9800' : '#fff');

        if (npc.hp <= 0) {
          npc.alive = false;
          _dropLoot(npc);
          const xpGain = (npc.xpReward || 0) + Utils.randInt(0, 5);
          if (xpGain > 0) addXP(xpGain);
          Utils.notify(`击败 ${npc.name}（Lv${npc.level||1}）+${xpGain}XP`, '#ffd700');
          Utils.addWorldLog('⚔️战斗', `击败了 ${npc.name}（Lv${npc.level||1}）`, 'combat');
        }
      }
    }
    // 消耗灵力（灵剑）
    if (player.weapon && player.weapon.spirit_cost) {
      player.spirit = Utils.clamp(player.spirit - player.weapon.spirit_cost, 0, player.spiritMax);
    }
  }

  function _dropLoot(npc) {
    if (!npc.loot) return;
    for (const drop of npc.loot) {
      if (Math.random() < drop.chance) {
        addItemToInventory(player, drop.id, drop.qty);
        Utils.addFloatingText(npc.x, npc.y - 40, `+${drop.id} x${drop.qty}`, '#8bc34a');
      }
    }
  }

  // ── 背包操作 ────────────────────────────────────────────
  function addItemToInventory(entity, itemId, qty) {
    const slot = entity.inventory.find(s => s.id === itemId);
    if (slot) { slot.qty += qty; }
    else { entity.inventory.push({ id: itemId, qty }); }
  }

  function removeItemFromInventory(entity, itemId, qty) {
    const slot = entity.inventory.find(s => s.id === itemId);
    if (!slot || slot.qty < qty) return false;
    slot.qty -= qty;
    if (slot.qty === 0) entity.inventory.splice(entity.inventory.indexOf(slot), 1);
    return true;
  }

  function countItem(entity, itemId) {
    const slot = entity.inventory.find(s => s.id === itemId);
    return slot ? slot.qty : 0;
  }

  // XP与境界
  function addXP(amount) {
    player.xp += amount;
    if (player.xp >= player.xpMax) {
      player.xp -= player.xpMax;
      player.level++;
      player.xpMax = Math.floor(player.xpMax * 1.4);
      player.hpMax += 10;
      player.hp = player.hpMax;
      Utils.notify(`等级提升！当前等级 ${player.level}`, '#ffd700', 4000);
    }
  }

  // 使用物品
  function useItem(itemId) {
    const itemDef = Object.values(ITEMS).find(i => i.id === itemId);
    if (!itemDef) return;

    if (itemDef.type === 'food') {
      if (itemDef.id === 'raw_meat' && !player.nearFire) {
        // 吃生肉：有概率生病
        if (Math.random() < itemDef.sick) {
          player.sick = true;
          player.immunity = Utils.clamp(player.immunity - 30, 0, player.immunityMax);
          Utils.notify('吃了生肉，感觉不舒服...', '#f44336');
        } else {
          Utils.notify('吃了生肉，勉强充饥', '#ff9800');
        }
      }
      if (itemDef.hp)     player.hp     = Utils.clamp(player.hp     + itemDef.hp, 0, player.hpMax);
      if (itemDef.hunger) player.hunger = Utils.clamp(player.hunger + Math.abs(itemDef.hunger||0), 0, player.hungerMax);
      if (itemDef.spirit) player.spirit = Utils.clamp(player.spirit + itemDef.spirit, 0, player.spiritMax);
      removeItemFromInventory(player, itemId, 1);
      Utils.addFloatingText(player.x, player.y - 30, itemDef.icon, '#8bc34a', 20);

    } else if (itemDef.type === 'pill') {
      if (itemDef.hp)        player.hp       = Utils.clamp(player.hp + itemDef.hp, 0, player.hpMax);
      if (itemDef.spirit)    player.spirit   = Utils.clamp(player.spirit + itemDef.spirit, 0, player.spiritMax);
      if (itemDef.immunity)  player.immunity = Utils.clamp(player.immunity + itemDef.immunity, 0, player.immunityMax);
      if (itemDef.sick < 0 && player.sick) { player.sick = false; Utils.notify('病情痊愈！', '#4caf50'); }
      if (itemDef.atk_buff)  addBuff(player, 'atk', itemDef.atk_buff, itemDef.duration || 30);
      removeItemFromInventory(player, itemId, 1);
      Utils.addFloatingText(player.x, player.y - 30, `+${itemDef.name}`, '#2196f3', 14);

    } else if (itemDef.type === 'weapon') {
      player.weapon = itemDef;
      Utils.notify(`装备 ${itemDef.name}`, '#ffd700');

    } else if (itemDef.type === 'armor') {
      player.armor = itemDef;
      Utils.notify(`穿上 ${itemDef.name}`, '#ffd700');

    } else if (itemDef.type === 'fuel') {
      // 添加到篝火 —— 由building系统处理
      return 'add_fuel';
    }
  }

  function getPlayer() { return player; }
  function getNPCs() { return npcs; }
  function getProjectiles() { return projectiles; }

  // 绘制所有实体
  function draw(ctx, camX, camY) {
    _drawPlayer(ctx, camX, camY);
    for (const npc of npcs) {
      if (npc.alive) _drawNPC(ctx, npc, camX, camY);
    }
  }

  function _drawPlayer(ctx, camX, camY) {
    const sx = player.x - camX, sy = player.y - camY;
    // 阴影
    ctx.beginPath();
    ctx.ellipse(sx, sy+14, 12, 5, 0, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fill();
    // 角色图标
    ctx.font = '28px serif';
    ctx.textAlign = 'center';
    ctx.fillText('🧙', sx, sy + 8);
    // 状态标记
    if (player.sick) {
      ctx.font = '12px serif';
      ctx.fillText('🤢', sx + 16, sy - 10);
    }
    if (player.spirit > 80) {
      ctx.font = '12px serif';
      ctx.fillText('✨', sx - 20, sy - 10);
    }
    // 血条
    Utils.drawBar(ctx, sx - 20, sy - 30, 40, 5, player.hp, player.hpMax, C.COLOR.HP);
    Utils.drawBar(ctx, sx - 20, sy - 24, 40, 4, player.spirit, player.spiritMax, C.COLOR.SPIRIT);
    ctx.textAlign = 'left';
  }

  function _drawNPC(ctx, npc, camX, camY) {
    const sx = npc.x - camX, sy = npc.y - camY;
    if (sx < -30 || sx > C.CANVAS_W + 30 || sy < -30 || sy > C.CANVAS_H + 30) return;
    // 阴影
    ctx.beginPath();
    ctx.ellipse(sx, sy+12, 10, 4, 0, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fill();
    // NPC图标
    ctx.font = '22px serif';
    ctx.textAlign = 'center';
    ctx.fillText(npc.icon || '👤', sx, sy + 7);
    // 名字
    ctx.font = '10px 微软雅黑';
    ctx.fillStyle = npc.hostile ? '#f44336' : '#adf';
    ctx.fillText(npc.name, sx, sy - 16);
    // 血条（受伤时显示）
    if (npc.hp < npc.hpMax) {
      Utils.drawBar(ctx, sx - 18, sy - 28, 36, 4, npc.hp, npc.hpMax, C.COLOR.HP);
    }
    ctx.textAlign = 'left';
  }

  return {
    init, updatePlayer, updateNPCs, playerAttack,
    addItemToInventory, removeItemFromInventory, countItem,
    addXP, addBuff, getBuffValue, useItem,
    getPlayer, getNPCs, getProjectiles, draw,
  };
})();
