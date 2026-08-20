# JSON Tools 发布清单

从代码到商店上架的完整流程。每个版本发布时按此文档逐项核对。

---

## 一、发布前自检（每次都要做）

### 1.1 代码层
- [ ] `manifest.json` 的 `version` 已递增（Chrome Web Store 不允许重复版本号）
- [ ] `manifest.json` 的 `name` / `description` 准确且无歧义
- [ ] 在 Chrome 和 Edge 中分别「加载未打包扩展」做最终冒烟测试（`chrome://extensions` → 开发者模式 → 加载已解压的扩展 → 选 `JSON-Tools/` 目录）
- [ ] 三大功能 + 自动捕获 + 路径提取 + 忽略字段 + 帮助面板 全部跑通
- [ ] 控制台无报错（F12 → Console）
- [ ] 深 / 浅主题切换正常

### 1.2 资产层
- [ ] 根据 `icons/json-tools-logo.svg` 导出并替换 `icons/icon{16,48,128}.png` 正式图标
- [ ] 商店截图已准备（见 `docs/store-listing.md` 末尾清单）
- [ ] 隐私政策已托管到公网可访问 URL（见下方「托管隐私政策」）

### 1.3 文案层
- [ ] `docs/store-listing.md` 中的文案已最终定稿
- [ ] 邮箱 `author@example.com` 已替换为真实邮箱（涉及 `docs/privacy.html` 和 `index.html` 的作者弹窗）

---

## 二、打包

```bash
cd JSON-Tools
./scripts/pack.sh
```

产物：`dist/jsontools-v<version>.zip`，直接用于上传。

脚本会自动：
- 从 `manifest.json` 读取版本号命名 zip
- 排除 `dist/`、`scripts/`、`docs/`、`.git`、`*.md`、`.DS_Store`、`node_modules`
- 校验 zip 根目录确实存在 `manifest.json`（避免常见上传错误）

---

## 三、托管隐私政策

隐私政策已写好在 `docs/privacy.html`，需要托管到一个公开可访问的 URL（Chrome Web Store 上架必填字段）。

### 方案 A：GitHub Pages（推荐，免费）
```bash
# 假设你的仓库是 yourname/json-tools
# 1. 把 docs/privacy.html 推到仓库的 docs/ 目录
# 2. 仓库 Settings → Pages → Source 选 main 分支 / docs 目录
# 3. 几分钟后即可访问：
#    https://yourname.github.io/json-tools/privacy.html
```

### 方案 B：自有域名
把 `docs/privacy.html` 上传到你的服务器，例如 `https://yourdomain.com/json-tools/privacy`。

上架表单填这个完整 URL 即可。

---

## 四、发布到 Chrome Web Store

### 4.1 注册（一次性）
1. 访问 https://chrome.google.com/webstore/devconsole/
2. 用 Google 账号登录
3. 支付 **$5 USD** 一次性注册费（永久有效）
4. 完成开发者身份验证（个人身份证 / 企业营业执照）

### 4.2 上传（每个版本）
1. 开发者控制台 → 「项目」→ 「添加新项」
2. 上传 `dist/jsontools-v<version>.zip`
3. 填写商品信息（从 `docs/store-listing.md` 复制）：
   - 名称 / 简短说明 / 详细描述
   - 类别：开发者工具
   - 图形资产：图标 / 小宣传图 / 大截图
   - 隐私政策 URL
4. 填写权限说明（从 `docs/store-listing.md` 的权限部分复制）
5. 勾选「不使用远程代码」「不收集个人信息」等声明
6. 提交审核

### 4.3 审核周期
- 通常 1-3 个工作日，新发布可能更长（最长见过 2-3 周）
- 状态查询：开发者控制台 → 项目详情
- 被拒会附原因，按提示修改后重新提交即可

---

## 五、发布到 Edge Add-ons（同步上架，几乎零成本）

1. 访问 https://partner.microsoft.com/dashboard/microsoftedge
2. 用微软账号注册开发者（**免费**）
3. 「创建新扩展」→ 上传**同一个** zip（manifest 无需修改）
4. 填写与 Chrome 类似的商店信息（可复用 `docs/store-listing.md` 文案）
5. 提交审核，通常 1-3 天

Edge 与 Chrome 同为 Chromium 内核，MV3 扩展完全兼容，无需改代码。

---

## 六、发布到 Firefox Add-ons（可选）

1. 访问 https://addons.mozilla.org/developers/
2. 注册开发者（免费）
3. 「提交新插件」→ 上传 zip
4. AMO 要求：如果代码经过打包/混淆，需额外上传可读源码。
   JSON Tools 是纯 vanilla JS、无构建，**直接上传即可**，无需额外源码包。
5. Firefox 支持 `chrome.*` 命名空间，大概率无需改代码；
   若遇到兼容问题，可加一行 polyfill 或改用 `browser.*`。
6. 审核通常 1-5 天

---

## 七、发布后维护

### 7.1 版本迭代
每次更新：
1. 改代码 + 本地测试
2. 递增 `manifest.json` 的 `version`
3. 重新运行 `./scripts/pack.sh`
4. 在 Chrome Web Store / Edge 开发者控制台 「上传新版本」

### 7.2 用户反馈
- Chrome Web Store 的「评价」和「支持」频道定期查看
- 在插件帮助面板已留「打赏作者」入口，可考虑加反馈邮箱或 GitHub Issues 链接

### 7.3 隐私政策维护
若新增权限或数据处理方式变更，同步更新 `docs/privacy.html` 并重新发布。

---

## 八、常见审核拒绝原因（避坑）

| 原因 | 应对 |
|---|---|
| 权限说明不充分 | `docs/store-listing.md` 的权限说明逐项填全，尤其 `scripting` |
| 缺隐私政策 | 用 `docs/privacy.html` 托管后填 URL |
| 描述与功能不符 | 详细描述只写实际有的功能，不吹 |
| 截图质量差 / 不对应 | 截图清晰、与描述功能一一对应 |
| 无用权限 | 已最小化（activeTab/scripting/storage 都是必要的） |
| 后台静默监控 | 本插件无此行为，无风险 |
| 版本号未递增 | `pack.sh` 会读 manifest 版本，确认已改 |

---

## 九、快速发布 Checklist（贴在每个版本的 PR 里）

```
- [ ] manifest.json version 已递增
- [ ] 本地 Chrome 加载未打包扩展，全功能冒烟通过
- [ ] 本地 Edge 加载未打包扩展，全功能冒烟通过
- [ ] Console 无报错
- [ ] 图标已替换为正式稿
- [ ] 截图已更新（若 UI 有变化）
- [ ] ./scripts/pack.sh 生成成功
- [ ] 隐私政策 URL 可访问
- [ ] 商店文案已校对
- [ ] 已上传 Chrome Web Store
- [ ] 已上传 Edge Add-ons
- [ ] （可选）已上传 Firefox AMO
```
