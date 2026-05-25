#!/usr/bin/env bash
# Bootstrap fastify-api on a fresh Debian 12 / Ubuntu 22+ VM behind Caddy.
# Usage:  ssh into VM  ->  sudo bash bootstrap.sh
#
# Idempotent: rerunning is safe.
#
# Required env vars (export before running, or paste them in /opt/fastify-api/backend/.env after):
#   DATABASE_URL, CLERK_DOMAIN, CLERK_SECRET_KEY

set -euo pipefail

REPO_URL="https://github.com/ayushpaharia/Fastify-API.git"
APP_DIR="/opt/fastify-api"
APP_USER="fastify"
NODE_MAJOR="22"

log() { printf "\033[1;36m▸\033[0m %s\n" "$*"; }

# -------- 0. sudo guard --------
if [[ $EUID -ne 0 ]]; then
	echo "Run with sudo." >&2
	exit 1
fi

# -------- 1. base packages --------
log "Installing base packages…"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq curl ca-certificates gnupg git ufw debian-keyring debian-archive-keyring apt-transport-https

# -------- 2. Node.js ${NODE_MAJOR} via NodeSource --------
if ! command -v node >/dev/null || [[ "$(node -v | cut -d. -f1)" != "v${NODE_MAJOR}" ]]; then
	log "Installing Node.js ${NODE_MAJOR}…"
	curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
	apt-get install -y -qq nodejs
fi
node -v

# -------- 3. Caddy (official APT repo) --------
if ! command -v caddy >/dev/null; then
	log "Installing Caddy…"
	curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
	curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
	apt-get update -qq
	apt-get install -y -qq caddy
fi

# Caddy rate_limit module (built into v2.7+). If older, build via xcaddy.
caddy version

# -------- 4. service user --------
if ! id "$APP_USER" >/dev/null 2>&1; then
	log "Creating user $APP_USER…"
	useradd --system --shell /usr/sbin/nologin --home "$APP_DIR" "$APP_USER"
fi

# -------- 5. clone / pull repo --------
if [[ -d "$APP_DIR/.git" ]]; then
	log "Repo exists, pulling latest…"
	su -s /bin/bash -c "cd '$APP_DIR' && git fetch --quiet origin && git reset --hard origin/main" "$APP_USER"
else
	log "Cloning repo…"
	install -d -o "$APP_USER" -g "$APP_USER" "$APP_DIR"
	su -s /bin/bash -c "git clone --depth=1 '$REPO_URL' '$APP_DIR'" "$APP_USER"
fi

# -------- 6. install + build --------
log "Installing deps + building…"
cd "$APP_DIR/backend"
su -s /bin/bash -c "cd '$APP_DIR/backend' && npm ci --omit=dev=false && npm run build" "$APP_USER"

# -------- 7. .env scaffold --------
if [[ ! -f "$APP_DIR/backend/.env" ]]; then
	log "Creating .env stub — FILL IT IN before starting the service"
	cat >"$APP_DIR/backend/.env" <<'EOF'
PORT=4000
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
CLERK_DOMAIN=your-clerk-domain.clerk.accounts.dev
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
EOF
	chown "$APP_USER:$APP_USER" "$APP_DIR/backend/.env"
	chmod 600 "$APP_DIR/backend/.env"
fi

# -------- 8. systemd unit --------
log "Installing systemd unit…"
install -m 644 "$APP_DIR/deploy/fastify-api.service" /etc/systemd/system/fastify-api.service
systemctl daemon-reload
systemctl enable fastify-api

# -------- 9. Caddy config --------
log "Installing Caddyfile…"
install -m 644 "$APP_DIR/deploy/Caddyfile" /etc/caddy/Caddyfile
install -d -o caddy -g caddy /var/log/caddy
systemctl reload caddy || systemctl restart caddy

# -------- 10. firewall --------
log "Configuring UFW…"
ufw --force reset >/dev/null
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 25565/tcp comment 'Minecraft'
ufw --force enable

# -------- done --------
cat <<EOF

────────────────────────────────────────────────────────────
✔ Bootstrap complete.

NEXT STEPS:
1. Edit /opt/fastify-api/backend/.env with real DATABASE_URL + Clerk keys
2. sudo systemctl start fastify-api
3. journalctl -u fastify-api -f      # watch logs
4. curl -I https://fastify-api.ayushpaharia.in/api/health

If Caddy says "no certificate", check Cloudflare DNS:
  - A  fastify-api  ->  $(curl -s ifconfig.me)
  - Proxy: DNS only (grey cloud) until cert issues, then flip to orange
  - SSL/TLS mode: Full (strict)
────────────────────────────────────────────────────────────
EOF
