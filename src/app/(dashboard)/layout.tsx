import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="page-container">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
