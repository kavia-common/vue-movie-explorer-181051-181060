# Security Improvements

This document describes the security headers and policies applied to the Movie Explorer SPA and how they mitigate common web vulnerabilities. It also includes guidance to deploy strict security headers at your CDN/server for production.

Contents
- Content-Security-Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Content-Type-Options
- X-Frame-Options and CSP frame-ancestors
- Referrer-Policy
- Permissions-Policy
- Production deployment guidance and examples

## 1) Content-Security-Policy (CSP)

Why it’s needed
- Limits the sources the app can load resources from, drastically reducing the risk of XSS and data exfiltration.
- Blocks mixed content, disallows plugin content (object-src), and restricts framing (via frame-ancestors).

What’s applied in index.html (meta)
The app ships with a meta CSP suitable for development/preview and production with minimal allowances:

```
default-src 'self';
base-uri 'self';
frame-ancestors 'self';
form-action 'self';
object-src 'none';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https://image.tmdb.org;
font-src 'self' data:;
connect-src 'self' https://api.themoviedb.org https://*.supabase.co wss://*.supabase.co ws: wss:;
manifest-src 'self';
upgrade-insecure-requests;
```

Notes and rationale
- self only by default; external allowances are whitelisted per directive.
- Supabase: https://*.supabase.co (REST, Auth, Realtime over HTTPS/WSS).
- TMDB: https://api.themoviedb.org (API requests) and https://image.tmdb.org (images).
- Vite dev/HMR: `ws:` and `wss:` are included to support local development. In production, prefer removing `ws:` and narrowing to only `wss://<your-prod-origin>` and `wss://<your-supabase-project>.supabase.co`.
- Inline styles: `'unsafe-inline'` for style-src supports Tailwind and framework-injected styles safely in this context. Avoid inline scripts; `script-src 'self'` is used without `'unsafe-inline'`.

Mitigations
- XSS: Blocks execution of scripts from unexpected origins and blocks inline scripts by default.
- Clickjacking: `frame-ancestors 'self'` prevents other sites from embedding this app.
- Mixed content: `upgrade-insecure-requests` ensures all subresources are requested over HTTPS.

Recommendation for production
- Serve CSP as an HTTP response header (reliable and can be more dynamic):
  - Remove `ws:` if not needed.
  - Pin `connect-src` Supabase to your exact project URL: `https://<project-ref>.supabase.co wss://<project-ref>.supabase.co`
  - Keep only the origins you actually use.

## 2) HTTP Strict Transport Security (HSTS)

Why it’s needed
- Forces browsers to use HTTPS for your site, preventing SSL stripping attacks.

Header
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

Notes
- Only send from HTTPS origins. Do not attempt to set via meta; it must be an HTTP header.
- Consider submitting your domain to the HSTS preload list after careful validation.

Mitigations
- Prevents downgrade/mixed-content risks and man-in-the-middle attacks on the first connection after the preload.

## 3) X-Content-Type-Options

Why it’s needed
- Prevents MIME type sniffing which can lead to executing untrusted content.

Header
```
X-Content-Type-Options: nosniff
```

Mitigations
- Blocks browsers from interpreting non-script content as script.

## 4) X-Frame-Options / frame-ancestors

Why it’s needed
- Prevents other sites from embedding your app in an iframe, mitigating clickjacking.

Options
- Prefer CSP `frame-ancestors 'self'` (already included).
- For legacy support, also set:
  ```
  X-Frame-Options: SAMEORIGIN
  ```

Mitigations
- Blocks clickjacking attacks by restricting who can frame your site.

## 5) Referrer-Policy

Why it’s needed
- Controls how much referrer information is sent to other origins.

Header (recommended)
```
Referrer-Policy: strict-origin-when-cross-origin
```

Notes
- A meta equivalent is included, but prefer HTTP header in production.

Mitigations
- Reduces leakage of full URLs (including query strings) to third parties.

## 6) Permissions-Policy

Why it’s needed
- Limits access to powerful web platform features.

Header (example aligned with this app’s needs)
```
Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=(), usb=(), accelerometer=(), gyroscope=(), magnetometer=(), midi=(), interest-cohort=(), browsing-topics=(), fullscreen=(self)
```

Notes
- A meta version is included for best-effort during dev/preview; use the HTTP header for production.

Mitigations
- Reduces attack surface by disabling unused features.

## Production Deployment Guidance

Meta tags are helpful for local dev and static previews, but not all headers can be set by meta (e.g., HSTS, X-Content-Type-Options, X-Frame-Options). In production, set headers at your CDN/app server.

Relevant environment variables
- VITE_SUPABASE_URL, VITE_SUPABASE_KEY, VITE_TMDB_API_KEY
- For a stricter CSP, pin `connect-src` to your exact Supabase project origin (from `VITE_SUPABASE_URL`) and remove generic `ws:`.

### NGINX example

```
add_header Content-Security-Policy "default-src 'self'; base-uri 'self'; frame-ancestors 'self'; form-action 'self'; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://image.tmdb.org; font-src 'self' data:; connect-src 'self' https://api.themoviedb.org https://<project-ref>.supabase.co wss://<project-ref>.supabase.co; manifest-src 'self'; upgrade-insecure-requests" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=(), payment=(), usb=(), accelerometer=(), gyroscope=(), magnetometer=(), midi=(), interest-cohort=(), browsing-topics=(), fullscreen=(self)" always;
```

### Vercel (vercel.json) example

```
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Content-Security-Policy", "value": "default-src 'self'; base-uri 'self'; frame-ancestors 'self'; form-action 'self'; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://image.tmdb.org; font-src 'self' data:; connect-src 'self' https://api.themoviedb.org https://<project-ref>.supabase.co wss://<project-ref>.supabase.co; manifest-src 'self'; upgrade-insecure-requests" },
        { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains; preload" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "geolocation=(), microphone=(), camera=(), payment=(), usb=(), accelerometer=(), gyroscope=(), magnetometer=(), midi=(), interest-cohort=(), browsing-topics=(), fullscreen=(self)" }
      ]
    }
  ]
}
```

### Netlify (_headers) example

```
/*
  Content-Security-Policy: default-src 'self'; base-uri 'self'; frame-ancestors 'self'; form-action 'self'; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://image.tmdb.org; font-src 'self' data:; connect-src 'self' https://api.themoviedb.org https://<project-ref>.supabase.co wss://<project-ref>.supabase.co; manifest-src 'self'; upgrade-insecure-requests
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=(), usb=(), accelerometer=(), gyroscope=(), magnetometer=(), midi=(), interest-cohort=(), browsing-topics=(), fullscreen=(self)
```

## Summary

- A strict CSP is included via meta for dev/preview/prod with minimal allowances to Supabase and TMDB.
- For production, set headers at your CDN/app server to:
  - Remove `ws:` from `connect-src` if not needed.
  - Pin Supabase to your project origin.
  - Add HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, and Permissions-Policy as HTTP headers.
