// ============================================================
// social.js - NPC社交/对话系统（二级节点）
// 引用三级节点：data/npcs.js
// ============================================================

const Social = (() => {
  // 当前对话状态
  let dialogActive  = false;
  let currentNPC    = null;
  let dialogHistory = []; // { role:'user'|'npc', text, ts }
  let inputText     = '';
  let apiKey        = ''; // 用户在UI中填写
  let thinking      = false;

  // NPC好感度存储 { npcId -> number }
  const relations = {};

  // 世界消息面板开关
  let worldPanelOpen = false;

  // 记录世界日志（委托给Utils）
  function _addWorldLog(speaker, text) {
    Utils.addWorldLog(speaker, text.slice(0, 80));
  }

  function init() {}

  // 获取与玩家最近的可对话NPC
  function getNearbyNPC(player, npcs) {
    const radius = 70;
    let best = null, bestD = Infinity;
    for (const npc of npcs) {
      if (!npc.alive || npc.hostile) continue;
      const d = Utils.dist(player, npc);
      if (d < radius && d < bestD) { best = npc; bestD = d; }
    }
    return best;
  }

  // 开始对话
  function startDialog(npc, player) {
    if (!npc) return;
    currentNPC    = npc;
    dialogActive  = true;
    dialogHistory = [];
    inputText     = '';

    // NPC初始问候
    const greeting = _pickGreeting(npc, player);
    dialogHistory.push({ role:'npc', text: greeting, ts: Date.now() });
  }

  function closeDialog() {
    dialogActive  = false;
    currentNPC    = null;
    inputText     = '';
  }

  function _pickGreeting(npc, player) {
    const lines = npc.dialogue?.greeting || ['...'];
    // 根据玩家状态选择台词
    if (player.hp < player.hpMax * 0.3 && npc.dialogue?.low_hp)
      return _pick(npc.dialogue.low_hp);
    if (player.spirit > player.spiritMax * 0.8 && npc.dialogue?.high_spirit)
      return _pick(npc.dialogue.high_spirit);
    return _pick(lines);
  }

  function _pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // 发送消息（调用Qwen API）
  async function sendMessage(text, player) {
    if (!text.trim() || thinking) return;
    thinking = true;

    dialogHistory.push({ role:'user', text, ts: Date.now() });
    inputText = '';

    // 构建系统Prompt（融入修仙世界观和NPC状态）
    const realm = Cultivation.getRealm(player.realmIdx);
    const spirit = World.getSpiritAt(player.x, player.y);
    const weather = Weather.getCurrent();
    const relation = relations[currentNPC.id] || 50;
    const npcTpl = NPC_TEMPLATES[currentNPC.tplId] || {};

    const systemPrompt = `你是修仙小镇中的一个NPC角色。
角色名：${currentNPC.name}
角色职业：${npcTpl.role || '居民'}
角色性格：${_getPersonality(currentNPC)}
当前与玩家的好感度：${relation}/100
当前环境：${weather}天气，当地灵力浓度${(spirit*100).toFixed(0)}%
玩家信息：境界「${realm.name}」，HP ${Math.floor(player.hp)}/${player.hpMax}，灵力 ${Math.floor(player.spirit)}/${player.spiritMax}${player.sick ? '，正在生病' : ''}${player.sectId ? `，门派「${C.SECTS[player.sectId]?.name}」` : ''}

请用符合修仙世界观的语气回应，言简意赅（不超过80字），根据好感度调整亲疏。
好感度<30时态度冷淡，30-70正常，>70亲切热情。`;

    // 构建对话历史
    const messages = [
      { role: 'system', content: systemPrompt },
      ...dialogHistory.slice(-8).map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text,
      })),
    ];

    try {
      let replyText = '';
      if (apiKey) {
        // 使用阿里云 DashScope OpenAI 兼容接口
        const resp = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: C.QWEN_MODEL,
            messages,
            max_tokens: 150,
            temperature: 0.85,
          }),
        });
        if (!resp.ok) {
          const errText = await resp.text();
          console.warn('Qwen API error:', resp.status, errText);
          replyText = _offlineFallback(currentNPC, text, player, relation);
        } else {
          const data = await resp.json();
          replyText = data?.choices?.[0]?.message?.content
            || data?.output?.text
            || _offlineFallback(currentNPC, text, player, relation);
        }
      } else {
        // 离线回退：从预设台词随机选择
        replyText = _offlineFallback(currentNPC, text, player, relation);
      }

      dialogHistory.push({ role:'npc', text: replyText, ts: Date.now() });
      _addWorldLog(currentNPC.name, replyText);

      // 对话改善好感度
      relations[currentNPC.id] = Utils.clamp((relations[currentNPC.id] || 50) + 1, 0, 100);

    } catch (e) {
      console.warn('Qwen API exception:', e);
      // 网络异常时降级到离线回退
      const fallback = _offlineFallback(currentNPC, text, player, relation);
      dialogHistory.push({ role:'npc', text: fallback, ts: Date.now() });
      _addWorldLog(currentNPC.name, fallback);
    }

    thinking = false;
  }

  function _getPersonality(npc) {
    const roles = { teacher:'博学沉稳', trader:'精明实在', ally:'热情豪爽', enemy:'凶悍傲慢' };
    return roles[npc.role] || '普通';
  }

  function _offlineFallback(npc, text, player, relation) {
    const t = text.toLowerCase();
    if (t.includes('功法') || t.includes('修炼'))
      return relation > 60 ? '修炼之道在于持之以恒，切莫急于求成。' : '此乃门中秘事，不便相告。';
    if (t.includes('灵石') || t.includes('买') || t.includes('交易'))
      return npc.shop?.length ? '且看我这里有何好货，莫嫌价高。' : '小老儿不做买卖。';
    if (t.includes('天气') || t.includes('今天'))
      return `今日${Weather.getCfg().label}，${Weather.getCfg().icon}修炼需因时而异。`;
    if (t.includes('你好') || t.includes('打招呼'))
      return _pick(npc.dialogue?.greeting || ['有何贵干？']);
    return relation > 70
      ? '哈哈，你说的有意思，改日再聊！'
      : '嗯…随你去吧。';
  }

  // 添加聊天输入字符
  function appendInput(char) { inputText += char; }
  function backspaceInput()   { inputText = inputText.slice(0, -1); }
  function clearInput()       { inputText = ''; }
  function getInput()         { return inputText; }
  function setInput(v)        { inputText = v; }

  // NPC之间互动（每隔一段时间触发）
  function updateNPCSocial(npcs, dt) {
    for (const npc of npcs) {
      if (!npc.alive || npc.hostile) continue;
      npc.chatCooldown = (npc.chatCooldown || 0) - dt;
      for (const other of npcs) {
        if (other === npc || !other.alive || other.hostile) continue;
        const d = Utils.dist(npc, other);
        if (d < C.NPC_SOCIAL_RADIUS && npc.chatCooldown <= 0) {
          npc.chatCooldown = C.NPC_CHAT_COOLDOWN;
          // 同阵营NPC好感度上升
          if (npc.faction === other.faction) {
            npc.relation[other.id] = Utils.clamp((npc.relation[other.id] || 50) + 2, 0, 100);
          }
          // 有概率触发NPC间AI对话（不阻塞UI）
          if (apiKey && Math.random() < 0.2) {
            _npcToNpcChat(npc, other);
          }
        }
      }
    }
  }

  // NPC间AI对话（异步，结果作为浮动文字显示）
  async function _npcToNpcChat(npcA, npcB) {
    const prompt = `你是修仙小镇NPC「${npcA.name}」，正在和「${npcB.name}」聊天，用一句话（不超过30字）说一件修仙世界的日常趣事或感叹。`;
    try {
      const resp = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${apiKey}` },
        body: JSON.stringify({
          model: C.QWEN_MODEL,
          messages: [{ role:'user', content: prompt }],
          max_tokens: 60, temperature: 0.9,
        }),
      });
      if (!resp.ok) return;
      const data = await resp.json();
      const text = data?.choices?.[0]?.message?.content;
      if (text) {
        Utils.addChatBubble(npcA.x, npcA.y - 40, text.slice(0, 40), '#adf', 11);
        _addWorldLog(npcA.name, text.slice(0, 60));
      }
    } catch (_) {}
  }

  // 与NPC交易
  function tradeWithNPC(npc, player, itemId, qty = 1) {
    if (!npc.shop || !npc.shop.includes(itemId)) {
      Utils.notify('此NPC不出售该物品', '#aaa'); return;
    }
    const itemDef = Object.values(ITEMS).find(i => i.id === itemId);
    if (!itemDef) return;
    // 简单价格：稀有度决定价格
    const price = _itemPrice(itemId);
    if (player.gold < price) { Utils.notify(`金币不足（需要 ${price}）`, '#f44336'); return; }
    player.gold -= price;
    Entities.addItemToInventory(player, itemId, qty);
    Utils.notify(`购买 ${itemDef.name} x${qty}`, '#ffd700');
  }

  function _itemPrice(itemId) {
    const prices = {
      spirit_stone:50, jade:40, fire_crystal:35, heal_pill:20,
      spirit_pill:30, power_pill:25, immune_pill:25,
      iron_sword:30, iron_armor:45, spirit_sword:200, spirit_robe:180,
      spirit_herb:8, golden_fruit:15, wood:3, stone:2, iron_ore:5,
    };
    return prices[itemId] || 10;
  }

  function setApiKey(key) { apiKey = key; }
  function getApiKey()    { return apiKey; }
  function isDialogActive()  { return dialogActive; }
  function getCurrentNPC()   { return currentNPC; }
  function getHistory()      { return dialogHistory; }
  function isThinking()      { return thinking; }
  function getRelation(npcId){ return relations[npcId] || 50; }

  function toggleWorldPanel()   { worldPanelOpen = !worldPanelOpen; }
  function isWorldPanelOpen()   { return worldPanelOpen; }

  return {
    init, getNearbyNPC, startDialog, closeDialog,
    sendMessage, appendInput, backspaceInput, clearInput, getInput, setInput,
    updateNPCSocial, tradeWithNPC,
    setApiKey, getApiKey, isDialogActive, getCurrentNPC, getHistory, isThinking, getRelation,
    toggleWorldPanel, isWorldPanelOpen,
  };
})();
