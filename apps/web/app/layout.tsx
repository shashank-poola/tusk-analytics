import type { Metadata } from "next"
import { JetBrains_Mono } from "next/font/google"
import localFont from "next/font/local"

import "@workspace/ui/globals.css"
import { ThemeProvider } from "@/components/providers/theme-provider"

export const metadata: Metadata = {
  // Tabs truncate from the right, so the specific part (a site's domain,
  // "Settings") comes first and the brand last: "shashank.ink · Tusk".
  title: { template: "%s · Tusk", default: "Tusk" },
  description: "Web analytics that links every payment to its traffic source.",
}

// Feather Bold (headings) has a single weight; Fredoka (everything else)
// loads only the weights the UI uses.
const fontHeading = localFont({
  src: "../public/font/feather-bold/Duolingo Feather Bold.ttf",
  weight: "700",
  variable: "--font-feather",
  display: "swap",
  fallback: ["Baloo 2", "system-ui", "sans-serif"],
})

const fontBody = localFont({
  src: [
    { path: "../public/font/fredoka/Fredoka-Regular.ttf", weight: "400" },
    { path: "../public/font/fredoka/Fredoka-Medium.ttf", weight: "500" },
    { path: "../public/font/fredoka/Fredoka-SemiBold.ttf", weight: "600" },
  ],
  variable: "--font-fredoka",
  display: "swap",
})

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fontHeading.variable} ${fontBody.variable} ${fontMono.variable} font-sans antialiased`}
    >
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
