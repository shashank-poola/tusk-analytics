import type { Metadata } from "next"
import { Geist_Mono } from "next/font/google"
import localFont from "next/font/local"

import "@workspace/ui/globals.css"
import { ThemeProvider } from "@/components/providers/theme-provider"

export const metadata: Metadata = {
  title: "Viewtally",
  description: "Web analytics that links every payment to its traffic source.",
}

// Gellix is the brand typeface. Only the weights the UI uses are loaded.
const fontSans = localFont({
  src: [
    { path: "../public/font/Gellix-TRIAL-Regular.otf", weight: "400" },
    { path: "../public/font/Gellix-TRIAL-Medium.otf", weight: "500" },
    { path: "../public/font/Gellix-TRIAL-SemiBold.otf", weight: "600" },
    { path: "../public/font/Gellix-TRIAL-Bold.otf", weight: "700" },
  ],
  variable: "--font-sans",
  display: "swap",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
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
      className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased`}
    >
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
