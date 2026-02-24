'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useGlobalStore } from '@/store/global';
import { Home, BriefcaseBusiness, ListTodo, BarChart3, Wallet, User, BookOpen, ShieldAlert, Image } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { Flexbox } from '@lobehub/ui';
import clsx from 'clsx';
import { supabase } from '@/lib/supabase';

const NAV_ITEMS = [
    { key: 'dashboard', label: 'Сводка', icon: Home, path: '/dashboard' },
    { key: 'briefs', label: 'Кастинг', icon: BriefcaseBusiness, path: '/briefs' },
    { key: 'projects', label: 'Проекты', icon: ListTodo, path: '/projects' },
    { key: 'stats', label: 'Статистика', icon: BarChart3, path: '/stats' },
    { key: 'finances', label: 'Финансы', icon: Wallet, path: '/finances' },
    { key: 'profile', label: 'Профиль', icon: User, path: '/profile' },
    { key: 'portfolio', label: 'Портфолио', icon: Image, path: '/portfolio' },
    { key: 'training', label: 'Обучение', icon: BookOpen, path: '/training' },
    { key: 'admin', label: 'Админка', icon: ShieldAlert, path: '/admin', adminOnly: true },
];

export const MainLayout = ({ children }: { children: ReactNode }) => {
    const storeIsMobile = useGlobalStore((s) => s.isMobile);
    const setIsMobile = useGlobalStore((s) => s.setIsMobile);
    const storeUserId = useGlobalStore((s) => s.userId);
    const hasHydrated = useGlobalStore((s) => s._hasHydrated);
    const router = useRouter();
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        setMounted(true);
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, [setIsMobile]);

    // To prevent hydration mismatch, the first client render MUST match the server render exactly.
    // The server has no access to localStorage, so userId is null and isMobile is false.
    const userId = mounted && hasHydrated ? storeUserId : null;
    const isMobile = mounted ? storeIsMobile : false;

    useEffect(() => {
        if (!hasHydrated) return;

        if (!storeUserId && pathname !== '/login' && pathname !== '/register') {
            router.push('/login');
        } else if (storeUserId) {
            const checkAdmin = async () => {
                const { data } = await supabase.from('cr_creators').select('role').eq('id', storeUserId).single();
                if (data && data.role === 'admin') {
                    setIsAdmin(true);
                }
            };
            checkAdmin();
        }
    }, [hasHydrated, storeUserId, pathname, router]);

    if (pathname === '/login' || pathname === '/register') {
        return <main>{children}</main>;
    }

    if (!userId && pathname !== '/register') {
        // We match what the server renders before authentication is confirmed.
        return <main className="min-h-screen bg-neutral-950">{!mounted ? children : null}</main>;
    }

    return (
        <div className="flex bg-neutral-950 text-white min-h-screen font-sans">
            {/* Sidebar for Desktop */}
            {!isMobile && (
                <nav className="w-64 border-r border-neutral-800 p-4 sticky top-0 h-screen flex flex-col gap-2 bg-neutral-900/50 backdrop-blur-xl">
                    <div className="font-bold text-2xl mb-8 tracking-tighter text-blue-500 p-2">
                        HYPER<span className="text-white">LIFT</span>
                    </div>
                    {NAV_ITEMS.filter(item => !item.adminOnly || isAdmin).map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname.startsWith(item.path);
                        return (
                            <button
                                key={item.key}
                                onClick={() => router.push(item.path)}
                                className={clsx(
                                    'flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-medium text-sm',
                                    isActive
                                        ? 'bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.3)] text-white'
                                        : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                                )}
                            >
                                <Icon size={20} />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>
            )}

            {/* Main Content Area */}
            <main className="flex-1 pb-20 md:pb-0 relative overflow-x-hidden">
                {/* Mobile Header */}
                {isMobile && (
                    <header className="sticky top-0 z-50 h-16 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-xl flex items-center px-4 font-bold text-xl tracking-tighter">
                        <span className="text-blue-500">H</span>LIFT
                    </header>
                )}

                <div className="p-4 md:p-8 max-w-5xl mx-auto w-full min-h-full">
                    {children}
                </div>
            </main>

            {/* Bottom TabBar for Mobile */}
            {isMobile && (
                <nav className="fixed bottom-0 w-full h-20 border-t border-neutral-800 bg-neutral-900/80 backdrop-blur-2xl px-2 pb-safe flex justify-around items-center z-50">
                    {NAV_ITEMS.filter(item => !item.adminOnly || isAdmin).map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname.startsWith(item.path);
                        return (
                            <button
                                key={item.key}
                                onClick={() => router.push(item.path)}
                                className={clsx(
                                    'flex flex-col items-center justify-center w-16 h-12 gap-1 transition-all rounded-xl',
                                    isActive ? 'text-blue-500' : 'text-neutral-500 hover:text-white'
                                )}
                            >
                                <div className={clsx('relative p-1.5 rounded-full', isActive && 'bg-blue-500/10')}>
                                    <Icon size={22} className={clsx(isActive && 'drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]')} />
                                </div>
                                <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>
            )}
        </div>
    );
};
