"use client"

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from "sonner";
import { ArrowLeft, Plus, PlayCircle, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import LandscapeGuard from '@/components/game/LandscapeGuard';
import AnimatedCard from '@/components/game/AnimatedCard';
import Card from '@/components/game/Card';
import BuyInModal from '@/components/game/BuyInModal';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useGameStore } from "@/store/useGameStore";
import { cn } from "@/lib/utils";
import api from '@/lib/api';

// --- 响应式座位坐标 (Responsive Seat Positions) ---
// 手机端(Default) 使用百分比紧贴边缘; 桌面端(md) 使用舒适的间距
const SEAT_POSITIONS = [
    // 0: Hero (Bottom Center) - 稍微往上提一点，留给操作栏
    { id: 0, className: "bottom-[18%] left-1/2 -translate-x-1/2 md:bottom-8" },

    // 1: 左下 (Bottom Left)
    { id: 1, className: "bottom-[20%] left-[2%] md:bottom-16 md:left-[15%]" },

    // 2: 左 (Left Center)
    { id: 2, className: "top-1/2 -translate-y-[60%] left-[1%] md:left-4" },

    // 3: 左上 (Top Left)
    { id: 3, className: "top-[12%] left-[2%] md:top-16 md:left-[15%]" },

    // 4: 正上 (Top Center)
    { id: 4, className: "top-[2%] left-1/2 -translate-x-1/2 md:top-4" },

    // 5: 右上 (Top Right)
    { id: 5, className: "top-[12%] right-[2%] md:top-16 md:right-[15%]" },

    // 6: 右 (Right Center)
    { id: 6, className: "top-1/2 -translate-y-[60%] right-[1%] md:right-4" },

    // 7: 右下 (Bottom Right)
    { id: 7, className: "bottom-[20%] right-[2%] md:bottom-16 md:right-[15%]" },
];

