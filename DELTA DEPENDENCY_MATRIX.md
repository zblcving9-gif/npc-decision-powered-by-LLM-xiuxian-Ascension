# DELTA DEPENDENCY_MATRIX — v2 → v3

> **迭代版本：** v3（Bug修复迭代 · 2026-03-29）
> **对比版本：** v2 → v3
> **依赖关系变化：** 无文件新增/删除，依赖拓扑不变

## 修改文件清单

| 文件 | 层级 | 改动性质 | 修改行数 |
|------|------|---------|---------|
| `js/world.js` | 二级 | Bug修复 | +23行 |
| `js/data/npcs.js` | 三级 | 功能扩展 | +95行(重写) |
| `js/entities.js` | 二级 | Bug修复+功能扩展 | +55行 |
| `js/social.js` | 二级 | Bug修复+功能扩展 | +30行 |

## 变更详情

### Bug1 — `js/world.js`（+23行）
- 新增 `_ensureStarterResources()`：在玩家出生点(400,300)方圆200px内硬放6个资源节点，保证初始可见
- `drawResources()` 加 `ctx.save/restore` 保护渲染上下文状态

### Bug2 — `js/data/npcs.js`（重写）
- 建立 1/3/5 级怪物等级体系：
  - Lv1：BANDIT、SPIRIT_BEAST（幼灵兽）
  - Lv3：BANDIT_CHIEF（头目）、SPIRIT_BEAST_ELDER（灵兽）
  - Lv5：DEMON_BEAST（魔化灵兽，Boss）
- 每个NPC新增 `level`、`xpReward` 字段
- 友方NPC新增 `combatBrave` 字段（true=战斗，false=逃跑）
- 新增 `scaleNPCStat` 辅助函数（等级缩放公式，与玩家同体系）

### Bug3 — `js/entities.js`（+55行）
- `_spawnNPCs`：更新spawn列表使用新分级模板，Lv1怪物靠近出生点
- `_aiHostile`：敌对AI现在会检测并攻击附近友方NPC（不只攻击玩家）
- `_aiFriendly`：友方NPC遇到敌对单位时根据 `combatBrave` 选择战斗/逃跑
- 新增 `_npcAttackTarget(npc, target)`：通用攻击函数，可打玩家或友方NPC
- `playerAttack`：XP奖励改用 `npc.xpReward + randInt(0,5)`

### Bug4 — `js/social.js`（+30行）
- `sendMessage`：API请求改用 DashScope OpenAI 兼容接口
  - 旧：`/api/v1/services/aigc/text-generation/generation`（`input.messages` 格式）
  - 新：`/compatible-mode/v1/chat/completions`（标准 OpenAI `messages` 格式）
- 网络异常改为降级到离线回退（不再显示"思绪纷乱"错误）
- `updateNPCSocial`：NPC间靠近时有20%概率触发AI对话（`_npcToNpcChat`）
- 新增 `_npcToNpcChat(npcA, npcB)`：NPC间AI对话，结果以浮动文字显示

## 依赖矩阵变化

**本次无新增/删除依赖关系。** 矩阵拓扑与 v2 相同，只有内部逻辑变更。
