import './globals.css';
import { Inter } from 'next/font/google';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';
import { AuthProvider } from '@/context/AuthContext';
import { Analytics } from '@vercel/analytics/react';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Rooster - Escuela de Dibujo',
  description: 'Aprende a dibujar en Rooster. Talleres para todas las edades.',
  manifest: '/manifest.json',
  themeColor: '#0d1b2a',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Rooster',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          <Navbar />
          <main style={{ minHeight: '80vh' }}>
            {children}
          </main>
          <FloatingWhatsApp />
          <Footer />
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}