export default function PokerRoom() {
    const router = useRouter();
    const {
        currentUser, players, communityCards, pot, myPlayerId, activePlayerId,
        stage, winnerIds,
        playerAction, sitDown, nextPhase, updateGameState
    } = useGameStore();

    const [raiseAmount, setRaiseAmount] = useState([200]);
    const [showBuyIn, setShowBuyIn] = useState(false);
    const [selectedSeat, setSelectedSeat] = useState<number | null>(null);

    // Mock Init: 获取房间初始状态 (真实场景应调用 API)
    useEffect(() => {
        const initRoom = async () => {
            // 暂时先 Mock 一下，保证 UI 有东西显示
            // 实际上这里应该调用 await api.get('/rooms/1/state')
            // updateGameState(...)
        };
        initRoom();
    }, []);

    const isMyTurn = activePlayerId === myPlayerId && myPlayerId !== null;
    const heroPlayer = players.find(p => p.id === myPlayerId);
    // 如果没坐下，默认视角为 0
    const heroSeatIndex = heroPlayer ? heroPlayer.position : 0;

    // 旋转算法
    const getVisualPosition = (serverSeatIndex: number) => {
        if (!heroPlayer) return serverSeatIndex;
        const maxSeats = 8; // 前端我们按8人桌画
        return (serverSeatIndex - heroSeatIndex + maxSeats) % maxSeats;
    };

    const handleSeatClick = (seatIndex: number) => {
        if (myPlayerId) { toast.error("Already seated!"); return; }
        setSelectedSeat(seatIndex);
        setShowBuyIn(true);
    };

    // --- 对接真实 API 的坐下 ---
    const handleBuyInConfirm = async (amount: number) => {
        if (selectedSeat === null) return;

        // 调用 Store 里的真实 sitDown (会发请求给 Laravel)
        const success = await sitDown("1", selectedSeat, amount); // 假设 roomId=1

        if (success) {
            toast.success("Seated successfully!");
            setShowBuyIn(false);
        }
    };

    const handleAction = (type: 'FOLD'|'CHECK'|'RAISE') => {
        if(!myPlayerId) return;
        // 这里后续也要改成 api.post('/rooms/1/act')
        if(type === 'RAISE') playerAction(myPlayerId, type, raiseAmount[0]);
        else playerAction(myPlayerId, type);
    };

    return (
        <div className="w-full h-screen bg-table-bg relative overflow-hidden flex flex-col select-none">
            <LandscapeGuard />

            <BuyInModal
                isOpen={showBuyIn} onClose={() => setShowBuyIn(false)}
                onConfirm={handleBuyInConfirm} minBuyIn={100} maxBuyIn={5000} userBalance={Number(currentUser?.chips || 0)}
            />

            {/* --- Top Bar (Compact) --- */}
            <div className="absolute top-0 left-0 w-full p-2 md:p-4 flex justify-between items-start z-20 pointer-events-none">
                <div className="pointer-events-auto flex gap-2 items-center">
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white h-8 w-8" onClick={() => router.back()}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <Badge variant="outline" className="bg-black/60 text-white border-white/10 h-7 px-2 text-[10px] md:text-xs backdrop-blur-md">
                        Room #1 • $5/$10
                    </Badge>
                </div>

                <div className="pointer-events-auto flex gap-2">
                    {/* Dev Button */}
                    <Button onClick={() => nextPhase()} size="sm" className="h-7 bg-blue-600/80 hover:bg-blue-500 text-[10px] px-2">
                        <PlayCircle className="w-3 h-3 mr-1" /> Dev
                    </Button>
                    <Button variant="ghost" size="icon" className="text-white h-8 w-8">
                        <Menu className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* --- 牌桌区域 (核心适配区) --- */}
            <div className="flex-1 relative flex items-center justify-center perspective-[1000px] overflow-hidden">
                {/* Table Container:
                   手机端: w-[95%] h-[60%] border-[8px] (更扁平，留出上下空间)
                   PC端: w-[80%] h-[65%] border-[16px]
                */}
                <div className="w-[92%] h-[55%] md:w-[80%] md:h-[65%] bg-table-felt border-[8px] md:border-[16px] border-table-felt-dark rounded-[60px] md:rounded-[150px] shadow-2xl relative flex items-center justify-center">

                    {/* Logo */}
                    <div className="absolute top-[25%] font-serif text-table-felt-dark/40 text-2xl md:text-4xl font-bold pointer-events-none">
                        POKER
                    </div>

                    {/* --- 公共牌 (Community Cards) --- */}
                    {/* 手机端: scale-75 (缩小显示) */}
                    <div className="absolute top-[50%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-1 md:gap-3 z-10 h-16 items-center">
                        <AnimatePresence mode='popLayout'>
                            {communityCards.map((card, i) => (
                                <div key={`${card.code}-${i}`} className="transform scale-75 md:scale-100 origin-center">
                                    <AnimatedCard
                                        index={i}
                                        rank={card.rank as any}
                                        suite={card.suite as any}
                                        size="md"
                                        className="shadow-xl"
                                    />
                                </div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Pot - 稍微下移一点 */}
                    <div className="absolute top-[68%] bg-black/40 px-3 py-0.5 md:px-6 md:py-1.5 rounded-full text-gold-main text-xs md:text-sm font-mono border border-white/5 backdrop-blur-sm">
                        Pot: ${pot.toLocaleString()}
                    </div>

                    {/* --- 渲染座位 --- */}
                    {Array.from({ length: 8 }).map((_, i) => {
                        const player = players.find(p => p.position === i);
                        const visualIndex = getVisualPosition(i);
                        const posStyle = SEAT_POSITIONS[visualIndex] || { className: 'hidden' };
                        const isWinner = winnerIds?.includes(player?.id || -1);

                        return (
                            <div key={i} className={cn("absolute flex flex-col items-center gap-1 transition-all duration-500", posStyle.className)}>
                                {player ? (
                                    <>
                                        <div className="relative z-10">
                                            {/* Avatar: 手机端 w-10 (40px) */}
                                            <Avatar className={cn("w-10 h-10 md:w-16 md:h-16 border-2 shadow-lg bg-slate-900",
                                                player.id === activePlayerId ? "border-gold-main ring-2 md:ring-4 ring-gold-main/30 scale-110" : "border-slate-300",
                                                isWinner ? "border-gold-main ring-4 ring-gold-main scale-110" : ""
                                            )}>
                                                <AvatarFallback className="bg-slate-800 text-white text-[10px] md:text-base">{player.name[0]}</AvatarFallback>
                                            </Avatar>

                                            {/* 倒计时圈 (只在 PC 显示或手机端简化) */}
                                            {player.id === activePlayerId && (
                                                <div className="absolute -inset-1 border-2 border-gold-main rounded-full animate-pulse md:hidden" />
                                            )}

                                            {player.isDealer && (
                                                <div className="absolute -bottom-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-white text-black text-[8px] md:text-[10px] font-bold rounded-full flex items-center justify-center border border-slate-400 z-20">D</div>
                                            )}
                                        </div>

                                        {/* Info Box: 手机端极简模式 */}
                                        <div className="bg-black/80 text-white text-[9px] md:text-xs px-2 py-0.5 md:py-1 rounded-md text-center min-w-[50px] md:min-w-[80px] border border-white/10 shadow-lg z-20 -mt-1">
                                            <div className="truncate max-w-[50px] md:max-w-[80px] text-slate-300 leading-tight">{player.name}</div>
                                            <div className="text-gold-main font-mono font-bold leading-tight">${player.chips > 1000 ? (player.chips/1000).toFixed(1)+'k' : player.chips}</div>
                                        </div>

                                        {/* 别人手牌: 手机端缩小 */}
                                        {player.id !== myPlayerId && player.status === 'active' && (
                                            <div className="absolute top-2 left-6 md:left-10 flex -space-x-4 md:-space-x-8 scale-50 md:scale-75 rotate-12 opacity-90 z-0">
                                                <Card hidden size="sm" />
                                                <Card hidden size="sm" />
                                            </div>
                                        )}

                                        {/* Action Badge */}
                                        {player.lastAction && (
                                            <Badge className="absolute -top-4 z-30 bg-white/90 text-black text-[9px] h-4 px-1 md:text-xs shadow-md animate-in zoom-in">
                                                {player.lastAction}
                                            </Badge>
                                        )}
                                    </>
                                ) : (
                                    !myPlayerId && (
                                        <button onClick={() => handleSeatClick(i)} className="w-9 h-9 md:w-12 md:h-12 rounded-full border border-dashed border-white/30 flex items-center justify-center text-white/30 hover:text-gold-main hover:border-gold-main hover:bg-gold-main/10 transition-all">
                                            <Plus className="w-4 h-4 md:w-6 md:h-6" />
                                        </button>
                                    )
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* --- 底部 Hero 操作栏 (Mobile Optimized) --- */}
            {/* 高度压缩至 80px-100px */}
            <div className="w-full absolute bottom-0 z-30 px-2 pb-2 md:px-4 md:pb-4 flex items-end justify-center pointer-events-none">

                {/* 1. Hero Hand Cards */}
                {/* 手机端: 放在左下角或者稍微靠左，不要挡住中间 */}
                {heroPlayer && heroPlayer.cards && (
                    <div className="absolute bottom-[80px] md:bottom-[100px] left-1/2 -translate-x-1/2 flex gap-0.5 md:gap-1 z-40 transition-all duration-300">
                        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="-rotate-3 origin-bottom-right transform scale-90 md:scale-110">
                            <Card rank={heroPlayer.cards[0].rank as any} suite={heroPlayer.cards[0].suite as any} size="lg" className="shadow-2xl" />
                        </motion.div>
                        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="rotate-3 origin-bottom-left transform scale-90 md:scale-110">
                            <Card rank={heroPlayer.cards[1].rank as any} suite={heroPlayer.cards[1].suite as any} size="lg" className="shadow-2xl" />
                        </motion.div>
                    </div>
                )}

                {/* 2. Controls */}
                {isMyTurn && (
                    <div className="w-full max-w-xl flex items-end gap-2 animate-in slide-in-from-bottom-10 fade-in duration-200 mb-1">
                        {/* FOLD */}
                        <Button
                            onClick={() => handleAction('FOLD')}
                            variant="destructive"
                            className="flex-1 h-10 md:h-14 rounded-lg font-bold text-sm md:text-lg shadow-lg border-b-4 border-red-900 active:border-b-0 active:translate-y-1"
                        >
                            FOLD
                        </Button>

                        {/* CHECK */}
                        <Button
                            onClick={() => handleAction('CHECK')}
                            className="flex-1 h-10 md:h-14 bg-slate-600 hover:bg-slate-500 rounded-lg font-bold text-sm md:text-lg shadow-lg border-b-4 border-slate-800 active:border-b-0 active:translate-y-1"
                        >
                            CHECK
                        </Button>

                        {/* RAISE Slider & Button */}
                        <div className="flex-[2] flex gap-2 bg-black/60 p-1.5 rounded-lg border border-white/10 backdrop-blur-md items-center h-10 md:h-auto md:block md:p-2">
                            {/* Mobile: 简化 Slider 展示 */}
                            <div className="hidden md:block">
                                <div className="flex justify-between text-xs text-slate-300 px-1 mb-1">
                                    <span>Raise</span>
                                    <span className="text-gold-main font-mono">${raiseAmount}</span>
                                </div>
                                <Slider value={raiseAmount} onValueChange={setRaiseAmount} min={20} max={heroPlayer?.chips} step={10} className="mb-2" />
                            </div>

                            <Button
                                onClick={() => handleAction('RAISE')}
                                className="w-full h-full md:h-10 bg-gold-main hover:bg-yellow-400 text-black font-bold rounded shadow-sm md:shadow md:border-b-4 border-yellow-700 active:border-b-0 text-xs md:text-base leading-tight"
                            >
                                RAISE <span className="hidden md:inline ml-1">${raiseAmount}</span>
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}