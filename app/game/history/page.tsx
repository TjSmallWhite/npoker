"use client"

import React, { useState } from 'react';
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Clock, ChevronDown, ChevronUp, Search, Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import BottomNav from '@/components/lobby/BottomNav';
import CardComponent from '@/components/game/Card'; // 复用你的扑克牌组件
import LandscapeGuard from '@/components/game/LandscapeGuard';

// --- Mock Data ---
interface HandRecord {
    id: string;
    date: string;
    roomName: string;
    blinds: string;
    handCards: [string, string]; // e.g. ["As", "Kh"]
    profit: number; // 正负数
    result: 'WIN' | 'LOSS' | 'FOLD';
}

const HISTORY_DATA: HandRecord[] = [
    { id: "H-88293", date: "Just now", roomName: "Novice Room", blinds: "$1/$2", handCards: ["As", "Ks"], profit: 450, result: "WIN" },
    { id: "H-88292", date: "10 mins ago", roomName: "Novice Room", blinds: "$1/$2", handCards: ["7h", "2d"], profit: -20, result: "FOLD" },
    { id: "H-88291", date: "2 hours ago", roomName: "Regular Table", blinds: "$5/$10", handCards: ["QQS", "QHS"], profit: -1200, result: "LOSS" }, // QQS 代表 Q Spade
    { id: "H-88290", date: "Yesterday", roomName: "Regular Table", blinds: "$5/$10", handCards: ["Ah", "Ac"], profit: 3800, result: "WIN" },
    { id: "H-88289", date: "Yesterday", roomName: "High Rollers", blinds: "$50/$100", handCards: ["Js", "Jc"], profit: 12500, result: "WIN" },
];

export default function HistoryPage() {
    const router = useRouter();

    // 简单的解析函数，把简写转成组件需要的 props
    // 比如 "As" -> rank="A", suite="♠"
    const parseCard = (code: string) => {
        // 这里做个简单的映射演示，实际可以用更严谨的正则
        const rank = code.slice(0, -1);
        const suiteCode = code.slice(-1).toLowerCase();
        const suiteMap: any = { s: '♠', h: '♥', c: '♣', d: '♦' };
        return { rank: rank as any, suite: suiteMap[suiteCode] || '♠' };
    };

    return (
        <div className="min-h-screen bg-table-bg text-white pb-20 relative">
            <LandscapeGuard />

            {/* Header */}
            <header className="sticky top-0 z-40 bg-black/60 backdrop-blur-md border-b border-white/5 px-4 py-4 flex items-center justify-between">
                <h1 className="text-xl font-bold font-serif text-gold-main flex items-center gap-2">
                    <Calendar className="w-5 h-5" /> Hand History
                </h1>
                <div className="flex gap-3">
                    <Filter className="w-5 h-5 text-slate-400" />
                    <Search className="w-5 h-5 text-slate-400" />
                </div>
            </header>

            {/* Stats Summary (总览) */}
            <div className="p-4 grid grid-cols-2 gap-4">
                <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                    <div className="text-xs text-slate-500 mb-1">Total Hands</div>
                    <div className="text-2xl font-mono font-bold">1,204</div>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                    <div className="text-xs text-slate-500 mb-1">Net Profit (7d)</div>
                    <div className="text-2xl font-mono font-bold text-green-500">+$15,400</div>
                </div>
            </div>

            {/* Hand List */}
            <ScrollArea className="px-4 h-[calc(100vh-220px)]">
                <div className="space-y-3">
                    {HISTORY_DATA.map((record, i) => (
                        <motion.div
                            key={record.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <Card className="bg-slate-900/80 border-white/5 overflow-hidden">
                                <CardContent className="p-0">
                                    {/* 上半部分：概览 */}
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
                                            {/* 手牌展示 (缩小版) */}
                                            <div className="flex -space-x-4 scale-75 origin-right opacity-80">
                                                {record.handCards.map((c, idx) => {
                                                    const { rank, suite } = parseCard(c);
                                                    return <CardComponent key={idx} rank={rank} suite={suite} size="sm" className="shadow-md" />;
                                                })}
                                            </div>

                                            {/* 盈利数额 */}
                                            <div className={`text-lg font-mono font-bold ${record.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                {record.profit >= 0 ? '+' : ''}${Math.abs(record.profit).toLocaleString()}
                                            </div>
                                        </div>

                                    </div>

                                    {/* (可选) 点击展开详细过程，暂留白 */}
                                    {/* <div className="px-4 py-2 bg-black/20 text-xs text-slate-500 border-t border-white/5">
                            Tap to view replay
                        </div> */}
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}

                    <div className="text-center text-xs text-slate-600 py-4">
                        Only showing last 5 hands
                    </div>
                </div>
            </ScrollArea>

            <BottomNav />
        </div>
    );
}