import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { SessionProvider } from 'next-auth/react'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: '族谱 · Zupu',
  description: '传承家族历史，记录每一位先辈',
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '28x28', type: 'image/png' },
      { url: '/icon-108.png', sizes: '108x108', type: 'image/png' },
    ],
    apple: { url: '/icon-108.png', sizes: '108x108', type: 'image/png' },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-stone-50 text-stone-900`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
