# DELTA DEPENDENCY_MATRIX.md — v9 增量

> **v9（功能迭代 · 2026-03-29）** 相对于 v8 的依赖关系变化

## 依赖变化

| 变化类型 | 列(引用方) | 行(被引用方) | 说明 |
|----------|-----------|-------------|------|
| 🟢 新增 | F13 (social.js) | F07 (entities.js) | 新增 `Entities.getNPCs()` 调用获取附近NPC列表（历史遗漏修正，`Entities.addItemToInventory`早已存在） |

## 文件行数变化

| 文件 | v8行数 | v9行数 | 变化 |
|------|--------|--------|------|
| js/data/items.js | 42 | 43 | +1（新增毛发物品） |
| js/data/npcs.js | 188 | 247 | +59（新增5种被动动物模板） |
| js/entities.js | 543 | 575 | +32（被动动物刷怪+逃跑AI+攻击判定） |
| js/social.js | 241 | 262 | +21（聊天prompt增加环境上下文） |
| js/ui.js | 295 | 312 | +17（悬停tooltip展开完整消息） |
| index.html | 354 | 354 | 无变化 |
| 其余文件 | — | — | 无变化 |

## 架构影响

- **新增物品**：`fur`（毛发，材料类，来自玉角羊/野兔/野猪/灵鸡/梅花鹿）
- **新增NPC角色**：`deer`/`rabbit`/`wild_boar`/`wild_chicken`/`silk_deer`（被动动物，逃跑型）
- **新增AI分支**：`_aiPassive()`（被动动物逃跑AI，在entities.js中）
- **依赖修正**：social.js→entities.js 依赖已被正确记录
