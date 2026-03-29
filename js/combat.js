// ============================================================
// combat.js - ARPG战斗系统（二级节点）
// 引用三级节点：无
// ============================================================

const Combat = (() => {
  // 特效列表（攻击flash、爆炸等）
  const effects = [];

  // 状态
  let combo = 0, comboTimer = 0;
  const MAX_COMBO = 5;

  // 初始化
  function init() {}

  // 玩家闪避（消耗少量灵力）
  function dodge(player, keys) {
    const cost = 10;
    if (player.spirit < cost) { Utils.notify('灵力不足，无法闪避', '#f44336'); return; }
    player.spirit -= cost;

    const dir = { x: player.facing.x, y: player.facing.y };
    Physics.applyImpulse('player',
      dir.x * 0.05,
      dir.y * 0.05,
    );
    addEffect({ type:'dash', x: player.x, y: player.y, life:0.3, color:'rgba(100,150,255,0.5)' });
    Utils.addFloatingText(player.x, player.y - 20, '闪！', '#03a9f4');
  }

  // 技能释放（按Q）- 根据当前功法触发技能
  function useSkill(player, skillId) {
    const skill = SKILLS[skillId];
    if (!skill) return;

    const cost = 20 + skill.tier * 10;
    if (player.spirit < cost) { Utils.notify('灵力不足', '#f44336'); return; }

    player.spirit -= cost;

    switch (skillId) {
      case 'FIRE_PATH':
        _fireballAttack(player);
        break;
      case 'ICE_PATH':
        _iceAoE(player);
        break;
      case 'SWORD_HEART':
        _swordStrike(player);
        break;
      case 'BODY_REFINE':
        _ironBody(player);
        break;
      case 'SPIRIT_GATHER':
        _spiritBurst(player);
        break;
      default:
        _basicQiStrike(player);
    }
  }

  function _fireballAttack(player) {
    addEffect({ type:'fireball', x: player.x, y: player.y,
      vx: player.facing.x * 6, vy: player.facing.y * 6,
      r: 12, life: 2, color:'#ff5722', dmg: player.atk * 1.5 });
    Utils.notify('炎阳火球！', '#f44336');
  }

  function _iceAoE(player) {
    addEffect({ type:'ice_ring', x: player.x, y: player.y, r: 0, maxR: 80, life: 0.8, color:'#03a9f4' });
    Utils.notify('玄冰冰环！', '#03a9f4');
  }

  function _swordStrike(player) {
    addEffect({ type:'sword_slash', x: player.x + player.facing.x*40,
      y: player.y + player.facing.y*40, life: 0.4, facing: {...player.facing} });
    Utils.addFloatingText(player.x, player.y - 40, '剑心斩！', '#9c27b0', 18);
  }

  function _ironBody(player) {
    Entities.addBuff(player, 'def', 30, 10);
    addEffect({ type:'shield', x: player.x, y: player.y, life: 10, color:'rgba(255,215,0,0.3)' });
    Utils.notify('淬体护盾！+30防御(10秒)', '#ffd700');
  }

  function _spiritBurst(player) {
    player.spirit = Math.min(player.spirit + 40, player.spiritMax);
    addEffect({ type:'spirit_burst', x: player.x, y: player.y, r:0, maxR:60, life:0.6, color:'rgba(150,100,255,0.6)' });
    Utils.notify('聚灵爆发！+40灵力', '#9c27b0');
  }

  function _basicQiStrike(player) {
    addEffect({ type:'qi_wave', x: player.x, y: player.y,
      vx: player.facing.x*4, vy: player.facing.y*4, r:8, life:1.5, color:'rgba(100,200,255,0.6)' });
  }

  // 更新特效 + 处理伤害型特效碰撞
  function update(dt, player, npcs) {
    // 连击计时
    if (combo > 0) {
      comboTimer -= dt;
      if (comboTimer <= 0) { combo = 0; }
    }

    for (let i = effects.length - 1; i >= 0; i--) {
      const ef = effects[i];
      ef.life -= dt / 1000;
      if (ef.life <= 0) { effects.splice(i, 1); continue; }

      if (ef.type === 'fireball' || ef.type === 'qi_wave') {
        ef.x += ef.vx;
        ef.y += ef.vy;
        // 碰撞检测
        for (const npc of npcs) {
          if (!npc.alive || !npc.hostile) continue;
          if (Utils.dist(ef, npc) < (ef.r || 10) + 14) {
            const dmg = Math.floor((ef.dmg || player.atk) + Utils.randInt(-3, 3));
            npc.hp -= dmg;
            Utils.addFloatingText(npc.x, npc.y - 20, `-${dmg}`, '#ff5722');
            effects.splice(i, 1);
            if (npc.hp <= 0) { npc.alive = false; }
            break;
          }
        }
      }

      if (ef.type === 'ice_ring' || ef.type === 'spirit_burst') {
        ef.r = Utils.lerp(ef.r || 0, ef.maxR, 0.15);
        if (ef.type === 'ice_ring') {
          for (const npc of npcs) {
            if (!npc.alive || !npc.hostile) continue;
            if (Utils.dist(ef, npc) < ef.r + 14) {
              Entities.addBuff(npc, 'speed', -40, 3);
              const dmg = Math.floor(player.atk * 0.6);
              npc.hp -= dmg;
              Utils.addFloatingText(npc.x, npc.y - 20, `冰冻 -${dmg}`, '#03a9f4');
            }
          }
        }
      }
    }
  }

  function addEffect(ef) { effects.push(ef); }

  // 绘制特效
  function draw(ctx, camX, camY) {
    for (const ef of effects) {
      const sx = ef.x - camX, sy = ef.y - camY;
      ctx.save();

      if (ef.type === 'fireball') {
        ctx.beginPath();
        ctx.arc(sx, sy, ef.r, 0, Math.PI*2);
        ctx.fillStyle = ef.color;
        ctx.shadowBlur = 20; ctx.shadowColor = '#ff5722';
        ctx.fill();
      } else if (ef.type === 'ice_ring' || ef.type === 'spirit_burst') {
        ctx.beginPath();
        ctx.arc(sx, sy, ef.r || 1, 0, Math.PI*2);
        ctx.strokeStyle = ef.color;
        ctx.lineWidth = 3;
        ctx.globalAlpha = ef.life;
        ctx.stroke();
      } else if (ef.type === 'qi_wave') {
        ctx.beginPath();
        ctx.arc(sx, sy, ef.r, 0, Math.PI*2);
        ctx.fillStyle = ef.color;
        ctx.globalAlpha = ef.life;
        ctx.fill();
      } else if (ef.type === 'dash') {
        ctx.beginPath();
        ctx.arc(sx, sy, 20, 0, Math.PI*2);
        ctx.fillStyle = ef.color;
        ctx.globalAlpha = ef.life * 2;
        ctx.fill();
      } else if (ef.type === 'sword_slash') {
        ctx.strokeStyle = '#ce93d8';
        ctx.lineWidth = 4;
        ctx.globalAlpha = ef.life * 2.5;
        const perp = { x: -ef.facing.y, y: ef.facing.x };
        ctx.beginPath();
        ctx.moveTo(sx - perp.x * 30, sy - perp.y * 30);
        ctx.lineTo(sx + perp.x * 30, sy + perp.y * 30);
        ctx.stroke();
      } else if (ef.type === 'shield') {
        ctx.beginPath();
        ctx.arc(sx, sy, 22, 0, Math.PI*2);
        ctx.strokeStyle = ef.color;
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.5 + 0.3*Math.sin(Date.now()/200);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function getCombo() { return combo; }

  // 记录连击
  function registerHit() {
    combo = Math.min(combo + 1, MAX_COMBO);
    comboTimer = 2000;
    return combo;
  }

  return { init, dodge, useSkill, update, draw, addEffect, getCombo, registerHit };
})();
