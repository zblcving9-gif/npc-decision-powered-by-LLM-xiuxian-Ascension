// ============================================================
// ui.js - UI界面（二级节点）
// 引用三级节点：data/buildings.js, data/skills.js
// ============================================================

const UI = (() => {
  // 当前开启的面板
  let activePanel = null; // 'inventory'|'craft'|'build'|'cultivate'|'sect'|'dialog'|'settings'
  let hotbarSelected = 0;
  let hoveredSlot = null;
  let mouseX = 0, mouseY = 0;

  function init() {}

  // ── 主绘制入口 ─────────────────────────────────────────────
  function draw(ctx, gs) {
    const { player, cam } = gs;

    _drawHUD(ctx, player);
    Renderer.drawMinimap(ctx, player, Building.getPlaced(), Entities.getNPCs());
    _drawHotbar(ctx, player);
    _drawWeatherInfo(ctx);
    _drawCultivationBar(ctx, player);

    if (activePanel === 'inventory') _drawInventory(ctx, player);
    if (activePanel === 'craft')     _drawCraftPanel(ctx, player);
    if (activePanel === 'build')     _drawBuildPanel(ctx, player);
    if (activePanel === 'cultivate') _drawCultivatePanel(ctx, player);
    if (activePanel === 'sect')      _drawSectPanel(ctx, player);
    if (activePanel === 'settings')  _drawSettingsPanel(ctx);
    if (Social.isDialogActive())     _drawDialogPanel(ctx, player);
    if (Social.isWorldPanelOpen())  _drawWorldPanel(ctx);

    _drawKeyHints(ctx, player);
    _drawStatusEffects(ctx, player);
  }

  // ── HUD状态栏 ────────────────────────────────────────────
  function _drawHUD(ctx, player) {
    const x = 10, y = 10;
    // 背景
    ctx.fillStyle = C.COLOR.PANEL;
    Utils.roundRect(ctx, x, y, 200, 112, 6); ctx.fill();

    const realm = Cultivation.getRealm(player.realmIdx);
    ctx.fillStyle = C.COLOR.TEXT;
    ctx.font = C.FONT_TITLE;
    ctx.fillText(`${realm.name} Lv.${player.level}`, x+8, y+18);

    Utils.drawBar(ctx, x+8, y+24, 184, 8, player.hp, player.hpMax,    C.COLOR.HP,      `❤️${Math.floor(player.hp)}/${player.hpMax}`);
    Utils.drawBar(ctx, x+8, y+36, 184, 8, player.spirit, player.spiritMax, C.COLOR.SPIRIT,  `✨${Math.floor(player.spirit)}/${player.spiritMax}`);
    Utils.drawBar(ctx, x+8, y+48, 184, 8, player.hunger, player.hungerMax, C.COLOR.HUNGER,  `🍖${Math.floor(player.hunger)}`);
    // 体力条（跑步时高亮）
    const stamColor = player.sprinting ? '#ffeb3b' : '#78909c';
    Utils.drawBar(ctx, x+8, y+60, 184, 6, player.stamina, player.staminaMax, stamColor, `🏃${Math.floor(player.stamina)}`);
    Utils.drawBar(ctx, x+8, y+72, 184, 6, player.immunity, player.immunityMax, C.COLOR.IMMUNITY, `🛡️${Math.floor(player.immunity)}`);
    Utils.drawBar(ctx, x+8, y+84, 184, 6, player.xp, player.xpMax, C.COLOR.XP, `XP`);

    // 状态标记
    if (player.sick) {
      ctx.fillStyle = '#f44336';
      ctx.font = '11px 微软雅黑';
      ctx.fillText('⚠️生病中', x+8, y+104);
    }
    if (Cultivation.isCultivating()) {
      ctx.fillStyle = '#9c27b0';
      ctx.font = '11px 微软雅黑';
      ctx.fillText('🧘修炼中', x+90, y+104);
    }
    if (player.nearFire) {
      ctx.fillStyle = '#ff9800';
      ctx.font = '11px 微软雅黑';
      ctx.fillText('🔥火源', x+160, y+104);
    }
  }

  // ── 快捷栏 ────────────────────────────────────────────────
  function _drawHotbar(ctx, player) {
    const slots = C.HOTBAR_SLOTS;
    const sw = 48, sh = 48, gap = 4;
    const totalW = slots * (sw + gap) - gap;
    const sx = C.CANVAS_W/2 - totalW/2;
    const sy = C.CANVAS_H - sh - 10;

    for (let i = 0; i < slots; i++) {
      const x = sx + i * (sw + gap), y = sy;
      const sel = i === hotbarSelected;
      ctx.fillStyle = sel ? 'rgba(255,255,255,0.15)' : C.COLOR.PANEL;
      Utils.roundRect(ctx, x, y, sw, sh, 4); ctx.fill();
      ctx.strokeStyle = sel ? '#fff' : C.COLOR.BORDER;
      ctx.lineWidth = sel ? 2 : 1;
      Utils.roundRect(ctx, x, y, sw, sh, 4); ctx.stroke();

      const item = player.inventory[i];
      if (item) {
        const def = Object.values(ITEMS).find(it=>it.id===item.id);
        ctx.font = '22px serif';
        ctx.textAlign = 'center';
        ctx.fillText(def?.icon || '?', x + sw/2, y + sh/2 + 6);
        if (item.qty > 1) {
          ctx.fillStyle = '#fff';
          ctx.font = '10px sans-serif';
          ctx.fillText(item.qty, x + sw - 8, y + sh - 4);
        }
        ctx.textAlign = 'left';
      }
      // 数字键提示
      ctx.fillStyle = '#888';
      ctx.font = '9px sans-serif';
      ctx.fillText(i < 9 ? i+1 : '0', x+3, y+10);
    }
  }

  // ── 天气 & 灵力信息 ───────────────────────────────────────
  function _drawWeatherInfo(ctx) {
    const cfg = Weather.getCfg();
    ctx.fillStyle = C.COLOR.PANEL;
    Utils.roundRect(ctx, C.CANVAS_W - 160, 115, 150, 30, 4); ctx.fill();
    ctx.fillStyle = C.COLOR.TEXT;
    ctx.font = '13px 微软雅黑';
    ctx.textAlign = 'center';
    ctx.fillText(`${cfg.icon} ${cfg.label}  灵力×${cfg.spiritMul}`, C.CANVAS_W - 85, 134);
    ctx.textAlign = 'left';
  }

  // ── 修炼进度条（底部） ────────────────────────────────────
  function _drawCultivationBar(ctx, player) {
    if (!Cultivation.isCultivating()) return;
    const stageXpNeeded = 100 * Math.pow(1.5, (player.cultStage||1) - 1);
    const progress = ((player.cultXp||0) % stageXpNeeded) / stageXpNeeded;
    const x = 10, y = C.CANVAS_H - 70;
    ctx.fillStyle = C.COLOR.PANEL;
    Utils.roundRect(ctx, x, y, 160, 22, 4); ctx.fill();
    Utils.drawBar(ctx, x+4, y+4, 152, 14, progress, 1, '#9c27b0');
    ctx.fillStyle = '#ddd';
    ctx.font = '10px 微软雅黑';
    const skill = Cultivation.getAllSkills()[player.cultSkillId] || Cultivation.getAllSkills().BASIC_QI;
    ctx.fillText(`${skill.name} 第${player.cultStage||1}层`, x+6, y+36);
  }

  // ── 背包面板 ──────────────────────────────────────────────
  function _drawInventory(ctx, player) {
    const pw = 400, ph = 320;
    const px = C.CANVAS_W/2 - pw/2, py = C.CANVAS_H/2 - ph/2;
    _drawPanel(ctx, px, py, pw, ph, '背包');

    const cols = 8, slotSize = 44, gap = 4;
    player.inventory.forEach((item, i) => {
      if (i >= cols * 5) return;
      const col = i % cols, row = Math.floor(i / cols);
      const sx = px + 12 + col*(slotSize+gap);
      const sy = py + 36 + row*(slotSize+gap);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      Utils.roundRect(ctx, sx, sy, slotSize, slotSize, 3); ctx.fill();
      ctx.strokeStyle = C.COLOR.BORDER; ctx.lineWidth=1;
      Utils.roundRect(ctx, sx, sy, slotSize, slotSize, 3); ctx.stroke();

      const def = Object.values(ITEMS).find(it=>it.id===item.id);
      if (def) {
        ctx.font = '22px serif'; ctx.textAlign='center';
        ctx.fillText(def.icon, sx+slotSize/2, sy+slotSize/2+6);
        ctx.fillStyle='#fff'; ctx.font='9px sans-serif';
        ctx.fillText(item.qty, sx+slotSize-10, sy+slotSize-3);
        ctx.textAlign='left';
      }
    });

    ctx.fillStyle='#aaa'; ctx.font='11px 微软雅黑';
    ctx.fillText('点击物品使用 / E关闭', px+10, py+ph-10);
  }

  // ── 合成面板 ──────────────────────────────────────────────
  function _drawCraftPanel(ctx, player) {
    const pw = 420, ph = 380;
    const px = C.CANVAS_W/2 - pw/2, py = C.CANVAS_H/2 - ph/2;
    _drawPanel(ctx, px, py, pw, ph, '炼制合成');

    const recipes = Craft.getAllRecipes(player);
    recipes.forEach((r, i) => {
      if (i >= 8) return;
      const ry = py + 38 + i * 38;
      ctx.fillStyle = r.canCraft ? 'rgba(100,200,100,0.1)' : 'rgba(255,255,255,0.04)';
      Utils.roundRect(ctx, px+10, ry, pw-20, 34, 3); ctx.fill();

      ctx.fillStyle = r.canCraft ? '#8bc34a' : '#666';
      ctx.font = '13px 微软雅黑';
      ctx.fillText(`${r.name}`, px+20, ry+14);
      ctx.fillStyle = '#999'; ctx.font='10px sans-serif';
      ctx.fillText(r.inputs.map(it=>`${it.id}×${it.qty}`).join(' + ')
        + ` → ${r.output.id}×${r.output.qty}`, px+20, ry+27);

      if (r.canCraft) {
        ctx.fillStyle='#ffd700'; ctx.font='10px 微软雅黑';
        ctx.textAlign='right';
        ctx.fillText('[点击制作]', px+pw-14, ry+18);
        ctx.textAlign='left';
      }
    });
    if (Craft.isCrafting()) {
      ctx.fillStyle='#ff9800'; ctx.font='12px 微软雅黑';
      ctx.fillText(`制作中：${Craft.getActive()?.name}  ${(Craft.getProgress()*100).toFixed(0)}%`, px+12, py+ph-12);
    }
  }

  // ── 建造面板 ──────────────────────────────────────────────
  function _drawBuildPanel(ctx, player) {
    const pw = 440, ph = 360;
    const px = C.CANVAS_W/2 - pw/2, py = C.CANVAS_H/2 - ph/2;
    _drawPanel(ctx, px, py, pw, ph, '建造');

    const tpls = Object.values(BUILDING_TEMPLATES);
    tpls.forEach((tpl, i) => {
      if (i >= 8) return;
      const ry = py + 38 + i * 38;
      const cat = BUILDING_CATEGORIES[tpl.category];
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      Utils.roundRect(ctx, px+10, ry, pw-20, 34, 3); ctx.fill();

      ctx.fillStyle = cat?.color || '#ccc';
      ctx.font = '13px 微软雅黑';
      ctx.fillText(`${tpl.icon} ${tpl.name}`, px+16, ry+14);
      ctx.fillStyle='#888'; ctx.font='10px sans-serif';
      ctx.fillText(tpl.cost.map(c=>`${c.id}×${c.qty}`).join(', '), px+16, ry+27);

      ctx.fillStyle='#adf'; ctx.font='10px 微软雅黑';
      ctx.textAlign='right';
      ctx.fillText('[B+数字放置]', px+pw-14, ry+18);
      ctx.textAlign='left';
    });
    ctx.fillStyle='#aaa'; ctx.font='11px 微软雅黑';
    ctx.fillText('选择建筑后，在地图上点击放置', px+10, py+ph-10);
  }

  // ── 修炼面板 ──────────────────────────────────────────────
  function _drawCultivatePanel(ctx, player) {
    const pw = 360, ph = 320;
    const px = C.CANVAS_W/2 - pw/2, py = C.CANVAS_H/2 - ph/2;
    _drawPanel(ctx, px, py, pw, ph, '功法修炼');

    const realm = Cultivation.getRealm(player.realmIdx);
    ctx.fillStyle = '#ffd700'; ctx.font = 'bold 14px 微软雅黑';
    ctx.fillText(`当前境界：${realm.name}`, px+12, py+40);
    ctx.fillStyle='#adf'; ctx.font='12px 微软雅黑';
    ctx.fillText(`累计灵力：${(player.spiritTotal||0).toFixed(0)}`, px+12, py+58);

    const skills = Object.values(Cultivation.getAllSkills());
    skills.forEach((sk, i) => {
      const sy = py + 78 + i * 36;
      const active = player.cultSkillId === sk.id || player.cultSkillId === sk.id.toUpperCase();
      ctx.fillStyle = active ? 'rgba(150,100,255,0.2)' : 'rgba(255,255,255,0.04)';
      Utils.roundRect(ctx, px+8, sy, pw-16, 30, 3); ctx.fill();
      if (active) { ctx.strokeStyle='#9c27b0'; ctx.lineWidth=1; Utils.roundRect(ctx,px+8,sy,pw-16,30,3); ctx.stroke(); }

      ctx.fillStyle = active?'#ce93d8':'#bbb'; ctx.font='13px 微软雅黑';
      ctx.fillText(`${sk.icon} ${sk.name} ${active?`[第${player.cultStage||1}层]`:''}`, px+14, sy+16);
      if (sk.sect) {
        ctx.fillStyle='#888'; ctx.font='10px sans-serif';
        ctx.fillText(`门派：${C.SECTS[sk.sect]?.name||sk.sect}`, px+14, sy+27);
      }
    });
  }

  // ── 门派面板 ──────────────────────────────────────────────
  function _drawSectPanel(ctx, player) {
    const pw = 360, ph = 280;
    const px = C.CANVAS_W/2 - pw/2, py = C.CANVAS_H/2 - ph/2;
    _drawPanel(ctx, px, py, pw, ph, '门派');

    const sect = Cultivation.getSect();
    if (!sect.id) {
      ctx.fillStyle='#aaa'; ctx.font='13px 微软雅黑';
      ctx.fillText('尚未建立或加入门派', px+12, py+60);
      ctx.fillStyle='#ffd700'; ctx.font='12px 微软雅黑';
      Object.entries(C.SECTS).forEach(([id, cfg], i) => {
        ctx.fillText(`[${i+1}] 创建 ${cfg.icon}${cfg.name}`, px+20, py+90+i*24);
      });
      ctx.fillStyle='#aaa'; ctx.font='11px 微软雅黑';
      ctx.fillText('需筑基境。按1-4选择门派', px+12, py+ph-12);
    } else {
      const cfg = C.SECTS[sect.id];
      ctx.fillStyle = cfg?.color || '#ffd700'; ctx.font='bold 16px 微软雅黑';
      ctx.fillText(`${cfg?.icon||''} ${sect.name}  Lv.${sect.level}`, px+12, py+44);
      ctx.fillStyle='#bbb'; ctx.font='12px 微软雅黑';
      ctx.fillText(`声望：${sect.reputation}  弟子：${sect.members.length}人`, px+12, py+64);
      Utils.drawBar(ctx, px+12, py+72, pw-24, 10, sect.xp, sect.xpMax, cfg?.color||'#9c27b0');
      ctx.fillStyle='#aaa'; ctx.font='11px 微软雅黑';
      ctx.fillText(`门派经验 ${sect.xp.toFixed(0)}/${sect.xpMax}`, px+12, py+95);
      ctx.fillText('与友好NPC对话可招募弟子', px+12, py+115);
    }
  }

  // ── 对话面板 ──────────────────────────────────────────────
  function _drawDialogPanel(ctx, player) {
    const pw = 500, ph = 320;
    const px = C.CANVAS_W/2 - pw/2, py = C.CANVAS_H - ph - 60;
    ctx.fillStyle = 'rgba(10,10,20,0.92)';
    Utils.roundRect(ctx, px, py, pw, ph, 8); ctx.fill();
    ctx.strokeStyle = C.COLOR.BORDER; ctx.lineWidth=1.5;
    Utils.roundRect(ctx, px, py, pw, ph, 8); ctx.stroke();

    const npc = Social.getCurrentNPC();
    if (!npc) return;

    // NPC头像 & 名字
    ctx.font='28px serif'; ctx.textAlign='center';
    ctx.fillText(npc.icon||'👤', px+30, py+36);
    ctx.textAlign='left';
    ctx.fillStyle='#ffd700'; ctx.font='bold 14px 微软雅黑';
    ctx.fillText(npc.name, px+52, py+28);
    ctx.fillStyle='#888'; ctx.font='11px 微软雅黑';
    ctx.fillText(`好感度 ${Social.getRelation(npc.id)}`, px+52, py+44);

    // 对话记录
    const history = Social.getHistory();
    const maxShow = 6;
    const showFrom = Math.max(0, history.length - maxShow);
    history.slice(showFrom).forEach((msg, i) => {
      const isUser = msg.role === 'user';
      const ty = py + 62 + i * 34;
      ctx.fillStyle = isUser ? 'rgba(30,80,150,0.5)' : 'rgba(50,30,80,0.5)';
      Utils.roundRect(ctx, px+8, ty, pw-16, 28, 4); ctx.fill();
      ctx.fillStyle = isUser ? '#adf' : '#ce93d8';
      ctx.font='11px 微软雅黑';
      ctx.fillText((isUser ? '我：' : `${npc.name}：`) + msg.text.slice(0, 55) + (msg.text.length>55?'…':''), px+14, ty+18);
    });

    if (Social.isThinking()) {
      ctx.fillStyle='#9c27b0'; ctx.font='italic 12px 微软雅黑';
      ctx.fillText('…思考中…', px+12, py+ph-40);
    }

    // 输入框
    const inputY = py + ph - 30;
    ctx.fillStyle='rgba(255,255,255,0.08)';
    Utils.roundRect(ctx, px+8, inputY, pw-80, 22, 4); ctx.fill();
    ctx.strokeStyle='#4a4a7a'; ctx.lineWidth=1;
    Utils.roundRect(ctx, px+8, inputY, pw-80, 22, 4); ctx.stroke();
    ctx.fillStyle='#fff'; ctx.font='12px 微软雅黑';
    ctx.fillText(Social.getInput() + (Math.floor(Date.now()/500)%2?'|':''), px+12, inputY+15);

    ctx.fillStyle='#4caf50'; ctx.font='11px 微软雅黑';
    ctx.textAlign='right';
    ctx.fillText('[Enter发送] [Esc关闭]', px+pw-8, inputY+15);
    ctx.textAlign='left';
  }

  // ── 设置面板 ──────────────────────────────────────────────
  function _drawSettingsPanel(ctx) {
    const pw = 340, ph = 180;
    const px = C.CANVAS_W/2-pw/2, py = C.CANVAS_H/2-ph/2;
    _drawPanel(ctx, px, py, pw, ph, '设置');
    ctx.fillStyle='#bbb'; ctx.font='12px 微软雅黑';
    ctx.fillText('Qwen API Key（用于NPC智能对话）:', px+12, py+48);
    // 输入框
    ctx.fillStyle='rgba(255,255,255,0.08)';
    Utils.roundRect(ctx, px+12, py+56, pw-24, 26, 4); ctx.fill();
    ctx.strokeStyle='#4a4a7a'; ctx.lineWidth=1;
    Utils.roundRect(ctx, px+12, py+56, pw-24, 26, 4); ctx.stroke();
    const key = Social.getApiKey();
    ctx.fillStyle='#fff'; ctx.font='12px monospace';
    const masked = key ? key.slice(0,6) + '****' + key.slice(-4) : '（未设置）';
    ctx.fillText(masked, px+16, py+74);
    ctx.fillStyle='#888'; ctx.font='11px 微软雅黑';
    ctx.fillText('未设置API Key时使用内置离线对话', px+12, py+100);
    ctx.fillText('[Tab]切换面板  [Esc]关闭', px+12, py+ph-12);
  }

  // ── 状态效果 ─────────────────────────────────────────────
  function _drawStatusEffects(ctx, player) {
    let xi = 0;
    player.buffList.forEach(b => {
      const x = 220 + xi * 44, y = 10;
      ctx.fillStyle='rgba(0,0,0,0.6)';
      Utils.roundRect(ctx, x, y, 40, 38, 4); ctx.fill();
      ctx.fillStyle='#ffd700'; ctx.font='10px 微软雅黑'; ctx.textAlign='center';
      ctx.fillText(b.type, x+20, y+12);
      ctx.fillStyle='#8bc34a';
      ctx.fillText(`+${b.value}`, x+20, y+24);
      ctx.fillStyle='#aaa';
      ctx.fillText(`${b.timer.toFixed(0)}s`, x+20, y+35);
      ctx.textAlign='left';
      xi++;
    });
  }

  // ── 世界信息面板 ─────────────────────────────────────────
  function _drawWorldPanel(ctx) {
    const pw = 360, ph = 400;
    const px = C.CANVAS_W - pw - 8, py = 120;
    ctx.fillStyle = 'rgba(10,10,25,0.82)';
    Utils.roundRect(ctx, px, py, pw, ph, 8); ctx.fill();
    ctx.strokeStyle = '#4a4a7a'; ctx.lineWidth = 1;
    Utils.roundRect(ctx, px, py, pw, ph, 8); ctx.stroke();

    // 标题
    ctx.fillStyle = '#ffd700'; ctx.font = 'bold 14px 微软雅黑';
    ctx.fillText('📜 世界消息', px + 12, py + 22);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(px + 8, py + 28); ctx.lineTo(px + pw - 8, py + 28); ctx.stroke();

    // 消息列表（最新在下）
    const logs = Utils.getWorldLog();
    const maxShow = 14;
    const showFrom = Math.max(0, logs.length - maxShow);
    logs.slice(showFrom).forEach((msg, i) => {
      const ly = py + 38 + i * 25;
      ctx.fillStyle = '#7a7aaa'; ctx.font = '10px 微软雅黑';
      const timeStr = new Date(msg.ts).toLocaleTimeString('zh-CN', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
      ctx.fillText(`[${timeStr}]`, px + 10, ly + 12);
      ctx.fillStyle = '#ce93d8'; ctx.font = '11px 微软雅黑';
      ctx.fillText(msg.speaker, px + 80, ly + 12);
      ctx.fillStyle = '#ccc'; ctx.font = '11px 微软雅黑';
      const speakerW = ctx.measureText(msg.speaker).width;
      const maxTextW = Math.max(20, pw - 12 - 80 - speakerW - 10);
      let txt = msg.text || '';
      if (ctx.measureText(txt).width > maxTextW) {
        while (txt.length > 1 && ctx.measureText(txt + '…').width > maxTextW) txt = txt.slice(0, -1);
        txt += '…';
      }
      ctx.fillText('：' + txt, px + 80 + speakerW, ly + 12);
    });

    // 底部提示
    ctx.fillStyle = '#555'; ctx.font = '10px 微软雅黑';
    ctx.textAlign = 'right';
    ctx.fillText('L 键切换 · 半透明模式', px + pw - 8, py + ph - 8);
    ctx.textAlign = 'left';
  }

  // ── 操作提示 ─────────────────────────────────────────────
  function _drawKeyHints(ctx, player) {
    const hints = [
      'WASD/方向键移动', 'Shift跑步',
      'J/点击 攻击',
      'F 采集', 'G 修炼切换',
      'E 背包', 'C 合成',
      'B 建造', 'Z 使用物品',
      'T 对话', 'P 门派',
      'L 世界消息',
    ];
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    Utils.roundRect(ctx, C.CANVAS_W-160, C.CANVAS_H-152, 150, 142, 4); ctx.fill();
    ctx.fillStyle='#666'; ctx.font='9px 微软雅黑';
    hints.forEach((h, i) => ctx.fillText(h, C.CANVAS_W-155, C.CANVAS_H-126+i*12));
  }

  // ── 通用面板背景 ─────────────────────────────────────────
  function _drawPanel(ctx, x, y, w, h, title) {
    ctx.fillStyle = C.COLOR.PANEL;
    Utils.roundRect(ctx, x, y, w, h, 8); ctx.fill();
    ctx.strokeStyle = C.COLOR.BORDER; ctx.lineWidth=1.5;
    Utils.roundRect(ctx, x, y, w, h, 8); ctx.stroke();
    ctx.fillStyle='#ffd700'; ctx.font=C.FONT_TITLE;
    ctx.fillText(title, x+12, y+22);
    ctx.strokeStyle='rgba(255,255,255,0.1)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(x+8,y+28); ctx.lineTo(x+w-8,y+28); ctx.stroke();
  }

  // ── 事件处理 ─────────────────────────────────────────────
  function handleClick(wx, wy, player) {
    if (activePanel === 'inventory') {
      const cols=8, slotSize=44, gap=4;
      const pw=400, ph=320;
      const px=C.CANVAS_W/2-pw/2, py=C.CANVAS_H/2-ph/2;
      player.inventory.forEach((item, i) => {
        if (i >= cols*5) return;
        const col=i%cols, row=Math.floor(i/cols);
        const sx=px+12+col*(slotSize+gap), sy=py+36+row*(slotSize+gap);
        if (wx>=sx&&wx<=sx+slotSize&&wy>=sy&&wy<=sy+slotSize) {
          const r = Entities.useItem(item.id);
          if (r === 'add_fuel') {
            const nearBuildings = Building.getBuildingsNear(player, 80);
            const fire = nearBuildings.find(b=>b.isFireSource);
            if (fire) Building.addFuel(fire.id, item.id, player);
            else Utils.notify('附近没有篝火', '#f44336');
          }
        }
      });
    }
    if (activePanel === 'craft') {
      const pw=420, ph=380, px=C.CANVAS_W/2-pw/2, py=C.CANVAS_H/2-ph/2;
      const recipes = Craft.getAllRecipes(player);
      recipes.forEach((r, i) => {
        if (i>=8) return;
        const ry=py+38+i*38;
        if (wx>=px+10&&wx<=px+pw-10&&wy>=ry&&wy<=ry+34) {
          Craft.startCraft(r.id, player);
        }
      });
    }
    if (activePanel === 'build') {
      const tpls=Object.values(BUILDING_TEMPLATES);
      const pw=440, ph=360, px=C.CANVAS_W/2-pw/2, py=C.CANVAS_H/2-ph/2;
      tpls.forEach((tpl, i) => {
        if (i>=8) return;
        const ry=py+38+i*38;
        if (wx>=px+10&&wx<=px+pw-10&&wy>=ry&&wy<=ry+34) {
          Building.enterBuildMode(tpl.id);
          activePanel=null;
        }
      });
    }
    if (activePanel === 'cultivate') {
      const skills=Object.values(Cultivation.getAllSkills());
      const pw=360, ph=320, px=C.CANVAS_W/2-pw/2, py=C.CANVAS_H/2-ph/2;
      skills.forEach((sk, i) => {
        const sy=py+78+i*36;
        if (wx>=px+8&&wx<=px+pw-8&&wy>=sy&&wy<=sy+30) {
          Cultivation.switchSkill(player, sk.id);
        }
      });
    }
    if (activePanel === 'sect') {
      const pw=360, ph=280, px=C.CANVAS_W/2-pw/2, py=C.CANVAS_H/2-ph/2;
      const sect=Cultivation.getSect();
      if (!sect.id) {
        Object.keys(C.SECTS).forEach((id, i) => {
          const ty=py+90+i*24;
          if (wx>=px+20&&wx<=px+pw-20&&wy>=ty-14&&wy<=ty+6) {
            Cultivation.foundSect(player, id);
          }
        });
      }
    }
    if (Building.isBuildMode()) {
      Building.confirmBuild(player);
    }
  }

  function togglePanel(name) {
    activePanel = activePanel === name ? null : name;
  }

  function setHotbar(idx) { hotbarSelected = Utils.clamp(idx, 0, C.HOTBAR_SLOTS-1); }
  function getHotbar()    { return hotbarSelected; }
  function getActivePanel(){ return activePanel; }
  function setMouse(x, y) { mouseX=x; mouseY=y; }
  function closeAllPanels(){ activePanel=null; }

  return {
    init, draw, handleClick, togglePanel, setHotbar, getHotbar,
    getActivePanel, setMouse, closeAllPanels,
  };
})();
