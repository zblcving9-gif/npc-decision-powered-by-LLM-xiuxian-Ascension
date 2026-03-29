// ============================================================
// world.js - 地图/坐标/灵力系统（二级节点）
// 引用三级节点：data/biomes.js
// ============================================================

const World = (() => {
  // 灵力阵法叠加列表 { x, y, radius, bonus }
  const spiritArrays = [];

  // 资源节点列表
  const resourceNodes = [];

  // 摄像机
  const cam = { x: 0, y: 0, targetX: 0, targetY: 0 };

  function init() {
    _generateResources();
    _ensureStarterResources();
  }

  // 确保玩家出生点附近有可见资源（防止随机分布导致初始区域空白）
  function _ensureStarterResources() {
    const starters = [
      { itemId:'wood',        x:340, y:260 },
      { itemId:'wood',        x:460, y:340 },
      { itemId:'stone',       x:300, y:380 },
      { itemId:'spirit_herb', x:480, y:260 },
      { itemId:'stone',       x:380, y:420 },
      { itemId:'wood',        x:520, y:300 },
    ];
    for (const s of starters) {
      resourceNodes.push({
        id: Utils.uid('res'),
        itemId: s.itemId,
        x: s.x, y: s.y,
        hp: 3, maxHp: 3,
        regenTimer: 0, depleted: false,
      });
    }
  }

  // 生成初始资源节点
  function _generateResources() {
    const configs = [
      { id:'wood',        count:40, biomes:['plain','forest'] },
      { id:'stone',       count:35, biomes:['plain','mountain'] },
      { id:'iron_ore',    count:20, biomes:['mountain','volcano'] },
      { id:'spirit_herb', count:25, biomes:['forest','lake'] },
      { id:'spirit_stone',count:12, biomes:['mountain','ruins'] },
      { id:'fire_crystal',count:10, biomes:['volcano'] },
      { id:'jade',        count:10, biomes:['lake','mountain'] },
      { id:'golden_fruit',count:8,  biomes:['forest'] },
      { id:'coal',        count:15, biomes:['volcano','desert'] },
    ];

    for (const cfg of configs) {
      let placed = 0, tries = 0;
      while (placed < cfg.count && tries < cfg.count * 20) {
        tries++;
        const tx = Utils.randInt(1, C.MAP_TILES_X - 1);
        const ty = Utils.randInt(1, C.MAP_TILES_Y - 1);
        const biome = getBiomeAt(tx, ty);
        if (cfg.biomes.includes(biome.id)) {
          const wx = tx * C.TILE_SIZE + Utils.randInt(0, C.TILE_SIZE - 1);
          const wy = ty * C.TILE_SIZE + Utils.randInt(0, C.TILE_SIZE - 1);
          resourceNodes.push({
            id: Utils.uid('res'),
            itemId: cfg.id,
            x: wx, y: wy,
            hp: 3,
            maxHp: 3,
            regenTimer: 0,
            depleted: false,
          });
          placed++;
        }
      }
    }
  }

  // 获取某世界坐标的实际灵力值（受地形+聚灵阵影响）
  function getSpiritAt(wx, wy) {
    let base = getBaseSpiritAt(wx, wy);
    let bonus = 0;
    for (const sa of spiritArrays) {
      const d = Math.hypot(wx - sa.x, wy - sa.y);
      if (d < sa.radius) {
        bonus += sa.bonus * (1 - d / sa.radius);
      }
    }
    return Utils.clamp(base + bonus, 0, 1);
  }

  // 添加聚灵阵
  function addSpiritArray(x, y, radius, bonus) {
    spiritArrays.push({ x, y, radius, bonus });
  }

  // 移除聚灵阵
  function removeSpiritArray(x, y) {
    const idx = spiritArrays.findIndex(s => Math.hypot(s.x-x,s.y-y)<10);
    if (idx >= 0) spiritArrays.splice(idx, 1);
  }

  // 更新资源重生
  function update(dt) {
    for (const node of resourceNodes) {
      if (node.depleted) {
        node.regenTimer += dt;
        if (node.regenTimer >= C.RESOURCE_REGEN_TIME) {
          node.depleted = false;
          node.hp = node.maxHp;
          node.regenTimer = 0;
        }
      }
    }
  }

  // 获取范围内可采集的资源
  function getResourcesNear(x, y, r) {
    return resourceNodes.filter(n =>
      !n.depleted && Math.hypot(n.x - x, n.y - y) <= r
    );
  }

  // 采集节点（返回是否成功）
  function harvestNode(nodeId) {
    const n = resourceNodes.find(r => r.id === nodeId);
    if (!n || n.depleted) return false;
    n.hp--;
    if (n.hp <= 0) { n.depleted = true; n.regenTimer = 0; }
    return true;
  }

  // 摄像机跟随
  function updateCamera(targetX, targetY, dt) {
    cam.targetX = targetX - C.CANVAS_W / 2;
    cam.targetY = targetY - C.CANVAS_H / 2;
    // 边界夹取
    const maxX = C.MAP_TILES_X * C.TILE_SIZE - C.CANVAS_W;
    const maxY = C.MAP_TILES_Y * C.TILE_SIZE - C.CANVAS_H;
    cam.targetX = Utils.clamp(cam.targetX, 0, maxX);
    cam.targetY = Utils.clamp(cam.targetY, 0, maxY);
    cam.x = Utils.lerp(cam.x, cam.targetX, Math.min(1, dt / 100));
    cam.y = Utils.lerp(cam.y, cam.targetY, Math.min(1, dt / 100));
  }

  function getCamera() { return cam; }
  function getResourceNodes() { return resourceNodes; }
  function getSpiritArrays() { return spiritArrays; }

  // 绘制地图
  function drawTerrain(ctx) {
    const startTX = Math.floor(cam.x / C.TILE_SIZE);
    const startTY = Math.floor(cam.y / C.TILE_SIZE);
    const endTX   = Math.min(C.MAP_TILES_X, startTX + Math.ceil(C.CANVAS_W / C.TILE_SIZE) + 1);
    const endTY   = Math.min(C.MAP_TILES_Y, startTY + Math.ceil(C.CANVAS_H / C.TILE_SIZE) + 1);

    for (let tx = startTX; tx < endTX; tx++) {
      for (let ty = startTY; ty < endTY; ty++) {
        const biome = getBiomeAt(tx, ty);
        const sx = tx * C.TILE_SIZE - cam.x;
        const sy = ty * C.TILE_SIZE - cam.y;

        // 基础地形颜色
        ctx.fillStyle = biome.color;
        ctx.fillRect(sx, sy, C.TILE_SIZE, C.TILE_SIZE);

        // 灵力光晕叠加
        const spirit = getSpiritAt(tx * C.TILE_SIZE + 32, ty * C.TILE_SIZE + 32);
        if (spirit > 0.6) {
          ctx.fillStyle = `rgba(100,150,255,${(spirit - 0.6) * 0.3})`;
          ctx.fillRect(sx, sy, C.TILE_SIZE, C.TILE_SIZE);
        }

        // 轻微网格线
        ctx.strokeStyle = 'rgba(0,0,0,0.08)';
        ctx.strokeRect(sx, sy, C.TILE_SIZE, C.TILE_SIZE);
      }
    }
  }

  // 绘制资源节点
  function drawResources(ctx) {
    ctx.save();
    ctx.globalAlpha = 1;
    for (const node of resourceNodes) {
      if (node.depleted) continue;
      const sx = node.x - cam.x;
      const sy = node.y - cam.y;
      if (sx < -20 || sx > C.CANVAS_W + 20 || sy < -20 || sy > C.CANVAS_H + 20) continue;

      const item = Object.values(ITEMS).find(it => it.id === node.itemId);
      ctx.font = '20px serif';
      ctx.textAlign = 'center';
      ctx.fillText(item ? item.icon : '?', sx, sy + 6);
      if (node.hp < node.maxHp) {
        Utils.drawBar(ctx, sx-12, sy-18, 24, 4, node.hp, node.maxHp, '#8bc34a');
      }
    }
    ctx.restore();
  }

  return {
    init, update, getSpiritAt, addSpiritArray, removeSpiritArray,
    getResourcesNear, harvestNode, updateCamera, getCamera,
    getResourceNodes, getSpiritArrays, drawTerrain, drawResources,
  };
})();
