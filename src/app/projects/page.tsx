'use client';

import { useState, useEffect } from 'react';
import {
    CheckCircle2,
    Lock,
    Clock,
    Package,
    FileText,
    Video,
    Search,
    MessageSquare,
    UploadCloud,
    XCircle,
    PlaySquare,
    ChevronLeft
} from 'lucide-react';
import { ActionIcon } from '@lobehub/ui';
import clsx from 'clsx';
import { useGlobalStore } from '@/store/global';
import { supabase } from '@/lib/supabase';

type ProjectStatus = 'Ожидание товара' | 'ТЗ' | 'Съемка' | 'Модерация' | 'Правки' | 'Утверждено' | 'Закрыто';

interface Project {
    id: string;
    brief?: { brand: string, title: string };
    title?: string;
    status: ProjectStatus;
    reward: string;
    deadline?: string;
    video_assets?: any[];
}

const STATUS_ICONS: Record<ProjectStatus, any> = {
    'Ожидание товара': Package,
    'ТЗ': FileText,
    'Съемка': Video,
    'Модерация': Search,
    'Правки': XCircle,
    'Утверждено': CheckCircle2,
    'Закрыто': Lock
};

const STATUS_COLORS: Record<ProjectStatus, string> = {
    'Ожидание товара': 'text-neutral-400 bg-neutral-500/10 border-neutral-500/20',
    'ТЗ': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    'Съемка': 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    'Модерация': 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    'Правки': 'text-red-400 bg-red-500/10 border-red-500/20',
    'Утверждено': 'text-green-400 bg-green-500/10 border-green-500/20',
    'Закрыто': 'text-neutral-500 bg-neutral-800/10 border-neutral-700/20'
};

