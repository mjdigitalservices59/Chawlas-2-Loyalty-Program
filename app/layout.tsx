import './globals.css';
import TopBar from '@/components/TopBar';

export const metadata = { title: 'Chawlas2 Loyalty' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <TopBar />
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
