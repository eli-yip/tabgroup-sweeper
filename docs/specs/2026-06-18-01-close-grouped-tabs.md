# SPEC：tabgroup-sweeper —— 关闭所有「属于某个标签组」的标签页

- 日期：2026-06-18
- 状态：初版实现 / 待评审

## 1. 背景与动机

需求：把「已经归入某个标签组（tab group）的标签页」从浏览器里关掉，**保留未分组
的散落标签页**。

> 例：Tab1∈Tg1、Tab2∈Tg2、Tab3 不属于任何组 → 关闭 Tab1、Tab2，保留 Tab3。

此需求与 `tabgroups-export`（解析 SNSS 的 Python CLI）的导出/分类功能正交，故独立
成一个项目。

### 为什么是浏览器扩展，而不是 CLI

调研了在 macOS 上关闭运行中浏览器标签页的三条路：

- **AppleScript**：Chromium 的 AppleScript 字典只有 `window/tab`，**完全没有"标签
  组"概念**。要判断"哪些标签页是分组的"只能解析 SNSS 再按 URL 近似匹配，存在同名
  URL / 会话滞后的边界，不精确。
- **CDP（remote debugging）**：Chrome 136（2025-04）起 `--remote-debugging-port`
  对默认 profile 失效，连不到用户的日常浏览器。出局。
- **浏览器扩展（`chrome.tabGroups` + `chrome.tabs`）**：**直接读真实的标签组归属**，
  机器精确、零 URL 匹配、零启发式。

选扩展，因为只有它能精确识别组归属，符合「机器可校验、不靠猜」的原则。

## 2. 目标与非目标

### 目标

- Manifest V3 扩展，工具栏图标 + popup。
- popup 列出当前所有标签组（颜色、名称、标签页数），一个按钮一次性关闭全部分组
  标签页。
- 未分组标签页一律保留。
- 权限最小化：仅 `tabGroups`。

### 非目标

- 不读 SNSS / 不依赖 `tabgroups-export`。
- 不按组名筛选（"只关某几个组"）；本次是「全部分组标签页」。
- 不支持非 Chromium 浏览器。
- 不做二次确认弹窗（点按钮即关；popup 本身就是确认前的可见列表）。

## 3. 设计

### 3.1 形态

- bun + TypeScript，`build.ts` 用 `Bun.build` 把 `src/popup.ts` 打成
  `public/popup.js`；`public/manifest.json` + `public/popup.html` 为提交资产。
- Biome 负责 lint/format。参照 `cookie-updater` 的工程模式。

### 3.2 关闭逻辑

1. `chrome.tabGroups.query({})` 取所有组（含 title / color）。
2. `chrome.tabs.query({})` 取所有标签页；`tab.groupId !== TAB_GROUP_ID_NONE(-1)`
   即为分组标签页，按 groupId 聚合得到每组的 tab id。
3. popup 渲染：每组一行（色点 + 名称 + 数量），按钮显示总数。
4. 点按钮：在点击时刻**重新读取**一次（保证 id 新鲜），收集全部分组 tab id，
   `chrome.tabs.remove(ids)` 一次性关闭，再刷新列表并提示已关闭数。

### 3.3 权限

仅 `tabGroups`。说明：`chrome.tabs.query` 返回的 `groupId` 与 `chrome.tabs.remove`
均无需 `tabs` 权限；组的标题/颜色来自 `tabGroups`。故不申请 `tabs` / host 权限。

## 4. 边界与风险

- **整窗皆分组**：某窗口的标签页全部属于组时，扫掉后该窗口随之关闭（Chromium 对
  无标签页的窗口的固有行为）。符合预期。
- **精确性**：组归属直接来自浏览器 API，无 URL 匹配、无启发式，不会误判未分组标签
  页。

## 5. 验收标准

- 浏览器里有分组标签页 + 未分组标签页时，点按钮后全部分组标签页关闭，未分组保留。
- popup 正确列出各组颜色 / 名称 / 数量与总数。
- 无标签组时按钮禁用并提示。
- `just build` 产出 `public/popup.js`；`just lint` / `just fmt` 干净。
- 在 Brave/Chrome 以「加载已解压扩展」指向 `public/` 可正常运行。
