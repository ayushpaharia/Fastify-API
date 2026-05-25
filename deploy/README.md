# Deploy: Fastify-API on GCP VM behind Caddy

Single-VM deploy. Auto-HTTPS via Caddy, supervised by systemd, hardened with UFW.
Same VM also runs Minecraft (`mc.ayushpaharia.in:25565`) — does not interfere.

## TL;DR

```bash
# 1. From your laptop — SSH into the VM
gcloud compute ssh <vm-name> --zone=<zone>     # or: ssh <user>@35.207.255.63

# 2. On the VM
curl -fsSL https://raw.githubusercontent.com/ayushpaharia/Fastify-API/main/deploy/bootstrap.sh | sudo bash

# 3. Fill in env
sudo nano /opt/fastify-api/backend/.env

# 4. Start
sudo systemctl start fastify-api
sudo journalctl -u fastify-api -f
```

## Cloudflare DNS

| Type | Name          | Content          | Proxy        |
|------|---------------|------------------|--------------|
| A    | `fastify-api` | `<VM_PUBLIC_IP>` | DNS only ⚪ → flip to 🟠 after first cert issue |

SSL/TLS mode: **Full (strict)**.

## What the bootstrap does

1. Installs Node 22, Caddy, git, UFW.
2. Creates a non-login `fastify` system user.
3. Clones the repo into `/opt/fastify-api`.
4. `npm ci && npm run build` in `backend/`.
5. Scaffolds `.env` (you fill it in).
6. Installs `fastify-api.service` systemd unit (memory cap 512MB, CPU 80%, restart on-failure).
7. Installs `Caddyfile` with auto-HTTPS + per-IP edge rate-limit + HSTS + JSON logs.
8. UFW: deny in, allow 22/80/443/25565.

## Rate limiting in depth

Two layers — both enforced:

**Caddy (edge)** — 60 req/min/IP, blocks before reaching Node. `Caddyfile`.

**Fastify (app)** — keyed by `userId || req.ip` (Caddy passes `X-Forwarded-For`, `trustProxy: true` in `src/index.ts` makes Fastify trust it):
- 15 req/min reads
- 5 req/min writes
- 2 req/min on `/api/ingest`, `POST /api/webhooks/:id/test`
- `/api/health` exempt
- 3 strikes → 403 ban (in-memory; clears on restart)
- 256 KB body cap

## Updating

```bash
sudo -u fastify bash -c 'cd /opt/fastify-api && git pull && cd backend && npm ci && npm run build'
sudo systemctl restart fastify-api
```

## Operational

```bash
systemctl status fastify-api
journalctl -u fastify-api -f --since "10 min ago"
tail -f /var/log/caddy/fastify-api.log | jq
caddy validate --config /etc/caddy/Caddyfile
```

## Notes

- DB is **Neon** (managed). Nothing local-postgres on the VM.
- No swap, no in-memory queue — `bodyLimit: 256KB`, `cache: 10k` keys in rate-limit LRU.
- Minecraft on 25565 is untouched. Caddy doesn't bind it.
- If Caddy `rate_limit` directive fails: your Caddy is <2.7. Either upgrade or remove that block — Fastify limits are sufficient.
