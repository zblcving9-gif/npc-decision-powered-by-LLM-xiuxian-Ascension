# DELTA DEPENDENCY_MATRIX v1.md
> 版本说明：v1（初始版本）→ v2（Bug修复迭代）
> 日期：2026-03-29

## 本次迭代变更说明

本次为 **Bug修复迭代**，修改了以下3个文件中的逻辑Bug。
**文件依赖关系（矩阵结构）未发生任何变化**，无新文件增删，无引用关系变动。

---

## 变更文件列表

| 文件 | 编号 | 变更类型 | 修改行数 |
|------|------|----------|----------|
| `js/world.js`     | F05 | Bug修复 | -1 / +1 |
| `js/entities.js`  | F07 | Bug修复 | -2 / +2 |
| `index.html`      | F01 | Bug修复 | -7 / +12 |

---

## Bug修复详情

### Bug 1 — 资源节点初始不渲染（F05: world.js）

- **位置：** `drawResources()` 函数
- **原代码：**
  ```js
  const item = ITEMS[node.itemId.toUpperCase()] || ITEMS[Object.keys(ITEMS).find(k=>ITEMS[k].id===node.itemId)];
  ```
- **修复代码：**
  ```js
  const item = Object.values(ITEMS).find(it => it.id === node.itemId);
  ```
- **根因：** `toUpperCase()` 对含下划线的 itemId（如 `iron_ore`→`IRON_ORE`）找不到对应 ITEMS 键（键为 `IRON`），导致 `item` 为 `undefined`，渲染时跳过，资源节点不显示。

---

### Bug 2 — 玩家无法移动（F07: entities.js）

- **位置：** `_handleMovement()` 函数
- **原代码：**
  ```js
  player.moving = dx !== 0 || dy !== 0;
  if (player.moving) {
    const n = Utils.normalize(dx, dy);  // ← n 定义在 if 块内
    player.facing = n;
  }
  // ...
  Physics.setVelocity('player',
    player.moving ? n.x * spd / 60 : 0,  // ← n 在此处为 undefined！
    player.moving ? n.y * spd / 60 : 0,
  );
  ```
- **修复代码：**
  ```js
  player.moving = dx !== 0 || dy !== 0;
  const n = player.moving ? Utils.normalize(dx, dy) : { x: 0, y: 0 };
  if (player.moving) { player.facing = n; }
  // ...
  Physics.setVelocity('player',
    player.moving ? n.x * spd / 60 : 0,
    player.moving ? n.y * spd / 60 : 0,
  );
  ```
- **根因：** `const n` 声明在 `if (player.moving)` 块内，块外作用域无法访问，静止时 `n` 为 `undefined`，`n.x` 抛出 `TypeError`，游戏主循环崩溃，玩家永久无法移动。

---

### Bug 3 — 门派面板按1-4无反应（F01: index.html）

- **位置：** `keydown` 事件处理器，`switch(e.key)` 语句
- **原代码：**
  ```js
  case '1': case '2': ... case '9':
    UI.setHotbar(parseInt(e.key) - 1);   // ← 无论何时都切快捷栏
    break;
  // ...
  case 'Digit1': case 'Digit2': ...       // ← e.key 永远不等于 'Digit1'
    if (UI.getActivePanel() === 'sect') { ... }
    break;
  ```
- **修复代码：**
  ```js
  case '1': case '2': ... case '9':
    if (UI.getActivePanel() === 'sect') {
      // 门派面板激活时：选择门派
      Cultivation.foundSect(player, sectKeys[idx]);
    } else {
      // 否则：切换快捷栏
      UI.setHotbar(parseInt(e.key) - 1);
    }
    break;
  ```
- **根因1：** `e.key` 的值是 `'1'`~`'9'`，而非 `'Digit1'`~`'Digit9'`（`e.code` 才是 `'Digit1'`），导致门派分支永远不执行。
- **根因2：** 数字键总是先被快捷栏逻辑消费，门派判断分支放在后面毫无意义。修复后在同一 `case` 内根据当前面板状态分支处理。

---

## 依赖矩阵增量（Δ矩阵）

> 本次修改无文件增删，无引用关系变更。
> Δ矩阵（v1→v2）全零，即：**所有文件对之间的依赖关系未发生变化。**

|        | F01 | F02 | F03 | F04 | F05 | F06 | F07 | F08 | F09 | F10 | F11 | F12 | F13 | F14 | F15 | F16 | F17 | F18 | F19 | F20 | F21 |
|--------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| **F01**| 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| **F02**| 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |
| ...    | 0   | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | 0   |
| **F21**| 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   | 0   |

*(所有 Δ 值均为 0，表示依赖关系无变化)*

---

## 结论

| 项目 | v1 | v2 |
|------|----|----|
| 文件总数 | 21 | 21 |
| 依赖关系数 | 30 | 30 |
| 矩阵变化 | — | **无变化** |
| Bug修复 | 0 | **3个** |
