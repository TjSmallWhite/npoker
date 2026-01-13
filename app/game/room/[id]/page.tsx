"use client"

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from "sonner";
import { ArrowLeft, Plus, Menu, Settings } from 'lucide-react';
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
import { echo } from "@/lib/echo";

// --- 响应式座位坐标 (优化版) ---
// 手机端：往边缘极限推，留出中间空间
const SEAT_POSITIONS = [
    // 0: Hero (Bottom Center)
    { id: 0, className: "bottom-[15%] left-1/2 -translate-x-1/2 md:bottom-8" },

    // 1: 左下 (Bottom Left) - 更靠边
    { id: 1, className: "bottom-[18%] left-[-2%] md:bottom-16 md:left-[15%]" },

    // 2: 左 (Left Center)
    { id: 2, className: "top-1/2 -translate-y-[60%] left-[-3%] md:left-4" },

    // 3: 左上 (Top Left)
    { id: 3, className: "top-[10%] left-[-2%] md:top-16 md:left-[15%]" },

    // 4: 正上 (Top Center)
    { id: 4, className: "top-[2%] left-1/2 -translate-x-1/2 md:top-4" },

    // 5: 右上 (Top Right)
    { id: 5, className: "top-[10%] right-[-2%] md:top-16 md:right-[15%]" },

    // 6: 右 (Right Center)
    { id: 6, className: "top-1/2 -translate-y-[60%] right-[-3%] md:right-4" },

    // 7: 右下 (Bottom Right)
    { id: 7, className: "bottom-[18%] right-[-2%] md:bottom-16 md:right-[15%]" },
];

