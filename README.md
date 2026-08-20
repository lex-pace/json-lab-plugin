# JSON Lab · 浏览器 JSON 工具箱

一个纯前端的 JSON 处理浏览器插件（Chrome / Edge，Manifest V3），灵感来自 [FeHelper](https://fehelper.com/)，提供 **JSON 美化**、**JSON 对比**、**JSON 转表格** 三大功能，并支持自动捕获当前页 JSON、路径提取、字段忽略等增强能力。

- 🚀 零依赖、零构建：原生 HTML/CSS/JS，下载即用
- 🔒 隐私安全：所有处理在本地浏览器完成，不请求任何网络
- 🎨 三大功能一体化 SPA：美化 / 对比 / 转表格 + 使用说明

## 功能一览

### 1. JSON 美化
- 语法高亮的可折叠树视图（key / 字符串 / 数字 / 布尔 / null 分色）
- 格式化 / 压缩 / 按 Key 排序；缩进切换 2 空格 / 4 空格 / Tab
- 多层级全展开树视图，点击箭头折叠任意节点
- 搜索高亮：精确或模糊匹配 Key / Value，折叠模式只显示命中项
- **路径提取**：悬停节点显示 JSONPath（如 `$.author.name`），点击复制
- 大整数防精度丢失：超过 15 位的整数自动转为字符串
- 一键复制、下载为 `.json`

### 2. JSON 对比
- 左右双栏输入两份 JSON，按 key 路径递归差异比对
- 三类差异一目了然：🟢 新增 / 🔴 删除 / 🟡 修改
- **下拉多选忽略字段**：自动加载两份 JSON 的全部 key，勾选排除干扰字段（如 `timestamp`）
- 每条差异显示完整路径 + 旧值 / 新值
- 一键交换两侧、差异统计徽章

### 3. JSON 转表格
- 对象数组 → 表格（字段名为列头，保留首次出现顺序）
- 嵌套对象自动展平（`address.city`）
- 表格搜索高亮，命中行突出
- 导出 **CSV**（RFC 4180 转义，带 BOM，Excel 中文不乱码）/ **Markdown 表格**
- 边界处理：单对象自动包装、原始值数组降级、空数组友好提示

### 其他增强
- **自动捕获当前页 JSON**：点击插件图标即可检测并导入当前标签页中的 JSON（接口返回的原始 JSON 页一键导入）
- **使用说明面板**：卡片式介绍三大功能 + 快捷键 + 隐私声明 + 打赏入口
- 深 / 浅色主题切换、可折叠侧边栏

## 目录结构

```
JSON-Tools/
├── manifest.json              # MV3 清单
├── index.html                 # SPA 主页面（侧边栏 + 四个面板）
├── index.js                   # SPA 逻辑（Beautify / Compare / Table / Help 模块）
├── icons/                     # 16/48/128 图标
├── popup/                     # 扩展图标点击后的弹窗（含「捕获当前页 JSON」入口）
│   ├── popup.html / .css / .js
├── shared/                    # 公共资源
│   ├── styles.css             # 全局样式（含主题变量、组件、动画）
│   ├── json-utils.js          # 解析 / 格式化 / 排序 / diff / 高亮树 / 路径提取
│   ├── table-utils.js         # 对象数组 → 表格 / CSV / Markdown
│   ├── icons.js               # 内联 SVG 图标库
│   └── content-extractor.js   # 按需注入的内容脚本（捕获当前页 JSON）
├── scripts/
│   └── pack.sh                # 打包脚本（生成可上传的 zip）
├── docs/                      # 发布相关文档
│   ├── privacy.html           # 隐私政策（中英文，可托管 GitHub Pages）
│   └── store-listing.md       # 商店上架文案（中英文）
├── RELEASE.md                 # 发布清单
└── README.md
```

> `pages/` 目录为早期多页面版本的遗留，SPA 重构后已不再引用，可在后续清理时删除。

## 加载与使用

### 开发模式（加载已解压的扩展程序）

1. 打开 Chrome / Edge，访问 `chrome://extensions`
2. 右上角打开「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择本项目的 `JSON-Tools/` 目录
5. 浏览器工具栏会出现「JSON Lab」图标，点击即可看到弹窗

### 使用流程

1. 点击工具栏的插件图标 → 弹窗中选择功能（或直接点「捕获当前页 JSON」自动导入）
2. 在打开的主页面左侧侧边栏切换「美化 / 对比 / 转表格 / 说明」面板
3. 粘贴 JSON 并操作

### 本地调试

```bash
cd JSON-Tools
python3 -m http.server 8765
# 浏览器访问 http://localhost:8765/index.html?p=beautify
```

### 快捷键

- **Ctrl/⌘ + Enter** —— 执行当前面板主操作（格式化 / 对比 / 转换）
- **Ctrl/⌘ + F** —— 聚焦搜索框
- **Esc** —— 清除搜索 / 关闭弹窗

## 技术说明

- **Manifest V3**，最小权限：`activeTab` / `scripting` / `storage`（均用于「捕获当前页」和偏好存储）
- 无 background service worker（纯客户端工具，不占用后台资源）
- 无任何第三方库，所有代码自行实现
- 数据全程不出浏览器

## 发布到商店

详见 [`RELEASE.md`](./RELEASE.md)，关键步骤：

```bash
# 1. 本地冒烟测试通过后，递增 manifest.json 的 version
# 2. 打包
./scripts/pack.sh
# 产物：dist/jsontools-v<version>.zip
# 3. 上传到 Chrome Web Store / Edge Add-ons
```

上架所需文案见 [`docs/store-listing.md`](./docs/store-listing.md)，隐私政策见 [`docs/privacy.html`](./docs/privacy.html)。

## 浏览器兼容性

- ✅ Chrome（Manifest V3）
- ✅ Edge（Manifest V3，同一 zip 直接上传）
- 🟡 Firefox（同用 `chrome.*` 命名空间，大概率无需改动；AMO 上传即可）

## 许可

MIT
