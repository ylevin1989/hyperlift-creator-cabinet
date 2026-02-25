'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMemo, useEffect, useState } from 'react';
import { ArrowLeft, Clock, ChevronRight, BookOpen } from 'lucide-react';
import { CATEGORIES, ArticleCategory } from '@/data/articles';

interface DBArticle {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    category: ArticleCategory;
    read_time: number;
    cover_image: string;
    content: string;
}

const CATEGORY_COLORS: Record<ArticleCategory, { bg: string; text: string; border: string }> = {
    production: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
    platforms: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
    monetization: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
    content: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
    legal: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
};

function renderMarkdown(md: string) {
    const lines = md.split('\n');
    const elements: React.ReactNode[] = [];
    let inTable = false;
    let tableRows: string[][] = [];
    let tableHeader: string[] = [];
    let inList = false;
    let listItems: string[] = [];
    let listOrdered = false;
    let key = 0;

    const flushList = () => {
        if (!inList) return;
        const items = listItems.map((item, i) => <li key={i} className="text-neutral-300 leading-relaxed">{formatInline(item)}</li>);
        elements.push(listOrdered
            ? <ol key={key++} className="list-decimal list-inside space-y-1 my-3 ml-2">{items}</ol>
            : <ul key={key++} className="list-disc list-inside space-y-1 my-3 ml-2">{items}</ul>
        );
        inList = false;
        listItems = [];
    };

    const flushTable = () => {
        if (!inTable) return;
        elements.push(
            <div key={key++} className="overflow-x-auto my-4">
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="border-b border-neutral-700">
                            {tableHeader.map((h, i) => <th key={i} className="text-left py-2 px-3 text-neutral-400 font-bold text-xs uppercase">{h.trim()}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {tableRows.map((row, ri) => (
                            <tr key={ri} className="border-b border-neutral-800 hover:bg-neutral-800/50 transition-colors">
                                {row.map((cell, ci) => <td key={ci} className="py-2 px-3 text-neutral-300">{formatInline(cell.trim())}</td>)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
        inTable = false;
        tableRows = [];
        tableHeader = [];
    };

    const formatInline = (text: string): React.ReactNode => {
        const parts = text.split(/(\*\*[^*]+\*\*)/);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
            }
            const codeParts = part.split(/(`[^`]+`)/);
            return codeParts.map((cp, j) => {
                if (cp.startsWith('`') && cp.endsWith('`')) {
                    return <code key={`${i}-${j}`} className="bg-neutral-800 text-blue-400 px-1.5 py-0.5 rounded text-xs font-mono">{cp.slice(1, -1)}</code>;
                }
                return cp;
            });
        });
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
            flushList();
            const cells = trimmed.split('|').filter(Boolean);
            if (!inTable) { tableHeader = cells; inTable = true; continue; }
            if (cells.every(c => c.trim().match(/^[-:]+$/))) continue;
            tableRows.push(cells);
            continue;
        } else if (inTable) { flushTable(); }

        if (trimmed.startsWith('# ') && !trimmed.startsWith('## ')) { flushList(); continue; }
        if (trimmed.startsWith('## ')) { flushList(); elements.push(<h2 key={key++} className="text-xl font-bold text-white mt-8 mb-3 pb-2 border-b border-neutral-800">{trimmed.slice(3)}</h2>); continue; }
        if (trimmed.startsWith('### ')) { flushList(); elements.push(<h3 key={key++} className="text-lg font-bold text-white mt-6 mb-2">{trimmed.slice(4)}</h3>); continue; }

        if (trimmed.match(/^[-*] /)) { if (!inList) { inList = true; listOrdered = false; } listItems.push(trimmed.slice(2)); continue; }
        if (trimmed.match(/^\d+\. /)) { if (!inList) { inList = true; listOrdered = true; } listItems.push(trimmed.replace(/^\d+\. /, '')); continue; }
        if (inList && trimmed === '') { flushList(); continue; }

        if (trimmed.startsWith('⚠️')) { flushList(); elements.push(<div key={key++} className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 my-4 text-sm text-orange-300">{formatInline(trimmed)}</div>); continue; }
        if (trimmed === '') { flushList(); continue; }

        flushList();
        elements.push(<p key={key++} className="text-neutral-300 leading-relaxed my-2">{formatInline(trimmed)}</p>);
    }
    flushList();
    flushTable();
    return elements;
}

export default function ArticlePage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;
    const [article, setArticle] = useState<DBArticle | null>(null);
    const [related, setRelated] = useState<DBArticle[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/articles?slug=${slug}`)
            .then(r => r.json())
            .then(d => {
                if (d.article) {
                    setArticle(d.article);
                    // Get related
                    fetch('/api/articles')
                        .then(r2 => r2.json())
                        .then(d2 => {
                            const all = d2.articles || [];
                            setRelated(all.filter((a: DBArticle) => a.category === d.article.category && a.slug !== d.article.slug).slice(0, 3));
                        });
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [slug]);

    if (loading) {
        return (
            <div className="flex flex-col gap-6 animate-pulse pb-8 max-w-3xl mx-auto">
                <div className="h-4 bg-neutral-800 rounded w-1/3 mt-4" />
                <div className="aspect-[2/1] bg-neutral-800 rounded-2xl" />
                <div className="bg-neutral-900 rounded-2xl p-8 space-y-3">
                    <div className="h-6 bg-neutral-800 rounded w-2/3" />
                    <div className="h-4 bg-neutral-800 rounded w-full" />
                    <div className="h-4 bg-neutral-800 rounded w-5/6" />
                </div>
            </div>
        );
    }

    if (!article) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <BookOpen size={48} className="text-neutral-600" />
                <p className="text-neutral-400">Статья не найдена</p>
                <button onClick={() => router.push('/training')} className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1">
                    <ArrowLeft size={14} /> Вернуться к обучению
                </button>
            </div>
        );
    }

    const colors = CATEGORY_COLORS[article.category];
    const catLabel = CATEGORIES.find(c => c.key === article.category);

    return (
        <div className="flex flex-col gap-6 animate-fade-in pb-8 max-w-3xl mx-auto">
            <nav className="flex items-center gap-2 text-xs text-neutral-500 pt-2">
                <button onClick={() => router.push('/training')} className="hover:text-white transition-colors">Обучение</button>
                <ChevronRight size={10} />
                <button onClick={() => router.push('/training')} className="hover:text-white transition-colors">{catLabel?.label}</button>
                <ChevronRight size={10} />
                <span className="text-neutral-400 truncate max-w-[200px]">{article.title}</span>
            </nav>

            <div className="relative aspect-[2/1] rounded-2xl overflow-hidden">
                <img src={article.cover_image.replace('w=600', 'w=1200').replace('h=340', 'h=600')} alt={article.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="flex items-center gap-3 mb-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>{catLabel?.emoji} {catLabel?.label}</span>
                        <span className="flex items-center gap-1 text-xs text-neutral-300"><Clock size={12} /> {article.read_time} мин чтения</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">{article.title}</h1>
                    <p className="text-sm text-neutral-400 mt-2">{article.excerpt}</p>
                </div>
            </div>

            <article className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-8">
                {renderMarkdown(article.content)}
            </article>

            {related.length > 0 && (
                <div>
                    <h2 className="text-lg font-bold text-white mb-4">Читайте также</h2>
                    <div className="grid sm:grid-cols-3 gap-3">
                        {related.map(r => (
                            <div key={r.slug} onClick={() => router.push(`/training/${r.slug}`)} className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden group cursor-pointer hover:border-neutral-700 transition-all hover:-translate-y-0.5">
                                <div className="relative aspect-[16/9]">
                                    <img src={r.cover_image} alt={r.title} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" loading="lazy" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent" />
                                </div>
                                <div className="p-3">
                                    <h3 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors leading-snug">{r.title}</h3>
                                    <div className="flex items-center gap-1 text-[10px] text-neutral-500 mt-1.5"><Clock size={9} /> {r.read_time} мин</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <button onClick={() => router.push('/training')} className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors font-medium self-start">
                <ArrowLeft size={16} /> Назад к обучению
            </button>
        </div>
    );
}