export default function PokerRoom() {
    const router = useRouter();
    const params = useParams();
    const roomId = params.id as string;

    const {
        currentUser, players, communityCards, pot, myPlayerId, activePlayerId,
        winnerIds, playerAction, sitDown, updateGameState,
        roomConfig, setRoomConfig // 新增：从 Store 取配置
    } = useGameStore();

    const [raiseAmount, setRaiseAmount] = useState([0]); // 默认0，动态设为大盲
    const [showBuyIn, setShowBuyIn] = useState(false);
    const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // 1. 初始化房间数据
    useEffect(() => {
        const initRoom = async () => {
            try {
                // 并行请求：房间详情(用于显示标题/盲注) + 房间状态(用于显示座位)
                const [infoRes, stateRes] = await Promise.all([
                    api.get(`/rooms/${roomId}`),
                    api.get(`/rooms/${roomId}/state`)
                ]);

                // 设置房间配置 (标题, 盲注)
                const r = infoRes.data;
                setRoomConfig({
                    name: r.name,
                    smallBlind: Number(r.small_blind || 0), // 后端字段转驼峰
                    bigBlind: Number(r.big_blind || 0),
                    minBuyIn: Number(r.min_buy_in || 0),
                    maxBuyIn: Number(r.max_buy_in || 0),
                });

                // 设置默认加注额为大盲
                setRaiseAmount([Number(r.big_blind || 0)]);

                // 设置当前游戏状态 (座位上的玩家)
                updateGameState({
                    players: stateRes.data.players,
                    // 如果后端返回了 pot 等信息也可以在这里更新
                    // pot: stateRes.data.pot
                });

                // 如果已经开始了，去拿手牌
                if (stateRes.data.room.status === 'playing') { // 假设后端有这个状态
                    try {
                        const handRes = await api.get(`/rooms/${roomId}/my-hand`);
                        if (handRes.data.cards) useGameStore.getState().setMyCards(handRes.data.cards);
                    } catch(e) {}
                }

            } catch (error) {
                console.error(error);
                toast.error("Failed to join room");
                router.push('/game');
            } finally {
                setIsLoading(false);
            }
        };

        if (roomId) {
            initRoom();
        }

        // WebSocket 监听
        if (echo && roomId) {
            console.log(`Listening to channel: room.${roomId}`);
            const channel = echo.channel(`room.${roomId}`);

            channel.listen('.game.updated', async (e: any) => {
                console.log("WS Event:", e);

                if (e.type === 'PLAYER_SIT') {
                    // 有人坐下，更新 players 列表
                    updateGameState({ players: e.payload.players });
                }
                else if (e.type === 'GAME_START') {
                    toast.success("Game Started!");
                    updateGameState({
                        pot: e.payload.pot,
                        communityCards: [],
                        stage: 'PREFLOP',
                        players: e.payload.players
                    });
                    // 拿手牌
                    try {
                        const { data } = await api.get(`/rooms/${roomId}/my-hand`);
                        if (data.cards) useGameStore.getState().setMyCards(data.cards);
                    } catch (err) {}
                }
                // ... 其他事件处理 (Turn, River, Showdown)
            });

            return () => {
                echo.leave(`room.${roomId}`);
            };
        }
    }, [roomId]);

    const isMyTurn = activePlayerId === myPlayerId && myPlayerId !== null;
    const heroPlayer = players.find(p => p.id === myPlayerId);
    // 没坐下时视角默认 0，坐下后视角转到我的位置
    const heroSeatIndex = heroPlayer ? heroPlayer.position : 0;

    // 旋转算法
    const getVisualPosition = (serverSeatIndex: number) => {
        if (!heroPlayer) return serverSeatIndex;
        const maxSeats = 8;
        return (serverSeatIndex - heroSeatIndex + maxSeats) % maxSeats;
    };

    const handleSeatClick = (seatIndex: number) => {
        if (myPlayerId) {
            toast.error("You are already seated!");
            return;
        }
        setSelectedSeat(seatIndex);
        setShowBuyIn(true);
    };

    const handleBuyInConfirm = async (amount: number) => {
        if (selectedSeat === null) return;
        const success = await sitDown(roomId, selectedSeat, amount);
        if (success) {
            toast.success("Seated successfully!");
            setShowBuyIn(false);
        }
    };

    const handleAction = (type: 'FOLD' | 'CHECK' | 'RAISE') => {
        if (!myPlayerId) return;
        // 记得实现 api.post('/act')
        if (type === 'RAISE') playerAction(myPlayerId, type, raiseAmount[0]);
        else playerAction(myPlayerId, type);
    };

    if (isLoading) return <div className="w-full h-screen bg-table-bg flex items-center justify-center text-gold-main">Loading Room...</div>;

    return (
        <div className="w-full h-screen bg-table-bg relative overflow-hidden flex flex-col select-none touch-none">
            <LandscapeGuard/>

            {/* 买入弹窗: 数据从 roomConfig 动态读取 */}
            {roomConfig && (
                <BuyInModal
                    isOpen={showBuyIn} onClose={() => setShowBuyIn(false)}
                    onConfirm={handleBuyInConfirm}
                    minBuyIn={roomConfig.minBuyIn}
                    maxBuyIn={roomConfig.maxBuyIn}
                    userBalance={Number(currentUser?.chips || 0)}
                />
            )}

            {/* --- Top Bar --- */}
            <div className="absolute top-0 left-0 w-full p-2 md:p-4 flex justify-between items-start z-20 pointer-events-none">
                <div className="pointer-events-auto flex gap-2 items-center">
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white h-8 w-8" onClick={() => router.back()}>
                        <ArrowLeft className="w-5 h-5"/>
                    </Button>
                    {/* 动态显示房间信息 */}
                    <Badge variant="outline" className="bg-black/60 text-white border-white/10 h-7 px-2 text-[10px] md:text-xs backdrop-blur-md">
                        {roomConfig ? `${roomConfig.name} • $${roomConfig.smallBlind}/$${roomConfig.bigBlind}` : 'Loading...'}
                    </Badge>
                </div>

                <div className="pointer-events-auto flex gap-2">
                    <Button variant="ghost" size="icon" className="text-white h-8 w-8">
                        <Settings className="w-5 h-5"/>
                    </Button>
                    <Button variant="ghost" size="icon" className="text-white h-8 w-8">
                        <Menu className="w-5 h-5"/>
                    </Button>
                </div>
            </div>

            {/* --- 牌桌区域 --- */}
            <div className="flex-1 relative flex items-center justify-center perspective-[1000px] overflow-hidden">
                <div className="w-[92%] h-[55%] md:w-[80%] md:h-[65%] bg-table-felt border-[8px] md:border-[16px] border-table-felt-dark rounded-[60px] md:rounded-[150px] shadow-2xl relative flex items-center justify-center">

                    {/* Logo */}
                    <div className="absolute top-[35%] md:top-[25%] font-serif text-table-felt-dark/40 text-2xl md:text-4xl font-bold pointer-events-none">
                        POKER
                    </div>

                    {/* Community Cards */}
                    <div className="absolute top-[50%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-1 md:gap-3 z-10 h-16 items-center">
                        <AnimatePresence mode='popLayout'>
                            {communityCards.map((card, i) => (
                                <div key={`${card.code}-${i}`} className="transform scale-75 md:scale-100 origin-center">
                                    <AnimatedCard index={i} rank={card.rank as any} suite={card.suite as any} size="md" className="shadow-xl" />
                                </div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Pot */}
                    <div className="absolute top-[68%] bg-black/40 px-3 py-0.5 md:px-6 md:py-1.5 rounded-full text-gold-main text-xs md:text-sm font-mono border border-white/5 backdrop-blur-sm">
                        Pot: ${pot.toLocaleString()}
                    </div>

                    {/* --- 渲染座位 --- */}
                    {Array.from({length: 8}).map((_, i) => {
                        const player = players.find(p => p.position === i);
                        const visualIndex = getVisualPosition(i);
                        const posStyle = SEAT_POSITIONS[visualIndex] || {className: 'hidden'};
                        const isWinner = winnerIds?.includes(player?.id || -1);

                        return (
                            <div key={i} className={cn("absolute flex flex-col items-center gap-1 transition-all duration-500", posStyle.className)}>
                                {player ? (
                                    <>
                                        {/* 玩家头像区域 */}
                                        <div className="relative z-10">
                                            <Avatar className={cn("w-10 h-10 md:w-16 md:h-16 border-2 shadow-lg bg-slate-900 transition-all",
                                                player.id === activePlayerId ? "border-gold-main ring-2 ring-gold-main/30 scale-110" : "border-slate-300",
                                                isWinner ? "border-gold-main ring-4 ring-gold-main scale-110" : ""
                                            )}>
                                                <AvatarFallback className="bg-slate-800 text-white text-[10px] md:text-base">{player.name[0]}</AvatarFallback>
                                            </Avatar>

                                            {/* Dealer Button */}
                                            {player.isDealer && (
                                                <div className="absolute -bottom-1 -right-1 w-3 h-3 md:w-5 md:h-5 bg-white text-black text-[8px] md:text-[10px] font-bold rounded-full flex items-center justify-center border border-slate-400 z-20">D</div>
                                            )}
                                        </div>

                                        {/* 信息条 (手机端极度简化) */}
                                        <div className="bg-black/80 text-white text-[9px] md:text-xs px-1.5 py-0.5 md:px-3 md:py-1 rounded-full text-center min-w-[50px] md:min-w-[80px] border border-white/10 shadow-lg z-20 -mt-1 backdrop-blur-sm">
                                            <div className="truncate max-w-[50px] md:max-w-[80px] text-slate-300 leading-none mb-0.5">{player.name}</div>
                                            <div className="text-gold-main font-mono font-bold leading-none">${player.chips > 9999 ? (player.chips/1000).toFixed(1)+'k' : player.chips}</div>
                                        </div>

                                        {/* 别人手牌 (缩小) */}
                                        {player.id !== myPlayerId && player.status === 'active' && (
                                            <div className="absolute top-2 left-6 md:left-10 flex -space-x-4 md:-space-x-8 scale-50 md:scale-75 rotate-12 opacity-90 z-0">
                                                <Card hidden size="sm"/>
                                                <Card hidden size="sm"/>
                                            </div>
                                        )}

                                        {/* Action Badge */}
                                        {player.lastAction && (
                                            <Badge className="absolute -top-6 z-30 bg-white/90 text-black text-[9px] h-4 px-1 md:text-xs shadow-md animate-in zoom-in">
                                                {player.lastAction}
                                            </Badge>
                                        )}
                                    </>
                                ) : (
                                    // === 空座位按钮 (手机端优化版) ===
                                    !myPlayerId && (
                                        <button
                                            onClick={() => handleSeatClick(i)}
                                            // 尺寸从 w-12 改为 w-8 (32px)，更小巧
                                            className="w-8 h-8 md:w-12 md:h-12 rounded-full border border-dashed border-white/20 flex items-center justify-center text-white/20 hover:text-gold-main hover:border-gold-main hover:bg-gold-main/10 transition-all backdrop-blur-[2px]"
                                        >
                                            <Plus className="w-4 h-4 md:w-6 md:h-6" />
                                        </button>
                                    )
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* --- 底部 Hero 操作区 --- */}
            <div className="w-full absolute bottom-0 z-30 px-2 pb-2 md:px-4 md:pb-4 flex items-end justify-center pointer-events-none">

                {/* Hero Hand Cards */}
                {heroPlayer && heroPlayer.cards && (
                    <div className="pointer-events-auto absolute bottom-[80px] md:bottom-[100px] left-1/2 -translate-x-1/2 flex gap-0.5 md:gap-1 z-40 transition-all duration-300">
                        <motion.div initial={{y: 50, opacity: 0}} animate={{y: 0, opacity: 1}} className="-rotate-3 origin-bottom-right transform scale-90 md:scale-110">
                            <Card rank={heroPlayer.cards[0].rank as any} suite={heroPlayer.cards[0].suite as any} size="lg" className="shadow-2xl"/>
                        </motion.div>
                        <motion.div initial={{y: 50, opacity: 0}} animate={{y: 0, opacity: 1}} className="rotate-3 origin-bottom-left transform scale-90 md:scale-110">
                            <Card rank={heroPlayer.cards[1].rank as any} suite={heroPlayer.cards[1].suite as any} size="lg" className="shadow-2xl"/>
                        </motion.div>
                    </div>
                )}

                {/* Controls */}
                {isMyTurn && (
                    <div className="pointer-events-auto w-full max-w-xl flex items-end gap-2 animate-in slide-in-from-bottom-10 fade-in duration-200 mb-1">
                        <Button
                            onClick={() => handleAction('FOLD')}
                            variant="destructive"
                            className="flex-1 h-10 md:h-14 rounded-lg font-bold text-sm md:text-lg shadow-lg border-b-4 border-red-900 active:border-b-0 active:translate-y-1"
                        >
                            FOLD
                        </Button>
                        <Button
                            onClick={() => handleAction('CHECK')}
                            className="flex-1 h-10 md:h-14 bg-slate-600 hover:bg-slate-500 rounded-lg font-bold text-sm md:text-lg shadow-lg border-b-4 border-slate-800 active:border-b-0 active:translate-y-1"
                        >
                            CHECK
                        </Button>

                        <div className="flex-[2] flex gap-2 bg-black/60 p-1.5 rounded-lg border border-white/10 backdrop-blur-md items-center h-10 md:h-auto md:block md:p-2">
                            <div className="hidden md:block">
                                <div className="flex justify-between text-xs text-slate-300 px-1 mb-1">
                                    <span>Raise</span>
                                    <span className="text-gold-main font-mono">${raiseAmount}</span>
                                </div>
                                <Slider value={raiseAmount} onValueChange={setRaiseAmount} min={Number(roomConfig?.bigBlind)} max={heroPlayer?.chips} step={Number(roomConfig?.bigBlind)} className="mb-2"/>
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