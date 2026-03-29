// ============================================================
// utils.js - 工具函数（二级节点，不引用其他二级节点）
// ============================================================

const Utils = (() => {
  // 距离计算
  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  // 向量归一化
  function normalize(dx, dy) {
    const len = Math.hypot(dx, dy) || 1;
    return { x: dx / len, y: dy / len };
  }

  // 随机范围整数
  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // 随机范围浮点
  function randFloat(min, max) {
    return Math.random() * (max - min) + min;
  }

  // 从权重数组随机抽取
  function weightedRandom(items) {
    const total = items.reduce((s, i) => s + i.weight, 0);
    let r = Math.random() * total;
    for (const item of items) {
      r -= item.weight;
      if (r <= 0) return item;
    }
    return items[items.length - 1];
  }

  // 数值夹取
  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  // 线性插值
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  // AABB碰撞检测
  function rectOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  // 圆与AABB碰撞
  function circleRect(cx, cy, cr, rx, ry, rw, rh) {
    const nx = clamp(cx, rx, rx + rw);
    const ny = clamp(cy, ry, ry + rh);
    return Math.hypot(cx - nx, cy - ny) < cr;
  }

  // 格式化时间为 mm:ss
  function formatTime(ms) {
    const s = Math.floor(ms / 1000);
    return `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;
  }

  // 生成唯一ID
  let _idCounter = 0;
  function uid(prefix = 'e') {
    return `${prefix}_${++_idCounter}_${Date.now()}`;
  }

  // 颜色透明度混合
  function alphaColor(hex, alpha) {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  // 圆角矩形
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  // 绘制血条
  function drawBar(ctx, x, y, w, h, value, max, color, label) {
    const ratio = clamp(value / max, 0, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    roundRect(ctx, x, y, w, h, 3); ctx.fill();
    ctx.fillStyle = color;
    roundRect(ctx, x, y, w * ratio, h, 3); ctx.fill();
    if (label) {
      ctx.fillStyle = '#fff';
      ctx.font = '10px sans-serif';
      ctx.fillText(label, x + 2, y + h - 2);
    }
  }

  // 浮动文字动画
  const floatingTexts = [];
  function addFloatingText(x, y, text, color = '#fff', size = 16) {
    floatingTexts.push({ x, y, text, color, size, life: 1.2, vy: -1 });
  }
  function updateFloatingTexts(dt) {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.y += ft.vy;
      ft.life -= dt / 1200;
      if (ft.life <= 0) floatingTexts.splice(i, 1);
    }
  }
  function drawFloatingTexts(ctx, camX, camY) {
    for (const ft of floatingTexts) {
      ctx.globalAlpha = Math.max(0, ft.life);
      ctx.fillStyle = ft.color;
      ctx.font = `bold ${ft.size}px "微软雅黑"`;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x - camX, ft.y - camY);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }

  // 聊天气泡系统（NPC头顶对话，4秒显示，带半透明背景）
  const chatBubbles = [];
  function addChatBubble(x, y, text, color = '#adf', size = 12) {
    // 同一位置去重（刷新计时器）
    const exist = chatBubbles.find(b => b.x === x && b.y === y && b.text === text);
    if (exist) { exist.life = 4.0; return; }
    chatBubbles.push({ x, y, text, color, size, life: 4.0, vy: -0.3 });
  }
  function updateChatBubbles(dt) {
    for (let i = chatBubbles.length - 1; i >= 0; i--) {
      const b = chatBubbles[i];
      b.y += b.vy;
      b.life -= dt / 1000;
      if (b.life <= 0) chatBubbles.splice(i, 1);
    }
  }
  function drawChatBubbles(ctx, camX, camY) {
    for (const b of chatBubbles) {
      const alpha = Math.min(1, b.life / 0.8); // 最后0.8秒渐隐
      const sx = b.x - camX, sy = b.y - camY;
      ctx.globalAlpha = alpha;
      ctx.font = `${b.size}px "微软雅黑"`;
      ctx.textAlign = 'center';
      const tw = ctx.measureText(b.text).width + 12;
      const th = b.size + 10;
      // 背景框
      ctx.fillStyle = 'rgba(10,10,30,0.75)';
      roundRect(ctx, sx - tw/2, sy - th, tw, th, 6);
      ctx.fill();
      ctx.strokeStyle = 'rgba(100,100,180,0.4)';
      ctx.lineWidth = 1;
      roundRect(ctx, sx - tw/2, sy - th, tw, th, 6);
      ctx.stroke();
      // 文字
      ctx.fillStyle = b.color;
      ctx.fillText(b.text, sx, sy - 3);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }
  function getChatBubbles() { return chatBubbles; }

  // 世界消息日志（半透明信息面板，支持分类：dialog/combat/sect/other）
  const worldLog = [];
  const WORLD_LOG_MAX = 50;
  function addWorldLog(speaker, text, category = 'other') {
    worldLog.push({ speaker, text, category, ts: Date.now() });
    if (worldLog.length > WORLD_LOG_MAX) worldLog.shift();
  }
  function getWorldLog() { return worldLog; }

  // 简单通知队列（最多8条）
  const notifications = [];
  function notify(msg, color = '#fff', duration = 3000) {
    if (notifications.length >= 8) return; // 限制最多8条
    notifications.push({ msg, color, timer: duration });
  }
  function updateNotifications(dt) {
    for (let i = notifications.length - 1; i >= 0; i--) {
      notifications[i].timer -= dt;
      if (notifications[i].timer <= 0) notifications.splice(i, 1);
    }
  }
  function getNotifications() { return notifications; }

  return {
    dist, normalize, randInt, randFloat, weightedRandom, clamp, lerp,
    rectOverlap, circleRect, formatTime, uid, alphaColor,
    roundRect, drawBar,
    addFloatingText, updateFloatingTexts, drawFloatingTexts,
    addChatBubble, updateChatBubbles, drawChatBubbles, getChatBubbles,
    addWorldLog, getWorldLog,
    notify, updateNotifications, getNotifications,
  };
})();
