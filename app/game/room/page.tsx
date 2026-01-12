"use client"

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from "sonner";
import { ArrowLeft, Plus, PlayCircle } from 'lucide-react'; // 新增 PlayCircle
import { motion, AnimatePresence } from 'framer-motion'; // 引入动画库

import LandscapeGuard from '@/components/game/LandscapeGuard';
// 注意：这里把 Card 换成 AnimatedCard
import AnimatedCard from '@/components/game/AnimatedCard';
import Card from '@/components/game/Card'; // 牌堆还是用静态 Card
import BuyInModal from '@/components/game/BuyInModal';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useGameStore } from "@/store/useGameStore";
import { cn } from "@/lib/utils";

// ... (SEAT_POSITIONS 和 getVisualPosition 代码保持不变) ...
const SEAT_POSITIONS = [
    { id: 0, className: "bottom-4 left-1/2 -translate-x-1/2" },
    { id: 1, className: "bottom-16 left-[20%]" },
    { id: 2, className: "top-1/2 -translate-y-1/2 left-4" },
    { id: 3, className: "top-16 left-[20%]" },
    { id: 4, className: "top-4 left-1/2 -translate-x-1/2" },
    { id: 5, className: "top-16 right-[20%]" },
    { id: 6, className: "top-1/2 -translate-y-1/2 right-4" },
    { id: 7, className: "bottom-16 right-[20%]" },
    { id: 8, className: "hidden" },
];

