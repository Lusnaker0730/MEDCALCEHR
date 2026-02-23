# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in MEDCALCEHR, please report it responsibly.

### How to Report

1. **Do NOT** open a public GitHub issue for security vulnerabilities.
2. Email your report to the project maintainers with the subject line: `[SECURITY] MEDCALCEHR Vulnerability Report`.
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact assessment
   - Suggested fix (if any)

### Response Timeline

- **Acknowledgment**: Within 48 hours of report submission
- **Initial Assessment**: Within 5 business days
- **Critical Fix**: Within 7 days for critical/high severity
- **Regular Fix**: Within 30 days for medium/low severity

### What to Expect

- You will receive an acknowledgment with a tracking reference
- We will keep you informed of progress toward a fix
- We will credit you in the security advisory (unless you prefer anonymity)
- We will not take legal action against researchers acting in good faith

## Scope

The following are in scope for security reports:

- Authentication and authorization flaws (SMART on FHIR OAuth flow)
- Patient data exposure or PHI leakage
- Cross-site scripting (XSS) or injection vulnerabilities
- Container escape or privilege escalation
- Insecure configuration defaults
- Dependency vulnerabilities with exploitable impact

The following are **out of scope**:

- Vulnerabilities in upstream EHR systems
- Social engineering attacks
- Denial of service (rate limiting is in place)
- Issues in development/test configurations only

## Security Measures

MEDCALCEHR implements the following security controls:

- **Content Security Policy (CSP)**: Restricts script/style/connect sources
- **Security Headers**: HSTS, X-Frame-Options, X-Content-Type-Options, COOP, CORP
- **Input Sanitization**: All environment variables validated and sanitized at startup
- **Non-root Container**: Application runs as unprivileged `nginx` user
- **Rate Limiting**: Nginx rate limiting on all endpoints with healthcheck exemption
- **Session Management**: Configurable timeout with idle detection
- **PHI Protection**: Structured logging with automatic PHI stripping
- **Dependency Scanning**: Automated via Dependabot and Trivy in CI/CD
- **AES-GCM Encryption**: Client-side encryption for sensitive cached data
- **Container Hardening**: Dropped capabilities, no-new-privileges, resource limits
