'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  CreditCard, 
  HeartPulse, 
  Utensils, 
  ClipboardList,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

const navItems = [
  {
    label: 'Trang chủ',
    href: '/parent',
    icon: Home,
    exact: true,
  },
  {
    label: 'Học phí',
    href: '/parent/tuition',
    icon: CreditCard,
    exact: false,
  },
  {
    label: 'Sức khỏe',
    href: '/parent/health',
    icon: HeartPulse,
    exact: false,
  },
  {
    label: 'Thực đơn',
    href: '/parent/menu',
    icon: Utensils,
    exact: false,
  },
  {
    label: 'Đơn từ',
    href: '/parent/requests',
    icon: ClipboardList,
    exact: false,
  },
];

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-muted/30 flex justify-center selection:bg-primary/20">
      <div className="flex flex-col min-h-screen w-full max-w-lg bg-background border-x border-border/70 shadow-2xl relative">
        {/* Modern Mobile Header */}
        <header className="h-16 border-b border-border/70 bg-card/85 backdrop-blur-md sticky top-0 z-30 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link 
              href="/" 
              className="h-9 w-9 rounded-xl bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
              title="Về trang chủ"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-primary to-indigo-400 text-primary-foreground flex items-center justify-center shadow-xs">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight leading-none text-foreground">Cổng Phụ Huynh</span>
                <span className="text-[10px] text-muted-foreground font-medium">KinderManagement App</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>
        
        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto pb-24 px-4 py-5">
          {children}
        </main>

        {/* Floating Bottom Navigation Bar */}
        <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto border-t border-border/80 bg-card/90 backdrop-blur-lg px-2 py-1.5 z-30 shadow-lg">
          <div className="grid grid-cols-5 gap-1">
            {navItems.map((item) => {
              const isActive = item.exact 
                ? pathname === item.href
                : pathname === item.href || (item.href !== '/parent' && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? 'bg-primary/10 text-primary font-semibold shadow-xs' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <Icon className={`h-5 w-5 mb-1 transition-transform ${isActive ? 'scale-110' : ''}`} />
                  <span className="text-[11px] leading-tight">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
