'use client';

import {
    Plus, X, Save, Edit3, Trash2, RefreshCw, ExternalLink, Eye, Heart, MessageCircle,
    Youtube, Instagram, PlaySquare, Video, Link, ChevronLeft, Upload, Tag, FileText
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useGlobalStore } from '@/store/global';

interface PortfolioItem {
    id: string;
    title: string;
    description: string;
    video_url: string;
    thumbnail_url: string;
    platform: string;
    category: string;
    tags: string[];
    metrics: { views: number; likes: number; comments: number };
    status: string;
    sort_order: number;
    created_at: string;
}

const CATEGORIES = [
    { value: 'unboxing', label: 'Unboxing', emoji: '📦' },
    { value: 'review', label: 'Обзор', emoji: '⭐' },
    { value: 'sketch', label: 'Скетч', emoji: '🎬' },
    { value: 'beauty', label: 'Beauty', emoji: '💄' },
    { value: 'howto', label: 'How-to', emoji: '🔧' },
    { value: 'lifestyle', label: 'Lifestyle', emoji: '🌿' },
    { value: 'food', label: 'Food', emoji: '🍕' },
    { value: 'travel', label: 'Travel', emoji: '✈️' },
    { value: 'tech', label: 'Tech', emoji: '💻' },
    { value: 'fitness', label: 'Fitness', emoji: '💪' },
    { value: 'other', label: 'Другое', emoji: '📌' },
];

const PLATFORM_ICONS: Record<string, { icon: any; color: string; label: string }> = {
    youtube: { icon: Youtube, color: 'text-red-500', label: 'YouTube' },
    instagram: { icon: Instagram, color: 'text-pink-500', label: 'Instagram' },
    tiktok: { icon: PlaySquare, color: 'text-cyan-400', label: 'TikTok' },
    other: { icon: Link, color: 'text-neutral-400', label: 'Другое' },
};

function formatNumber(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return n.toString();
}

function detectPlatform(url: string): string {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('tiktok.com')) return 'tiktok';
    if (url.includes('instagram.com')) return 'instagram';
    return 'other';
}

function getYouTubeThumbnail(url: string): string {
    const match = url.match(/[?&]v=([A-Za-z0-9_-]{11})/) || url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
    return match ? `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg` : '';
}

