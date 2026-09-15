#!/usr/bin/env bash
# JSON Tools 扩展打包脚本
# 用法：./scripts/pack.sh
# 产物：dist/jsontools-v<version>.zip（可直接上传到 Chrome Web Store / Edge Add-ons）
set -euo pipefail

# 脚本所在目录是 scripts/，项目根是其上级
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ ! -f manifest.json ]; then
  echo "错误：未在项目根目录找到 manifest.json（当前目录：$(pwd)）" >&2
  exit 1
fi

# 从 manifest.json 读取版本号（不依赖 jq，用 node 兼容性更好）
if ! command -v node >/dev/null 2>&1; then
  echo "错误：需要 node 来读取 manifest 版本号" >&2
  exit 1
fi
VERSION="$(node -e "console.log(require('./manifest.json').version)")"
if [ -z "$VERSION" ]; then
  echo "错误：无法从 manifest.json 读取 version" >&2
  exit 1
fi

DIST_DIR="$ROOT_DIR/dist"
PKG_NAME="jsontools-v${VERSION}.zip"
PKG_PATH="$DIST_DIR/$PKG_NAME"

mkdir -p "$DIST_DIR"
# 清掉旧的同版本包，避免混淆
rm -f "$PKG_PATH"

echo "📦 打包 JSON Tools v${VERSION} ..."

# 关键：zip 根目录必须是 manifest.json 所在层，不能外面再套文件夹
# 排除开发期产物和与运行无关的文件
zip -r -q "$PKG_PATH" . \
  -x "dist/*" \
  -x "scripts/*" \
  -x "docs/*" \
  -x "keys/*" \
  -x ".git/*" \
  -x ".gitignore" \
  -x ".DS_Store" \
  -x "**/.DS_Store" \
  -x "*.md" \
  -x "node_modules/*" \
  -x "gui-test-screenshots/*"

# 校验产物里是否真的有 manifest.json 在根层（不能在任何子目录下）
if ! unzip -l "$PKG_PATH" | awk '{print $4}' | grep -qx "manifest.json"; then
  echo "❌ 校验失败：zip 包内未在根层找到 manifest.json" >&2
  echo "   包内文件清单：" >&2
  unzip -l "$PKG_PATH" | head -20 >&2
  exit 1
fi

# 安全校验：签名私钥绝不能进入发布包
if unzip -l "$PKG_PATH" | awk '{print $4}' | grep -q "^keys/"; then
  echo "❌ 校验失败：zip 包内混入了签名私钥（keys/），请检查打包排除规则" >&2
  exit 1
fi

SIZE_KB=$(( $(stat -f%z "$PKG_PATH" 2>/dev/null || stat -c%s "$PKG_PATH") / 1024 ))

# ---------- 生成 .crx（Chrome 官网外直接安装包，CRX3 格式）----------
# 用 Chrome 自带的 --pack-extension 对 payload 签名。payload 直接解压刚打好的 zip，
# 保证 .crx 与商店 zip 内容完全一致。
# 私钥固定在 keys/json-lab.pem：扩展 ID 由公钥派生，首装后保持不变，
# 后续版本（同名 ID 签名）可平滑升级。私钥务必保密，不要提交到仓库。
CRX_NAME="json-lab-v${VERSION}.crx"
CRX_PATH="$DIST_DIR/$CRX_NAME"

find_chrome() {
  if [ -n "${CHROME_BIN:-}" ] && [ -x "${CHROME_BIN}" ]; then
    echo "${CHROME_BIN}"; return 0
  fi
  local candidate
  for candidate in \
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" \
    "/Applications/Chromium.app/Contents/MacOS/Chromium" \
    "$(command -v google-chrome 2>/dev/null || true)" \
    "$(command -v chromium 2>/dev/null || true)"; do
    if [ -n "$candidate" ] && [ -x "$candidate" ]; then
      echo "$candidate"; return 0
    fi
  done
  return 1
}

CRX_KB=""
if CHROME_RESOLVED="$(find_chrome)"; then
  echo "🔐 打包已签名 .crx ..."
  CRX_STAGE="$(mktemp -d)"
  unzip -q "$PKG_PATH" -d "$CRX_STAGE"
  CRX_KEY="$ROOT_DIR/keys/json-lab.pem"
  PACK_ARGS=(--no-sandbox --pack-extension="$CRX_STAGE")
  if [ -f "$CRX_KEY" ]; then
    PACK_ARGS+=(--pack-extension-key="$CRX_KEY")
  fi
  # Chrome --pack-extension 成功时也可能返回非零退出码，这里不校验退出码，只看产物文件
  "$CHROME_RESOLVED" "${PACK_ARGS[@]}" >/dev/null 2>&1 || true
  if [ ! -f "$CRX_KEY" ] && [ -f "$CRX_STAGE.pem" ]; then
    mkdir -p "$ROOT_DIR/keys"
    mv "$CRX_STAGE.pem" "$CRX_KEY"
    echo "   已生成签名私钥：keys/json-lab.pem（请备份，切勿提交或分发）"
  fi
  if [ -f "$CRX_STAGE.crx" ]; then
    mv "$CRX_STAGE.crx" "$CRX_PATH"
    CRX_KB=$(( $(stat -f%z "$CRX_PATH" 2>/dev/null || stat -c%s "$CRX_PATH") / 1024 ))
  fi
  rm -rf "$CRX_STAGE"
else
  echo "⚠️  未找到 Chrome/Edge/Chromium，跳过 .crx 打包（可用 CHROME_BIN=... 指定浏览器路径）"
fi

echo ""
echo "✅ 打包完成"
echo "   版本：v${VERSION}"
echo "   产物：${PKG_PATH}（约 ${SIZE_KB} KB，商店上传用）"
if [ -n "$CRX_KB" ]; then
  echo "         ${CRX_PATH}（约 ${CRX_KB} KB，Chrome 官网直接安装用）"
fi
echo ""
echo "下一步："
echo "  Chrome: https://chrome.google.com/webstore/devconsole/  → 添加新项 → 上传此 zip"
echo "  Edge:   https://partner.microsoft.com/dashboard/microsoftedge → 创建新扩展 → 上传此 zip"
echo "  官网:   把 dist/ 下的 zip 和 crx 一并复制到 docs/downloads/ 并更新 index.html 里的文件名"
