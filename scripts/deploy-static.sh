#!/bin/bash

# 静态站点部署脚本
# 用于构建和部署静态站点到各种平台

set -e  # 遇到错误时退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

# 检查环境变量
check_env() {
    log "检查环境变量..."
    
    if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
        error "NEXT_PUBLIC_SUPABASE_URL 未设置"
        exit 1
    fi
    
    if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
        error "NEXT_PUBLIC_SUPABASE_ANON_KEY 未设置"
        exit 1
    fi
    
    log "✅ 环境变量检查通过"
}

# 清理旧文件
cleanup() {
    log "清理旧文件..."
    
    if [ -d "out" ]; then
        rm -rf out
        log "✅ 清理完成"
    fi
}

# 构建Next.js应用
build_nextjs() {
    log "构建Next.js应用..."
    
    npm run build
    
    if [ $? -eq 0 ]; then
        log "✅ Next.js构建完成"
    else
        error "Next.js构建失败"
        exit 1
    fi
}

# 生成静态页面
generate_static() {
    log "生成静态页面..."
    
    # 使用高级脚本生成静态页面
    npm run generate-static-advanced
    
    if [ $? -eq 0 ]; then
        log "✅ 静态页面生成完成"
    else
        error "静态页面生成失败"
        exit 1
    fi
}

# 验证生成的文件
verify_output() {
    log "验证生成的文件..."
    
    if [ ! -d "out" ]; then
        error "输出目录不存在"
        exit 1
    fi
    
    if [ ! -f "out/sitemap.xml" ]; then
        error "sitemap.xml不存在"
        exit 1
    fi
    
    # 统计生成的文件数量
    local issue_count=$(find out/issues -name "*.html" 2>/dev/null | wc -l)
    log "📊 生成了 $issue_count 个issue页面"
    
    log "✅ 文件验证通过"
}

# 压缩文件
compress_output() {
    log "压缩输出文件..."
    
    if command -v gzip &> /dev/null; then
        find out -name "*.html" -exec gzip -k {} \;
        find out -name "*.xml" -exec gzip -k {} \;
        find out -name "*.css" -exec gzip -k {} \;
        find out -name "*.js" -exec gzip -k {} \;
        log "✅ 文件压缩完成"
    else
        warn "gzip未安装，跳过压缩"
    fi
}

# 生成部署报告
generate_report() {
    log "生成部署报告..."
    
    local report_file="out/deployment-report.txt"
    local timestamp=$(date)
    local issue_count=$(find out/issues -name "*.html" 2>/dev/null | wc -l)
    local total_size=$(du -sh out | cut -f1)
    
    cat > "$report_file" << EOF
# 部署报告

**生成时间**: $timestamp
**总文件数**: $issue_count 个issue页面
**输出大小**: $total_size
**包含文件**:
- sitemap.xml
- issues/*.html (${issue_count} 个文件)
- 其他Next.js静态文件

**环境信息**:
- Node.js版本: $(node --version)
- NPM版本: $(npm --version)
- 构建时间: $(date)

**部署说明**:
1. 将 out/ 目录下的所有文件上传到Web服务器
2. 确保服务器支持HTML5 History API（用于客户端路由）
3. 配置服务器支持gzip压缩（如果使用了压缩）
4. 设置适当的缓存头

**验证步骤**:
1. 访问首页确认正常加载
2. 检查sitemap.xml是否可访问
3. 测试几个issue页面是否正常显示
4. 验证移动端响应式设计

EOF

    log "✅ 部署报告已生成: $report_file"
}

# 部署到Vercel
deploy_vercel() {
    if command -v vercel &> /dev/null; then
        log "部署到Vercel..."
        vercel --prod
        log "✅ Vercel部署完成"
    else
        warn "Vercel CLI未安装，跳过Vercel部署"
    fi
}

# 部署到Netlify
deploy_netlify() {
    if command -v netlify &> /dev/null; then
        log "部署到Netlify..."
        netlify deploy --prod --dir=out
        log "✅ Netlify部署完成"
    else
        warn "Netlify CLI未安装，跳过Netlify部署"
    fi
}

# 本地预览
preview_local() {
    log "启动本地预览服务器..."
    
    if command -v serve &> /dev/null; then
        log "使用serve启动预览服务器..."
        serve out -p 3001
    elif command -v python3 &> /dev/null; then
        log "使用Python启动预览服务器..."
        cd out && python3 -m http.server 3001
    else
        warn "没有找到合适的预览服务器，请手动启动"
        log "输出目录: $(pwd)/out"
    fi
}

# 主函数
main() {
    log "🚀 开始静态站点部署流程..."
    
    # 解析命令行参数
    local deploy_target=""
    local skip_build=false
    local preview_only=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --vercel)
                deploy_target="vercel"
                shift
                ;;
            --netlify)
                deploy_target="netlify"
                shift
                ;;
            --preview)
                preview_only=true
                shift
                ;;
            --skip-build)
                skip_build=true
                shift
                ;;
            --help)
                echo "用法: $0 [选项]"
                echo "选项:"
                echo "  --vercel      部署到Vercel"
                echo "  --netlify     部署到Netlify"
                echo "  --preview     仅启动本地预览"
                echo "  --skip-build  跳过构建步骤"
                echo "  --help        显示此帮助信息"
                exit 0
                ;;
            *)
                error "未知选项: $1"
                exit 1
                ;;
        esac
    done
    
    # 检查环境
    check_env
    
    if [ "$preview_only" = true ]; then
        if [ -d "out" ]; then
            preview_local
        else
            error "输出目录不存在，请先运行构建"
            exit 1
        fi
        return
    fi
    
    # 清理旧文件
    cleanup
    
    # 构建和生成
    if [ "$skip_build" = false ]; then
        build_nextjs
        generate_static
    else
        log "跳过构建步骤"
        generate_static
    fi
    
    # 验证和压缩
    verify_output
    compress_output
    
    # 生成报告
    generate_report
    
    # 部署
    case $deploy_target in
        "vercel")
            deploy_vercel
            ;;
        "netlify")
            deploy_netlify
            ;;
        "")
            log "🎉 构建完成！输出目录: $(pwd)/out"
            log "💡 使用 --preview 启动本地预览"
            log "💡 使用 --vercel 或 --netlify 部署到云平台"
            ;;
    esac
    
    log "✅ 部署流程完成！"
}

# 运行主函数
main "$@"
