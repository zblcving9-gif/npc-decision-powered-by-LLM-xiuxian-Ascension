// ============================================================
// renderer.js - Canvas渲染主循环（二级节点）
// 引用三级节点：无
// ============================================================

const Renderer = (() => {
  let canvas, ctx;
  let lastTime = 0;

  function init(canvasEl) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    canvas.width  = C.CANVAS_W;
    canvas.height = C.CANVAS_H;
    // 平滑关闭（像素风格）
    ctx.imageSmoothingEnabled = false;
  }

  // 主渲染帧
  function render(timestamp, gameState) {
    const dt = Math.min(timestamp - lastTime, 50); // 最大50ms防跳帧
    lastTime = timestamp;

    const { player, npcs, cam } = gameState;

    // ── 背景清除 ────────────────────────────────────────────
    ctx.fillStyle = C.COLOR.BG;
    ctx.fillRect(0, 0, C.CANVAS_W, C.CANVAS_H);

    // ── 地形 ────────────────────────────────────────────────
    World.drawTerrain(ctx);

    // ── 地图边界线 ──────────────────────────────────────────
    _drawMapBorder(ctx, cam.x, cam.y);

    // ── 建筑（底层） ────────────────────────────────────────
    Building.draw(ctx, cam.x, cam.y);

    // ── 资源节点 ────────────────────────────────────────────
    World.drawResources(ctx);

    // ── 采集进度圈 ──────────────────────────────────────────
    Resource.draw(ctx, cam.x, cam.y, player);

    // ── 实体（NPC + 玩家） ──────────────────────────────────
    Entities.draw(ctx, cam.x, cam.y);

    // ── 聊天气泡（NPC头顶） ──────────────────────────────────
    Utils.drawChatBubbles(ctx, cam.x, cam.y);

    // ── 战斗特效 ────────────────────────────────────────────
    Combat.draw(ctx, cam.x, cam.y);

    // ── 天气叠加 ────────────────────────────────────────────
    Weather.draw(ctx);

    // ── 制作进度条 ──────────────────────────────────────────
    Craft.draw(ctx);

    // ── 浮动文字 ────────────────────────────────────────────
    Utils.drawFloatingTexts(ctx, cam.x, cam.y);

    // ── UI面板 ──────────────────────────────────────────────
    UI.draw(ctx, gameState);

    // ── 通知 ─────────────────────────────────────────────────
    _drawNotifications(ctx);

    return dt;
  }

  function _drawNotifications(ctx) {
    const notes = Utils.getNotifications();
    const x = C.CANVAS_W - 270, startY = 160;
    notes.forEach((n, i) => {
      const alpha = Math.min(1, n.timer / 500);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(20,20,40,0.75)';
      Utils.roundRect(ctx, x - 4, startY + i * 28 - 16, 264, 22, 4);
      ctx.fill();
      ctx.fillStyle = n.color || '#fff';
      ctx.font = '12px 微软雅黑';
      ctx.fillText(n.msg, x, startY + i * 28);
      ctx.globalAlpha = 1;
    });
  }

  // 绘制小地图
  function drawMinimap(ctx, player, buildings, npcs) {
    const mmW = 140, mmH = 100;
    const mmX = C.CANVAS_W - mmW - 8, mmY = 8;
    const scaleX = mmW / (C.MAP_TILES_X * C.TILE_SIZE);
    const scaleY = mmH / (C.MAP_TILES_Y * C.TILE_SIZE);

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    Utils.roundRect(ctx, mmX - 2, mmY - 2, mmW + 4, mmH + 4, 4);
    ctx.fill();

    // 地形色块
    for (let tx = 0; tx < C.MAP_TILES_X; tx++) {
      for (let ty = 0; ty < C.MAP_TILES_Y; ty++) {
        const biome = getBiomeAt(tx, ty);
        ctx.fillStyle = biome.color;
        ctx.fillRect(mmX + tx*mmW/C.MAP_TILES_X, mmY + ty*mmH/C.MAP_TILES_Y,
          mmW/C.MAP_TILES_X + 1, mmH/C.MAP_TILES_Y + 1);
      }
    }

    // 建筑点
    for (const b of buildings) {
      if (!b.built) continue;
      ctx.fillStyle = '#ff9800';
      ctx.fillRect(mmX + b.x * scaleX - 1, mmY + b.y * scaleY - 1, 3, 3);
    }

    // 敌人点
    for (const npc of npcs) {
      if (!npc.alive) continue;
      ctx.fillStyle = npc.hostile ? '#f44336' : '#4caf50';
      ctx.beginPath();
      ctx.arc(mmX + npc.x * scaleX, mmY + npc.y * scaleY, 2, 0, Math.PI*2);
      ctx.fill();
    }

    // 玩家点
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(mmX + player.x * scaleX, mmY + player.y * scaleY, 3, 0, Math.PI*2);
    ctx.fill();

    // 边框
    ctx.strokeStyle = C.COLOR.BORDER;
    ctx.lineWidth = 1;
    ctx.strokeRect(mmX, mmY, mmW, mmH);
  }

  // 绘制地图边界红线
  function _drawMapBorder(ctx, camX, camY) {
    const mapW = C.MAP_TILES_X * C.TILE_SIZE;
    const mapH = C.MAP_TILES_Y * C.TILE_SIZE;
    ctx.save();
    ctx.strokeStyle = '#f44336';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(-camX, -camY, mapW, mapH);
    ctx.restore();
  }

  function getCtx() { return ctx; }
  function getCanvas() { return canvas; }

  return { init, render, drawMinimap, getCtx, getCanvas };
})();
