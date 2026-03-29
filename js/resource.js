// ============================================================
// resource.js - 采集资源系统（二级节点）
// 引用三级节点：data/biomes.js
// ============================================================

const Resource = (() => {
  let gatherActive = false;
  let gatherTimer   = 0;
  let currentTarget = null;

  function init() {}

  // 尝试开始采集
  function tryGather(player) {
    if (gatherActive) return;
    const nodes = World.getResourcesNear(player.x, player.y, C.GATHER_RADIUS);
    if (nodes.length === 0) {
      Utils.notify('附近没有可采集的资源', '#aaa');
      return;
    }
    // 选最近的
    nodes.sort((a, b) => Utils.dist(player, a) - Utils.dist(player, b));
    currentTarget = nodes[0];
    gatherActive = true;
    gatherTimer  = 0;

    const itemDef = _getItemDef(currentTarget.itemId);
    Utils.notify(`开始采集 ${itemDef ? itemDef.icon + itemDef.name : currentTarget.itemId}...`, '#8bc34a');
  }

  // 取消采集
  function cancelGather() {
    gatherActive  = false;
    gatherTimer   = 0;
    currentTarget = null;
  }

  // 每帧更新（dt毫秒）
  function update(dt, player, weatherCfg) {
    if (!gatherActive || !currentTarget) return;

    // 若玩家移动则取消
    if (player.moving) { cancelGather(); return; }

    // 灵力加成采集速度
    const spiritBonus = World.getSpiritAt(player.x, player.y);
    const biome = getBiomeAt(
      Math.floor(currentTarget.x / C.TILE_SIZE),
      Math.floor(currentTarget.y / C.TILE_SIZE),
    );
    let speedMul = 1 + spiritBonus * 0.4;
    // 天气影响（暴雨/雷暴减缓）
    speedMul *= (weatherCfg.moveMul || 1);
    // 玩家等级加成
    speedMul *= (1 + player.level * 0.02);

    gatherTimer += dt * speedMul;

    // 进度到达
    if (gatherTimer >= C.GATHER_TIME) {
      _completeGather(player, biome);
    }
  }

  function _completeGather(player, biome) {
    if (!currentTarget) return;

    const success = World.harvestNode(currentTarget.id);
    if (!success) { cancelGather(); return; }

    // 基础数量1~2，高灵力有额外掉落
    let qty = 1;
    const spirit = World.getSpiritAt(player.x, player.y);
    if (Math.random() < spirit * 0.4) qty++;
    if (player.level > 5 && Math.random() < 0.15) qty++;

    Entities.addItemToInventory(player, currentTarget.itemId, qty);

    const itemDef = _getItemDef(currentTarget.itemId);
    Utils.addFloatingText(currentTarget.x, currentTarget.y - 20,
      `+${itemDef ? itemDef.icon : ''}${qty}`, '#8bc34a');
    Entities.addXP(Utils.randInt(3, 8));

    // 如果地形有特殊资源加成，概率给额外奖励
    if (biome && biome.resources) {
      const bonus = biome.resources.find(r => r.id === currentTarget.itemId);
      if (bonus && Math.random() < 0.2) {
        // 额外1个同类资源
        Entities.addItemToInventory(player, currentTarget.itemId, 1);
        Utils.addFloatingText(currentTarget.x, currentTarget.y - 40, '地灵加持!', '#adf');
      }
    }

    cancelGather();
  }

  function _getItemDef(itemId) {
    return Object.values(ITEMS).find(i => i.id === itemId);
  }

  // 绘制采集进度圈
  function draw(ctx, camX, camY, player) {
    if (!gatherActive || !currentTarget) return;
    const sx = currentTarget.x - camX;
    const sy = currentTarget.y - camY;

    const progress = gatherTimer / C.GATHER_TIME;
    ctx.beginPath();
    ctx.arc(sx, sy, 22, -Math.PI/2, -Math.PI/2 + Math.PI*2*progress);
    ctx.strokeStyle = '#8bc34a';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(sx, sy, 22, 0, Math.PI*2);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 进度百分比
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.floor(progress*100)}%`, sx, sy + 4);
    ctx.textAlign = 'left';
  }

  function isGathering()     { return gatherActive; }
  function getProgress()     { return gatherActive ? gatherTimer / C.GATHER_TIME : 0; }
  function getCurrentTarget(){ return currentTarget; }

  return { init, tryGather, cancelGather, update, draw, isGathering, getProgress, getCurrentTarget };
})();
