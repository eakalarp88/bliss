import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'จองคิว - Bliss Salon',
  description: 'จองคิวทำผมและทำเล็บออนไลน์ที่ Bliss Salon',
};

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-beige-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-pink-100 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">💅💇</span>
            <h1 className="text-2xl font-bold text-primary">Bliss</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto">
        {children}
      </main>

      {/* Footer */}
      <footer className="max-w-lg mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
        <p>📍 Bliss Salon</p>
        <p className="mt-1">โทร. 02-XXX-XXXX</p>
        <p className="mt-4">© 2025 Bliss. All rights reserved.</p>
      </footer>
    </div>
  );
}
