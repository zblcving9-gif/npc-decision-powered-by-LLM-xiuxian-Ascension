// building.js - 建造系统（二级节点），引用三级节点：data/buildings.js
const Building = (() => {
  const placed = [];
  let buildMode = false, selectedTemplate = null, preview = null;

  function init() {}

  function enterBuildMode(templateId) {
    const tpl = BUILDING_TEMPLATES[templateId.toUpperCase()] || Object.values(BUILDING_TEMPLATES).find(t=>t.id===templateId);
    if (!tpl) return;
    buildMode = true;
    selectedTemplate = tpl;
    preview = { x: 0, y: 0, tpl, valid: false };
  }

  function exitBuildMode() { buildMode = false; selectedTemplate = null; preview = null; }

  function updatePreview(worldX, worldY, player) {
    if (!preview) return;
    preview.x = Math.floor(worldX / C.TILE_SIZE) * C.TILE_SIZE;
    preview.y = Math.floor(worldY / C.TILE_SIZE) * C.TILE_SIZE;
    const dist = Utils.dist({ x: preview.x + preview.tpl.w/2, y: preview.y + preview.tpl.h/2 }, player);
    preview.valid = dist < C.BUILD_RADIUS && !_overlaps(preview.x, preview.y, preview.tpl.w, preview.tpl.h);
  }

  function _overlaps(x, y, w, h) {
    for (const b of placed) {
      if (b.isDoor && !b.doorClosed) continue;
      if (Utils.rectOverlap(x, y, w, h, b.x, b.y, b.w, b.h)) return true;
    }
    return false;
  }

  function confirmBuild(player) {
    if (!preview || !preview.valid) return false;
    const tpl = preview.tpl;
    for (const cost of tpl.cost) {
      if (Entities.countItem(player, cost.id) < cost.qty) {
        Utils.notify(`材料不足：${cost.id} x${cost.qty}`, '#f44336'); return false;
      }
    }
    if (tpl.minRealmLevel && player.realmIdx + 1 < tpl.minRealmLevel) {
      Utils.notify('境界不足', '#f44336'); return false;
    }
    for (const cost of tpl.cost) Entities.removeItemFromInventory(player, cost.id, cost.qty);
    const building = {
      id: Utils.uid('bld'), tplId: tpl.id, ...tpl,
      x: preview.x, y: preview.y,
      buildProgress: 0, built: false, fuelCurrent: tpl.fuelMax || 0, burning: false,
      owner: 'player', doorClosed: !!tpl.isDoor, sleeping: false, sleepTimer: 0,
      training: false, trainTimer: 0,
    };
    placed.push(building);
    if (!building.isDoor || building.doorClosed) {
      Physics.addRect(building.id, building.x, building.y, building.w, building.h, { isStatic: true });
    }
    if (tpl.id === 'spirit_array') {
      World.addSpiritArray(building.x + building.w/2, building.y + building.h/2, tpl.auraRadius, tpl.spiritBonus);
    }
    Utils.notify(`开始建造 ${tpl.name}`, '#8bc34a');
    exitBuildMode();
    return true;
  }

  function addFuel(buildingId, itemId, player) {
    const b = placed.find(b => b.id === buildingId);
    if (!b || !b.isFireSource) return false;
    const itemDef = Object.values(ITEMS).find(i => i.id === itemId);
    if (!itemDef || itemDef.type !== 'fuel') return false;
    if (!Entities.removeItemFromInventory(player, itemId, 1)) return false;
    b.fuelCurrent = Math.min(b.fuelMax, b.fuelCurrent + (itemDef.fuel || 100));
    b.burning = b.fuelCurrent > 0;
    Utils.notify(`添加燃料 ${itemDef.name}`, '#ff9800');
    return true;
  }

  // N键交互：门开关 / 床休息 / 木桩训练
  function interact(player) {
    const near = getBuildingsNear(player, 60);
    for (const b of near) {
      if (!b.built) continue;
      if (b.isDoor) {
        if (b.owner !== 'player') { Utils.notify('这不是你建造的门', '#f44336'); return; }
        b.doorClosed = !b.doorClosed;
        if (b.doorClosed) {
          Physics.addRect(b.id, b.x, b.y, b.w, b.h, { isStatic: true });
          Utils.notify('门已关闭', '#78909c');
        } else {
          Physics.remove(b.id);
          Utils.notify('门已打开', '#8bc34a');
        }
        return;
      }
      if (b.isBed) {
        if (b.sleeping) { Utils.notify('正在休息中...', '#9c27b0'); return; }
        b.sleeping = true; b.sleepTimer = 0;
        Utils.notify('开始休息，恢复中...', '#9c27b0');
        return;
      }
      if (b.isTrainingPost) {
        if (b.training) { Utils.notify('正在训练中...', '#ff9800'); return; }
        if (player.stamina < 20) { Utils.notify('体力不足，无法训练', '#f44336'); return; }
        b.training = true; b.trainTimer = 0;
        Utils.notify('开始练武！', '#ff9800');
        return;
      }
    }
  }

  function update(dt, player, weatherCfg) {
    for (const b of placed) {
      if (!b.built) {
        b.buildProgress += dt / (b.buildTime * 1000);
        if (b.buildProgress >= 1) {
          b.built = true; b.buildProgress = 1;
          Utils.notify(`${b.name} 建造完成！`, '#ffd700');
        }
      }
      if (b.isFireSource && b.burning) {
        b.fuelCurrent -= 0.02 * (weatherCfg.fireDecayMul || 1) * dt / 16;
        if (b.fuelCurrent <= 0) { b.fuelCurrent = 0; b.burning = false; Utils.notify('篝火熄灭了！', '#ff9800'); }
      }
      if (b.isBed && b.sleeping && b.built) {
        b.sleepTimer += dt;
        player.stamina = Utils.clamp(player.stamina + 0.3 * dt / 16, 0, player.staminaMax);
        player.spirit = Utils.clamp(player.spirit + 0.2 * dt / 16, 0, player.spiritMax);
        player.hunger = Utils.clamp(player.hunger + 0.05 * dt / 16, 0, player.hungerMax);
        player.immunity = Utils.clamp(player.immunity + 0.05 * dt / 16, 0, player.immunityMax);
        player.hp = Utils.clamp(player.hp + 0.1 * dt / 16, 0, player.hpMax);
        if (b.sleepTimer >= 8000) { b.sleeping = false; b.sleepTimer = 0; Utils.notify('休息完毕！', '#4caf50'); }
      }
      if (b.isTrainingPost && b.training && b.built) {
        b.trainTimer += dt;
        player.stamina = Utils.clamp(player.stamina - 0.2 * dt / 16, 0, player.staminaMax);
        if (b.trainTimer >= 2000) {
          b.trainTimer -= 2000; Entities.addXP(1);
          Utils.addFloatingText(b.x + b.w/2, b.y - 10, '+1XP', '#ffd700');
        }
        if (player.stamina <= 0 || b.trainTimer >= 10000) { b.training = false; b.trainTimer = 0; Utils.notify('训练结束', '#ff9800'); }
      }
    }
    player.nearFire = false; player.fireRange = false;
    for (const b of placed) {
      if (b.isFireSource && b.burning && b.built) {
        const cx = b.x + b.w/2, cy = b.y + b.h/2;
        if (Utils.dist(player, { x: cx, y: cy }) < (b.fireRadius || 80)) {
          player.nearFire = true; player.fireRange = true;
          if (weatherCfg.immunityDecay > 0) player.immunity = Utils.clamp(player.immunity + 0.002 * dt/16, 0, player.immunityMax);
        }
      }
    }
  }

  function getBuildingsNear(player, radius) {
    return placed.filter(b => b.built && Utils.dist(player, { x: b.x + b.w/2, y: b.y + b.h/2 }) < (radius || 60));
  }

  function hasBuildingType(typeId) { return placed.some(b => b.tplId === typeId && b.built); }

  function draw(ctx, camX, camY) {
    for (const b of placed) {
      const sx = b.x - camX, sy = b.y - camY;
      if (sx > C.CANVAS_W + 50 || sx + b.w < -50 || sy > C.CANVAS_H + 50 || sy + b.h < -50) continue;
      ctx.globalAlpha = b.built ? 1 : 0.5 + b.buildProgress * 0.5;
      // 主体
      ctx.fillStyle = b.isWall ? 'rgba(120,90,50,0.9)' : 'rgba(80,60,40,0.85)';
      Utils.roundRect(ctx, sx, sy, b.w, b.h, b.isWall ? 0 : 4); ctx.fill();
      ctx.strokeStyle = b.isWall ? '#8d6e3f' : C.COLOR.BORDER;
      ctx.lineWidth = b.isWall ? 2 : 1.5;
      Utils.roundRect(ctx, sx, sy, b.w, b.h, b.isWall ? 0 : 4); ctx.stroke();
      // 图标
      ctx.font = `${Math.max(12, Math.min(b.w, b.h) * 0.5)}px serif`;
      ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
      if (b.isDoor && !b.doorClosed) ctx.fillText('🔓', sx + b.w/2, sy + b.h/2 + 6);
      else ctx.fillText(b.icon || '🏠', sx + b.w/2, sy + b.h/2 + 6);
      // 名称
      ctx.font = '10px 微软雅黑'; ctx.fillStyle = '#ddd';
      ctx.fillText(b.name, sx + b.w/2, sy - 4);
      // 建造进度
      if (!b.built) Utils.drawBar(ctx, sx, sy + b.h + 2, b.w, 5, b.buildProgress, 1, '#8bc34a');
      // 门状态
      if (b.isDoor && b.built) {
        ctx.font = '9px 微软雅黑'; ctx.fillStyle = b.doorClosed ? '#f44336' : '#4caf50';
        ctx.fillText(b.doorClosed ? '已锁' : '开启', sx + b.w/2, sy + b.h + 12);
      }
      // 床休息特效
      if (b.isBed && b.sleeping) {
        ctx.font = '16px serif'; ctx.fillText('💤', sx + b.w/2, sy - 14);
        Utils.drawBar(ctx, sx, sy + b.h + 2, b.w, 4, b.sleepTimer / 8000, 1, '#9c27b0');
      }
      // 木桩训练特效
      if (b.isTrainingPost && b.training) {
        ctx.font = '16px serif';
        ctx.fillText(Math.floor(Date.now() / 300) % 2 ? '💥' : '👊', sx + b.w/2, sy - 14);
      }
      // 篝火
      if (b.isFireSource && b.burning) {
        const cx = sx + b.w/2, cy = sy + b.h/2;
        ctx.globalAlpha = 0.7 + 0.3 * Math.sin(Date.now() / 200);
        ctx.font = '28px serif'; ctx.fillText('🔥', cx, cy - b.h/4);
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, b.fireRadius || 80);
        grad.addColorStop(0, 'rgba(255,120,0,0.12)'); grad.addColorStop(1, 'rgba(255,120,0,0)');
        ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(cx, cy, b.fireRadius || 80, 0, Math.PI*2); ctx.fill();
        Utils.drawBar(ctx, sx, sy - 12, b.w, 4, b.fuelCurrent, b.fuelMax, '#ff9800', '🔥');
      }
      ctx.globalAlpha = 1; ctx.textAlign = 'left';
    }
    // 建造预览
    if (buildMode && preview) {
      const sx = preview.x - camX, sy = preview.y - camY;
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = preview.valid ? 'rgba(100,200,100,0.3)' : 'rgba(200,100,100,0.3)';
      ctx.fillRect(sx, sy, preview.tpl.w, preview.tpl.h);
      ctx.strokeStyle = preview.valid ? '#8bc34a' : '#f44336'; ctx.lineWidth = 2;
      ctx.strokeRect(sx, sy, preview.tpl.w, preview.tpl.h);
      ctx.font = '22px serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
      ctx.fillText(preview.tpl.icon || '🏗️', sx + preview.tpl.w/2, sy + preview.tpl.h/2 + 6);
      ctx.globalAlpha = 1; ctx.textAlign = 'left';
    }
  }

  return {
    init, enterBuildMode, exitBuildMode, updatePreview, confirmBuild,
    addFuel, update, getBuildingsNear, hasBuildingType, draw, interact,
    getPlaced: () => placed, isBuildMode: () => buildMode, getPreview: () => preview,
  };
})();
