// ============================================================
// building.js - 建造系统（二级节点）
// 引用三级节点：data/buildings.js
// ============================================================

const Building = (() => {
  const placed = [];     // 已建造建筑列表
  let buildMode = false;
  let selectedTemplate = null;
  let preview = null;

  function init() {}

  // 进入建造模式
  function enterBuildMode(templateId) {
    const tpl = BUILDING_TEMPLATES[templateId.toUpperCase()] || Object.values(BUILDING_TEMPLATES).find(t=>t.id===templateId);
    if (!tpl) return;
    buildMode = true;
    selectedTemplate = tpl;
    preview = { x: 0, y: 0, tpl, valid: false };
  }

  function exitBuildMode() {
    buildMode = false;
    selectedTemplate = null;
    preview = null;
  }

  // 更新预览位置
  function updatePreview(worldX, worldY, player) {
    if (!preview) return;
    // 吸附到网格
    preview.x = Math.floor(worldX / C.TILE_SIZE) * C.TILE_SIZE;
    preview.y = Math.floor(worldY / C.TILE_SIZE) * C.TILE_SIZE;
    // 检查距离玩家是否在范围内
    const dist = Utils.dist({ x: preview.x + preview.tpl.w/2, y: preview.y + preview.tpl.h/2 }, player);
    preview.valid = dist < C.BUILD_RADIUS && !_overlaps(preview.x, preview.y, preview.tpl.w, preview.tpl.h);
  }

  function _overlaps(x, y, w, h) {
    for (const b of placed) {
      if (Utils.rectOverlap(x, y, w, h, b.x, b.y, b.w, b.h)) return true;
    }
    return false;
  }

  // 确认建造
  function confirmBuild(player) {
    if (!preview || !preview.valid) return false;
    const tpl = preview.tpl;

    // 检查材料
    for (const cost of tpl.cost) {
      if (Entities.countItem(player, cost.id) < cost.qty) {
        Utils.notify(`材料不足：${cost.id} x${cost.qty}`, '#f44336');
        return false;
      }
    }
    // 检查境界限制
    if (tpl.minRealmLevel && player.realmIdx + 1 < tpl.minRealmLevel) {
      Utils.notify('境界不足，无法建造此建筑', '#f44336');
      return false;
    }

    // 扣除材料
    for (const cost of tpl.cost) {
      Entities.removeItemFromInventory(player, cost.id, cost.qty);
    }

    // 放置建筑
    const building = {
      id: Utils.uid('bld'),
      tplId: tpl.id,
      ...tpl,
      x: preview.x, y: preview.y,
      buildProgress: 0,
      built: false,
      fuelCurrent: tpl.fuelMax || 0,
      burning: false,
    };

    placed.push(building);
    Physics.addRect(building.id, building.x, building.y, building.w, building.h, { isStatic: true });

    // 如果是聚灵阵，通知world
    if (tpl.id === 'spirit_array') {
      World.addSpiritArray(building.x + building.w/2, building.y + building.h/2,
        tpl.auraRadius, tpl.spiritBonus);
    }

    Utils.notify(`开始建造 ${tpl.name}`, '#8bc34a');
    exitBuildMode();
    return true;
  }

  // 添加燃料到篝火
  function addFuel(buildingId, itemId, player) {
    const b = placed.find(b => b.id === buildingId);
    if (!b || !b.isFireSource) return false;
    const itemDef = Object.values(ITEMS).find(i => i.id === itemId);
    if (!itemDef || itemDef.type !== 'fuel') return false;
    if (!Entities.removeItemFromInventory(player, itemId, 1)) return false;
    b.fuelCurrent = Math.min(b.fuelMax, b.fuelCurrent + (itemDef.fuel || 100));
    b.burning = b.fuelCurrent > 0;
    Utils.notify(`添加燃料 ${itemDef.name}，火力充沛！`, '#ff9800');
    return true;
  }

  // 更新所有建筑
  function update(dt, player, weatherCfg) {
    for (const b of placed) {
      // 建造进度
      if (!b.built) {
        b.buildProgress += dt / (b.buildTime * 1000);
        if (b.buildProgress >= 1) {
          b.built = true;
          b.buildProgress = 1;
          Utils.notify(`${b.name} 建造完成！`, '#ffd700');
        }
      }

      // 篝火燃料消耗
      if (b.isFireSource && b.burning) {
        const decayMul = weatherCfg.fireDecayMul || 1;
        b.fuelCurrent -= 0.02 * decayMul * dt / 16;
        if (b.fuelCurrent <= 0) {
          b.fuelCurrent = 0;
          b.burning = false;
          Utils.notify('篝火熄灭了！', '#ff9800');
        }
      }
    }

    // 检测玩家是否在火源范围内
    player.nearFire = false;
    player.fireRange = false;
    for (const b of placed) {
      if (b.isFireSource && b.burning && b.built) {
        const cx = b.x + b.w/2, cy = b.y + b.h/2;
        const d = Utils.dist(player, { x: cx, y: cy });
        if (d < (b.fireRadius || 80)) {
          player.nearFire = true;
          player.fireRange = true;
          // 靠近火取暖：寒冷天气可抵消免疫力损失
          if (weatherCfg.immunityDecay > 0) {
            player.immunity = Utils.clamp(player.immunity + 0.002 * dt/16, 0, player.immunityMax);
          }
        }
      }
    }
  }

  // 获取玩家附近的建筑
  function getBuildingsNear(player, radius) {
    return placed.filter(b => b.built &&
      Utils.dist(player, { x: b.x + b.w/2, y: b.y + b.h/2 }) < (radius || 60)
    );
  }

  // 检查某类建筑是否已建造
  function hasBuildingType(typeId) {
    return placed.some(b => b.tplId === typeId && b.built);
  }

  // 绘制建筑
  function draw(ctx, camX, camY) {
    for (const b of placed) {
      const sx = b.x - camX, sy = b.y - camY;
      if (sx > C.CANVAS_W + 50 || sx + b.w < -50 || sy > C.CANVAS_H + 50 || sy + b.h < -50) continue;

      // 建筑主体
      const alpha = b.built ? 1 : 0.5 + b.buildProgress * 0.5;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(80,60,40,0.85)';
      Utils.roundRect(ctx, sx, sy, b.w, b.h, 4);
      ctx.fill();
      ctx.strokeStyle = C.COLOR.BORDER;
      ctx.lineWidth = 1.5;
      Utils.roundRect(ctx, sx, sy, b.w, b.h, 4);
      ctx.stroke();

      // 建筑图标
      ctx.font = `${Math.min(b.w, b.h) * 0.5}px serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.fillText(b.icon || '🏠', sx + b.w/2, sy + b.h/2 + 6);

      // 建筑名
      ctx.font = '10px 微软雅黑';
      ctx.fillStyle = '#ddd';
      ctx.fillText(b.name, sx + b.w/2, sy - 4);

      // 建造进度条
      if (!b.built) {
        Utils.drawBar(ctx, sx, sy + b.h + 2, b.w, 5, b.buildProgress, 1, '#8bc34a');
      }

      // 篝火火焰效果
      if (b.isFireSource && b.burning) {
        const cx = sx + b.w/2, cy = sy + b.h/2;
        const t = Date.now() / 200;
        ctx.globalAlpha = 0.7 + 0.3 * Math.sin(t);
        ctx.font = '28px serif';
        ctx.fillText('🔥', cx, cy - b.h/4);
        // 火光晕
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, b.fireRadius || 80);
        grad.addColorStop(0, 'rgba(255,120,0,0.12)');
        grad.addColorStop(1, 'rgba(255,120,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, b.fireRadius || 80, 0, Math.PI*2);
        ctx.fill();

        // 燃料条
        Utils.drawBar(ctx, sx, sy - 12, b.w, 4, b.fuelCurrent, b.fuelMax, '#ff9800', '🔥');
      }

      ctx.globalAlpha = 1;
      ctx.textAlign = 'left';
    }

    // 建造预览
    if (buildMode && preview) {
      const sx = preview.x - camX, sy = preview.y - camY;
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = preview.valid ? 'rgba(100,200,100,0.3)' : 'rgba(200,100,100,0.3)';
      ctx.fillRect(sx, sy, preview.tpl.w, preview.tpl.h);
      ctx.strokeStyle = preview.valid ? '#8bc34a' : '#f44336';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx, sy, preview.tpl.w, preview.tpl.h);
      ctx.font = '22px serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.fillText(preview.tpl.icon || '🏗️', sx + preview.tpl.w/2, sy + preview.tpl.h/2 + 6);
      ctx.globalAlpha = 1;
      ctx.textAlign = 'left';
    }
  }

  return {
    init, enterBuildMode, exitBuildMode, updatePreview, confirmBuild,
    addFuel, update, getBuildingsNear, hasBuildingType, draw,
    getPlaced: () => placed,
    isBuildMode: () => buildMode,
    getPreview: () => preview,
  };
})();
