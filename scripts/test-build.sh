#!/bin/bash

# 测试Next.js构建脚本
# 用于验证静态导出配置是否正确

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ERROR: $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARNING: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] $1${NC}"
}

log "🧪 开始测试Next.js构建..."

# 检查环境变量
info "检查环境变量..."
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    error "NEXT_PUBLIC_SUPABASE_URL 未设置"
    exit 1
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    error "NEXT_PUBLIC_SUPABASE_ANON_KEY 未设置"
    exit 1
fi

log "✅ 环境变量检查通过"

# 清理旧文件
info "清理旧文件..."
rm -rf .next out

# 运行构建
log "🔨 开始构建..."
if npm run build; then
    log "✅ 构建成功！"
else
    error "构建失败"
    exit 1
fi

# 检查输出
info "检查输出文件..."

if [ ! -d ".next" ]; then
    error ".next 目录不存在"
    exit 1
fi

if [ ! -d "out" ]; then
    warn "out 目录不存在（可能是正常的，取决于配置）"
fi

# 统计生成的文件
log "📊 构建统计:"
echo "  .next 目录大小: $(du -sh .next | cut -f1)"

if [ -d "out" ]; then
    echo "  out 目录大小: $(du -sh out | cut -f1)"
    
    if [ -d "out/issues" ]; then
        issue_count=$(find out/issues -name "*.html" | wc -l)
        echo "  生成的issue页面: $issue_count 个"
    fi
    
    if [ -f "out/sitemap.xml" ]; then
        echo "  ✅ sitemap.xml 已生成"
    fi
fi

log "🎉 测试完成！"
log "💡 下一步: 运行 npm run preview-local 预览站点"
