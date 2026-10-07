import { MotionProvider } from "@/components/providers/motion-provider"

import { SiteFooter } from "@/features/marketing/components/site-footer"
import { SiteHeader } from "@/features/marketing/components/site-header"

/** The public pages: the landing header on top. Signed-in visitors never see "/" (proxy.ts). */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MotionProvider>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </MotionProvider>
  )
}
