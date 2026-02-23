'use client';

import {
    BellRing,
    TrendingUp,
    CheckCircle2,
    Eye,
    Wallet,
    Clock,
    MessageSquareWarning,
    ChevronRight,
    Flame,
    ArrowUpRight
} from 'lucide-react';
import { Flexbox, ActionIcon, Avatar } from '@lobehub/ui';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
    const router = useRouter();

    return (
        <div className="flex flex-col gap-8 animate-fade-in pb-8">

            {/* Header */}
            <Flexbox horizontal justify={'space-between'} align={'center'} className="pt-2">
                <div>
                    <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
                        Привет, креатор! 👋
                    </h1>
                    <p className="text-neutral-500 font-medium mt-1">Вот твоя сводка на сегодня.</p>
                </div>
                <ActionIcon icon={BellRing} size="large" title="Уведомления" className="bg-neutral-900 border-neutral-800 text-white hover:bg-neutral-800" />
            </Flexbox>

            {/* Alerts / Notifications */}
            <div className="flex flex-col gap-3">
                <div className="flex bg-red-500/10 border border-red-500/20 p-4 rounded-2xl gap-4 items-start relative overflow-hidden">
                    <div className="bg-red-500 p-2 rounded-xl text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                        <Clock size={20} />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-red-500">Горящий дедлайн</h4>
                        <p className="text-sm text-red-200/70 mt-0.5">Видео для "GlowUp Cosmetics" нужно сдать до 18:00 сегодня.</p>
                    </div>
                    <ActionIcon icon={ChevronRight} className="text-red-400" />
                </div>

                <div className="flex bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl gap-4 items-start">
                    <div className="bg-amber-500 p-2 rounded-xl text-white shadow-[0_0_15px_rgba(245,158,11,0.4)]">
                        <MessageSquareWarning size={20} />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-amber-500">Правки от модератора</h4>
                        <p className="text-sm text-amber-200/70 mt-0.5">Добавьте больше света на 0:15 в ролике про кроссовки.</p>
                    </div>
                    <ActionIcon icon={ChevronRight} className="text-amber-400" />
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Balance */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-5 rounded-3xl relative overflow-hidden shadow-[0_0_30px_rgba(37,99,235,0.2)]">
                    <div className="absolute -right-6 -top-6 text-white/10">
                        <Wallet size={120} />
                    </div>
                    <h3 className="text-blue-200 font-medium text-sm">Доступно</h3>
                    <p className="text-3xl font-black text-white mt-1">45 200 ₽</p>
                    <div className="flex items-center gap-1 text-xs text-blue-200 mt-3 bg-white/10 w-fit px-2 py-1 rounded-lg backdrop-blur-md">
                        <ArrowUpRight size={14} /> +12 000 ₽ за неделю
                    </div>
                </div>

                {/* Views */}
                <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-neutral-400 font-medium text-sm">Охват (месяц)</h3>
                        <div className="bg-purple-500/20 text-purple-400 p-1.5 rounded-lg"><Eye size={16} /></div>
                    </div>
                    <p className="text-2xl font-bold text-white">1.2M</p>
                    <p className="text-xs text-green-400 mt-2 flex items-center gap-1"><TrendingUp size={12} /> +15% к прошлому</p>
                </div>

                {/* Approved */}
                <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-neutral-400 font-medium text-sm">Утверждено</h3>
                        <div className="bg-green-500/20 text-green-400 p-1.5 rounded-lg"><CheckCircle2 size={16} /></div>
                    </div>
                    <p className="text-2xl font-bold text-white">18 <span className="text-sm font-normal text-neutral-500">роликов</span></p>
                    <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div className="bg-green-500 h-full rounded-full" style={{ width: '80%' }}></div>
                    </div>
                </div>

                {/* Trust Score */}
                <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-3xl flex flex-col items-center justify-center text-center">
                    <div className="text-orange-500 mb-1"><Flame size={24} className="drop-shadow-[0_0_10px_rgba(249,115,22,0.5)] fill-orange-500/20" /></div>
                    <p className="text-2xl font-black text-white">98/100</p>
                    <h3 className="text-neutral-500 font-medium text-xs mt-1 uppercase tracking-wider">Trust Score</h3>
                </div>
            </div>

            {/* Active Projects */}
            <div>
                <Flexbox horizontal justify={'space-between'} align={'center'} className="mb-4 mt-2">
                    <h2 className="text-xl font-bold text-white">В работе</h2>
                    <button onClick={() => router.push('/projects')} className="text-sm text-blue-500 hover:text-blue-400 font-medium">Все проекты</button>
                </Flexbox>

                <div className="flex flex-col gap-3">
                    {/* Active Card 1 */}
                    <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-start md:items-center hover:border-neutral-700 transition-colors cursor-pointer group">
                        <img src="https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?q=80&w=200&auto=format&fit=crop" alt="product" className="w-16 h-16 rounded-xl object-cover" />
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded-md font-medium border border-blue-500/20">Съемка</span>
                                <span className="text-xs text-neutral-500 font-medium">Осталось 2 дня</span>
                            </div>
                            <h3 className="font-bold text-white text-lg">Polaroid Now: Распаковка камеры</h3>
                            <p className="text-sm text-neutral-400">Формат: Unboxing (до 30 сек)</p>
                        </div>
                        <div className="text-right">
                            <div className="font-bold text-white">15 000 ₽</div>
                        </div>
                    </div>

                    {/* Active Card 2 */}
                    <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-start md:items-center hover:border-neutral-700 transition-colors cursor-pointer group">
                        <img src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=200&auto=format&fit=crop" alt="product" className="w-16 h-16 rounded-xl object-cover" />
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="bg-neutral-800 text-neutral-300 text-xs px-2 py-0.5 rounded-md font-medium border border-neutral-700">Ожидание товара</span>
                                <span className="text-xs text-neutral-500 font-medium">Трек-номер: RU128491</span>
                            </div>
                            <h3 className="font-bold text-white text-lg">Набор косметики GlowUp</h3>
                            <p className="text-sm text-neutral-400">Формат: Testimonial (Живой отзыв)</p>
                        </div>
                        <div className="text-right">
                            <div className="font-bold text-white">8 000 ₽ + Товар</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Suggested Briefs */}
            <div>
                <Flexbox horizontal justify={'space-between'} align={'center'} className="mb-4 mt-2">
                    <h2 className="text-xl font-bold text-white">Подобрано для вас</h2>
                    <button onClick={() => router.push('/briefs')} className="text-sm text-neutral-400 hover:text-white font-medium flex items-center gap-1">На витрину <ChevronRight size={14} /></button>
                </Flexbox>

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 border border-neutral-800 p-5 rounded-3xl relative overflow-hidden group cursor-pointer hover:border-blue-500/50 transition-all">
                        <div className="absolute top-0 right-0 p-4">
                            <span className="bg-white/10 text-white text-xs px-3 py-1 rounded-full backdrop-blur-md font-medium border border-white/10">Sketch</span>
                        </div>
                        <h3 className="font-bold text-xl text-white mt-8 mb-2">Приложение для фитнеса</h3>
                        <p className="text-sm text-neutral-400 line-clamp-2 mb-4">Нативный скетч про то, как сложно начать бегать по утрам, и как наше приложение...</p>
                        <div className="flex items-center justify-between mt-auto">
                            <div className="font-black text-blue-400 text-lg">от 12 000 ₽</div>
                            <button className="bg-white text-black px-4 py-1.5 rounded-full text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">Смотреть</button>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 border border-neutral-800 p-5 rounded-3xl relative overflow-hidden group cursor-pointer hover:border-blue-500/50 transition-all">
                        <div className="absolute top-0 right-0 p-4">
                            <span className="bg-white/10 text-white text-xs px-3 py-1 rounded-full backdrop-blur-md font-medium border border-white/10">Unboxing</span>
                        </div>
                        <div className="flex gap-2 mb-2 absolute top-4 left-4">
                            <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Hot</span>
                        </div>
                        <h3 className="font-bold text-xl text-white mt-8 mb-2">Обзор наушников SoundPro</h3>
                        <p className="text-sm text-neutral-400 line-clamp-2 mb-4">Детальная распаковка и ASMR-тест новых премиальных TWS-наушников.</p>
                        <div className="flex items-center justify-between mt-auto">
                            <div className="font-black text-blue-400 text-lg">18 000 ₽</div>
                            <button className="bg-white text-black px-4 py-1.5 rounded-full text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">Смотреть</button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
