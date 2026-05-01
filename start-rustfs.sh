#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="${SCRIPT_DIR}/files"
CREDS_FILE="${SCRIPT_DIR}/.rustfs-credentials"

# 创建挂载目录
mkdir -p "${DATA_DIR}"

# 生成随机 AK/SK（如果凭证文件不存在则重新生成）
if [[ ! -f "${CREDS_FILE}" ]]; then
    ACCESS_KEY=$(openssl rand -hex 10)
    SECRET_KEY=$(openssl rand -hex 20)
    cat > "${CREDS_FILE}" <<EOF
ACCESS_KEY=${ACCESS_KEY}
SECRET_KEY=${SECRET_KEY}
EOF
    chmod 600 "${CREDS_FILE}"
    echo "✅ 已生成新的凭证文件: ${CREDS_FILE}"
else
    echo "ℹ️  使用已有凭证文件: ${CREDS_FILE}"
fi

# 读取凭证
source "${CREDS_FILE}"

echo "========================================="
echo "  RustFS 本地服务"
echo "========================================="
echo "  端口:       9009"
echo "  数据目录:   ${DATA_DIR}"
echo "  Access Key: ${ACCESS_KEY}"
echo "  Secret Key: ${SECRET_KEY}"
echo "========================================="

exec rustfs \
    --address ":9009" \
    --access-key "${ACCESS_KEY}" \
    --secret-key "${SECRET_KEY}" \
    --console-enable \
    "${DATA_DIR}"
