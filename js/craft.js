// ============================================================
// craft.js - 合成物资系统（二级节点）
// 引用三级节点：data/recipes.js
// ============================================================

const Craft = (() => {
  let activeRecipe = null;
  let craftTimer   = 0;
  let craftQueue   = []; // 队列（最多3个）

  function init() {}

  // 获取当前可制作的配方（依据玩家背包、已建建筑、境界）
  function getAvailableRecipes(player) {
    return RECIPES.filter(r => {
      // 建筑依赖
      if (r.requireBuilding && !Building.hasBuildingType(r.requireBuilding)) return false;
      // 境界依赖
      if (r.minLevel && player.level < r.minLevel) return false;
      // 烹饪需要火源
      if (r.requireFire && !player.nearFire) return false;
      // 材料检查
      for (const inp of r.inputs) {
        if (Entities.countItem(player, inp.id) < inp.qty) return false;
      }
      return true;
    });
  }

  // 所有配方（供UI展示，无视材料是否足够）
  function getAllRecipes(player) {
    return RECIPES.map(r => ({
      ...r,
      canCraft: _canCraft(r, player),
    }));
  }

  function _canCraft(recipe, player) {
    if (recipe.requireBuilding && !Building.hasBuildingType(recipe.requireBuilding)) return false;
    if (recipe.minLevel && player.level < recipe.minLevel) return false;
    if (recipe.requireFire && !player.nearFire) return false;
    for (const inp of recipe.inputs) {
      if (Entities.countItem(player, inp.id) < inp.qty) return false;
    }
    return true;
  }

  // 开始制作
  function startCraft(recipeId, player) {
    const recipe = RECIPES.find(r => r.id === recipeId);
    if (!recipe) return false;
    if (!_canCraft(recipe, player)) { Utils.notify('条件不满足，无法制作', '#f44336'); return false; }

    // 灵力消耗
    if (recipe.spiritCost && player.spirit < recipe.spiritCost) {
      Utils.notify(`灵力不足（需要 ${recipe.spiritCost}）`, '#f44336'); return false;
    }

    // 消耗材料
    for (const inp of recipe.inputs) {
      Entities.removeItemFromInventory(player, inp.id, inp.qty);
    }
    if (recipe.spiritCost) {
      player.spirit = Utils.clamp(player.spirit - recipe.spiritCost, 0, player.spiritMax);
    }

    activeRecipe = { ...recipe };
    craftTimer = 0;
    Utils.notify(`开始制作：${recipe.name}`, '#8bc34a');
    return true;
  }

  // 更新制作进度
  function update(dt, player) {
    if (!activeRecipe) return;

    // 制作速度受境界和灵力影响
    const spirit = World.getSpiritAt(player.x, player.y);
    const speedMul = 1 + player.level * 0.05 + spirit * 0.2;
    craftTimer += dt * speedMul;

    if (craftTimer >= activeRecipe.time * 1000) {
      _completeCraft(player);
    }
  }

  function _completeCraft(player) {
    if (!activeRecipe) return;
    const out = activeRecipe.output;
    Entities.addItemToInventory(player, out.id, out.qty);

    const itemDef = Object.values(ITEMS).find(i => i.id === out.id);
    Utils.addFloatingText(player.x, player.y - 30,
      `制成 ${itemDef ? itemDef.icon : ''}${activeRecipe.name}!`, '#ffd700', 16);
    Entities.addXP(Utils.randInt(5, 15));

    // 炼丹增加修炼经验
    if (activeRecipe.category === 'alchemy') {
      player.spiritTotal = (player.spiritTotal || 0) + 5;
    }

    activeRecipe = null;
    craftTimer   = 0;
    Utils.notify(`制作完成：${RECIPES.find(r=>r.id===activeRecipe?.id)?.name || '物品'}`, '#ffd700');
  }

  // 取消制作（材料不退还）
  function cancelCraft() {
    activeRecipe = null;
    craftTimer   = 0;
  }

  // 快速烤肉（靠近火源时直接烤）
  function cookMeat(player) {
    if (!player.nearFire) { Utils.notify('需要靠近火源才能烤肉', '#f44336'); return; }
    if (Entities.countItem(player, 'raw_meat') === 0) { Utils.notify('没有生肉', '#aaa'); return; }
    startCraft('cook_meat', player);
  }

  // 绘制制作进度
  function draw(ctx) {
    if (!activeRecipe) return;
    const progress = craftTimer / (activeRecipe.time * 1000);
    const bw = 200, bh = 18;
    const bx = C.CANVAS_W/2 - bw/2, by = C.CANVAS_H - 80;

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    Utils.roundRect(ctx, bx - 6, by - 22, bw + 12, bh + 28, 6); ctx.fill();

    ctx.fillStyle = '#ddd';
    ctx.font = '13px 微软雅黑';
    ctx.textAlign = 'center';
    ctx.fillText(`制作中：${activeRecipe.name}`, C.CANVAS_W/2, by - 6);
    ctx.textAlign = 'left';

    Utils.drawBar(ctx, bx, by, bw, bh, progress, 1, '#ff9800');
    ctx.fillStyle = '#fff';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.floor(progress*100)}%`, C.CANVAS_W/2, by + 13);
    ctx.textAlign = 'left';
  }

  function isCrafting()  { return !!activeRecipe; }
  function getProgress() { return activeRecipe ? craftTimer / (activeRecipe.time * 1000) : 0; }
  function getActive()   { return activeRecipe; }

  return { init, getAvailableRecipes, getAllRecipes, startCraft, update, cancelCraft, cookMeat, draw, isCrafting, getProgress, getActive };
})();
