# SSL Certificate Renewal Guide

## Certificate Status

| Property | Value |
|----------|-------|
| **Domain** | portal.srpsid-dss.gos.pk |
| **Status** | Active ✅ |
| **Last Renewed** | 2026-05-15 |
| **Expiry Date** | 2026-08-13 10:57:37 UTC |
| **Days Valid** | 90 days |
| **Auth Method** | DNS-01 (Manual) |

## Renewal Timeline

- **Next Renewal**: ~July 15, 2026 (30 days before expiry)
- **Set Calendar Reminder**: June 15, 2026

## How to Renew

### Step 1: SSH to Server

```bash
ssh umair@10.0.0.205
```

### Step 2: Run Renewal Command

```bash
sudo certbot certonly --manual --preferred-challenges dns -d portal.srpsid-dss.gos.pk --force-renewal
```

### Step 3: Add DNS TXT Record

The command will display a token like:

```
_acme-challenge.portal.srpsid-dss.gos.pk
<YOUR_TOKEN_HERE>
```

Add this to your DNS Zone Editor at privateserver.com:
- **Type**: TXT
- **Name**: `_acme-challenge.portal.srpsid-dss.gos.pk`
- **Value**: The token shown

### Step 4: Press Enter to Continue

After adding the DNS record, press Enter in the terminal.

### Step 5: Reload Apache

```bash
sudo systemctl reload apache2
```

### Step 6: Verify

```bash
sudo certbot certificates
curl -I https://portal.srpsid-dss.gos.pk
```

### Step 7: Clean Up

Delete the `_acme-challenge.portal.srpsid-dss.gos.pk` TXT record from DNS (no longer needed).

## Server Credentials

| Credential | Value |
|------------|-------|
| **Host** | 10.0.0.205 |
| **User** | umair |
| **Sudo Password** | maltanadirSRV0 |
| **SSH Password** | maltanadirSRV0 |

## Certificate Paths

| File | Path |
|------|------|
| **Full Chain** | `/etc/letsencrypt/live/portal.srpsid-dss.gos.pk/fullchain.pem` |
| **Private Key** | `/etc/letsencrypt/live/portal.srpsid-dss.gos.pk/privkey.pem` |
| **Renewal Config** | `/etc/letsencrypt/renewal/portal.srpsid-dss.gos.pk.conf` |

## Why Manual DNS?

HTTP-01 validation (automatic renewal) is blocked by firewall/NAT at the public IP (124.29.217.193). Let's Encrypt cannot reach the server on port 80 from the internet.

## Troubleshooting

### Rate Limit Exceeded

If you see: "too many failed authorizations", wait 1 hour and try again.

### DNS Not Propagating

Wait 2-5 minutes after adding the TXT record before pressing Enter. You can check propagation at:
https://toolbox.googleapps.com/apps/dig/#TXT/_acme-challenge.portal.srpsid-dss.gos.pk

### Apache Not Using New Certificate

```bash
sudo systemctl restart apache2
```

## Automation Hook (Optional)

An auth hook script exists at `/etc/letsencrypt/renewal-hooks/auth/dns-token.sh` but manual renewal is simpler and more reliable.
