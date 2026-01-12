"use client"

import React, {useEffect, useState} from 'react'; // 引入 useState
import {toast} from "sonner"; // 引入 toast 用于反馈
import LandscapeGuard from '@/components/game/LandscapeGuard';
import {Button} from '@/components/ui/button';
import {Avatar, AvatarFallback} from '@/components/ui/avatar';
import {Badge} from '@/components/ui/badge';
import {Slider} from '@/components/ui/slider';
import {useGameStore} from "@/store/useGameStore";
import {cn} from "@/lib/utils";

// ... (SEAT_POSITIONS 和 getRelativeIndex 代码保持不变，此处省略以节省篇幅) ...

const SEAT_POSITIONS = [ /* ...保持原样... */];

export default function GamePage() {
    // 1. 从 Store 中提取状态 和 动作(playerAction)
    const {
        players,
        communityCards,
        pot,
        myPlayerId,
        activePlayerId,
        updateGameState,
        playerAction // <--- 新增：取出这个方法
    } = useGameStore();

    // 2. 本地状态：记录用户想要加注的金额 (默认 200)
    const [raiseAmount, setRaiseAmount] = useState([200]);

    const isMyTurn = activePlayerId === myPlayerId;

    // ... (初始化 useEffect 和 getRelativeIndex 保持不变) ...

    // --- 3. 定义操作处理函数 ---

    const handleFold = () => {
        if (!myPlayerId) return;
        // 1. 更新本地 Store (立刻看到效果)
        playerAction(myPlayerId, 'FOLD');
        // 2. 提示
        toast("你弃牌了");
        // 3. (未来) 这里会发送 socket/api 请求给 Laravel
        // socket.emit('action', { type: 'FOLD' });
    };

    const handleCheck = () => {
        if (!myPlayerId) return;
        playerAction(myPlayerId, 'CHECK');
        toast("你过牌 (Check)");
    };

    const handleRaise = () => {
        if (!myPlayerId) return;
        const amount = raiseAmount[0]; // Slider 返回的是数组
        playerAction(myPlayerId, 'RAISE', amount);
        toast.success(`你加注到了 $${amount}`);
    };

    // 找到 Hero 数据 (用于渲染手牌)
    const hero = players.find(p => p.id === myPlayerId);
    const heroSeat = hero?.position || 0;

    return (
        <div className="w-full h-screen bg-green-800 relative overflow-hidden flex flex-col">
            <LandscapeGuard/>
            {/* ... 顶部和中间牌桌区域代码保持不变 ... */}

            {/* --- 底部操作栏 (更新了这里) --- */}
            <div
                className="h-[120px] bg-gradient-to-t from-black/90 to-transparent p-4 flex items-end justify-center gap-4 relative z-20">

                {/* 渲染 Hero 的手牌 */}
                {hero?.cards && (
                    <div
                        className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-1 transform scale-110 hover:scale-125 transition-transform cursor-pointer origin-bottom">
                        {hero.cards.map((card, i) => (
                            <div key={i}
                                 className={`w-14 h-20 bg-white rounded border border-gray-300 shadow-2xl flex flex-col items-center justify-center ${i === 0 ? '-rotate-6' : 'rotate-6'}`}>
                                <span
                                    className={`font-bold text-xl ${['♥', '♦'].includes(card.suite) ? 'text-red-600' : 'text-black'}`}>{card.rank}</span>
                                <span
                                    className={`text-2xl ${['♥', '♦'].includes(card.suite) ? 'text-red-600' : 'text-black'}`}>{card.suite}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* 操作按钮区域 */}
                {isMyTurn && (
                    <div
                        className="flex items-end gap-3 w-full max-w-2xl justify-between animate-in slide-in-from-bottom-10 fade-in duration-300">
                        {/* 左侧：弃牌 & 过牌 */}
                        <div className="flex gap-2">
                            <Button
                                onClick={handleFold} // <--- 绑定事件
                                variant="destructive"
                                className="rounded-full w-16 h-16 md:w-20 md:h-20 font-bold border-4 border-red-900/50 shadow-lg flex flex-col gap-0 active:scale-95 transition-transform"
                            >
                                <span className="text-xs opacity-70">弃牌</span>
                                <span>Fold</span>
                            </Button>
                            <Button
                                onClick={handleCheck} // <--- 绑定事件
                                variant="secondary"
                                className="rounded-full w-16 h-16 md:w-20 md:h-20 font-bold border-4 border-gray-600/50 shadow-lg flex flex-col gap-0 active:scale-95 transition-transform"
                            >
                                <span className="text-xs opacity-70">看牌</span>
                                <span>Check</span>
                            </Button>
                        </div>

                        {/* 中间：加注滑块 */}
                        <div className="flex-1 px-4 mb-4 flex flex-col gap-2">
                            <div className="text-white text-center font-mono text-xl shadow-black drop-shadow-md">
                                Raise to ${raiseAmount[0]} {/* 显示当前滑块数值 */}
                            </div>
                            <Slider
                                value={raiseAmount}         // 绑定值
                                onValueChange={setRaiseAmount} // 绑定更新函数
                                min={200}                   // 最小加注 (应为大盲注)
                                max={hero?.chips || 3000}   // 最大加注 (All-in)
                                step={50}
                                className="w-full cursor-pointer"
                            />
                        </div>

                        {/* 右侧：加注按钮 */}
                        <div className="flex gap-2">
                            <Button
                                onClick={handleRaise} // <--- 绑定事件
                                className="bg-yellow-600 hover:bg-yellow-700 text-white rounded-full w-16 h-16 md:w-20 md:h-20 font-bold border-4 border-yellow-800/50 shadow-lg flex flex-col gap-0 active:scale-95 transition-transform"
                            >
                                <span className="text-xs opacity-70">加注</span>
                                <span>Raise</span>
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}