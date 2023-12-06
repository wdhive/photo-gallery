import '/styles/global.css'

import { Metadata } from 'next'
import { Inter } from 'next/font/google'
import LocalFont from 'next/font/local'
import { Provider } from '/context'

export const metadata: Metadata = {
  title: {
    default: 'Photo Gallery',
    template: '%s | Photo Gallery',
  },
}

const mark = LocalFont({
  src: '../public/fonts/mark-pro-font/mark-pro-heavy.otf',
  variable: '--font-mark-pro',
  preload: true,
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  preload: true,
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={[inter.variable, mark.variable].join(' ')}>
      <body
        className={`bg-black ${
          process.env.NODE_ENV === 'development' ? 'debug-screens' : undefined
        }`}
      >
        <Provider>{children}</Provider>
      </body>
    </html>
  )
}
