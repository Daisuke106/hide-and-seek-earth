# Security Considerations

## webpack-dev-server Vulnerability (CVE)

### Issue
- webpack-dev-server <= 5.2.0 has a vulnerability that allows source code theft when accessing malicious websites
- The vulnerability affects development mode only, not production builds

### Current Status
- Using webpack-dev-server 4.15.2 (vulnerable version)
- Cannot upgrade to 5.2.1+ due to compatibility issues with react-scripts 5.0.1

### Mitigation Measures
1. **Development Environment Security**:
   - Use unpredictable ports (avoid default 3000, 8080)
   - Limit development server to localhost only
   - Do not expose development server to external networks

2. **Developer Guidelines**:
   - Never run development server on production systems
   - Be cautious when browsing untrusted websites while dev server is running
   - Use HTTPS for development when possible

### Recommended Actions
1. Monitor for react-scripts updates that support webpack-dev-server 5.2.1+
2. Consider ejecting from react-scripts if security is critical
3. Use production builds for any public-facing deployments

### Production Safety
- Production builds are NOT affected by this vulnerability
- Only development mode with webpack-dev-server is vulnerable