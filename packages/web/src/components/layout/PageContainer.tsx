import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import Header from './Header';

interface PageContainerProps {
  title: string;
  children: ReactNode;
}

export default function PageContainer({ title, children }: PageContainerProps) {
  return (
    <div className="flex min-h-screen themed-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={title} />
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
          <div className="max-w-5xl mx-auto">{children}</div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
