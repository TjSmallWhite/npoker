"use client"

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from "sonner";
import { ArrowLeft, Plus } from 'lucide-react';

import LandscapeGuard from '@/components/game/LandscapeGuard';
import Card from '@/components/game/Card'; // 使用漂亮的 Card 组件
import BuyInModal from '@/components/game/BuyInModal';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useGameStore } from "@/store/useGameStore";
import { cn } from "@/lib/utils";

// --- 座位配置 (9人桌) ---
// 0号位永远在正下方（我的位置）
const SEAT_POSITIONS = [
    { id: 0, className: "bottom-4 left-1/2 -translate-x-1/2" },
    { id: 1, className: "bottom-16 left-[20%]" },
    { id: 2, className: "top-1/2 -translate-y-1/2 left-4" },
    { id: 3, className: "top-16 left-[20%]" },
    { id: 4, className: "top-4 left-1/2 -translate-x-1/2" },
    { id: 5, className: "top-16 right-[20%]" },
    { id: 6, className: "top-1/2 -translate-y-1/2 right-4" },
    { id: 7, className: "bottom-16 right-[20%]" },
    { id: 8, className: "hidden" }, // 9人桌通常不显示这个，或者你可以自己调整位置
];

export default function PokerRoom() {
    const router = useRouter();
    const {
        players, communityCards, pot, myPlayerId, activePlayerId,
        updateGameState, playerAction, sitDown
    } = useGameStore();

    // 本地状态
    const [raiseAmount, setRaiseAmount] = useState([200]);

    // 买入弹窗控制
    const [showBuyIn, setShowBuyIn] = useState(false);
    const [selectedSeat, setSelectedSeat] = useState<number | null>(null);

    // 计算当前是否轮到我
    const isMyTurn = activePlayerId === myPlayerId && myPlayerId !== null;

    // --- Mock 初始化: 模拟房间里已经有几个机器人 ---
    useEffect(() => {
        // 注意：这里没有设置 myPlayerId，意味着我默认是“旁观者”
        updateGameState({
            roomId: "8888",
            pot: 1200,
            communityCards: [
                { suite: '♠', rank: 'A', code: 'As' },
                { suite: '♦', rank: '10', code: 'Td' },
                { suite: '♣', rank: '7', code: '7c' }
            ],
            players: [
                { id: 101, name: "Tom Dwan", chips: 50000, avatar: "", position: 2, bet: 0, status: 'active', cards: null, lastAction: 'CHECK', isDealer: false, timeLeft: 0 },
                { id: 102, name: "Phil Ivey", chips: 82000, avatar: "", position: 5, bet: 0, status: 'active', cards: null, lastAction: 'RAISE', isDealer: true, timeLeft: 0 },
            ]
        });
    }, []);

    // --- 核心逻辑: 视角旋转 (Seat Rotation) ---
    // 如果我坐下了 (myPlayerId != null)，把我的位置转到正下方 (index 0)
    // 如果我没坐下 (Spectator)，保持绝对位置，或者默认 0 号位是空
    const heroPlayer = players.find(p => p.id === myPlayerId);
    const heroSeatIndex = heroPlayer ? heroPlayer.position : 0; // 旁观者默认视角以0为基准

    const getVisualPosition = (serverSeatIndex: number) => {
        if (!heroPlayer) return serverSeatIndex; // 旁观者视角：不旋转
        const maxSeats = 8;
        return (serverSeatIndex - heroSeatIndex + maxSeats) % maxSeats;
    };

    // --- 处理坐下点击 ---
    const handleSeatClick = (seatIndex: number) => {
        if (myPlayerId) {
            toast.error("You are already seated!");
            return;
        }
        // 打开买入弹窗
        setSelectedSeat(seatIndex);
        setShowBuyIn(true);
    };

    const handleBuyInConfirm = (amount: number) => {
        if (selectedSeat === null) return;

        // 1. 调用 Store 方法 (Mock)
        // 实际上这里应该发 API: POST /api/room/sit { seat: selectedSeat, amount: amount }
        sitDown(999, selectedSeat, amount); // 假设我的 ID 是 999

        toast.success(`Sat down at seat #${selectedSeat} with $${amount}`);
        setShowBuyIn(false);
    };

    // --- 游戏操作 ---
    const handleAction = (type: 'FOLD'|'CHECK'|'RAISE') => {
        if(!myPlayerId) return;
        if(type === 'RAISE') playerAction(myPlayerId, type, raiseAmount[0]);
        else playerAction(myPlayerId, type);
    };

    return (
        <div className="w-full h-screen bg-table-bg relative overflow-hidden flex flex-col">
            <LandscapeGuard />

            {/* 买入弹窗 */}
            <BuyInModal
                isOpen={showBuyIn}
                onClose={() => setShowBuyIn(false)}
                onConfirm={handleBuyInConfirm}
                minBuyIn={100}
                maxBuyIn={5000}
                userBalance={10000} // Mock Balance
            />

            {/* Top Bar */}
            <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-10 pointer-events-none">
                <div className="pointer-events-auto flex gap-2">
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white" onClick={() => router.back()}>
                        <ArrowLeft className="w-6 h-6" />
                    </Button>
                    <Badge variant="outline" className="bg-black/40 text-white border-white/10 h-9 px-3">
                        Room #8888 ($5/$10)
                    </Badge>
                </div>
                {/* Menu Button placeholder */}
                <Button variant="ghost" size="icon" className="pointer-events-auto text-white">
                    <div className="space-y-1">
                        <div className="w-5 h-0.5 bg-white"></div>
                        <div className="w-5 h-0.5 bg-white"></div>
                    </div>
                </Button>
            </div>

            {/* --- 牌桌区域 --- */}
            <div className="flex-1 relative flex items-center justify-center perspective-[1000px]">
                {/* 桌子本体 */}
                <div className="w-[85%] h-[65%] bg-table-felt border-[16px] border-table-felt-dark rounded-[150px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative flex items-center justify-center">

                    {/* 桌子 Logo/文字 */}
                    <div className="absolute top-[20%] font-serif text-table-felt-dark/30 text-4xl font-bold select-none pointer-events-none">
                        POKER MASTER
                    </div>

                    {/* 公共牌 (Community Cards) */}
                    <div className="flex gap-3 z-10">
                        {communityCards.map((card, i) => (
                            <Card key={i} rank={card.rank as any} suite={card.suite as any} size="md" className="shadow-2xl" />
                        ))}
                    </div>

                    {/* 底池 (Pot) */}
                    <div className="absolute top-[60%] bg-black/40 px-6 py-1.5 rounded-full text-gold-main text-sm font-mono border border-white/5 backdrop-blur-sm shadow-inner">
                        Pot: ${pot.toLocaleString()}
                    </div>

                    {/* --- 渲染所有座位 (包括空座位) --- */}
                    {Array.from({ length: 8 }).map((_, i) => {
                        // 1. 找到该座位上的玩家
                        const player = players.find(p => p.position === i);
                        // 2. 计算视觉位置
                        const visualIndex = getVisualPosition(i);
                        const posStyle = SEAT_POSITIONS[visualIndex] || { className: 'hidden' };

                        return (
                            <div
                                key={i}
                                className={cn(
                                    "absolute flex flex-col items-center gap-2 transition-all duration-700 ease-in-out",
                                    posStyle.className
                                )}
                            >
                                {player ? (
                                    // === 有人坐的情况 ===
                                    <>
                                        {/* 头像区域 */}
                                        <div className="relative">
                                            <Avatar className={cn("w-14 h-14 border-2 shadow-lg transition-all",
                                                player.id === activePlayerId ? "border-gold-main ring-4 ring-gold-main/30 scale-110" : "border-slate-300"
                                            )}>
                                                <AvatarFallback className="bg-slate-800 text-white">{player.name[0]}</AvatarFallback>
                                            </Avatar>

                                            {/* 倒计时圈 (Mock 样式) */}
                                            {player.id === activePlayerId && (
                                                <svg className="absolute -top-1 -left-1 w-16 h-16 pointer-events-none animate-spin-slow">
                                                    <circle cx="32" cy="32" r="30" fill="none" stroke="gold" strokeWidth="2" strokeDasharray="188" strokeDashoffset="40" className="opacity-50" />
                                                </svg>
                                            )}

                                            {/* 庄家 Button */}
                                            {player.isDealer && (
                                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white text-black text-[10px] font-bold rounded-full flex items-center justify-center border border-slate-400 z-20">
                                                    D
                                                </div>
                                            )}
                                        </div>

                                        {/* 信息条 */}
                                        <div className="bg-black/70 text-white text-xs px-3 py-1 rounded-full text-center min-w-[80px] backdrop-blur-md border border-white/10 shadow-lg">
                                            <div className="font-bold truncate max-w-[80px] text-slate-200">{player.name}</div>
                                            <div className="text-gold-main font-mono font-bold">${player.chips.toLocaleString()}</div>
                                        </div>

                                        {/* 玩家动作 Badge */}
                                        {player.lastAction && (
                                            <Badge className="absolute -top-8 z-20 bg-white/90 text-black shadow-lg animate-in zoom-in font-bold">
                                                {player.lastAction}
                                            </Badge>
                                        )}

                                        {/* 别人的手牌 (背面) */}
                                        {player.id !== myPlayerId && player.status === 'active' && (
                                            <div className="absolute top-4 left-8 flex -space-x-8 scale-75 rotate-12 opacity-80">
                                                <Card hidden size="sm" />
                                                <Card hidden size="sm" />
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    // === 空座位 (Empty Seat) ===
                                    // 只有我没坐下时，才显示空座位的“坐下”按钮
                                    !myPlayerId && (
                                        <button
                                            onClick={() => handleSeatClick(i)}
                                            className="w-12 h-12 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center text-white/20 hover:text-gold-main hover:border-gold-main hover:bg-gold-main/10 transition-all group"
                                        >
                                            <Plus className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                        </button>
                                    )
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* --- 底部操作栏 (只有我坐下了且轮到我才显示) --- */}
            <div className="h-[140px] w-full bg-gradient-to-t from-black via-black/80 to-transparent absolute bottom-0 z-20 px-4 pb-4 flex items-end justify-center">

                {/* 1. 我的手牌 (显示在正下方) */}
                {heroPlayer && heroPlayer.cards && (
                    <div className="absolute bottom-[100px] left-1/2 -translate-x-1/2 flex gap-1 z-30">
                        {/* 使用我们写的 Card 组件 */}
                        <div className="-rotate-6 hover:-translate-y-4 transition-transform duration-300 origin-bottom-right">
                            <Card rank={heroPlayer.cards[0].rank as any} suite={heroPlayer.cards[0].suite as any} size="lg" className="shadow-[0_10px_20px_rgba(0,0,0,0.5)]" />
                        </div>
                        <div className="rotate-6 hover:-translate-y-4 transition-transform duration-300 origin-bottom-left">
                            <Card rank={heroPlayer.cards[1].rank as any} suite={heroPlayer.cards[1].suite as any} size="lg" className="shadow-[0_10px_20px_rgba(0,0,0,0.5)]" />
                        </div>
                    </div>
                )}

                {/* 2. 操作按钮组 */}
                {isMyTurn && (
                    <div className="w-full max-w-xl flex items-end gap-3 animate-in slide-in-from-bottom-20 fade-in duration-300">
                        <Button
                            onClick={() => handleAction('FOLD')}
                            variant="destructive"
                            className="flex-1 h-14 rounded-xl font-bold text-lg shadow-lg border-b-4 border-red-900 active:border-b-0 active:translate-y-1 transition-all"
                        >
                            FOLD
                        </Button>
                        <Button
                            onClick={() => handleAction('CHECK')}
                            className="flex-1 h-14 bg-slate-600 hover:bg-slate-500 rounded-xl font-bold text-lg shadow-lg border-b-4 border-slate-800 active:border-b-0 active:translate-y-1 transition-all"
                        >
                            CHECK
                        </Button>

                        {/* 加注区域 */}
                        <div className="flex-[2] flex flex-col gap-2 bg-black/40 p-2 rounded-xl border border-white/10 backdrop-blur-md">
                            <div className="flex justify-between text-xs text-slate-300 px-1">
                                <span>Raise</span>
                                <span className="text-gold-main font-mono">${raiseAmount}</span>
                            </div>
                            <Slider
                                value={raiseAmount}
                                onValueChange={setRaiseAmount}
                                min={20} max={heroPlayer?.chips} step={10}
                                className="cursor-pointer"
                            />
                            <Button
                                onClick={() => handleAction('RAISE')}
                                className="w-full h-10 bg-gold-main hover:bg-yellow-400 text-black font-bold rounded-lg shadow border-b-4 border-yellow-700 active:border-b-0 active:translate-y-1"
                            >
                                RAISE ${raiseAmount}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}