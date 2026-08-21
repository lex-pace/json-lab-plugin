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

SIZE_KB=$(( $(stat -f%z "$PKG_PATH" 2>/dev/null || stat -c%s "$PKG_PATH") / 1024 ))
echo ""
echo "✅ 打包完成"
echo "   版本：v${VERSION}"
echo "   产物：${PKG_PATH}"
echo "   大小：约 ${SIZE_KB} KB"
echo ""
echo "下一步："
echo "  Chrome: https://chrome.google.com/webstore/devconsole/  → 添加新项 → 上传此 zip"
echo "  Edge:   https://partner.microsoft.com/dashboard/microsoftedge → 创建新扩展 → 上传此 zip"
