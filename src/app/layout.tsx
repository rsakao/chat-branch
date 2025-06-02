import type { Metadata } from "next";
import "./globals.css";
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
