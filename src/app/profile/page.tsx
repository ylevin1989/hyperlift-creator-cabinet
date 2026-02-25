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
    Edit3,
    ExternalLink,
    RefreshCw,
    Users,
    Eye,
    Heart
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useGlobalStore } from '@/store/global';

interface SocialLink {
    platform: string;
    url: string;
    username?: string;
    followers?: number;
}


const PLATFORM_ICONS: Record<string, { icon: any; bg: string }> = {
    instagram: { icon: Instagram, bg: 'bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-500' },
    youtube: { icon: Youtube, bg: 'bg-red-600' },
    tiktok: { icon: PlaySquare, bg: 'bg-black border border-neutral-700' },
};

function extractUsername(url: string, platform: string): string {
    if (!url) return '';
    try {
        const u = new URL(url.startsWith('http') ? url : 'https://' + url);
        const path = u.pathname.replace(/^\//, '').split('/')[0];
        if (path.startsWith('@')) return path;
        return '@' + path;
    } catch {
        return url;
    }
}

export default function ProfilePage() {
    const userId = useGlobalStore((s) => s.userId);
    const [profile, setProfile] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [portfolioItems, setPortfolioItems] = useState<any[]>([]);
    const [equipment, setEquipment] = useState<{ id: string, name: string, type: string }[]>([]);

    // Form states
    const [formData, setFormData] = useState({
        full_name: '',
        location: '',
        age: '',
        avatar_url: '',
    });

    // Social links form state
    const [socialForm, setSocialForm] = useState({
        instagram: '',
        youtube: '',
        tiktok: '',
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
                    const links: SocialLink[] = Array.isArray(data.social_links) ? data.social_links : [];
                    setSocialForm({
                        instagram: links.find(l => l.platform === 'instagram')?.url || '',
                        youtube: links.find(l => l.platform === 'youtube')?.url || '',
                        tiktok: links.find(l => l.platform === 'tiktok')?.url || '',
                    });
                    setEquipment(Array.isArray(data.equipment) ? data.equipment : []);
                }
            } catch (e) {
                console.error('Error fetching profile:', e);
            } finally {
                setLoading(false);
            }
        };
        const fetchPortfolio = async () => {
            try {
                const res = await fetch(`/api/portfolio?creatorId=${userId}`);
                const data = await res.json();
                if (Array.isArray(data)) setPortfolioItems(data);
            } catch (e) {
                console.error('Error fetching portfolio:', e);
            }
        };
        fetchProfile();
        fetchPortfolio();
    }, [userId]);

    const handleSave = async () => {
        try {
            setLoading(true);

            // Build social_links array from form
            const social_links: SocialLink[] = [];
            if (socialForm.instagram) social_links.push({ platform: 'instagram', url: socialForm.instagram, username: extractUsername(socialForm.instagram, 'instagram') });
            if (socialForm.youtube) social_links.push({ platform: 'youtube', url: socialForm.youtube, username: extractUsername(socialForm.youtube, 'youtube') });
            if (socialForm.tiktok) social_links.push({ platform: 'tiktok', url: socialForm.tiktok, username: extractUsername(socialForm.tiktok, 'tiktok') });

            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    full_name: formData.full_name,
                    location: formData.location,
                    age: parseInt(formData.age, 10) || null,
                    avatar_url: formData.avatar_url,
                    social_links,
                    equipment
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

    // Parse social links from profile for display
    const socialLinks: SocialLink[] = Array.isArray(profile.social_links) ? profile.social_links : [];

    return (
        <div className="flex flex-col gap-6 animate-fade-in pb-8">
            {/* Header Profile Info */}
            <div className="pt-2 flex flex-col md:flex-row gap-6 md:items-center bg-neutral-900 border border-neutral-800 p-6 rounded-3xl">
                <div className="relative w-24 h-24 flex-shrink-0 rounded-full p-1 bg-gradient-to-tr from-blue-600 to-purple-600 shadow-xl group">
                    <img src={formData.avatar_url || profile.avatar_url || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop"} alt="Avatar" className="w-full h-full rounded-full object-cover border-4 border-neutral-950 bg-neutral-800" />
                    {isEditing && (
                        <>
                            <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                id="avatar-upload" 
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (ev) => {
                                            if (ev.target?.result) {
                                                setFormData({ ...formData, avatar_url: ev.target.result as string });
                                            }
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }} 
                            />
                            <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-blue-500 text-white p-1.5 rounded-full border-2 border-neutral-950 shadow-md cursor-pointer hover:bg-blue-400 group-hover:scale-110 transition-transform">
                                <Camera size={14} />
                            </label>
                        </>
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
                {/* Social Accounts Integrations — now reads/writes from DB */}
                <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg text-white">Соцсети</h3>
                        {!isEditing && socialLinks.length > 0 && (
                            <button
                                onClick={async () => {
                                    setSyncing(true);
                                    try {
                                        const res = await fetch('/api/profile/sync-social', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ userId })
                                        });
                                        const data = await res.json();
                                        if (res.ok && data.social_links) {
                                            setProfile((prev: any) => ({ ...prev, social_links: data.social_links }));
                                        }
                                    } catch (e) {
                                        console.error('Sync failed:', e);
                                    } finally {
                                        setSyncing(false);
                                    }
                                }}
                                disabled={syncing}
                                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors disabled:opacity-50"
                            >
                                <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
                                {syncing ? 'Синхр...' : 'Обновить подписчиков'}
                            </button>
                        )}
                    </div>
                    <div className="space-y-3 flex-1 flex flex-col justify-center">

                        {isEditing ? (
                            /* EDIT MODE: show URL inputs */
                            <>
                                {(['instagram', 'youtube', 'tiktok'] as const).map(platform => {
                                    const cfg = PLATFORM_ICONS[platform];
                                    const Icon = cfg.icon;
                                    const labels: Record<string, string> = { instagram: 'Instagram', youtube: 'YouTube', tiktok: 'TikTok' };
                                    return (
                                        <div key={platform} className="flex items-center gap-3 p-3 border border-neutral-800 rounded-xl">
                                            <div className={`${cfg.bg} p-2 rounded-lg text-white shrink-0`}>
                                                <Icon size={20} />
                                            </div>
                                            <input
                                                type="url"
                                                value={socialForm[platform]}
                                                onChange={(e) => setSocialForm(prev => ({ ...prev, [platform]: e.target.value }))}
                                                placeholder={`Ссылка на ${labels[platform]}`}
                                                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-blue-500"
                                            />
                                        </div>
                                    );
                                })}
                            </>
                        ) : (
                            /* VIEW MODE: show saved social links, or placeholders */
                            <>
                                {socialLinks.length > 0 ? socialLinks.map(link => {
                                    const cfg = PLATFORM_ICONS[link.platform] || { icon: ExternalLink, bg: 'bg-neutral-800' };
                                    const Icon = cfg.icon;
                                    const username = link.username || extractUsername(link.url, link.platform);
                                    return (
                                        <a key={link.platform} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 border border-neutral-800 rounded-xl hover:border-neutral-700 transition-colors group">
                                            <div className="flex items-center gap-3">
                                                <div className={`${cfg.bg} p-2 rounded-lg text-white`}>
                                                    <Icon size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white text-sm">{username}</p>
                                                    <p className="text-xs text-neutral-500 truncate max-w-[180px]">{link.url.replace(/^https?:\/\/(www\.)?/, '')}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {link.followers ? (
                                                    <span className="text-xs text-neutral-400 flex items-center gap-1">
                                                        <Users size={12} />
                                                        {link.followers >= 1000000 ? (link.followers / 1000000).toFixed(1) + 'M' : link.followers >= 1000 ? (link.followers / 1000).toFixed(1) + 'K' : link.followers}
                                                    </span>
                                                ) : null}
                                                <ExternalLink size={14} className="text-neutral-600 group-hover:text-blue-400 transition-colors" />
                                            </div>
                                        </a>
                                    );
                                }) : (
                                    <div className="text-neutral-500 text-sm text-center py-4">
                                        Нет привязанных соцсетей. Нажмите «Редактировать» чтобы добавить.
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Equipment Profile */}
                <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg text-white">Оборудование</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3 flex-1 mt-1">
                        {equipment.map(item => (
                            <div key={item.id} className="bg-neutral-950 border border-neutral-800 p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-2 relative group">
                                {isEditing && (
                                    <div onClick={() => setEquipment(prev => prev.filter(e => e.id !== item.id))} className="absolute top-2 right-2 text-neutral-600 hover:text-red-500 cursor-pointer">
                                        <X size={14} />
                                    </div>
                                )}
                                {item.type === 'Камера' ? <Camera size={24} className="text-blue-500" /> :
                                 item.type === 'Звук' ? <Mic size={24} className="text-purple-500" /> :
                                 item.type === 'Свет' ? <Lightbulb size={24} className="text-orange-500" /> :
                                 <Smartphone size={24} className="text-green-500" />}
                                
                                {isEditing ? (
                                    <div className="w-full">
                                        <input 
                                           className="mt-1 w-full bg-transparent border-b border-neutral-700/50 text-sm font-bold text-white text-center focus:outline-none focus:border-blue-500 transition-colors"
                                           value={item.name}
                                           onChange={(e) => setEquipment(prev => prev.map(eq => eq.id === item.id ? { ...eq, name: e.target.value } : eq))}
                                        />
                                        <div className="w-full flex justify-center mt-1">
                                            <select 
                                                className="text-[10px] text-neutral-500 uppercase tracking-widest bg-transparent focus:outline-none text-center outline-none [&>option]:bg-neutral-900"
                                                value={item.type}
                                                onChange={(e) => setEquipment(prev => prev.map(eq => eq.id === item.id ? { ...eq, type: e.target.value } : eq))}
                                            >
                                                <option value="Камера">Камера</option>
                                                <option value="Звук">Звук</option>
                                                <option value="Свет">Свет</option>
                                                <option value="Прочее">Прочее</option>
                                            </select>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-sm font-bold text-white leading-tight mt-1">{item.name}</p>
                                        <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-1">{item.type}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                        {isEditing && (
                            <div onClick={() => {
                                setEquipment(prev => [...prev, { id: Date.now().toString(), name: 'Название...', type: 'Камера' }]);
                            }} className="bg-neutral-950 border border-neutral-800 p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-2 cursor-pointer hover:bg-neutral-800 transition-colors border-dashed text-neutral-500 hover:text-white">
                                <Plus size={24} />
                                <p className="text-[10px] font-bold mt-2 uppercase">Добавить</p>
                            </div>
                        )}
                        {!isEditing && equipment.length === 0 && (
                            <div className="col-span-2 text-neutral-500 text-sm py-4 text-center">
                                Оборудование не добавлено. Нажмите «Редактировать», чтобы добавить.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Media Portfolio Grid */}
            <div className="mt-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white">Портфолио</h2>
                    <button onClick={() => window.location.href = '/portfolio'} className="bg-blue-600 hover:bg-blue-700 text-white border border-blue-500 text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                        <Plus size={14} /> Управление портфолио
                    </button>
                </div>

                {portfolioItems.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {portfolioItems.slice(0, 8).map(item => {
                            const thumb = item.thumbnail_url || (item.video_url?.includes('youtube.com') || item.video_url?.includes('youtu.be')
                                ? `https://i.ytimg.com/vi/${(item.video_url.match(/[?&]v=([A-Za-z0-9_-]{11})/) || item.video_url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/) || [])[1]}/hqdefault.jpg`
                                : '');
                            return (
                                <div key={item.id}
                                    onClick={() => window.location.href = '/portfolio'}
                                    className="relative aspect-video rounded-2xl overflow-hidden group cursor-pointer bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all">
                                    {thumb ? (
                                        <img src={thumb} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center"><Video size={24} className="text-neutral-700" /></div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-xs font-bold text-white truncate">{item.title || 'Без названия'}</p>
                                        <div className="flex items-center gap-2 mt-1 text-[10px] text-neutral-300">
                                            <span className="flex items-center gap-0.5"><Eye size={9} /> {item.metrics?.views >= 1000 ? (item.metrics.views / 1000).toFixed(1) + 'K' : item.metrics?.views || 0}</span>
                                            <span className="flex items-center gap-0.5"><Heart size={9} /> {item.metrics?.likes >= 1000 ? (item.metrics.likes / 1000).toFixed(1) + 'K' : item.metrics?.likes || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div
                        onClick={() => window.location.href = '/portfolio'}
                        className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center cursor-pointer hover:border-neutral-700 transition-all group"
                    >
                        <Video size={36} className="mx-auto text-neutral-600 mb-3 group-hover:text-blue-500 transition-colors" />
                        <p className="text-sm text-neutral-400 group-hover:text-white transition-colors">
                            Добавьте первую работу в портфолио
                        </p>
                    </div>
                )}
            </div>

        </div>
    );
}