export default function PokerRoom() {
    const router = useRouter();
    const {
        players, communityCards, pot, myPlayerId, activePlayerId,
        stage, winnerIds, // 取出 stage 和 winners
        playerAction, sitDown, nextPhase // 取出 nextPhase
    } = useGameStore();

    // ... (本地状态保持不变)
    const [raiseAmount, setRaiseAmount] = useState([200]);
    const [showBuyIn, setShowBuyIn] = useState(false);
    const [selectedSeat, setSelectedSeat] = useState<number | null>(null);

    const isMyTurn = activePlayerId === myPlayerId && myPlayerId !== null;
    const heroPlayer = players.find(p => p.id === myPlayerId);
    const heroSeatIndex = heroPlayer ? heroPlayer.position : 0;

    const getVisualPosition = (serverSeatIndex: number) => {
        if (!heroPlayer) return serverSeatIndex;
        const maxSeats = 8;
        return (serverSeatIndex - heroSeatIndex + maxSeats) % maxSeats;
    };

    // ... (handleSeatClick, handleBuyInConfirm, handleAction 保持不变) ...
    const handleSeatClick = (seatIndex: number) => {
        if (myPlayerId) { toast.error("Already seated!"); return; }
        setSelectedSeat(seatIndex);
        setShowBuyIn(true);
    };

    const handleBuyInConfirm = (amount: number) => {
        if (selectedSeat === null) return;
        sitDown(999, selectedSeat, amount);
        toast.success("Seated!");
        setShowBuyIn(false);
    };

    const handleAction = (type: 'FOLD'|'CHECK'|'RAISE') => {
        if(!myPlayerId) return;
        if(type === 'RAISE') playerAction(myPlayerId, type, raiseAmount[0]);
        else playerAction(myPlayerId, type);
    };

    // --- Dev Tool: 模拟游戏进程 ---
    const handleNextPhase = () => {
        nextPhase(); // 触发 Store 的状态机
        toast.info(`Game Stage: ${useGameStore.getState().stage}`);
    };

    return (
        <div className="w-full h-screen bg-table-bg relative overflow-hidden flex flex-col">
            <LandscapeGuard />

            <BuyInModal
                isOpen={showBuyIn} onClose={() => setShowBuyIn(false)}
                onConfirm={handleBuyInConfirm} minBuyIn={100} maxBuyIn={5000} userBalance={10000}
            />

            {/* Top Bar */}
            <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-10 pointer-events-none">
                <div className="pointer-events-auto flex gap-2">
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white" onClick={() => router.back()}>
                        <ArrowLeft className="w-6 h-6" />
                    </Button>
                    <Badge variant="outline" className="bg-black/40 text-white border-white/10 h-9 px-3">
                        Room #8888 ({stage}) {/* 显示当前阶段 */}
                    </Badge>
                </div>

                {/* --- DEV ONLY: Game Control Button --- */}
                <Button
                    onClick={handleNextPhase}
                    className="pointer-events-auto bg-blue-600 hover:bg-blue-500 text-white shadow-lg z-50 animate-pulse"
                >
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Dev: Next Phase
                </Button>
            </div>

            {/* --- 牌桌区域 --- */}
            <div className="flex-1 relative flex items-center justify-center perspective-[1000px]">
                <div className="w-[85%] h-[65%] bg-table-felt border-[16px] border-table-felt-dark rounded-[150px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative flex items-center justify-center">

                    {/* 桌子中央 Logo */}
                    <div className="absolute top-[20%] font-serif text-table-felt-dark/30 text-4xl font-bold select-none pointer-events-none">
                        POKER MASTER
                    </div>

                    {/* --- 牌堆 (Deck) --- */}
                    {/* 放在桌子稍上方，作为发牌源头 */}
                    <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-20 bg-transparent z-0">
                        {/* 模拟厚度 */}
                        {[1,2,3].map(i => (
                            <div key={i} className={`absolute top-0 left-0 w-full h-full bg-blue-800 rounded border border-blue-900 shadow-sm`} style={{ transform: `translate(-${i}px, -${i}px)` }} />
                        ))}
                        {/* 顶张牌背 */}
                        <Card hidden size="md" className="absolute top-0 left-0 -translate-x-1 -translate-y-1" />
                    </div>

                    {/* --- 公共牌区域 (Community Cards) --- */}
                    {/* 使用 AnimatePresence 确保卡片进出都有动画 */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-3 z-10 h-20 min-w-[200px] justify-center items-center">
                        <AnimatePresence mode='popLayout'>
                            {communityCards.map((card, i) => (
                                <AnimatedCard
                                    key={`${card.code}-${i}`} // 唯一 key
                                    index={i} // 传入索引用于延迟动画
                                    rank={card.rank as any}
                                    suite={card.suite as any}
                                    size="md"
                                    className="shadow-2xl"
                                />
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* 底池 */}
                    <motion.div
                        layout // 布局变化时自动动画
                        className="absolute top-[65%] bg-black/40 px-6 py-1.5 rounded-full text-gold-main text-sm font-mono border border-white/5 backdrop-blur-sm shadow-inner"
                    >
                        Pot: ${pot.toLocaleString()}
                    </motion.div>

                    {/* --- 渲染玩家座位 --- */}
                    {Array.from({ length: 8 }).map((_, i) => {
                        const player = players.find(p => p.position === i);
                        const visualIndex = getVisualPosition(i);
                        const posStyle = SEAT_POSITIONS[visualIndex] || { className: 'hidden' };
                        // 判断是否是赢家 (Showdown 阶段高亮)
                        const isWinner = winnerIds?.includes(player?.id || -1);

                        return (
                            <div key={i} className={cn("absolute flex flex-col items-center gap-2 transition-all duration-700 ease-in-out", posStyle.className)}>
                                {player ? (
                                    <>
                                        {/* 赢家光效 */}
                                        {isWinner && (
                                            <div className="absolute inset-0 -m-4 bg-gold-main/30 blur-xl rounded-full animate-pulse z-0" />
                                        )}

                                        <div className="relative z-10">
                                            <Avatar className={cn("w-14 h-14 border-2 shadow-lg transition-all bg-slate-900",
                                                player.id === activePlayerId ? "border-gold-main ring-4 ring-gold-main/30 scale-110" : "border-slate-300",
                                                isWinner ? "border-gold-main ring-4 ring-gold-main scale-110" : ""
                                            )}>
                                                <AvatarFallback className="bg-slate-800 text-white">{player.name[0]}</AvatarFallback>
                                            </Avatar>
                                            {/* ... (倒计时圈、庄家按钮代码保持不变) ... */}
                                        </div>

                                        <div className="bg-black/70 text-white text-xs px-3 py-1 rounded-full text-center min-w-[80px] backdrop-blur-md border border-white/10 shadow-lg z-10">
                                            <div className="font-bold truncate max-w-[80px] text-slate-200">{player.name}</div>
                                            <div className="text-gold-main font-mono font-bold">${player.chips.toLocaleString()}</div>
                                        </div>

                                        {/* ... (动作 Badge 保持不变) ... */}

                                        {/* 别人的手牌/自己的牌背 (Showdown 时如果不是自己，且有牌数据，则显示正面) */}
                                        {player.id !== myPlayerId && player.status === 'active' && (
                                            <div className="absolute top-4 left-8 flex -space-x-8 scale-75 rotate-12 opacity-80 z-0">
                                                {/* 如果到了摊牌阶段且玩家有牌数据，显示正面 */}
                                                {stage === 'SHOWDOWN' && player.cards ? (
                                                    <>
                                                        <Card rank={player.cards[0].rank as any} suite={player.cards[0].suite as any} size="sm" />
                                                        <Card rank={player.cards[1].rank as any} suite={player.cards[1].suite as any} size="sm" />
                                                    </>
                                                ) : (
                                                    // 否则显示牌背
                                                    <>
                                                        <Card hidden size="sm" />
                                                        <Card hidden size="sm" />
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    !myPlayerId && (
                                        <button onClick={() => handleSeatClick(i)} className="w-12 h-12 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center text-white/20 hover:text-gold-main hover:border-gold-main hover:bg-gold-main/10 transition-all group">
                                            <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                        </button>
                                    )
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* --- 底部 Hero 操作栏 (代码保持不变) --- */}
            <div className="h-[140px] w-full bg-gradient-to-t from-black via-black/80 to-transparent absolute bottom-0 z-20 px-4 pb-4 flex items-end justify-center">
                {/* ... (Hero 手牌和操作按钮) ... */}
                {heroPlayer && heroPlayer.cards && (
                    <div className="absolute bottom-[100px] left-1/2 -translate-x-1/2 flex gap-1 z-30">
                        {/* 使用 AnimatedCard 让自己的牌也动起来 (可选，或者保持 layout 动画) */}
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ type: 'spring', delay: 0.2 }}
                            className="-rotate-6 origin-bottom-right"
                        >
                            <Card rank={heroPlayer.cards[0].rank as any} suite={heroPlayer.cards[0].suite as any} size="lg" className="shadow-[0_10px_20px_rgba(0,0,0,0.5)]" />
                        </motion.div>
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ type: 'spring', delay: 0.3 }}
                            className="rotate-6 origin-bottom-left"
                        >
                            <Card rank={heroPlayer.cards[1].rank as any} suite={heroPlayer.cards[1].suite as any} size="lg" className="shadow-[0_10px_20px_rgba(0,0,0,0.5)]" />
                        </motion.div>
                    </div>
                )}
                {/* ... */}
            </div>
        </div>
    );
}