/** What to check when the first pageview doesn't arrive. */
export function InstallChecklist({ domain }: { domain: string }) {
  return (
    <div className="mt-5 border-t border-border pt-4">
      <h3 className="text-sm font-medium">No data yet? Check that:</h3>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
        <li>
          The snippet is inside the &lt;head&gt; of your pages (or your root
          layout in Next.js), and that version is deployed.
        </li>
        <li>
          You opened {domain} or www.{domain} exactly. Other subdomains and
          preview URLs are ignored.
        </li>
        <li>
          No ad blocker is blocking the script. Try a private window with
          extensions off.
        </li>
        <li>
          Your browser isn&apos;t showing a cached page. Hard refresh with
          Ctrl+Shift+R (Cmd+Shift+R on a Mac).
        </li>
      </ul>
    </div>
  )
}
