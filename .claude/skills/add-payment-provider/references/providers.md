# Provider signature schemes

Written from memory, **not checked against current provider docs**. Before
implementing a provider, open its webhook docs and confirm the header names,
signed string and encoding below; update this file if anything changed.

| Provider      | Header(s)                                              | Signed string                   | Algorithm / encoding                               | Idempotency key              |
| ------------- | ------------------------------------------------------ | ------------------------------- | -------------------------------------------------- | ---------------------------- |
| Stripe        | `Stripe-Signature: t=<ts>,v1=<sig>`                    | `${t}.${rawBody}`               | HMAC-SHA256, hex; several `v1` may be present      | event `id` (`evt_…`)         |
| Polar, Dodo   | `webhook-id`, `webhook-timestamp`, `webhook-signature` | `${id}.${timestamp}.${rawBody}` | Standard Webhooks: HMAC-SHA256, base64, `v1,<sig>` | `webhook-id` header          |
| Paddle        | `Paddle-Signature: ts=<ts>;h1=<sig>`                   | `${ts}:${rawBody}`              | HMAC-SHA256, hex                                   | `event_id` in body           |
| Lemon Squeezy | `X-Signature`                                          | `rawBody`                       | HMAC-SHA256, hex                                   | none: hash of raw body       |
| Razorpay      | `X-Razorpay-Signature`, `x-razorpay-event-id`          | `rawBody`                       | HMAC-SHA256, hex                                   | `x-razorpay-event-id` header |

Standard Webhooks secrets look like `whsec_<base64>`: strip the prefix and
base64-decode to get the key bytes.

## Verifying with WebCrypto

```ts
/** Constant-time: subtle.verify compares; never `===` two signature strings. */
async function verifyHmacSha256(
  secret: Uint8Array, // key bytes
  signedString: string,
  signature: Uint8Array // decoded from the header's hex or base64
): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    secret,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  )
  return crypto.subtle.verify(
    "HMAC",
    key,
    signature,
    new TextEncoder().encode(signedString)
  )
}
```

For Stripe, try each `v1` value and accept if any verifies.

Providers without a timestamp (Lemon Squeezy, Razorpay) can't be protected
against replay by the signature alone; the idempotency key in
`webhook_events` makes replays harmless instead.
