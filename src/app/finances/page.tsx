'use client';

import { useState, useEffect } from 'react';
import {
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    Lock,
    Download,
    CreditCard,
    Building,
    CheckCircle2
} from 'lucide-react';
import clsx from 'clsx';
import { useGlobalStore } from '@/store/global';

interface Transaction {
    id: string;
    project: string;
    type: 'income' | 'withdraw' | 'holding' | string;
    amount: string;
    date: string;
    status: string;
}

interface FinancesData {
    profile: {
        available_balance: number;
        holding_balance: number;
    };
    transactions: Transaction[];
}

export default function FinancesPage() {
    const userId = useGlobalStore((s) => s.userId);
    const [data, setData] = useState<FinancesData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;
        const fetchFinances = async () => {
            try {
                const res = await fetch(`/api/finances?userId=${userId}`);
                const json = await res.json();
                if (res.ok) setData(json);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchFinances();
    }, [userId]);

    if (loading) {
        return <div className="p-8 text-neutral-400 animate-pulse text-center">Загрузка финансов...</div>;
    }

    if (!data) {
        return <div className="p-8 text-red-400 text-center">Ошибка загрузки финансов</div>;
    }

    return (
        <div className="flex flex-col gap-6 animate-fade-in pb-8">

            {/* Header */}
            <div className="pt-2">
                <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
                    Финансы
                </h1>
                <p className="text-neutral-500 font-medium mt-1">Контроль баланса и выплаты.</p>
            </div>

            {/* Balance Cards */}
            <div className="grid md:grid-cols-2 gap-4">
                {/* Available Balance */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-3xl relative overflow-hidden shadow-[0_0_30px_rgba(37,99,235,0.2)]">
                    <div className="absolute -right-6 -top-6 text-white/10">
                        <Wallet size={150} />
                    </div>
                    <h3 className="text-blue-200 font-medium flex items-center gap-2">
                        Доступно к выводу <CheckCircle2 size={16} />
                    </h3>
                    <p className="text-4xl font-black text-white mt-2 mb-6">{Math.floor(data.profile.available_balance)} ₽</p>
                    <button className="bg-white text-black font-bold py-3 px-6 rounded-xl hover:bg-neutral-200 transition-colors shadow-lg relative z-10">
                        Вывести средства
                    </button>
                </div>

                {/* Holding Balance */}
                <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between">
                    <div>
                        <h3 className="text-neutral-400 font-medium flex items-center gap-2">
                            Холдирование <Lock size={16} className="text-neutral-500" />
                        </h3>
                        <p className="text-3xl font-black text-white mt-2">{data.profile.holding_balance} ₽</p>
                        <p className="text-sm text-neutral-500 mt-2">Средства заморожены до окончания срока гарантии по активным проектам. Они будут зачислены после успешной проверки модератором.</p>
                    </div>
                    <div className="mt-4 flex gap-2">
                        <span className="text-xs bg-neutral-800 text-neutral-400 px-3 py-1.5 rounded-lg border border-neutral-700">Проектов на холде: {data.transactions.filter(t => t.status === 'Холдирование').length}</span>
                    </div>
                </div>
            </div>

            {/* Tax Info (Consol.pro integration context) */}
            <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl flex items-center gap-4">
                <div className="bg-purple-500/20 text-purple-400 p-3 rounded-xl">
                    <Building size={24} />
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-white">Статус: Самозанятый (НПД)</h3>
                    <p className="text-sm text-neutral-400 mt-0.5">Интеграция с Консоль.Про активна. Чеки формируются автоматически.</p>
                </div>
                <button className="hidden sm:flex bg-neutral-800 text-white font-medium py-2 px-4 rounded-xl hover:bg-neutral-700 transition-colors text-sm">
                    Настройки
                </button>
            </div>

            {/* Transaction History */}
            <div>
                <h2 className="text-xl font-bold text-white mb-4 mt-2">История операций</h2>
                <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden">
                    {data.transactions.length === 0 ? (
                        <div className="p-8 text-neutral-500 text-center text-sm">Нет недавних операций</div>
                    ) : data.transactions.map((trx, idx) => (
                        <div key={trx.id} className={clsx("p-5 flex items-center justify-between", idx !== data.transactions.length - 1 && "border-b border-neutral-800")}>
                            <div className="flex items-center gap-4">
                                <div className={clsx(
                                    "p-3 rounded-xl",
                                    trx.type === 'income' ? 'bg-green-500/10 text-green-400' :
                                        trx.type === 'withdraw' ? 'bg-blue-500/10 text-blue-400' :
                                            'bg-orange-500/10 text-orange-400'
                                )}>
                                    {trx.type === 'income' ? <ArrowDownLeft size={20} /> :
                                        trx.type === 'withdraw' ? <ArrowUpRight size={20} /> :
                                            <Lock size={20} />}
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-sm md:text-base">{trx.project}</h4>
                                    <p className="text-xs text-neutral-500 mt-0.5">{trx.date} • {trx.status}</p>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                                <div className={clsx(
                                    "font-bold text-base md:text-lg",
                                    trx.type === 'income' ? 'text-green-400' :
                                        trx.type === 'withdraw' ? 'text-white' :
                                            'text-orange-400'
                                )}>
                                    {trx.amount}
                                </div>
                                {(trx.type === 'income' || trx.type === 'withdraw') && (
                                    <button className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 transition-colors">
                                        <Download size={12} /> Чек
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