export default function ProjectsPage() {
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [activeTab, setActiveTab] = useState<'brief' | 'materials' | 'chat'>('materials');
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    // Form state
    const [videoUrl, setVideoUrl] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // New project modal state
    const [isAddingProject, setIsAddingProject] = useState(false);
    const [newProjectTitle, setNewProjectTitle] = useState('');
    const [newProjectReward, setNewProjectReward] = useState('');
    const [creatingProject, setCreatingProject] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    const userId = useGlobalStore((s) => s.userId);

    const fetchProjects = async () => {
        try {
            const res = await fetch(`/api/projects?userId=${userId}`);
            const data = await res.json();
            if (res.ok) setProjects(data.projects || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!userId) return;
        fetchProjects();
        const checkAdmin = async () => {
            const { data } = await supabase.from('cr_creators').select('role').eq('id', userId).single();
            if (data?.role === 'admin') setIsAdmin(true);
        };
        checkAdmin();
    }, [userId]);

    const handleSubmitUrl = async () => {
        if (!videoUrl || !selectedProject || !userId) return;
        setSubmitting(true);
        try {
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId: selectedProject.id,
                    userId,
                    videoUrl
                })
            });
            if (res.ok) {
                // Refresh list and selected project
                setVideoUrl('');
                try {
                    const freshRes = await fetch(`/api/projects?userId=${userId}`);
                    const freshData = await freshRes.json();
                    if (freshRes.ok) {
                        setProjects(freshData.projects || []);
                        const updatedProj = freshData.projects?.find((p: Project) => p.id === selectedProject.id);
                        if (updatedProj) setSelectedProject(updatedProj);
                    }
                } catch (e) { console.error(e); }
            } else {
                alert('Не удалось отправить ссылку.');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreateProject = async () => {
        if (!newProjectTitle || !userId) return;
        setCreatingProject(true);
        try {
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create',
                    title: newProjectTitle,
                    reward: newProjectReward || '0',
                    userId
                })
            });
            if (res.ok) {
                await fetchProjects();
                setIsAddingProject(false);
                setNewProjectTitle('');
                setNewProjectReward('');
            } else {
                alert('Ошибка создания проекта');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setCreatingProject(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-neutral-400 animate-pulse text-center">Загрузка проектов...</div>;
    }

    if (selectedProject) {
        return (
            <div className="flex flex-col h-full animate-fade-in pb-8">
                {/* Detail Header */}
                <div className="flex items-center gap-3 mb-6">
                    <ActionIcon
                        icon={ChevronLeft}
                        onClick={() => setSelectedProject(null)}
                        className="bg-neutral-900 border-neutral-800 text-white hover:bg-neutral-800"
                    />
                    <div>
                        <div className="text-neutral-400 text-sm font-medium">{selectedProject.brief?.brand || 'Без бренда'} • {selectedProject.id.slice(0, 8)}</div>
                        <h1 className="text-xl font-bold text-white">{selectedProject.title || selectedProject.brief?.title}</h1>
                    </div>
                </div>

                {/* Status Pipeline Tracker (Mobile friendly) */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 mb-6 overflow-x-auto hide-scrollbar">
                    <div className="flex items-center min-w-max">
                        {Object.keys(STATUS_ICONS).map((status, idx, arr) => {
                            const isActive = status === selectedProject.status;
                            const isPast = arr.indexOf(status as string) < arr.indexOf(selectedProject.status);
                            const isFuture = arr.indexOf(status as string) > arr.indexOf(selectedProject.status);

                            return (
                                <div key={status} className="flex items-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className={clsx(
                                            "w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all shadow-sm",
                                            isActive ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] ring-4 ring-blue-500/20" :
                                                isPast ? "bg-blue-500/20 text-blue-400" :
                                                    "bg-neutral-800 text-neutral-500"
                                        )}>
                                            {isActive || isPast ? <CheckCircle2 size={16} /> : <div className="w-2 h-2 rounded-full bg-neutral-600" />}
                                        </div>
                                        <span className={clsx("text-[10px] font-medium whitespace-nowrap", isActive ? "text-white" : "text-neutral-500")}>{status}</span>
                                    </div>
                                    {idx < arr.length - 1 && (
                                        <div className={clsx("w-8 h-[2px] mx-1 mb-5", isPast ? "bg-blue-500/50" : "bg-neutral-800")} />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Detail Tabs */}
                <div className="flex bg-neutral-900 p-1 rounded-xl mb-6">
                    <button
                        onClick={() => setActiveTab('brief')}
                        className={clsx("flex-1 py-2 text-sm font-medium rounded-lg transition-all", activeTab === 'brief' ? "bg-neutral-800 text-white shadow-sm" : "text-neutral-400")}
                    >
                        Бриф
                    </button>
                    <button
                        onClick={() => setActiveTab('materials')}
                        className={clsx("flex-1 py-2 text-sm font-medium rounded-lg transition-all", activeTab === 'materials' ? "bg-neutral-800 text-white shadow-sm" : "text-neutral-400")}
                    >
                        Материалы
                    </button>
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={clsx("flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2", activeTab === 'chat' ? "bg-neutral-800 text-white shadow-sm" : "text-neutral-400")}
                    >
                        Чат <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1">
                    {activeTab === 'brief' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl">
                                <h3 className="font-bold text-white mb-2">Техническое задание</h3>
                                <p className="text-sm text-neutral-400">Снять распаковку камеры на штативе. Свет: дневной от окна или кольцевая лампа. Звук: петличный микрофон, без эха.</p>
                                <h4 className="font-bold text-white mt-4 mb-2">Крючок (Hook) 0-3 сек:</h4>
                                <p className="text-sm text-blue-400 bg-blue-500/10 p-3 rounded-xl border border-blue-500/20">"Я нашла идеальную камеру для вечеринок, которая печатает фотки прямо сейчас!"</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'materials' && (
                        <div className="space-y-4 animate-fade-in">
                            {/* Upload area */}
                            <div className="flex flex-col items-center justify-center min-h-[200px] bg-neutral-900 border border-neutral-800 p-8 rounded-3xl text-center">
                                <div className="bg-blue-500/10 text-blue-400 w-20 h-20 rounded-full flex items-center justify-center mb-4">
                                    <Video size={32} />
                                </div>
                                <h3 className="font-bold text-white text-lg">Ссылка на материал</h3>
                                <p className="text-sm text-neutral-500 max-w-[300px] mb-6">
                                    Загрузите ваше видео на YouTube, TikTok или Яндекс Диск и вставьте ссылку ниже.
                                </p>

                                <div className="w-full max-w-md relative flex items-center">
                                    <input
                                        type="url"
                                        value={videoUrl}
                                        onChange={(e) => setVideoUrl(e.target.value)}
                                        placeholder="https://..."
                                        className="w-full bg-neutral-950 border border-neutral-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                        disabled={submitting || ['Закрыто'].includes(selectedProject.status)}
                                    />
                                    <button
                                        onClick={handleSubmitUrl}
                                        disabled={submitting || !videoUrl || ['Закрыто'].includes(selectedProject.status)}
                                        className="absolute right-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-colors"
                                    >
                                        {submitting ? 'Отправка...' : 'Отправить'}
                                    </button>
                                </div>
                            </div>

                            {/* Submitted videos with metrics from parser */}
                            {selectedProject.video_assets && selectedProject.video_assets.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="font-bold text-white text-sm uppercase tracking-wider text-neutral-400">Загруженные видео</h3>
                                    {selectedProject.video_assets.map((asset: any) => (
                                        <div key={asset.id} className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl">
                                            {/* URL + Status */}
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex flex-col gap-1.5">
                                                    <span className="font-medium text-white text-sm max-w-[220px] truncate" title={asset.title || 'Видео'}>
                                                        {asset.title || 'Видео без названия'}
                                                    </span>
                                                    <a href={asset.video_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-xs truncate max-w-[220px] flex items-center gap-1.5">
                                                        <PlaySquare size={12} className="shrink-0" />
                                                        {asset.video_url.replace(/^https?:\/\/(www\.)?/, '')}
                                                    </a>
                                                </div>
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${asset.status === 'approved' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                    asset.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                        'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                                    }`}>
                                                    {asset.status === 'approved' ? '✓ Одобрено' :
                                                        asset.status === 'rejected' ? '✗ Отклонено' : '⏳ На проверке'}
                                                </span>
                                            </div>

                                            {/* Metrics Grid */}
                                            <div className="grid grid-cols-4 gap-3">
                                                <div className="bg-neutral-950 rounded-xl p-3 text-center">
                                                    <div className="text-[10px] text-neutral-500 uppercase font-medium mb-1">Просмотры</div>
                                                    <div className="text-lg font-black text-white">
                                                        {asset.views >= 1000 ? (asset.views / 1000).toFixed(1) + 'K' : asset.views || 0}
                                                    </div>
                                                </div>
                                                <div className="bg-neutral-950 rounded-xl p-3 text-center">
                                                    <div className="text-[10px] text-neutral-500 uppercase font-medium mb-1">Лайки</div>
                                                    <div className="text-lg font-black text-white">
                                                        {asset.likes >= 1000 ? (asset.likes / 1000).toFixed(1) + 'K' : asset.likes || 0}
                                                    </div>
                                                </div>
                                                <div className="bg-neutral-950 rounded-xl p-3 text-center">
                                                    <div className="text-[10px] text-neutral-500 uppercase font-medium mb-1">Комменты</div>
                                                    <div className="text-lg font-black text-white">{asset.comments || 0}</div>
                                                </div>
                                                <div className="bg-neutral-950 rounded-xl p-3 text-center border border-green-500/20">
                                                    <div className="text-[10px] text-green-500 uppercase font-medium mb-1">KPI Бонус</div>
                                                    <div className="text-lg font-black text-green-400">+{asset.kpi_bonus || 0} ₽</div>
                                                </div>
                                            </div>

                                            {/* Last sync info */}
                                            {asset.last_stats_update && (
                                                <div className="text-[10px] text-neutral-600 mt-2 text-right">
                                                    Обновлено: {new Date(asset.last_stats_update).toLocaleString('ru-RU')}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {selectedProject.status === 'Правки' && (
                                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl w-full text-left">
                                    <h4 className="font-bold text-red-400 mb-1 flex items-center gap-2"><XCircle size={16} /> Замечания модератора</h4>
                                    <p className="text-sm text-red-200/80">Пожалуйста, сделайте звук чуть громче на 0:15 и обрежьте концовку на 1 секунду.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'chat' && (
                        <div className="flex flex-col h-[400px] border border-neutral-800 rounded-2xl overflow-hidden animate-fade-in">
                            <div className="flex-1 bg-neutral-900 p-4 space-y-4 overflow-y-auto">
                                <div className="text-xs text-center text-neutral-500 my-4">Сегодня</div>
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center font-bold text-xs uppercase">HL</div>
                                    <div className="bg-neutral-800 p-3 rounded-2xl rounded-tl-sm text-sm text-white max-w-[80%]">
                                        Привет! Товар отправлен, трек-номер RU1234567. Как получишь — нажимай кнопку в статусах.
                                    </div>
                                </div>
                                <div className="flex gap-3 flex-row-reverse">
                                    <div className="bg-blue-600 p-3 rounded-2xl rounded-tr-sm text-sm text-white max-w-[80%]">
                                        Супер, жду доставку!
                                    </div>
                                </div>
                            </div>
                            <div className="p-3 bg-neutral-950 border-t border-neutral-800 flex gap-2">
                                <input type="text" placeholder="Написать сообщение..." className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-blue-500" />
                                <ActionIcon icon={PlaySquare} className="bg-blue-600 text-white hover:bg-blue-700" />
                            </div>
                        </div>
                    )}
                </div>

            </div>
        );
    }

    // LIST VIEW
    return (
        <div className="flex flex-col gap-6 animate-fade-in pb-8">
            {/* Header */}
            <div className="pt-2 flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
                        Мои проекты
                    </h1>
                    <p className="text-neutral-500 font-medium mt-1">Отслеживай статусы и сдавай работу.</p>
                </div>
                {isAdmin && <button
                    onClick={() => setIsAddingProject(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 font-bold text-sm transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] shrink-0"
                >
                    + Добавить проект
                </button>}
            </div>

            {isAddingProject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl w-full max-w-md">
                        <h2 className="text-xl font-bold text-white mb-4">Новый проект</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-1">Название проекта / Бренд</label>
                                <input
                                    type="text"
                                    value={newProjectTitle}
                                    onChange={e => setNewProjectTitle(e.target.value)}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                                    placeholder="Например: Спонсорская интеграция"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-1">Вознаграждение (₽)</label>
                                <input
                                    type="number"
                                    value={newProjectReward}
                                    onChange={e => setNewProjectReward(e.target.value)}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                                    placeholder="5000"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setIsAddingProject(false)}
                                className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-bold transition-colors"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handleCreateProject}
                                disabled={creatingProject || !newProjectTitle}
                                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold transition-colors"
                            >
                                {creatingProject ? 'Создание...' : 'Добавить'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-3">
                {projects.map((project) => {
                    const Icon = STATUS_ICONS[project.status];
                    const colorClass = STATUS_COLORS[project.status];

                    return (
                        <div
                            key={project.id}
                            onClick={() => setSelectedProject(project)}
                            className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl flex flex-col md:flex-row gap-4 hover:border-neutral-700 transition-colors cursor-pointer group relative overflow-hidden"
                        >
                            {/* Vertical line indicator based on status */}
                            <div className={clsx("absolute left-0 top-0 bottom-0 w-1", colorClass.split(' ')[1])} />

                            <div className="flex-1 pl-2">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">{project.brief?.brand || 'БЕЗ БРЕНДА'}</span>
                                    <span className="font-bold text-white text-sm">{project.reward} ₽</span>
                                </div>
                                <h3 className="font-bold text-white text-lg mb-3">{project.title || project.brief?.title}</h3>

                                <div className="flex items-center justify-between mt-auto">
                                    <div className={clsx("flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold", colorClass)}>
                                        <Icon size={14} /> {project.status}
                                    </div>

                                    {project.deadline && (
                                        <div className="flex items-center gap-1 text-xs text-red-400 font-medium bg-red-500/10 px-2 py-1 rounded-md">
                                            <Clock size={12} /> {new Date(project.deadline).toLocaleDateString('ru-RU')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}