export default function PortfolioPage() {
    const userId = useGlobalStore((s) => s.userId);
    const [items, setItems] = useState<PortfolioItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
    const [syncing, setSyncing] = useState<string | null>(null);

    // Form state
    const [form, setForm] = useState({
        title: '',
        description: '',
        video_url: '',
        thumbnail_url: '',
        category: '',
        tags: '',
        status: 'published' as string,
    });

    // Step wizard state
    const [step, setStep] = useState(1);

    const fetchPortfolio = async () => {
        if (!userId) return;
        try {
            const res = await fetch(`/api/portfolio?creatorId=${userId}`);
            const data = await res.json();
            if (Array.isArray(data)) setItems(data);
        } catch (e) {
            console.error('Failed to load portfolio:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPortfolio(); }, [userId]);

    const resetForm = () => {
        setForm({ title: '', description: '', video_url: '', thumbnail_url: '', category: '', tags: '', status: 'published' });
        setStep(1);
        setEditingId(null);
    };

    const handleSave = async () => {
        if (!form.video_url && !form.title) return;
        setLoading(true);
        try {
            const body: any = {
                creatorId: userId,
                title: form.title,
                description: form.description,
                video_url: form.video_url,
                thumbnail_url: form.thumbnail_url || (form.video_url ? getYouTubeThumbnail(form.video_url) : ''),
                category: form.category,
                tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
                status: form.status,
            };
            if (editingId) body.id = editingId;

            const res = await fetch('/api/portfolio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (res.ok) {
                resetForm();
                setShowForm(false);
                await fetchPortfolio();
            }
        } catch (e) {
            console.error('Save error:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Удалить эту работу из портфолио?')) return;
        try {
            await fetch('/api/portfolio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', id, creatorId: userId }),
            });
            setItems(prev => prev.filter(i => i.id !== id));
            if (selectedItem?.id === id) setSelectedItem(null);
        } catch (e) {
            console.error('Delete error:', e);
        }
    };

    const handleSync = async (id: string) => {
        setSyncing(id);
        try {
            const res = await fetch('/api/portfolio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'sync', id, creatorId: userId }),
            });
            if (res.ok) {
                const updated = await res.json();
                setItems(prev => prev.map(i => i.id === id ? updated : i));
                if (selectedItem?.id === id) setSelectedItem(updated);
            }
        } catch (e) {
            console.error('Sync error:', e);
        } finally {
            setSyncing(null);
        }
    };

    const openEdit = (item: PortfolioItem) => {
        setForm({
            title: item.title,
            description: item.description,
            video_url: item.video_url,
            thumbnail_url: item.thumbnail_url,
            category: item.category,
            tags: item.tags?.join(', ') || '',
            status: item.status,
        });
        setEditingId(item.id);
        setStep(1);
        setShowForm(true);
    };

    if (loading && items.length === 0) {
        return <div className="animate-pulse flex items-center justify-center p-12 text-neutral-500">Загрузка портфолио...</div>;
    }

    // ─── Detail View ───────────────────────────────────────────────────
    if (selectedItem) {
        const p = PLATFORM_ICONS[selectedItem.platform] || PLATFORM_ICONS.other;
        const PIcon = p.icon;
        const cat = CATEGORIES.find(c => c.value === selectedItem.category);
        return (
            <div className="animate-fade-in pb-8">
                <button onClick={() => setSelectedItem(null)} className="flex items-center gap-2 text-neutral-400 hover:text-white mb-6 transition-colors">
                    <ChevronLeft size={18} /> Назад к портфолио
                </button>

                <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden">
                    {/* Thumbnail / Video */}
                    <div className="relative aspect-video bg-neutral-950 flex items-center justify-center">
                        {selectedItem.thumbnail_url ? (
                            <img src={selectedItem.thumbnail_url} alt={selectedItem.title} className="w-full h-full object-cover" />
                        ) : (
                            <Video size={48} className="text-neutral-700" />
                        )}
                        {selectedItem.video_url && (
                            <a href={selectedItem.video_url} target="_blank" rel="noopener noreferrer"
                                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                <div className="bg-white/20 backdrop-blur-md p-4 rounded-full">
                                    <ExternalLink size={32} className="text-white" />
                                </div>
                            </a>
                        )}
                    </div>

                    {/* Info */}
                    <div className="p-6">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div>
                                <h1 className="text-2xl font-bold text-white">{selectedItem.title || 'Без названия'}</h1>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className={`flex items-center gap-1 text-xs ${p.color}`}>
                                        <PIcon size={14} /> {p.label}
                                    </span>
                                    {cat && <span className="text-xs text-neutral-500">{cat.emoji} {cat.label}</span>}
                                    <span className="text-xs text-neutral-600">{new Date(selectedItem.created_at).toLocaleDateString('ru')}</span>
                                </div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <button onClick={() => handleSync(selectedItem.id)} disabled={syncing === selectedItem.id}
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-1 transition-colors disabled:opacity-50">
                                    <RefreshCw size={12} className={syncing === selectedItem.id ? 'animate-spin' : ''} /> Sync
                                </button>
                                <button onClick={() => openEdit(selectedItem)}
                                    className="bg-neutral-800 hover:bg-neutral-700 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-1 transition-colors">
                                    <Edit3 size={12} /> Ред.
                                </button>
                                <button onClick={() => handleDelete(selectedItem.id)}
                                    className="bg-red-900/50 hover:bg-red-700 text-red-400 hover:text-white text-xs px-3 py-2 rounded-lg flex items-center gap-1 transition-colors">
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>

                        {/* Metrics */}
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-center">
                                <Eye size={16} className="mx-auto text-neutral-500 mb-1" />
                                <p className="text-lg font-bold text-white">{formatNumber(selectedItem.metrics?.views || 0)}</p>
                                <p className="text-[10px] text-neutral-500 uppercase">Просмотры</p>
                            </div>
                            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-center">
                                <Heart size={16} className="mx-auto text-neutral-500 mb-1" />
                                <p className="text-lg font-bold text-white">{formatNumber(selectedItem.metrics?.likes || 0)}</p>
                                <p className="text-[10px] text-neutral-500 uppercase">Лайки</p>
                            </div>
                            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-center">
                                <MessageCircle size={16} className="mx-auto text-neutral-500 mb-1" />
                                <p className="text-lg font-bold text-white">{formatNumber(selectedItem.metrics?.comments || 0)}</p>
                                <p className="text-[10px] text-neutral-500 uppercase">Комментарии</p>
                            </div>
                        </div>

                        {/* Description */}
                        {selectedItem.description && (
                            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 mb-4">
                                <p className="text-sm text-neutral-300 whitespace-pre-wrap">{selectedItem.description}</p>
                            </div>
                        )}

                        {/* Tags */}
                        {selectedItem.tags?.length > 0 && (
                            <div className="flex gap-2 flex-wrap">
                                {selectedItem.tags.map(tag => (
                                    <span key={tag} className="text-xs bg-neutral-800 text-neutral-300 px-2 py-1 rounded-md">#{tag}</span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ─── Add/Edit Form (Step Wizard) ───────────────────────────────────
    if (showForm) {
        const detectedPlatform = form.video_url ? detectPlatform(form.video_url) : null;
        const autoThumb = form.video_url ? getYouTubeThumbnail(form.video_url) : '';

        return (
            <div className="animate-fade-in pb-8">
                <button onClick={() => { setShowForm(false); resetForm(); }} className="flex items-center gap-2 text-neutral-400 hover:text-white mb-6 transition-colors">
                    <ChevronLeft size={18} /> Назад
                </button>

                <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-2xl mx-auto">
                    <h2 className="text-xl font-bold text-white mb-2">{editingId ? 'Редактировать работу' : 'Добавить работу'}</h2>
                    <p className="text-sm text-neutral-500 mb-6">Шаг {step} из 3</p>

                    {/* Progress bar */}
                    <div className="flex gap-1 mb-8">
                        {[1, 2, 3].map(s => (
                            <div key={s} className={`flex-1 h-1 rounded-full transition-colors ${s <= step ? 'bg-blue-500' : 'bg-neutral-800'}`} />
                        ))}
                    </div>

                    {/* Step 1: Video URL */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-bold text-white block mb-2">
                                    <Link size={14} className="inline mr-1.5 text-blue-400" />
                                    Ссылка на видео
                                </label>
                                <input
                                    type="url"
                                    value={form.video_url}
                                    onChange={(e) => setForm(prev => ({ ...prev, video_url: e.target.value }))}
                                    placeholder="https://youtube.com/watch?v=... или instagram.com/reel/..."
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                />
                                {detectedPlatform && (
                                    <div className="mt-2 flex items-center gap-2">
                                        {(() => { const P = PLATFORM_ICONS[detectedPlatform]; const I = P.icon; return <I size={14} className={P.color} />; })()}
                                        <span className="text-xs text-neutral-400">Платформа: {PLATFORM_ICONS[detectedPlatform]?.label}</span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="text-sm font-bold text-white block mb-2">
                                    <FileText size={14} className="inline mr-1.5 text-purple-400" />
                                    Название (необязательно)
                                </label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="Подтянется автоматически при синхронизации"
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>

                            {autoThumb && (
                                <div className="mt-2">
                                    <p className="text-xs text-neutral-500 mb-2">Превью:</p>
                                    <img src={autoThumb} alt="Preview" className="rounded-xl w-full max-w-sm aspect-video object-cover border border-neutral-800" />
                                </div>
                            )}

                            <button onClick={() => setStep(2)} disabled={!form.video_url && !form.title}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                                Далее →
                            </button>
                        </div>
                    )}

                    {/* Step 2: Category & Tags */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-bold text-white block mb-3">Категория</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {CATEGORIES.map(cat => (
                                        <button
                                            key={cat.value}
                                            onClick={() => setForm(prev => ({ ...prev, category: cat.value }))}
                                            className={`p-3 rounded-xl border text-left text-sm transition-all ${form.category === cat.value
                                                ? 'border-blue-500 bg-blue-500/10 text-white'
                                                : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'}`}
                                        >
                                            <span className="text-lg">{cat.emoji}</span>
                                            <p className="mt-1 font-medium">{cat.label}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-bold text-white block mb-2">
                                    <Tag size={14} className="inline mr-1.5 text-green-400" />
                                    Теги (через запятую)
                                </label>
                                <input
                                    type="text"
                                    value={form.tags}
                                    onChange={(e) => setForm(prev => ({ ...prev, tags: e.target.value }))}
                                    placeholder="unboxing, gadgets, tech"
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => setStep(1)} className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-3 rounded-xl transition-colors">
                                    ← Назад
                                </button>
                                <button onClick={() => setStep(3)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors">
                                    Далее →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Description & Thumbnail */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-bold text-white block mb-2">Описание</label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Расскажите о вашей работе, контексте, результатах..."
                                    rows={4}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-bold text-white block mb-2">
                                    <Upload size={14} className="inline mr-1.5 text-orange-400" />
                                    URL обложки (необязательно)
                                </label>
                                <input
                                    type="url"
                                    value={form.thumbnail_url}
                                    onChange={(e) => setForm(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                                    placeholder="https://... (для YouTube подтянется автоматически)"
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => setStep(2)} className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-3 rounded-xl transition-colors">
                                    ← Назад
                                </button>
                                <button onClick={handleSave} disabled={loading}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                                    <Save size={16} /> {editingId ? 'Сохранить' : 'Опубликовать'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ─── Portfolio Grid ────────────────────────────────────────────────
    return (
        <div className="animate-fade-in pb-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Портфолио</h1>
                    <p className="text-sm text-neutral-500 mt-1">{items.length} {items.length === 1 ? 'работа' : items.length < 5 ? 'работы' : 'работ'}</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowForm(true); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2"
                >
                    <Plus size={16} /> Добавить работу
                </button>
            </div>

            {items.length === 0 ? (
                <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-12 text-center">
                    <Video size={48} className="mx-auto text-neutral-700 mb-4" />
                    <h3 className="text-lg font-bold text-white mb-2">Портфолио пока пустое</h3>
                    <p className="text-sm text-neutral-500 mb-6 max-w-md mx-auto">
                        Добавьте ваши лучшие работы — ссылки на YouTube, TikTok или Instagram. Метрики подтянутся автоматически.
                    </p>
                    <button
                        onClick={() => { resetForm(); setShowForm(true); }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-colors inline-flex items-center gap-2"
                    >
                        <Plus size={16} /> Добавить первую работу
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map(item => {
                        const p = PLATFORM_ICONS[item.platform] || PLATFORM_ICONS.other;
                        const PIcon = p.icon;
                        const cat = CATEGORIES.find(c => c.value === item.category);
                        const thumb = item.thumbnail_url || (item.video_url ? getYouTubeThumbnail(item.video_url) : '');

                        return (
                            <div key={item.id}
                                className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden hover:border-neutral-700 transition-all group cursor-pointer"
                                onClick={() => setSelectedItem(item)}>
                                {/* Thumbnail */}
                                <div className="relative aspect-video bg-neutral-950">
                                    {thumb ? (
                                        <img src={thumb} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Video size={32} className="text-neutral-700" />
                                        </div>
                                    )}
                                    {/* Platform badge */}
                                    <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1">
                                        <PIcon size={12} className={p.color} />
                                        <span className="text-[10px] text-white font-medium">{p.label}</span>
                                    </div>
                                    {/* Actions on hover */}
                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => { e.stopPropagation(); handleSync(item.id); }}
                                            className="bg-black/70 backdrop-blur-sm p-1.5 rounded-md hover:bg-blue-600 transition-colors">
                                            <RefreshCw size={12} className={`text-white ${syncing === item.id ? 'animate-spin' : ''}`} />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); openEdit(item); }}
                                            className="bg-black/70 backdrop-blur-sm p-1.5 rounded-md hover:bg-neutral-700 transition-colors">
                                            <Edit3 size={12} className="text-white" />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                            className="bg-black/70 backdrop-blur-sm p-1.5 rounded-md hover:bg-red-600 transition-colors">
                                            <Trash2 size={12} className="text-white" />
                                        </button>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="p-3">
                                    <p className="text-sm font-bold text-white truncate">{item.title || 'Без названия'}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        {cat && <span className="text-[10px] text-neutral-500">{cat.emoji} {cat.label}</span>}
                                        {item.tags?.length > 0 && <span className="text-[10px] text-neutral-600">#{item.tags[0]}</span>}
                                    </div>
                                    {/* Metrics */}
                                    <div className="flex items-center gap-3 mt-2 text-[11px] text-neutral-500">
                                        <span className="flex items-center gap-1"><Eye size={10} /> {formatNumber(item.metrics?.views || 0)}</span>
                                        <span className="flex items-center gap-1"><Heart size={10} /> {formatNumber(item.metrics?.likes || 0)}</span>
                                        <span className="flex items-center gap-1"><MessageCircle size={10} /> {formatNumber(item.metrics?.comments || 0)}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
