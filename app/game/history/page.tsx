"use client"

import React, { useState, useEffect } from 'react';
import { Calendar, Filter, Search, Clock, Loader2 } from 'lucide-react'; // 引入 Loader
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import BottomNav from '@/components/lobby/BottomNav';
import CardComponent from '@/components/game/Card';
import LandscapeGuard from '@/components/game/LandscapeGuard';
import api from '@/lib/api'; // 引入我们封装的 axios
import { toast } from 'sonner';

export default function HistoryPage() {
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState<any[]>([]); // 暂用 any

    // 1. 获取真实数据
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const { data } = await api.get('/history');
                setHistory(data);
            } catch (error) {
                toast.error("Failed to load history");
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    // 简单的解析函数 (复用之前的)
    const parseCard = (code: string) => {
        if (!code) return { rank: 'A', suite: '♠' };
        const rank = code.slice(0, -1) as any;
        const suiteCode = code.slice(-1).toLowerCase();
        const suiteMap: any = { s: '♠', h: '♥', c: '♣', d: '♦' };
        return { rank, suite: suiteMap[suiteCode] || '♠' };
    };

    return (
        <div className="min-h-screen bg-table-bg text-white pb-20 relative">
            <LandscapeGuard />

            {/* Header */}
            <header className="sticky top-0 z-40 bg-black/60 backdrop-blur-md border-b border-white/5 px-4 py-4 flex items-center justify-between">
                <h1 className="text-xl font-bold font-serif text-gold-main flex items-center gap-2">
                    <Calendar className="w-5 h-5" /> Hand History
                </h1>
                {/* ... Search Icons ... */}
            </header>

            {/* Stats Summary (静态展示，后期可接接口) */}
            <div className="p-4 grid grid-cols-2 gap-4">
                <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                    <div className="text-xs text-slate-500 mb-1">Total Hands</div>
                    <div className="text-2xl font-mono font-bold">{history.length}</div>
                </div>
                {/* ... */}
            </div>

            {/* Hand List */}
            <ScrollArea className="px-4 h-[calc(100vh-220px)]">
                {loading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="animate-spin text-gold-main" />
                    </div>
                ) : (
                    <div className="space-y-3">
                        {history.map((record, i) => (
                            <div key={i} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                                <Card className="bg-slate-900/80 border-white/5 overflow-hidden">
                                    <CardContent className="p-0">
                                        <div className="p-4 flex justify-between items-center">
                                            {/* 左侧：时间与房间 */}
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className={`border-none text-black font-bold px-1.5 py-0 text-[10px] ${
                                                        record.result === 'WIN' ? 'bg-green-500' :
                                                            record.result === 'LOSS' ? 'bg-red-500' : 'bg-slate-500'
                                                    }`}>
                                                        {record.result}
                                                    </Badge>
                                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {record.date}
                                        </span>
                                                </div>
                                                <div className="font-bold text-sm text-slate-200">
                                                    {record.roomName} <span className="text-xs font-normal text-slate-500">({record.blinds})</span>
                                                </div>
                                            </div>

                                            {/* 右侧：盈利与手牌 */}
                                            <div className="flex items-center gap-4">
                                                <div className="flex -space-x-4 scale-75 origin-right opacity-80">
                                                    {record.handCards && record.handCards.map((c: string, idx: number) => {
                                                        const { rank, suite } = parseCard(c);
                                                        // @ts-ignore
                                                        return <CardComponent key={idx} rank={rank} suite={suite} size="sm" className="shadow-md" />;
                                                    })}
                                                </div>
                                                <div className={`text-lg font-mono font-bold ${Number(record.profit) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                    {Number(record.profit) >= 0 ? '+' : ''}{Number(record.profit).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ))}

                        {history.length === 0 && (
                            <div className="text-center text-slate-500 py-10">No history found.</div>
                        )}
                    </div>
                )}
            </ScrollArea>

            <BottomNav />
        </div>
    );
}