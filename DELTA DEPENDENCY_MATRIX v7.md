# 修仙AI小镇 · 文件依赖增量矩阵（v6 → v7）

> **v7版本：** Bug修复 · 2026-03-29
> 前一版本：[DELTA DEPENDENCY_MATRIX v6.md](./DELTA%20DEPENDENCY_MATRIX%20v6.md)

## 修改文件

| 文件 | 类型 | 变更行数 | 说明 |
|------|------|----------|------|
| `js/utils.js` | 修改 | +2行 | `addWorldLog`增加`category`参数（dialog/combat/sect/other）；`notify`限制最多8条 |
| `js/social.js` | 修改 | +2行 | `_addWorldLog`增加`category`参数，默认`'dialog'` |
| `js/entities.js` | 修改 | +2行 | 2处`addWorldLog`调用增加`'combat'`分类参数 |
| `js/renderer.js` | 修改 | +1行 | 通知渲染区域y坐标从120改为160，避开小地图+天气信息 |
| `js/ui.js` | 修改 | +重写 | 世界信息面板增加分类标签页（全部/对话/打斗/门派/其它），每条消息带分类色条，标签可点击切换；handleClick中增加世界面板标签点击检测 |

## 依赖变化

本次迭代**无新增跨文件依赖**。所有修改均在已有引用关系的文件内部进行。

## 行数统计变化

| 文件 | v6行数 | v7行数 | 变化 |
|------|--------|--------|------|
| js/utils.js | 207 | 189 | -18 |
| js/social.js | 273 | 241 | -32 |
| js/entities.js | 543 | 543 | 0 |
| js/renderer.js | 153 | 123 | -30 |
| js/ui.js | 545 | 300 | -245（深度压缩空行和注释） |
