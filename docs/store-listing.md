# JSON Lab 商店上架文案

本文档汇总 Chrome Web Store / Edge Add-ons 上架所需的所有文案字段，可直接复制粘贴到上架表单。

---

## 中文版（简体）

### 商品名称
```
JSON Lab - JSON 美化对比工具箱
```
> 长度限制：75 字符以内。建议带上核心关键词，便于搜索命中。

### 简短说明（一句话简介，132 字符以内）
```
JSON 美化、JSON 对比、JSON 转表格，一站式前端工具箱，数据不离开浏览器，零依赖。
```

### 详细描述
```
JSON Lab 是一款轻量、纯前端的 JSON 处理浏览器插件，专为开发者、调试人员和数据分析师设计。
三大核心功能集成于一体，所有数据只在你的浏览器内处理，隐私安全零担忧。

【三大核心功能】

1. JSON 美化
- 把杂乱的 JSON 字符串格式化成可折叠的语法高亮树
- 支持格式化 / 压缩 / 按 Key 排序
- 多层级全展开树视图，点击箭头可折叠任意节点
- 搜索高亮：精确或模糊匹配 Key / Value，折叠模式只显示命中项
- 路径提取：鼠标悬停节点显示 JSONPath，点击复制到剪贴板
- 大整数防精度丢失：超过 15 位的整数自动转为字符串

2. JSON 对比
- 逐键递归比较两份 JSON，精准定位差异
- 三类差异一目了然：新增（绿）、删除（红）、修改（橙）
- 下拉多选忽略指定字段：对比时排除 timestamp、updatedAt 等干扰字段
- 每条差异显示完整路径（如 author.name）
- 差异统计徽章实时反馈

3. JSON 转表格
- 对象数组转成可视表格，嵌套对象自动展平（address.city）
- 表格搜索高亮，命中行突出显示
- 一键导出 CSV / Markdown
- CSV 带 BOM，Excel 打开中文不乱码

【其他亮点】
- 自动捕获当前页 JSON：接口直接返回的 JSON 页面一键导入
- 深 / 浅色主题切换
- 可折叠侧边栏，专注内容
- 快捷键支持：⌘ Enter 执行、⌘ F 搜索、Esc 清除
- 零依赖、零构建、零网络请求，开源透明

【适用场景】
- 调试 API 返回值、阅读复杂 JSON 配置
- 对比接口前后版本差异、验证数据迁移
- 把接口数据转成表格查看、导入 Excel、生成文档

【隐私承诺】
所有 JSON 数据只在浏览器内处理，不上传到任何服务器。
插件不集成任何第三方分析、不展示广告、不做后台监控。
```

### 类别
- **主类别**：开发者工具 / Developer Tools
- **次类别**（如有）：生产力工具 / Productivity

### 权限说明（上传表单必填，逐项填写）
```
activeTab：
  仅在用户主动点击插件图标时读取当前标签页内容，用于"自动捕获当前页 JSON"功能。
  插件不会在后台持续监控任何页面。

scripting：
  配合 activeTab，在用户主动触发时向当前标签页注入一次性内容脚本，
  用于抓取页面中的 JSON 文本。不会自动注入，仅在用户点击时执行。

storage：
  用于在插件弹窗与主页面之间临时传递已捕获的 JSON（会话级），
  以及持久化主题偏好等设置。所有数据存储在本地浏览器，不上传云端。
```

---

## English Version

### Name
```
JSON Lab - JSON Beautify & Compare Toolbox
```

### Summary (132 chars max)
```
Beautify, compare, and convert JSON to tables — a fully client-side toolbox. No data leaves your browser.
```

### Detailed Description
```
JSON Lab is a lightweight, fully client-side JSON toolbox built for developers, debuggers, and data analysts.
Three core features in one extension. All processing happens in your browser — your data never leaves your device.

[CORE FEATURES]

1. JSON Beautify
- Format messy JSON into a collapsible syntax-highlighted tree
- Beautify / minify / sort by key
- Fully expanded multi-level tree; click any arrow to collapse a node
- Search highlighting: exact or fuzzy match on keys and values; collapsed mode shows only matches
- JSONPath extraction: hover any node to reveal its path, click to copy
- Safe big integers: integers longer than 15 digits become strings to avoid precision loss

2. JSON Compare
- Recursive key-by-key comparison of two JSON documents
- Three diff types at a glance: added (green), removed (red), modified (orange)
- Multi-select field ignore list: exclude fields like timestamp, updatedAt from comparison
- Every diff shows its full path (e.g. author.name)
- Live diff-count badge

3. JSON to Table
- Convert arrays of objects into a visual table; nested objects are flattened (address.city)
- In-table search with row highlighting
- One-click export to CSV / Markdown
- CSV includes BOM so Excel opens Chinese text correctly

[EXTRAS]
- Auto-capture JSON from the current page: one click to import raw JSON pages
- Dark / light theme toggle
- Collapsible sidebar for focus
- Keyboard shortcuts: ⌘ Enter, ⌘ F, Esc
- Zero dependencies, zero build, zero network requests, open source

[USE CASES]
- Debug API responses and read complex JSON configs
- Compare API versions and validate data migrations
- Turn API data into tables, import to Excel, generate docs

[PRIVACY]
All JSON is processed locally — nothing is uploaded to any server.
No third-party analytics, no ads, no background monitoring.
```

### Category
- **Primary**: Developer Tools
- **Secondary** (if available): Productivity

### Permission Justifications
```
activeTab:
  Reads the current tab's content only when the user actively clicks the extension icon,
  powering the "capture current page JSON" feature. The extension never monitors any page in the background.

scripting:
  Works with activeTab to inject a one-shot content script into the current tab when the user
  explicitly triggers capture, to extract JSON text from the page. Never auto-injected.

storage:
  Temporarily passes captured JSON between the popup and the main page (session-level),
  and persists preferences such as theme. All data stays in the local browser; nothing is uploaded.
```

---

## 商店素材清单（图 / 视频）

上传时需要在开发者控制台准备以下图形资产：

| 资产 | 尺寸 | 数量 | 说明 |
|---|---|---|---|
| 商店图标 | 128×128 PNG | 1 | 直接使用 `icons/icon128.png` 正式图标 |
| 小宣传图 | 440×280 PNG/JPG | 1（必填） | 展示三大功能的一句话卖点图 |
| 大截图 | 1280×800 PNG | 1-5（至少 1 张必填） | 建议每张展示一个功能：①美化树 ②对比差异 ③转表格 |
| 演示视频（可选） | YouTube 链接 | 0-1 | 30-60 秒功能演示，可显著提升转化 |

截图建议内容（每张聚焦一个功能）：
1. **JSON 美化**：展示一棵带高亮、有搜索命中的展开树
2. **JSON 对比**：展示左右两份 JSON 的差异列表（绿/红/橙）
3. **JSON 转表格**：展示一张导出好的可视表格
4. **下拉多选忽略字段**：展示弹出的多选面板（可作为对比面板的局部放大）
5. **使用说明面板**：展示卡片式布局的「关于」页

小宣传图（440×280）文案建议：
- 主标题：JSON Lab
- 副标题：JSON 美化 · 对比 · 转表格
- 角标：纯前端 · 数据不出浏览器
