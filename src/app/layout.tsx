import type { Metadata } from "next";
import "./globals.css";
import 'highlight.js/styles/atom-one-dark.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: "AI分岐チャット",
  description: "OpenAI APIを使用した会話分岐機能付きチャットアプリケーション",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        {children}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </body>
    </html>
  );
}
