// ============================================================
// weather.js - 天气系统（二级节点）
// 引用三级节点：无
// ============================================================

const Weather = (() => {
  let current = 'sunny';
  let nextChange = 0;
  let timer = 0;
  let transitionAlpha = 0; // 天气过渡透明度
  let particles = [];       // 雨/雪/雾粒子

  // 天气配置：各天气对数值的影响系数
  const WEATHER_CFG = {
    sunny: {
      label: '晴天', icon: '☀️',
      spiritMul:  1.0,
      cultivateMul: 1.0,
      moveMul: 1.0,
      fireDecayMul: 1.2,   // 晴天火焰消耗更快
      immunityDecay: 0,
      sickChance: 0,
      bgTint: null,
      visibility: 1.0,
    },
    cloudy: {
      label: '多云', icon: '☁️',
      spiritMul: 0.9,
      cultivateMul: 0.9,
      moveMul: 1.0,
      fireDecayMul: 1.0,
      immunityDecay: 0,
      sickChance: 0,
      bgTint: 'rgba(100,100,100,0.1)',
      visibility: 0.85,
    },
    rain: {
      label: '雨天', icon: '🌧️',
      spiritMul: 0.8,
      cultivateMul: 0.75,
      moveMul: 0.85,
      fireDecayMul: 1.5,   // 雨天火焰消耗极快
      immunityDecay: 0.002,
      sickChance: 0.03,
      bgTint: 'rgba(50,80,120,0.15)',
      visibility: 0.7,
    },
    storm: {
      label: '雷暴', icon: '⛈️',
      spiritMul: 1.3,      // 雷暴灵力波动增强
      cultivateMul: 0.5,   // 难以集中修炼
      moveMul: 0.7,
      fireDecayMul: 2.0,
      immunityDecay: 0.005,
      sickChance: 0.08,
      bgTint: 'rgba(30,30,80,0.25)',
      visibility: 0.5,
      lightningChance: 0.002,
    },
    fog: {
      label: '浓雾', icon: '🌫️',
      spiritMul: 0.85,
      cultivateMul: 1.1,   // 雾气有助于某些功法
      moveMul: 0.9,
      fireDecayMul: 0.9,
      immunityDecay: 0.001,
      sickChance: 0.02,
      bgTint: 'rgba(200,200,220,0.25)',
      visibility: 0.4,
    },
    snow: {
      label: '飘雪', icon: '❄️',
      spiritMul: 1.1,
      cultivateMul: 1.0,
      moveMul: 0.75,
      fireDecayMul: 1.3,
      immunityDecay: 0.003,
      sickChance: 0.05,
      bgTint: 'rgba(200,230,255,0.12)',
      visibility: 0.75,
    },
    spirit_tide: {
      label: '灵潮', icon: '✨',
      spiritMul: 2.5,
      cultivateMul: 3.0,   // 灵潮爆发，修炼神速
      moveMul: 0.95,
      fireDecayMul: 0.8,
      immunityDecay: 0,
      sickChance: 0,
      bgTint: 'rgba(100,50,200,0.15)',
      visibility: 1.1,
    },
  };

  // 天气转换概率矩阵
  const TRANSITIONS = {
    sunny:       { cloudy:0.35, rain:0.1, fog:0.1, sunny:0.45 },
    cloudy:      { sunny:0.3, rain:0.3, storm:0.1, fog:0.15, cloudy:0.15 },
    rain:        { cloudy:0.4, storm:0.2, sunny:0.2, rain:0.2 },
    storm:       { rain:0.5, cloudy:0.3, sunny:0.1, storm:0.1 },
    fog:         { sunny:0.4, cloudy:0.3, fog:0.2, rain:0.1 },
    snow:        { sunny:0.3, cloudy:0.3, fog:0.2, snow:0.2 },
    spirit_tide: { sunny:0.6, cloudy:0.3, spirit_tide:0.1 },
  };

  function _pickNext() {
    const trans = TRANSITIONS[current] || { sunny:1 };
    const keys = Object.keys(trans);
    let r = Math.random();
    for (const k of keys) {
      r -= trans[k];
      if (r <= 0) return k;
    }
    return 'sunny';
  }

  function init() {
    current = 'sunny';
    nextChange = Utils.randInt(C.WEATHER_CHANGE_MIN, C.WEATHER_CHANGE_MAX);
    _rebuildParticles();
  }

  function _rebuildParticles() {
    particles = [];
    if (current === 'rain' || current === 'storm') {
      for (let i = 0; i < 150; i++) {
        particles.push({
          x: Utils.randFloat(0, C.CANVAS_W),
          y: Utils.randFloat(0, C.CANVAS_H),
          vy: Utils.randFloat(8, 14),
          vx: current === 'storm' ? Utils.randFloat(-3, -1) : 0,
          len: Utils.randFloat(8, 16),
        });
      }
    } else if (current === 'snow') {
      for (let i = 0; i < 80; i++) {
        particles.push({
          x: Utils.randFloat(0, C.CANVAS_W),
          y: Utils.randFloat(0, C.CANVAS_H),
          vy: Utils.randFloat(1.5, 3),
          vx: Utils.randFloat(-0.5, 0.5),
          r: Utils.randFloat(2, 5),
        });
      }
    } else if (current === 'fog') {
      for (let i = 0; i < 30; i++) {
        particles.push({
          x: Utils.randFloat(0, C.CANVAS_W),
          y: Utils.randFloat(0, C.CANVAS_H),
          vx: Utils.randFloat(-0.3, 0.3),
          vy: Utils.randFloat(-0.1, 0.1),
          r: Utils.randFloat(40, 100),
          alpha: Utils.randFloat(0.03, 0.08),
        });
      }
    }
  }

  function update(dt) {
    timer += dt;
    if (timer >= nextChange) {
      timer = 0;
      current = _pickNext();
      nextChange = Utils.randInt(C.WEATHER_CHANGE_MIN, C.WEATHER_CHANGE_MAX);
      _rebuildParticles();
      Utils.notify(`天气变化：${WEATHER_CFG[current].label} ${WEATHER_CFG[current].icon}`, '#adf', 4000);
    }

    // 更新粒子
    for (const p of particles) {
      p.x += (p.vx || 0);
      p.y += (p.vy || 0);
      if (p.y > C.CANVAS_H + 20) p.y = -10;
      if (p.x > C.CANVAS_W + 10) p.x = -10;
      if (p.x < -10) p.x = C.CANVAS_W + 10;
    }
  }

  function draw(ctx) {
    const cfg = WEATHER_CFG[current];
    if (cfg.bgTint) {
      ctx.fillStyle = cfg.bgTint;
      ctx.fillRect(0, 0, C.CANVAS_W, C.CANVAS_H);
    }

    if (current === 'rain' || current === 'storm') {
      ctx.strokeStyle = current === 'storm' ? 'rgba(150,180,255,0.6)' : 'rgba(150,180,255,0.4)';
      ctx.lineWidth = 1;
      for (const p of particles) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + (p.vx||0)*2, p.y + p.len);
        ctx.stroke();
      }
      // 闪电
      if (current === 'storm' && Math.random() < cfg.lightningChance) {
        _drawLightning(ctx);
      }
    } else if (current === 'snow') {
      ctx.fillStyle = 'rgba(220,240,255,0.8)';
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (current === 'fog') {
      for (const p of particles) {
        ctx.beginPath();
        const grad = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r);
        grad.addColorStop(0, `rgba(200,210,230,${p.alpha})`);
        grad.addColorStop(1, 'rgba(200,210,230,0)');
        ctx.fillStyle = grad;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fill();
      }
    } else if (current === 'spirit_tide') {
      // 灵潮特效：漂浮光点
      const t = Date.now() / 1000;
      for (let i = 0; i < 20; i++) {
        const x = (Math.sin(t * 0.5 + i * 0.8) * 0.5 + 0.5) * C.CANVAS_W;
        const y = (Math.cos(t * 0.3 + i * 1.1) * 0.5 + 0.5) * C.CANVAS_H;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI*2);
        ctx.fillStyle = `rgba(180,100,255,${0.3 + 0.3*Math.sin(t+i)})`;
        ctx.fill();
      }
    }
  }

  function _drawLightning(ctx) {
    ctx.strokeStyle = 'rgba(255,255,150,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    let lx = Utils.randFloat(0, C.CANVAS_W);
    ctx.moveTo(lx, 0);
    for (let i = 0; i < 8; i++) {
      lx += Utils.randFloat(-30, 30);
      ctx.lineTo(lx, (i+1) * (C.CANVAS_H / 8));
    }
    ctx.stroke();
  }

  function getCurrent() { return current; }
  function getCfg() { return WEATHER_CFG[current]; }
  function getAllCfg() { return WEATHER_CFG; }

  return { init, update, draw, getCurrent, getCfg, getAllCfg };
})();
