'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ChevronRight } from 'lucide-react';
import { useGlobalStore } from '@/store/global';
import TelegramLogin from '@/components/TelegramLogin';

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const setUserId = useGlobalStore(s => s.setUserId);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setUserId(data.userId);
                router.push('/dashboard');
            } else {
                setError(data.error || 'Ошибка входа');
            }
        } catch (err) {
            setError('Сеть недоступна');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-4 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full mix-blend-screen" />

            <div className="w-full max-w-md bg-neutral-900/60 backdrop-blur-xl border border-neutral-800 p-8 rounded-3xl shadow-2xl z-10 animate-fade-in relative">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white font-black text-2xl shadow-[0_0_30px_rgba(37,99,235,0.3)]">
                        HL
                    </div>
                    <h1 className="text-3xl font-black text-white">Вход для креаторов</h1>
                    <p className="text-neutral-500 font-medium mt-2">Войдите в личный кабинет Hyperlift</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm text-center font-medium">{error}</div>}
                    <div>
                        <div className="relative flex items-center">
                            <Mail size={18} className="absolute left-4 text-neutral-500" />
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Логин"
                                className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                            />
                        </div>
                    </div>
                    <div>
                        <div className="relative flex items-center">
                            <Lock size={18} className="absolute left-4 text-neutral-500" />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Пароль"
                                className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end mt-2 mb-6">
                        <a href="#" className="text-sm text-blue-500 hover:text-blue-400 font-medium transition-colors">Забыли пароль?</a>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex justify-center items-center gap-2 group"
                    >
                        {loading ? 'Вход...' : 'Войти'} {!loading && <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                    </button>

                    <div className="flex items-center my-6">
                        <div className="flex-grow border-t border-neutral-800"></div>
                        <span className="px-4 text-xs tracking-wider text-neutral-500 font-medium">ИЛИ</span>
                        <div className="flex-grow border-t border-neutral-800"></div>
                    </div>

                    <div className="flex justify-center content-center w-full min-h-[40px]">
                        <TelegramLogin 
                            botName={process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'hypertik_bot'} 
                            onAuth={async (user) => {
                                setLoading(true);
                                setError('');
                                try {
                                    const res = await fetch('/api/auth/telegram', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(user)
                                    });
                                    const data = await res.json();
                                    if (res.ok && data.success) {
                                        setUserId(data.userId);
                                        router.push('/dashboard');
                                    } else {
                                        setError(data.error || 'Ошибка входа через Telegram');
                                    }
                                } catch (err) {
                                    setError('Сеть недоступна');
                                } finally {
                                    setLoading(false);
                                }
                            }} 
                        />
                    </div>

                    <p className="text-center text-sm text-neutral-500 mt-6 font-medium">
                        Хотите стать креатором? <a href="/register" className="text-white hover:text-blue-400 underline decoration-neutral-700 underline-offset-4 transition-colors">Оставить заявку</a>
                    </p>
                </form>
            </div>
        </div>
    );
}
