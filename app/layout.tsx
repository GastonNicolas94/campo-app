import type { Metadata } from "next"
import { DM_Sans, Syne } from "next/font/google"
import "./globals.css"

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
})

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
})

export const metadata: Metadata = {
  title: "Campo App",
  description: "Gestión agrícola",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`${dmSans.variable} ${syne.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
