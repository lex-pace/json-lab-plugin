# JSON Lab · Microsoft Edge Add-ons 上架资料

本文档用于提交到 Microsoft Edge Add-ons 商店，可直接复制对应字段。发布前请确认隐私政策页面已经公开访问，并替换为真实的支持邮箱或主页地址（如有需要）。

## 一、商品基本信息

### 商品名称

```text
JSON Lab - JSON 美化对比工具箱
```

### 简短说明

```text
JSON 美化、JSON 对比、JSON 转表格，一站式前端工具箱，数据不离开浏览器，零依赖。
```

### 类别

```text
Developer Tools（开发者工具）
```

### 建议搜索关键词

```text
JSON, JSON formatter, JSON beautifier, JSON compare, JSON to table
```

### 支持邮箱

```text
935342295@qq.com
```

### 隐私政策 URL

```text
https://lex-pace.github.io/json-lab-plugin/privacy.html
```

> 提交前请在浏览器中确认该 URL 可以正常打开；如果 GitHub Pages 尚未启用，请先部署 `docs/privacy.html`。

### 项目主页 / 支持页面

```text
https://github.com/lex-pace/json-lab-plugin
```

## 二、中文详细描述

```text
JSON Lab 是一款轻量、纯前端的 JSON 处理浏览器扩展，专为开发者、调试人员和数据分析师设计。

它将 JSON 美化、JSON 对比和 JSON 转表格整合在一个工具箱中。所有数据都只在当前浏览器内处理，不上传到服务器，不集成第三方分析，也不展示广告。

【核心功能】

1. JSON 美化
- 将杂乱的 JSON 格式化为可折叠的语法高亮树
- 支持格式化、压缩和按 Key 排序
- 支持多层级展开与折叠
- 支持按 Key 或 Value 搜索并高亮结果
- 悬停节点查看 JSONPath，点击即可复制
- 超过 15 位的整数自动按字符串处理，避免精度丢失

2. JSON 对比
- 递归比较两份 JSON，快速定位新增、删除和修改项
- 每条差异显示完整路径以及旧值和新值
- 支持忽略 timestamp、updatedAt 等指定字段
- 实时显示差异统计

3. JSON 转表格
- 将对象数组转换为可视化表格
- 自动展平嵌套对象，例如 address.city
- 支持列显示/隐藏、表格搜索和列值筛选
- 支持导出 CSV 和 Markdown，CSV 兼容 Excel 中文显示

【更多功能】
- 用户主动点击插件图标后，可捕获当前页面中的 JSON
- 深色 / 浅色主题切换
- 可折叠侧边栏
- 快捷键：Ctrl/⌘ + Enter 执行，Ctrl/⌘ + F 搜索，Esc 清除
- 零依赖、零构建、零网络请求

【隐私承诺】
JSON Lab 不会在后台监控网页。只有当用户主动点击插件图标并使用“捕获当前页 JSON”功能时，扩展才会读取当前页面内容。所有解析、对比和导出均在本地完成，数据不会离开设备。
```

## 三、英文详细描述

```text
JSON Lab is a lightweight, fully client-side JSON toolbox for developers, debuggers, and data analysts.

It combines JSON beautification, JSON comparison, and JSON-to-table conversion in one browser extension. All data is processed locally in your browser. Nothing is uploaded to a server, and the extension contains no third-party analytics or advertising.

[CORE FEATURES]

1. JSON Beautifier
- Format messy JSON into a collapsible, syntax-highlighted tree
- Beautify, minify, or sort by key
- Expand and collapse nested levels
- Search and highlight matching keys or values
- Hover over a node to view its JSONPath, then click to copy it
- Preserve integers longer than 15 digits as strings to avoid precision loss

2. JSON Compare
- Recursively compare two JSON documents and locate changes quickly
- Show added, removed, and modified entries with their full paths
- Ignore fields such as timestamp and updatedAt
- Display live difference statistics

3. JSON to Table
- Convert arrays of objects into a readable table
- Flatten nested objects, such as address.city
- Search rows, show or hide columns, and filter column values
- Export to CSV or Markdown; CSV is Excel-friendly for Chinese text

[MORE FEATURES]
- Capture JSON from the current page after the user actively clicks the extension icon
- Dark and light themes
- Collapsible sidebar
- Keyboard shortcuts: Ctrl/⌘ + Enter to run, Ctrl/⌘ + F to search, Esc to clear
- Zero dependencies, zero build step, and zero network requests

[PRIVACY]
JSON Lab never monitors pages in the background. It reads the current page only after the user actively clicks the extension icon and uses the “capture current page JSON” feature. Parsing, comparison, and export happen locally on the device, and no data leaves the browser.
```

## 四、权限说明

### `activeTab`

```text
仅在用户主动点击扩展图标时临时访问当前标签页，用于“捕获当前页 JSON”功能。扩展不会在后台持续读取或监控任何网页。
```

### `scripting`

```text
仅在用户主动触发“捕获当前页 JSON”时，向当前标签页注入一次性内容脚本，用于提取页面中的 JSON 文本。不会自动注入。
```

### `storage`

```text
用于在插件弹窗与主页面之间传递用户主动捕获的 JSON，以及保存主题等本地偏好设置。数据只存储在用户的本地浏览器中，不会上传到云端。
```

## 五、隐私与数据声明建议

- 是否收集用户数据：仅勾选 **Website content**（用于用户主动触发的当前页 JSON 捕获）
- 是否出售或传输用户数据：**否**；页面内容仅在本地临时处理，不上传或分享
- 是否使用远程代码：**否**
- 是否包含广告或第三方分析：**否**
- 单一用途：**在本地浏览器中美化、比较和转换 JSON 数据**
- Website content 使用方式：仅在用户主动点击并使用当前页 JSON 捕获功能时读取当前页面内容

## 六、图形素材

| 素材 | 尺寸 | 文件 |
|---|---:|---|
| 商店图标 | 128×128 PNG | `icons/icon128.png` |
| 小宣传图 | 440×280 PNG/JPG | 暂未制作，可选 |
| 商店截图 | 1280×800 PNG | `docs/edge-screenshot-overview-1280x800.png`、`docs/edge-screenshot-beautify-1280x800.png`、`docs/edge-screenshot-compare-1280x800.png`、`docs/edge-screenshot-table-1280x800.png` |
| 大宣传图 | 1400×560 PNG/JPG | `docs/edge-large-promotional-tile-1400x560.png` |

当前扩展图标已经使用正式 JSON Lab Logo 导出。四张符合尺寸要求的截图和一张 1400×560 大宣传图已经生成。上传商店时，建议至少使用三张截图：JSON 美化、JSON 对比、JSON 转表格。

## 七、上传包

```text
dist/jsontools-v1.0.1.zip
```

上传前确认：

1. Edge Add-ons Partner Center 中开发者账号注册和身份验证已完成。
2. `privacy.html` 的公网 URL 可以访问。
3. 上传 zip 后，填写本文件中的名称、说明、权限和隐私声明。
4. 首次发布前在 Edge 中通过“加载已解压的扩展”完成一次冒烟测试。
