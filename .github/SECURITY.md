# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 2.x     | Yes       |
| < 2.0   | No        |

## Reporting a Vulnerability

If you discover a security vulnerability in terlik.js, please report it responsibly:

1. **Do NOT open a public issue.**
2. Email **badursun@gmail.com** with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
3. You will receive a response within 48 hours.

## Known Security Measures

- **ReDoS protection** — All regex patterns are bounded with `{0,3}` separators and 250ms timeout safety nets.
- **Input length limit** — `maxLength` option (default: 10,000 chars) prevents oversized input abuse.
- **No eval/Function** — No dynamic code execution anywhere in the codebase.
- **Zero dependencies** — No supply chain attack surface from third-party packages.
