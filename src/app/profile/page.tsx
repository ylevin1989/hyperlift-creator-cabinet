'use client';

import {
    Camera,
    Smartphone,
    Mic,
    Lightbulb,
    Instagram,
    Youtube,
    MapPin,
    Star,
    Plus,
    PlaySquare,
    Video,
    Save,
    X,
    Edit3
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useGlobalStore } from '@/store/global';

const PORTFOLIO = [
    { id: 1, type: 'video', tags: ['#Unboxing', '#Gadgets'], img: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=300&h=400&fit=crop' },
    { id: 2, type: 'video', tags: ['#Sketch', '#Comedy'], img: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=300&h=400&fit=crop' },
    { id: 3, type: 'video', tags: ['#Beauty', '#Testimonial'], img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=400&fit=crop' },
    { id: 4, type: 'video', tags: ['#HowTo', '#Lifehacks'], img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=400&fit=crop' },
];

export default function ProfilePage() {
    const userId = useGlobalStore((s) => s.userId);
    const [profile, setProfile] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);

    // Form states
    const [formData, setFormData] = useState({
        full_name: '',
        location: '',
        age: '',
        avatar_url: '',
    });

    useEffect(() => {
        if (!userId) return;
        const fetchProfile = async () => {
            try {
                const res = await fetch(`/api/profile?userId=${userId}`);
                const data = await res.json();
                if (res.ok) {
                    setProfile(data);
                    setFormData({
                        full_name: data.full_name || '',
                        location: data.location || '',
                        age: data.age?.toString() || '',
                        avatar_url: data.avatar_url || ''
                    });
                }
            } catch (e) {
                console.error('Error fetching profile:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [userId]);

    const handleSave = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    full_name: formData.full_name,
                    location: formData.location,
                    age: parseInt(formData.age, 10) || null,
                    avatar_url: formData.avatar_url
                })
            });
            const data = await res.json();
            if (res.ok) {
                setProfile(data);
                setIsEditing(false);
            }
        } catch (e) {
            console.error('Failed to update:', e);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !profile) {
        return <div className="animate-pulse flex space-x-4 p-8 items-center justify-center">В загрузке...</div>;
    }

    if (!profile) {
        return <div>Профиль не найден</div>;
    }

    return (
        <div className="flex flex-col gap-6 animate-fade-in pb-8">
            {/* Header Profile Info */}
            <div className="pt-2 flex flex-col md:flex-row gap-6 md:items-center bg-neutral-900 border border-neutral-800 p-6 rounded-3xl">
                <div className="relative w-24 h-24 flex-shrink-0 rounded-full p-1 bg-gradient-to-tr from-blue-600 to-purple-600 shadow-xl">
                    <img src={profile.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop"} alt="Avatar" className="w-full h-full rounded-full object-cover border-4 border-neutral-950" />
                    {isEditing && (
                        <div className="absolute bottom-0 right-0 bg-blue-500 text-white p-1.5 rounded-full border-2 border-neutral-950 shadow-md cursor-pointer hover:bg-blue-400">
                            <Camera size={14} />
                        </div>
                    )}
                </div>

                <div className="flex-1 space-y-3">
                    {isEditing ? (
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-neutral-500 font-bold uppercase">Имя и Фамилия</label>
                                <input
                                    type="text"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-blue-500 mt-1"
                                />
                            </div>
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <label className="text-xs text-neutral-500 font-bold uppercase">Город</label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-blue-500 mt-1"
                                    />
                                </div>
                                <div className="w-24">
                                    <label className="text-xs text-neutral-500 font-bold uppercase">Возраст</label>
                                    <input
                                        type="number"
                                        value={formData.age}
                                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-blue-500 mt-1"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-neutral-500 font-bold uppercase">Ссылка на аватарку (URL)</label>
                                <input
                                    type="text"
                                    value={formData.avatar_url}
                                    onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-blue-500 mt-1"
                                    placeholder="https://"
                                />
                            </div>
                        </div>
                    ) : (
                        <>
                            <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
                                {profile.full_name} <Star size={20} className="text-orange-500 fill-orange-500" />
                            </h1>
                            <p className="text-neutral-400 font-medium flex items-center gap-1 mt-1">
                                <MapPin size={14} /> {profile.location || 'Город не указан'} • {profile.age ? `${profile.age} лет` : 'Возраст не указан'}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-3">
                                {profile.niche && profile.niche.length > 0 ? profile.niche.map((n: string) => (
                                    <span key={n} className="bg-neutral-800 text-neutral-300 text-xs px-3 py-1 rounded-full border border-neutral-700">{n}</span>
                                )) : (
                                    <span className="text-neutral-500 text-xs">Ниши не указаны</span>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    {isEditing ? (
                        <>
                            <button onClick={handleSave} disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold flex items-center justify-center gap-2 flex-shrink-0 hover:bg-blue-700 transition-colors">
                                <Save size={18} /> Сохранить
                            </button>
                            <button onClick={() => setIsEditing(false)} disabled={loading} className="bg-neutral-800 border border-neutral-700 text-white px-6 py-2 rounded-xl font-bold flex items-center justify-center gap-2 flex-shrink-0 hover:bg-neutral-700 transition-colors">
                                <X size={18} /> Отмена
                            </button>
                        </>
                    ) : (
                        <button onClick={() => setIsEditing(true)} className="bg-neutral-800 border border-neutral-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 flex-shrink-0 hover:bg-neutral-700 transition-colors">
                            <Edit3 size={18} /> Редактировать
                        </button>
                    )}
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-2">
                {/* Social Accounts Integrations */}
                <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl flex flex-col h-full">
                    <h3 className="font-bold text-lg text-white mb-4">Соцсети</h3>
                    <div className="space-y-3 flex-1 flex flex-col justify-center">
                        <div className="flex items-center justify-between p-3 border border-neutral-800 rounded-xl hover:border-neutral-700 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-500 p-2 rounded-lg text-white">
                                    <Instagram size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-white text-sm">@alisa.vetrova</p>
                                    <p className="text-xs text-neutral-500">12.4K подписчиков</p>
                                </div>
                            </div>
                            <button className="text-xs font-bold text-neutral-400 bg-neutral-800 px-3 py-1.5 rounded-md hover:bg-neutral-700 transition-colors">Синх.</button>
                        </div>
                        <div className="flex items-center justify-between p-3 border border-neutral-800 rounded-xl hover:border-neutral-700 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="bg-red-600 p-2 rounded-lg text-white">
                                    <Youtube size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-white text-sm">Alisa Vlogs</p>
                                    <p className="text-xs text-neutral-500">5.2K подписчиков</p>
                                </div>
                            </div>
                            <button className="text-xs font-bold text-neutral-400 bg-neutral-800 px-3 py-1.5 rounded-md hover:bg-neutral-700 transition-colors">Синх.</button>
                        </div>
                        <div className="flex items-center justify-between p-3 border border-neutral-800 rounded-xl border-dashed bg-neutral-900/50 cursor-pointer hover:bg-neutral-800 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="bg-neutral-800 p-2 rounded-lg text-neutral-500">
                                    <PlaySquare size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-neutral-300 text-sm">Привязать TikTok</p>
                                </div>
                            </div>
                            <Plus size={16} className="text-neutral-500" />
                        </div>
                    </div>
                </div>

                {/* Equipment Profile */}
                <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl flex flex-col h-full">
                    <h3 className="font-bold text-lg text-white mb-4 flex justify-between items-center">
                        Оборудование
                        {isEditing && <span className="text-xs font-normal text-blue-500 cursor-pointer">Настроить</span>}
                    </h3>
                    <div className="grid grid-cols-2 gap-3 flex-1 mt-1">
                        <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-2 relative">
                            {isEditing && <div className="absolute top-2 right-2 text-neutral-600 hover:text-red-500 cursor-pointer"><X size={14} /></div>}
                            <Smartphone size={24} className="text-blue-500" />
                            <div>
                                <p className="text-sm font-bold text-white leading-tight mt-1">iPhone 14 Pro</p>
                                <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-1">Камера</p>
                            </div>
                        </div>
                        <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-2 relative">
                            {isEditing && <div className="absolute top-2 right-2 text-neutral-600 hover:text-red-500 cursor-pointer"><X size={14} /></div>}
                            <Mic size={24} className="text-purple-500" />
                            <div>
                                <p className="text-sm font-bold text-white leading-tight mt-1">DJI Mic</p>
                                <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-1">Звук</p>
                            </div>
                        </div>
                        <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-2 relative">
                            {isEditing && <div className="absolute top-2 right-2 text-neutral-600 hover:text-red-500 cursor-pointer"><X size={14} /></div>}
                            <Lightbulb size={24} className="text-orange-500" />
                            <div>
                                <p className="text-sm font-bold text-white leading-tight mt-1">RGB Ring 45cm</p>
                                <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-1">Свет</p>
                            </div>
                        </div>
                        <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-2 cursor-pointer hover:bg-neutral-800 transition-colors border-dashed text-neutral-500 hover:text-white">
                            <Plus size={24} />
                            <p className="text-[10px] font-bold mt-2 uppercase">Добавить</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Media Portfolio Grid */}
            <div className="mt-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white">Портфолио</h2>
                    <button className="bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                        <Plus size={14} /> Добавить работу
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {PORTFOLIO.map(item => (
                        <div key={item.id} className="relative aspect-[9/16] rounded-2xl overflow-hidden group cursor-pointer bg-neutral-900 border border-neutral-800">
                            {isEditing && (
                                <div className="absolute top-2 right-2 z-10 bg-black/60 backdrop-blur pb-1 px-1 rounded-md shadow hover:bg-red-500 transition-colors cursor-pointer text-white">
                                    <X size={14} />
                                </div>
                            )}
                            <img src={item.img} alt="Portfolio item" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-3">
                                <div className="flex gap-1 flex-wrap mb-1">
                                    {item.tags.map(tag => (
                                        <span key={tag} className="text-[9px] font-bold uppercase tracking-wider text-white bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-md">{tag}</span>
                                    ))}
                                </div>
                                <div className="text-white bg-blue-600/90 w-fit p-1.5 rounded-lg backdrop-blur-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                                    <Video size={16} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}
