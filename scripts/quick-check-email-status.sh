#!/bin/bash

# 快速查询邮件状态的脚本
# 用法: ./scripts/quick-check-email-status.sh "<messageId>"

MESSAGE_ID="$1"

if [ -z "$MESSAGE_ID" ]; then
    echo "❌ 错误: 请提供 messageId"
    echo "用法: ./scripts/quick-check-email-status.sh \"<messageId>\""
    echo "示例: ./scripts/quick-check-email-status.sh \"<202511031135.69929651882@smtp-relay.mailin.fr>\""
    exit 1
fi

echo "🔍 查询邮件状态..."
echo "Message ID: $MESSAGE_ID"
echo ""
echo "📋 在 Brevo 后台查询步骤:"
echo "   1. 访问: https://app.brevo.com/statistics/transactional"
echo "   2. 在搜索栏输入: $MESSAGE_ID"
echo "   3. 查看详细的发送状态和事件历史"
echo ""
echo "💡 或者使用脚本查询:"
echo "   node scripts/check-email-status.js \"$MESSAGE_ID\""
