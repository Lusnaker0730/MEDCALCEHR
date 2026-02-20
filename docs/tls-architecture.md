# TLS Architecture

**Product:** MEDCALCEHR
**Version:** 1.0.0

---

## 1. Architecture Overview

MEDCALCEHR uses **TLS termination at the reverse proxy / Application Load Balancer (ALB)** level. The Nginx container serves content over HTTP internally, while all external traffic is encrypted.

```
┌─────────────┐      HTTPS (TLS 1.2+)      ┌──────────────┐      HTTP (port 80)     ┌──────────────┐
│   Browser    │ ──────────────────────────→ │  ALB / Proxy │ ──────────────────────→ │    Nginx     │
│  (Client)    │ ←────────────────────────── │ (TLS Term.)  │ ←────────────────────── │ (Container)  │
└─────────────┘                              └──────────────┘                         └──────────────┘
     ▲                                              │
     │                                              │
     └── HSTS header enforces future HTTPS ─────────┘
```

---

## 2. TLS Configuration

### 2.1 ALB / Reverse Proxy Responsibilities

| Responsibility | Configuration |
|---------------|---------------|
| TLS Termination | TLS 1.2 minimum, TLS 1.3 preferred |
| Certificate Management | Hospital CA or Let's Encrypt (auto-renewal) |
| Cipher Suites | Modern cipher suites only (ECDHE, AES-GCM) |
| OCSP Stapling | Enabled for certificate validation performance |
| HTTP→HTTPS Redirect | ALB listener rule or Nginx `X-Forwarded-Proto` check |

### 2.2 Recommended Cipher Suites

```
TLS_AES_256_GCM_SHA384
TLS_AES_128_GCM_SHA256
TLS_CHACHA20_POLY1305_SHA256
ECDHE-RSA-AES256-GCM-SHA384
ECDHE-RSA-AES128-GCM-SHA256
```

---

## 3. Nginx Configuration

Nginx receives traffic from the ALB over HTTP and enforces security headers:

### 3.1 Proxy Trust

```nginx
# Trust internal network ranges for X-Forwarded-For
set_real_ip_from 10.0.0.0/8;
set_real_ip_from 172.16.0.0/12;
set_real_ip_from 192.168.0.0/16;
real_ip_header X-Forwarded-For;
real_ip_recursive on;
```

### 3.2 HTTP→HTTPS Redirect

```nginx
# Redirect HTTP to HTTPS when behind ALB/proxy
if ($http_x_forwarded_proto = "http") {
    return 301 https://$host$request_uri;
}
```

### 3.3 Security Headers

| Header | Value | Purpose |
|--------|-------|---------|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Force HTTPS for 1 year |
| `X-Frame-Options` | `SAMEORIGIN` | Prevent clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevent MIME sniffing |
| `X-XSS-Protection` | `1; mode=block` | Legacy XSS protection |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limit referrer information |
| `Permissions-Policy` | `geolocation=(), microphone=(), camera=()` | Restrict browser APIs |
| `Content-Security-Policy` | See ARCHITECTURE.md Section 5.3 | XSS and injection prevention |

---

## 4. Certificate Management

### 4.1 Hospital CA (Recommended for Internal Use)

| Aspect | Configuration |
|--------|---------------|
| Certificate Authority | Hospital IT PKI or institutional CA |
| Certificate Type | Server certificate for application domain |
| Key Length | RSA 2048+ or ECDSA P-256+ |
| Validity | 1-2 years (hospital policy) |
| Renewal | Manual renewal via hospital IT process |
| Storage | ALB certificate manager or reverse proxy config |

### 4.2 Let's Encrypt (Alternative for Internet-Facing)

| Aspect | Configuration |
|--------|---------------|
| ACME Client | certbot or ALB auto-renewal |
| Renewal | Automatic every 60 days |
| Challenge Type | HTTP-01 or DNS-01 |

---

## 5. CSP Domain Whitelist

The Content-Security-Policy `connect-src` directive must include the FHIR server domain:

```
connect-src 'self'
  https://launch.smarthealthit.org
  https://*.smarthealthit.org
  https://*.cerner.com
  https://*.sentry.io
  https://*.ingest.sentry.io
  https://<HOSPITAL-FHIR-SERVER>    # Add actual FHIR server domain at deployment
```

> **Action Required**: At deployment, replace wildcard domains with the specific hospital FHIR server domain to narrow the CSP whitelist.

---

## 6. Verification

### 6.1 TLS Verification Commands

```bash
# Verify TLS version and cipher
openssl s_client -connect <host>:443 -tls1_2

# Check HSTS header
curl -I https://<host>/ | grep -i strict-transport

# Verify HTTP redirect
curl -I -H "X-Forwarded-Proto: http" http://localhost/ | grep -i location

# Full SSL Labs scan (if internet-facing)
# https://www.ssllabs.com/ssltest/
```

### 6.2 Docker Test

```bash
docker compose up -d
curl -H "X-Forwarded-Proto: http" http://localhost:8080/
# Expected: 301 redirect to https://
```
