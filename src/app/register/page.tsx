'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Lock, Mail, ChevronRight, ChevronLeft, Phone, Youtube, Instagram, MonitorSmartphone, Camera } from 'lucide-react';
import { useGlobalStore } from '@/store/global';
import clsx from 'clsx';
import Link from 'next/link';

export default function RegisterPage() {
    const router = useRouter();
    const setUserId = useGlobalStore(s => s.setUserId);

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form data
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        password: '',
        phone: '',
        youtube: '',
        tiktok: '',
        instagram: '',
        camera: '',
        pc: '',
        location: '',
    });

    const updateForm = (key: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleNext = () => {
        if (step === 1 && (!formData.name || !formData.username || !formData.password)) {
            setError('Пожалуйста, заполните Имя, Логин и Пароль');
            return;
        }
        setError('');
        setStep(s => s + 1);
    };

    const handleBack = () => {
        setStep(s => s - 1);
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (step !== 3) return;

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.username,
                    password: formData.password,
                    name: formData.name,
                    phone: formData.phone,
                    socials: {
                        youtube: formData.youtube,
                        tiktok: formData.tiktok,
                        instagram: formData.instagram
                    },
                    equipment: {
                        camera: formData.camera,
                        pc: formData.pc,
                        location: formData.location
                    }
                })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setUserId(data.userId);
                router.push('/dashboard');
            } else {
                setError(data.error || 'Ошибка регистрации');
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
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full mix-blend-screen" />

            <div className="w-full max-w-lg bg-neutral-900/60 backdrop-blur-xl border border-neutral-800 p-8 rounded-3xl shadow-2xl z-10 animate-fade-in relative">

                {/* Progress Bar */}
                <div className="flex gap-2 mb-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={clsx(
                            "h-1.5 flex-1 rounded-full transition-colors",
                            step >= i ? "bg-blue-600" : "bg-neutral-800"
                        )} />
                    ))}
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-white">
                        {step === 1 ? 'Создание профиля' : step === 2 ? 'Ваши соцсети' : 'Оборудование'}
                    </h1>
                    <p className="text-neutral-500 font-medium mt-2">
                        {step === 1 ? 'Шаг 1 из 3' : step === 2 ? 'Шаг 2 из 3' : 'Завершающий шаг'}
                    </p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                    {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm text-center font-medium">{error}</div>}

                    {step === 1 && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="relative flex items-center">
                                <User size={18} className="absolute left-4 text-neutral-500" />
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => updateForm('name', e.target.value)}
                                    placeholder="Ваше имя (ФИО)"
                                    className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                                />
                            </div>
                            <div className="relative flex items-center">
                                <Mail size={18} className="absolute left-4 text-neutral-500" />
                                <input
                                    type="text"
                                    required
                                    value={formData.username}
                                    onChange={(e) => updateForm('username', e.target.value)}
                                    placeholder="Логин (Email или ник)"
                                    className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                                />
                            </div>
                            <div className="relative flex items-center">
                                <Lock size={18} className="absolute left-4 text-neutral-500" />
                                <input
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={(e) => updateForm('password', e.target.value)}
                                    placeholder="Пароль"
                                    className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                                />
                            </div>
                            <div className="relative flex items-center">
                                <Phone size={18} className="absolute left-4 text-neutral-500" />
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => updateForm('phone', e.target.value)}
                                    placeholder="Телефон (опционально)"
                                    className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                                />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="relative flex items-center">
                                <Youtube size={18} className="absolute left-4 text-neutral-500" />
                                <input
                                    type="url"
                                    value={formData.youtube}
                                    onChange={(e) => updateForm('youtube', e.target.value)}
                                    placeholder="Ссылка на YouTube канал"
                                    className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                                />
                            </div>
                            <div className="relative flex items-center">
                                <MonitorSmartphone size={18} className="absolute left-4 text-neutral-500" />
                                <input
                                    type="text"
                                    value={formData.tiktok}
                                    onChange={(e) => updateForm('tiktok', e.target.value)}
                                    placeholder="Никнейм в TikTok"
                                    className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                                />
                            </div>
                            <div className="relative flex items-center">
                                <Instagram size={18} className="absolute left-4 text-neutral-500" />
                                <input
                                    type="text"
                                    value={formData.instagram}
                                    onChange={(e) => updateForm('instagram', e.target.value)}
                                    placeholder="Никнейм в Instagram"
                                    className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                                />
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="relative flex items-center">
                                <Camera size={18} className="absolute left-4 text-neutral-500" />
                                <input
                                    type="text"
                                    value={formData.camera}
                                    onChange={(e) => updateForm('camera', e.target.value)}
                                    placeholder="На что снимаете? (Камера/Телефон)"
                                    className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                                />
                            </div>
                            <div className="relative flex items-center">
                                <MonitorSmartphone size={18} className="absolute left-4 text-neutral-500" />
                                <input
                                    type="text"
                                    value={formData.pc}
                                    onChange={(e) => updateForm('pc', e.target.value)}
                                    placeholder="Ваш ПК для монтажа"
                                    className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                                />
                            </div>
                            <div className="relative flex items-center">
                                <User size={18} className="absolute left-4 text-neutral-500" />
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => updateForm('location', e.target.value)}
                                    placeholder="Город проживания"
                                    className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 mt-8">
                        {step > 1 && (
                            <button
                                type="button"
                                onClick={handleBack}
                                className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-4 px-6 rounded-xl transition-all flex justify-center items-center gap-2 group"
                            >
                                <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Назад
                            </button>
                        )}

                        {step < 3 ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex justify-center items-center gap-2 group"
                            >
                                Продолжить <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-[2] bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-purple-600/20 flex justify-center items-center gap-2 group"
                            >
                                {loading ? 'Создание...' : 'Завершить регистрацию'}
                            </button>
                        )}
                    </div>

                    <p className="text-center text-sm text-neutral-500 mt-6 font-medium">
                        Уже есть аккаунт? <Link href="/login" className="text-white hover:text-blue-400 underline decoration-neutral-700 underline-offset-4 transition-colors">Войти</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
