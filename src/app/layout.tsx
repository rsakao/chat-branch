import type { Metadata } from 'next';
import './globals.css';
import 'highlight.js/styles/atom-one-dark.css';
import { Toaster } from 'react-hot-toast';
import LocaleProvider from '../components/LocaleProvider';

export const metadata: Metadata = {
  title: 'Chat Branch',
  description:
    'Chat application with conversation branching feature using OpenAI API',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
      </head>
      <body>
        <LocaleProvider>{children}</LocaleProvider>
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
