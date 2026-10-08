# @usetusk/analytics

Tusk web analytics for app code: adds the tracking script once and sends
goals. It does the same thing as the install snippet, from JavaScript.

```bash
npm i @usetusk/analytics
```

```ts
import { initTusk, track } from "@usetusk/analytics"

// Once, in your root layout or app entry. Does nothing on the server.
initTusk({ siteId: "vt_3k9x2m7qpd4n8r1t" })

// When something worth counting happens.
track("signup")
```

Options for `initTusk`:

| Option           | What it does                                                                   |
| ---------------- | ------------------------------------------------------------------------------ |
| `siteId`         | Your site's id from the Tusk dashboard.                                        |
| `cookieless`     | No cookies. Each page load counts as a new visitor: best for single-page apps. |
| `allowLocalhost` | Count visits on localhost while you test.                                      |
| `scriptUrl`      | A proxied or self-hosted copy of the script.                                   |

Goal names are lowercase letters, digits, `-` and `_`, up to 64
characters. Never put personal data (emails, names) in them.
