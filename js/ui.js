// ============================================================
// ui.js - UI界面（二级节点）
// 引用三级节点：data/buildings.js, data/skills.js
// ============================================================
const UI = (() => {
  let activePanel=null,hotbarSelected=0,mouseX=0,mouseY=0,worldPanelTab='all';
  // ── 主绘制 ────────────────────────────────────────
  function draw(ctx, gs) {
    const {player,cam}=gs;
    _drawHUD(ctx,player);
    Renderer.drawMinimap(ctx,player,Building.getPlaced(),Entities.getNPCs());
    _drawHotbar(ctx,player);_drawWeatherInfo(ctx);_drawCultivationBar(ctx,player);
    if(activePanel==='inventory')_drawInventory(ctx,player);
    if(activePanel==='craft')_drawCraftPanel(ctx,player);
    if(activePanel==='build')_drawBuildPanel(ctx);
    if(activePanel==='cultivate')_drawCultivatePanel(ctx,player);
    if(activePanel==='sect')_drawSectPanel(ctx,player);
    if(activePanel==='settings')_drawSettingsPanel(ctx);
    if(Social.isDialogActive())_drawDialogPanel(ctx,player);
    if(Social.isWorldPanelOpen())_drawWorldPanel(ctx);
    _drawKeyHints(ctx);_drawStatusEffects(ctx,player);
  }
  // ── HUD ────────────────────────────────────────────
  function _drawHUD(ctx,p){
    const x=10,y=10;ctx.fillStyle=C.COLOR.PANEL;Utils.roundRect(ctx,x,y,200,112,6);ctx.fill();
    const r=Cultivation.getRealm(p.realmIdx);ctx.fillStyle=C.COLOR.TEXT;ctx.font=C.FONT_TITLE;ctx.fillText(`${r.name} Lv.${p.level}`,x+8,y+18);
    Utils.drawBar(ctx,x+8,y+24,184,8,p.hp,p.hpMax,C.COLOR.HP,`❤️${Math.floor(p.hp)}/${p.hpMax}`);
    Utils.drawBar(ctx,x+8,y+36,184,8,p.spirit,p.spiritMax,C.COLOR.SPIRIT,`✨${Math.floor(p.spirit)}/${p.spiritMax}`);
    Utils.drawBar(ctx,x+8,y+48,184,8,p.hunger,p.hungerMax,C.COLOR.HUNGER,`🍖${Math.floor(p.hunger)}`);
    Utils.drawBar(ctx,x+8,y+60,184,6,p.stamina,p.staminaMax,p.sprinting?'#ffeb3b':'#78909c',`🏃${Math.floor(p.stamina)}`);
    Utils.drawBar(ctx,x+8,y+72,184,6,p.immunity,p.immunityMax,C.COLOR.IMMUNITY,`🛡️${Math.floor(p.immunity)}`);
    Utils.drawBar(ctx,x+8,y+84,184,6,p.xp,p.xpMax,C.COLOR.XP,`XP`);
    ctx.font='11px 微软雅黑';
    if(p.sick){ctx.fillStyle='#f44336';ctx.fillText('⚠️生病中',x+8,y+104);}
    if(Cultivation.isCultivating()){ctx.fillStyle='#9c27b0';ctx.fillText('🧘修炼中',x+90,y+104);}
    if(p.nearFire){ctx.fillStyle='#ff9800';ctx.fillText('🔥火源',x+160,y+104);}
  }
  // ── 快捷栏
  function _drawHotbar(ctx,p){
    const s=C.HOTBAR_SLOTS,sw=48,sh=48,g=4,tw=s*(sw+g)-g,sx=C.CANVAS_W/2-tw/2,sy=C.CANVAS_H-sh-10;
    for(let i=0;i<s;i++){
      const x=sx+i*(sw+g),y=sy,sel=i===hotbarSelected;
      ctx.fillStyle=sel?'rgba(255,255,255,0.15)':C.COLOR.PANEL;
      Utils.roundRect(ctx,x,y,sw,sh,4);ctx.fill();
      ctx.strokeStyle=sel?'#fff':C.COLOR.BORDER;ctx.lineWidth=sel?2:1;
      Utils.roundRect(ctx,x,y,sw,sh,4);ctx.stroke();
      const it=p.inventory[i];
      if(it){
        const d=Object.values(ITEMS).find(v=>v.id===it.id);
        ctx.font='22px serif';ctx.textAlign='center';ctx.fillText(d?.icon||'?',x+sw/2,y+sh/2+6);
        if(it.qty>1){ctx.fillStyle='#fff';ctx.font='10px sans-serif';ctx.fillText(it.qty,x+sw-8,y+sh-4);}
        ctx.textAlign='left';
      }
      ctx.fillStyle='#888';ctx.font='9px sans-serif';ctx.fillText(i<9?i+1:'0',x+3,y+10);
    }
  }
  // ── 天气+修炼进度
  function _drawWeatherInfo(ctx){
    const c=Weather.getCfg();ctx.fillStyle=C.COLOR.PANEL;Utils.roundRect(ctx,C.CANVAS_W-160,115,150,30,4);ctx.fill();
    ctx.fillStyle=C.COLOR.TEXT;ctx.font='13px 微软雅黑';ctx.textAlign='center';
    ctx.fillText(`${c.icon} ${c.label}  灵力×${c.spiritMul}`,C.CANVAS_W-85,134);ctx.textAlign='left';
  }
  function _drawCultivationBar(ctx,p){if(!Cultivation.isCultivating())return;
    const n=100*Math.pow(1.5,(p.cultStage||1)-1),pg=((p.cultXp||0)%n)/n,x=10,y=C.CANVAS_H-70;
    ctx.fillStyle=C.COLOR.PANEL;Utils.roundRect(ctx,x,y,160,22,4);ctx.fill();
    Utils.drawBar(ctx,x+4,y+4,152,14,pg,1,'#9c27b0');
    ctx.fillStyle='#ddd';ctx.font='10px 微软雅黑';
    const sk=Cultivation.getAllSkills()[p.cultSkillId]||Cultivation.getAllSkills().BASIC_QI;
    ctx.fillText(`${sk.name} 第${p.cultStage||1}层`,x+6,y+36);
  }
  // ── 通用面板
  function _drawPanel(ctx,x,y,w,h,title){
    ctx.fillStyle=C.COLOR.PANEL;Utils.roundRect(ctx,x,y,w,h,8);ctx.fill();
    ctx.strokeStyle=C.COLOR.BORDER;ctx.lineWidth=1.5;Utils.roundRect(ctx,x,y,w,h,8);ctx.stroke();
    ctx.fillStyle='#ffd700';ctx.font=C.FONT_TITLE;ctx.fillText(title,x+12,y+22);
    ctx.strokeStyle='rgba(255,255,255,0.1)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(x+8,y+28);ctx.lineTo(x+w-8,y+28);ctx.stroke();
  }
  // ── 背包
  function _drawInventory(ctx,p){
    const pw=400,ph=320,px=C.CANVAS_W/2-pw/2,py=C.CANVAS_H/2-ph/2;
    _drawPanel(ctx,px,py,pw,ph,'背包');
    const c=8,ss=44,g=4;
    p.inventory.forEach((it,i)=>{
      if(i>=c*5)return;const col=i%c,row=Math.floor(i/c),sx=px+12+col*(ss+g),sy=py+36+row*(ss+g);
      ctx.fillStyle='rgba(255,255,255,0.06)';Utils.roundRect(ctx,sx,sy,ss,ss,3);ctx.fill();
      ctx.strokeStyle=C.COLOR.BORDER;ctx.lineWidth=1;Utils.roundRect(ctx,sx,sy,ss,ss,3);ctx.stroke();
      const d=Object.values(ITEMS).find(v=>v.id===it.id);
      if(d){ctx.font='22px serif';ctx.textAlign='center';ctx.fillText(d.icon,sx+ss/2,sy+ss/2+6);
        ctx.fillStyle='#fff';ctx.font='9px sans-serif';ctx.fillText(it.qty,sx+ss-10,sy+ss-3);ctx.textAlign='left';}
    });
    ctx.fillStyle='#aaa';ctx.font='11px 微软雅黑';ctx.fillText('点击物品使用 / E关闭',px+10,py+ph-10);
  }
  // ── 合成
  function _drawCraftPanel(ctx,p){
    const pw=420,ph=380,px=C.CANVAS_W/2-pw/2,py=C.CANVAS_H/2-ph/2;
    _drawPanel(ctx,px,py,pw,ph,'炼制合成');
    Craft.getAllRecipes(p).forEach((r,i)=>{
      if(i>=8)return;const ry=py+38+i*38;
      ctx.fillStyle=r.canCraft?'rgba(100,200,100,0.1)':'rgba(255,255,255,0.04)';
      Utils.roundRect(ctx,px+10,ry,pw-20,34,3);ctx.fill();
      ctx.fillStyle=r.canCraft?'#8bc34a':'#666';ctx.font='13px 微软雅黑';ctx.fillText(`${r.name}`,px+20,ry+14);
      ctx.fillStyle='#999';ctx.font='10px sans-serif';
      ctx.fillText(r.inputs.map(t=>`${t.id}×${t.qty}`).join(' + ')+` → ${r.output.id}×${r.output.qty}`,px+20,ry+27);
      if(r.canCraft){ctx.fillStyle='#ffd700';ctx.font='10px 微软雅黑';ctx.textAlign='right';ctx.fillText('[点击制作]',px+pw-14,ry+18);ctx.textAlign='left';}
    });
    if(Craft.isCrafting()){ctx.fillStyle='#ff9800';ctx.font='12px 微软雅黑';ctx.fillText(`制作中：${Craft.getActive()?.name}  ${(Craft.getProgress()*100).toFixed(0)}%`,px+12,py+ph-12);}
  }
  // ── 建造
  function _drawBuildPanel(ctx){
    const pw=440,ph=580,px=C.CANVAS_W/2-pw/2,py=C.CANVAS_H/2-ph/2;
    _drawPanel(ctx,px,py,pw,ph,'建造');
    Object.values(BUILDING_TEMPLATES).forEach((t,i)=>{
      if(i>=14)return;const ry=py+38+i*38;
      const cat=BUILDING_CATEGORIES[t.category];
      ctx.fillStyle='rgba(255,255,255,0.05)';Utils.roundRect(ctx,px+10,ry,pw-20,34,3);ctx.fill();
      ctx.fillStyle=cat?.color||'#ccc';ctx.font='13px 微软雅黑';ctx.fillText(`${t.icon} ${t.name}`,px+16,ry+14);
      ctx.fillStyle='#888';ctx.font='10px sans-serif';ctx.fillText(t.cost.map(c=>`${c.id}×${c.qty}`).join(', '),px+16,ry+27);
      ctx.fillStyle='#adf';ctx.font='10px 微软雅黑';ctx.textAlign='right';ctx.fillText('[B+数字放置]',px+pw-14,ry+18);ctx.textAlign='left';
    });
    ctx.fillStyle='#aaa';ctx.font='11px 微软雅黑';ctx.fillText('选择建筑后，在地图上点击放置',px+10,py+ph-10);
  }
  // ── 修炼
  function _drawCultivatePanel(ctx,p){
    const pw=360,ph=320,px=C.CANVAS_W/2-pw/2,py=C.CANVAS_H/2-ph/2;
    _drawPanel(ctx,px,py,pw,ph,'功法修炼');
    const realm=Cultivation.getRealm(p.realmIdx);
    ctx.fillStyle='#ffd700';ctx.font='bold 14px 微软雅黑';ctx.fillText(`当前境界：${realm.name}`,px+12,py+40);
    ctx.fillStyle='#adf';ctx.font='12px 微软雅黑';ctx.fillText(`累计灵力：${(p.spiritTotal||0).toFixed(0)}`,px+12,py+58);
    Object.values(Cultivation.getAllSkills()).forEach((sk,i)=>{
      const sy=py+78+i*36,active=p.cultSkillId===sk.id||p.cultSkillId===sk.id.toUpperCase();
      ctx.fillStyle=active?'rgba(150,100,255,0.2)':'rgba(255,255,255,0.04)';
      Utils.roundRect(ctx,px+8,sy,pw-16,30,3);ctx.fill();
      if(active){ctx.strokeStyle='#9c27b0';ctx.lineWidth=1;Utils.roundRect(ctx,px+8,sy,pw-16,30,3);ctx.stroke();}
      ctx.fillStyle=active?'#ce93d8':'#bbb';ctx.font='13px 微软雅黑';
      ctx.fillText(`${sk.icon} ${sk.name} ${active?`[第${p.cultStage||1}层]`:''}`,px+14,sy+16);
      if(sk.sect){ctx.fillStyle='#888';ctx.font='10px sans-serif';ctx.fillText(`门派：${C.SECTS[sk.sect]?.name||sk.sect}`,px+14,sy+27);}
    });
  }
  // ── 门派
  function _drawSectPanel(ctx,p){
    const pw=360,ph=280,px=C.CANVAS_W/2-pw/2,py=C.CANVAS_H/2-ph/2;
    _drawPanel(ctx,px,py,pw,ph,'门派');
    const sect=Cultivation.getSect();
    if(!sect.id){
      ctx.fillStyle='#aaa';ctx.font='13px 微软雅黑';ctx.fillText('尚未建立或加入门派',px+12,py+60);
      ctx.fillStyle='#ffd700';ctx.font='12px 微软雅黑';
      Object.entries(C.SECTS).forEach(([id,cfg],i)=>ctx.fillText(`[${i+1}] 创建 ${cfg.icon}${cfg.name}`,px+20,py+90+i*24));
      ctx.fillStyle='#aaa';ctx.font='11px 微软雅黑';ctx.fillText('需筑基境。按1-4选择门派',px+12,py+ph-12);
    } else {
      const cfg=C.SECTS[sect.id];
      ctx.fillStyle=cfg?.color||'#ffd700';ctx.font='bold 16px 微软雅黑';
      ctx.fillText(`${cfg?.icon||''} ${sect.name}  Lv.${sect.level}`,px+12,py+44);
      ctx.fillStyle='#bbb';ctx.font='12px 微软雅黑';
      ctx.fillText(`声望：${sect.reputation}  弟子：${sect.members.length}人`,px+12,py+64);
      Utils.drawBar(ctx,px+12,py+72,pw-24,10,sect.xp,sect.xpMax,cfg?.color||'#9c27b0');
      ctx.fillStyle='#aaa';ctx.font='11px 微软雅黑';
      ctx.fillText(`门派经验 ${sect.xp.toFixed(0)}/${sect.xpMax}  与友好NPC对话可招募弟子`,px+12,py+95);
    }
  }
  // ── 对话
  function _drawDialogPanel(ctx,p){
    const pw=500,ph=320,px=C.CANVAS_W/2-pw/2,py=C.CANVAS_H-ph-60;
    ctx.fillStyle='rgba(10,10,20,0.92)';Utils.roundRect(ctx,px,py,pw,ph,8);ctx.fill();
    ctx.strokeStyle=C.COLOR.BORDER;ctx.lineWidth=1.5;Utils.roundRect(ctx,px,py,pw,ph,8);ctx.stroke();
    const npc=Social.getCurrentNPC();if(!npc)return;
    ctx.font='28px serif';ctx.textAlign='center';ctx.fillText(npc.icon||'👤',px+30,py+36);ctx.textAlign='left';
    ctx.fillStyle='#ffd700';ctx.font='bold 14px 微软雅黑';ctx.fillText(npc.name,px+52,py+28);
    ctx.fillStyle='#888';ctx.font='11px 微软雅黑';ctx.fillText(`好感度 ${Social.getRelation(npc)}`,px+52,py+44);
    const hist=Social.getHistory(),maxS=6,from=Math.max(0,hist.length-maxS);
    hist.slice(from).forEach((m,i)=>{
      const u=m.role==='user',ty=py+62+i*34;
      ctx.fillStyle=u?'rgba(30,80,150,0.5)':'rgba(50,30,80,0.5)';
      Utils.roundRect(ctx,px+8,ty,pw-16,28,4);ctx.fill();
      ctx.fillStyle=u?'#adf':'#ce93d8';ctx.font='11px 微软雅黑';
      ctx.fillText((u?'我：':`${npc.name}：`)+m.text.slice(0,55)+(m.text.length>55?'…':''),px+14,ty+18);
    });
    if(Social.isThinking()){ctx.fillStyle='#9c27b0';ctx.font='italic 12px 微软雅黑';ctx.fillText('…思考中…',px+12,py+ph-40);}
    const iy=py+ph-30;
    ctx.fillStyle='rgba(255,255,255,0.08)';Utils.roundRect(ctx,px+8,iy,pw-80,22,4);ctx.fill();
    ctx.strokeStyle='#4a4a7a';ctx.lineWidth=1;Utils.roundRect(ctx,px+8,iy,pw-80,22,4);ctx.stroke();
    ctx.fillStyle='#fff';ctx.font='12px 微软雅黑';
    ctx.fillText(Social.getInput()+(Math.floor(Date.now()/500)%2?'|':''),px+12,iy+15);
    ctx.fillStyle='#4caf50';ctx.font='11px 微软雅黑';ctx.textAlign='right';
    ctx.fillText('[Enter发送] [Esc关闭]',px+pw-8,iy+15);ctx.textAlign='left';
  }
  // ── 设置
  function _drawSettingsPanel(ctx){
    const pw=340,ph=140,px=C.CANVAS_W/2-pw/2,py=C.CANVAS_H/2-ph/2;
    _drawPanel(ctx,px,py,pw,ph,'设置');
    ctx.fillStyle='#bbb';ctx.font='12px 微软雅黑';ctx.fillText('Qwen API Key（用于NPC智能对话）:',px+12,py+48);
    ctx.fillStyle='rgba(255,255,255,0.08)';Utils.roundRect(ctx,px+12,py+56,pw-24,26,4);ctx.fill();
    ctx.strokeStyle='#4a4a7a';ctx.lineWidth=1;Utils.roundRect(ctx,px+12,py+56,pw-24,26,4);ctx.stroke();
    const key=Social.getApiKey();ctx.fillStyle='#fff';ctx.font='12px monospace';
    ctx.fillText(key?key.slice(0,6)+'****'+key.slice(-4):'（未设置）',px+16,py+74);
    ctx.fillStyle='#888';ctx.font='11px 微软雅黑';ctx.fillText('[Tab]切换面板  [Esc]关闭',px+12,py+ph-12);
  }
  // ── 状态效果
  function _drawStatusEffects(ctx,p){
    p.buffList.forEach((b,i)=>{
      const x=220+i*44,y=10;
      ctx.fillStyle='rgba(0,0,0,0.6)';Utils.roundRect(ctx,x,y,40,38,4);ctx.fill();
      ctx.fillStyle='#ffd700';ctx.font='10px 微软雅黑';ctx.textAlign='center';
      ctx.fillText(b.type,x+20,y+12);ctx.fillStyle='#8bc34a';ctx.fillText(`+${b.value}`,x+20,y+24);
      ctx.fillStyle='#aaa';ctx.fillText(`${b.timer.toFixed(0)}s`,x+20,y+35);ctx.textAlign='left';
    });
  }
  // ── 世界面板（分类标签页）
  const WTABS=[
    {id:'all',label:'全部',color:'#ffd700'},{id:'dialog',label:'💬对话',color:'#ce93d8'},
    {id:'combat',label:'⚔️打斗',color:'#f44336'},{id:'sect',label:'🏮门派',color:'#9c27b0'},
    {id:'other',label:'📋其它',color:'#78909c'},
  ];
  function _drawWorldPanel(ctx) {
    const pw=360,ph=440,px=C.CANVAS_W-pw-8,py=120;
    ctx.fillStyle='rgba(10,10,25,0.85)';Utils.roundRect(ctx,px,py,pw,ph,8);ctx.fill();
    ctx.strokeStyle='#4a4a7a';ctx.lineWidth=1;Utils.roundRect(ctx,px,py,pw,ph,8);ctx.stroke();
    ctx.fillStyle='#ffd700';ctx.font='bold 14px 微软雅黑';ctx.fillText('📜 世界消息',px+12,py+22);
    // 记录总数
    const logs=Utils.getWorldLog(),filt=worldPanelTab==='all'?logs:logs.filter(m=>m.category===worldPanelTab);
    const totalCount=filt.length;
    // 标签页
    let tabX=px+12;
    WTABS.forEach(tab=>{
      const act=worldPanelTab===tab.id,tw=ctx.measureText(tab.label).width+14;
      ctx.fillStyle=act?'rgba(255,255,255,0.12)':'rgba(255,255,255,0.03)';
      Utils.roundRect(ctx,tabX,py+28,tw,18,3);ctx.fill();
      if(act){ctx.strokeStyle=tab.color;ctx.lineWidth=1;Utils.roundRect(ctx,tabX,py+28,tw,18,3);ctx.stroke();}
      ctx.fillStyle=act?tab.color:'#666';ctx.font='10px 微软雅黑';ctx.fillText(tab.label,tabX+7,py+41);
      tabX+=tw+4;
    });
    ctx.strokeStyle='rgba(255,255,255,0.08)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(px+8,py+50);ctx.lineTo(px+pw-8,py+50);ctx.stroke();
    // 消息列表（根据滚轮偏移显示）
    const maxVisible=14,offset=Utils.getWorldLogOffset();
    const endIdx=Math.max(0,totalCount-offset),startIdx=Math.max(0,endIdx-maxVisible);
    const visible=filt.slice(startIdx,endIdx);
    visible.forEach((msg,i)=>{
      const ly=py+58+i*26,cc=WTABS.find(t=>t.id===msg.category)?.color||'#78909c';
      ctx.fillStyle=cc;ctx.globalAlpha=0.5;Utils.roundRect(ctx,px+8,ly+1,3,16,1);ctx.fill();ctx.globalAlpha=1;
      ctx.fillStyle='#7a7aaa';ctx.font='10px 微软雅黑';
      ctx.fillText(`[${new Date(msg.ts).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}]`,px+14,ly+13);
      ctx.fillStyle=cc;ctx.font='11px 微软雅黑';ctx.fillText(msg.speaker,px+84,ly+13);
      ctx.fillStyle='#ccc';const sw=ctx.measureText(msg.speaker).width,mw=Math.max(20,pw-106-sw);
      let txt=msg.text||'';
      if(ctx.measureText(txt).width>mw){while(txt.length>1&&ctx.measureText(txt+'…').width>mw)txt=txt.slice(0,-1);txt+='…';}
      ctx.fillText('：'+txt,px+84+sw,ly+13);
    });
    // 滚动提示+底部提示
    const hint=offset>0?`↑还有${offset}条历史（滚轮↑↓翻阅，到底自动回最新）`:'L 关闭 · 点击标签切换';
    ctx.fillStyle=offset>0?'#888':'#555';ctx.font='10px 微软雅黑';ctx.textAlign='center';
    ctx.fillText(hint,px+pw/2,py+ph-8);ctx.textAlign='left';
    // 鼠标悬停展开完整消息
    const rowH=26,msgAreaTop=py+58,msgAreaBot=py+58+maxVisible*rowH;
    if(mouseX>=px&&mouseX<=px+pw&&mouseY>=msgAreaTop&&mouseY<=Math.min(msgAreaBot,py+ph-18)){
      const hoverIdx=Math.floor((mouseY-msgAreaTop)/rowH);
      if(hoverIdx>=0&&hoverIdx<visible.length){
        const hmsg=visible[hoverIdx],hcc=WTABS.find(t=>t.id===hmsg.category)?.color||'#78909c';
        const fullTxt=`[${hmsg.speaker}] ${hmsg.text||''}`;
        ctx.font='11px 微软雅黑';
        const tw=ctx.measureText(fullTxt).width+20,th=28;
        let tx=mouseX+12,ty=mouseY-th/2;
        if(tx+tw>C.CANVAS_W-4)tx=mouseX-tw-8;
        if(ty<4)ty=4;if(ty+th>C.CANVAS_H-4)ty=C.CANVAS_H-th-4;
        ctx.fillStyle='rgba(10,10,30,0.92)';Utils.roundRect(ctx,tx,ty,tw,th,4);ctx.fill();
        ctx.strokeStyle=hcc;ctx.lineWidth=1;Utils.roundRect(ctx,tx,ty,tw,th,4);ctx.stroke();
        ctx.fillStyle='#fff';ctx.font='11px 微软雅黑';ctx.fillText(fullTxt,tx+8,ty+18);
      }
    }
  }
  function _mt(t,f){const c=document.createElement('canvas').getContext('2d');c.font=f||'11px 微软雅黑';return c.measureText(t).width;}
  function _handleWorldTabClick(wx,wy){if(!Social.isWorldPanelOpen())return false;
    const px=C.CANVAS_W-368,py=120;if(wy>=py+28&&wy<=py+46){let tx=px+12;
    for(const tab of WTABS){const tw=_mt(tab.label,'10px 微软雅黑')+14;if(wx>=tx&&wx<=tx+tw){worldPanelTab=tab.id;Utils.resetWorldLogOffset();return true;}tx+=tw+4;}}return false;}
  // ── 操作提示
  function _drawKeyHints(ctx){
    const h='WASD移动|Shift跑步|J攻击|F采集|G修炼|E背包|C合成|B建造|Z使用|T对话|P门派|L世界|N交互'.split('|');
    ctx.fillStyle='rgba(0,0,0,0.5)';Utils.roundRect(ctx,C.CANVAS_W-130,C.CANVAS_H-152,120,142,4);ctx.fill();
    ctx.fillStyle='#666';ctx.font='9px 微软雅黑';h.forEach((t,i)=>ctx.fillText(t,C.CANVAS_W-125,C.CANVAS_H-126+i*12));
  }
  // ── 事件处理
  function handleClick(wx,wy,p){if(_handleWorldTabClick(wx,wy))return;
    if(activePanel==='inventory'){const c=8,ss=44,g=4,pw=400,ph=320,px=C.CANVAS_W/2-pw/2,py=C.CANVAS_H/2-ph/2;
      p.inventory.forEach((it,i)=>{if(i>=c*5)return;const col=i%c,row=Math.floor(i/c),sx=px+12+col*(ss+g),sy=py+36+row*(ss+g);
        if(wx>=sx&&wx<=sx+ss&&wy>=sy&&wy<=sy+ss){const r=Entities.useItem(it.id);if(r==='add_fuel'){const nb=Building.getBuildingsNear(p,80),f=nb.find(b=>b.isFireSource);if(f)Building.addFuel(f.id,it.id,p);else Utils.notify('附近没有篝火','#f44336');}}});
    }
    if(activePanel==='craft'){
      const pw=420,ph=380,px=C.CANVAS_W/2-pw/2,py=C.CANVAS_H/2-ph/2;
      Craft.getAllRecipes(p).forEach((r,i)=>{if(i>=8)return;const ry=py+38+i*38;if(wx>=px+10&&wx<=px+pw-10&&wy>=ry&&wy<=ry+34)Craft.startCraft(r.id,p);});
    }
    if(activePanel==='build'){
      const ts=Object.values(BUILDING_TEMPLATES),pw=440,ph=580,px=C.CANVAS_W/2-pw/2,py=C.CANVAS_H/2-ph/2;
      ts.forEach((t,i)=>{if(i>=14)return;const ry=py+38+i*38;if(wx>=px+10&&wx<=px+pw-10&&wy>=ry&&wy<=ry+34){Building.enterBuildMode(t.id);activePanel=null;}});
    }
    if(activePanel==='cultivate'){
      const sk=Object.values(Cultivation.getAllSkills()),pw=360,ph=320,px=C.CANVAS_W/2-pw/2,py=C.CANVAS_H/2-ph/2;
      sk.forEach((s,i)=>{const sy=py+78+i*36;if(wx>=px+8&&wx<=px+pw-8&&wy>=sy&&wy<=sy+30)Cultivation.switchSkill(p,s.id);});
    }
    if(activePanel==='sect'){
      const pw=360,ph=280,px=C.CANVAS_W/2-pw/2,py=C.CANVAS_H/2-ph/2,sect=Cultivation.getSect();
      if(!sect.id)Object.keys(C.SECTS).forEach((id,i)=>{const ty=py+90+i*24;if(wx>=px+20&&wx<=px+pw-20&&wy>=ty-14&&wy<=ty+6)Cultivation.foundSect(p,id);});
    }
    if(Building.isBuildMode())Building.confirmBuild(p);
  }
  function togglePanel(n){activePanel=activePanel===n?null:n;}
  function setHotbar(i){hotbarSelected=Utils.clamp(i,0,C.HOTBAR_SLOTS-1);}
  function getHotbar(){return hotbarSelected;}
  function getActivePanel(){return activePanel;}
  function setMouse(x,y){mouseX=x;mouseY=y;}
  function closeAllPanels(){activePanel=null;}
  return {init(){},draw,handleClick,togglePanel,setHotbar,getHotbar,getActivePanel,setMouse,closeAllPanels};
})();
