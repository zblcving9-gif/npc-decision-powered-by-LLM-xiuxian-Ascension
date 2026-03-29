# DELTA DEPENDENCY_MATRIX — v3 → v4

> **迭代版本：** v4（Bug修复迭代 · 2026-03-29）
> **对比版本：** v3 → v4
> **依赖关系变化：** 无文件新增/删除，依赖拓扑不变

## 修改文件清单

| 文件 | 层级 | 改动性质 | 修改行数 |
|------|------|---------|---------|
| `js/constants.js` | 二级 | 新增常量 | +1行 |
| `js/entities.js` | 二级 | Bug修复+功能扩展 | +22行 |
| `js/world.js` | 二级 | 无净变化 | ±0行 |
| `js/renderer.js` | 二级 | 新增边界绘制 | +14行 |
| `js/data/npcs.js` | 三级 | 功能扩展 | +38行 |

## 变更详情

### Bug1 — 地图边界限制（多文件联动）

#### `js/constants.js`（+1行）
- 新增 `MAP_BOUND_PAD: 16` 常量，定义地图边界内边距（实体半径）

#### `js/entities.js`（+22行）
- 玩家移动同步后新增边界夹取逻辑：将玩家位置限制在 `MAP_BOUND_PAD` ~ `MAP_SIZE - MAP_BOUND_PAD` 范围内
- NPC移动同步后新增同样的边界夹取逻辑
- 使用 `C.MAP_TILES_X * C.TILE_SIZE` 计算地图尺寸，`Utils.clamp` 做夹取
- 超出边界时同步修正物理体位置（`Physics.setPos`）

#### `js/renderer.js`（+14行）
- 新增 `_drawMapBorder(ctx, camX, camY)` 函数
- 在地形绘制后调用，用红色虚线绘制地图边界矩形
- 视觉提示玩家地图范围

#### `js/world.js`（±0行）
- 短暂添加后移除了 `MAP_BOUND`、`clampToMap`、`getMapBound`
- 最终恢复为原状，无净变化

### Bug2 — 新增弱怪（新手可打）

#### `js/data/npcs.js`（+38行）
- 新增 `WILD_WOLF`（野狼）：hp:40, atk:6, def:2, level:1, xpReward:8
  - 掉落：生肉(80%)、兽皮(30%)
  - 最弱怪物，新手1-2刀可击杀
- 新增 `WEASEL_SPIRIT`（黄鼠狼精）：hp:55, atk:8, def:3, level:1, xpReward:12
  - 掉落：生肉(70%)、灵草(40%)、骨头(30%)
  - 弱怪，适合新手练级

#### `js/entities.js`（spawn列表）
- 新增5只弱怪出生点，全部靠近玩家出生点(400,300)：
  - 3只野狼：(500,180), (580,250), (450,450)
  - 2只黄鼠狼精：(600,400), (350,200)

## 依赖矩阵变化

**本次无新增/删除依赖关系。** 矩阵拓扑与 v3 相同，只有内部逻辑变更。
