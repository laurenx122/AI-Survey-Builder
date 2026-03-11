import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Survey Builder',
  description: 'Upload a document, AI generates your survey questions instantly',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
