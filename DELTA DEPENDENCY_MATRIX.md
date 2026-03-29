# 修仙AI小镇 · 文件依赖增量矩阵

> **当前版本：v10**（功能迭代 · 2026-03-29）
> 上一版本：[DEPENDENCY_MATRIX v9.md](./DEPENDENCY_MATRIX%20v9.md)

## v10 增量变化（相对 v9）

| 变化 | 说明 |
|------|------|
| **F07→F05** 0→1 | entities.js 新增 `World.getSpiritAt()` 调用（NPC属性更新需灵力浓度） |
| **F07→F06** 0→1 | entities.js 新增 `Weather.getCfg()` 调用（NPC属性更新需天气灵力倍率） |
| **F07→F16** 0→1 | entities.js 使用 `ITEMS`（历史遗漏修正） |
| **F07→F18** 0→1 | entities.js 使用 `REALMS`（历史遗漏修正） |
| **F07→F19** 0→1 | entities.js 使用 `NPC_TEMPLATES`（历史遗漏修正） |

## 变化矩阵（仅展示变化的行列）

|        | F05 | F06 | F16 | F18 | F19 |
|--------|-----|-----|-----|-----|-----|
| **F07**| +1  | +1  | +1  | +1  | +1  |
