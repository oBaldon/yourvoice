#!/usr/bin/env bash
set -euo pipefail
echo "Checklist rápido:"
echo "- VPN conectada?"
echo "- Você consegue pingar o IP da VPN do host?"
echo "- Abra http://IP_DA_VPN_DO_HOST:3000/health"
docker compose up --build