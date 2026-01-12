import React from 'react';
import {cn} from "@/lib/utils";
import {motion} from "framer-motion";

export type Suite = '♠' | '♥' | '♣' | '♦';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

interface CardProps {
    rank?: Rank;
    suite?: Suite;
    hidden?: boolean; // 是否是牌背
    className?: string;
    size?: 'sm' | 'md' | 'lg'; // 尺寸控制
}

// 简单的花色颜色映射
const SUITE_COLORS = {
    '♠': 'text-slate-900',
    '♣': 'text-slate-900',
    '♥': 'text-red-600',
    '♦': 'text-red-600',
};

export default function Card({rank = 'A', suite = '♠', hidden = false, className, size = 'md'}: CardProps) {
    // 尺寸映射
    const sizeClasses = {
        sm: "w-8 h-12 text-xs rounded-sm border-[1px]",
        md: "w-14 h-20 text-base rounded border-2", // 标准大小
        lg: "w-24 h-36 text-2xl rounded-lg border-4", // 首页展示用
    };

    // 如果是牌背 (Hidden)
    if (hidden) {
        return (
            <div className={cn(
                "bg-blue-800 border-white shadow-md flex items-center justify-center relative overflow-hidden",
                sizeClasses[size],
                className
            )}>
                {/* 牌背的花纹模拟 */}
                <div
                    className="absolute inset-1 border border-blue-600/50 rounded-sm opacity-50 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900 to-blue-700 pattern-grid-lg"></div>
                <div className="text-blue-300/20 font-serif font-bold text-4xl">♠</div>
            </div>
        );
    }

    // 如果是牌面 (Front)
    return (
        <div className={cn(
            "bg-white border-gray-200 shadow-xl flex flex-col justify-between p-1 relative select-none",
            sizeClasses[size],
            className
        )}>
            {/* 左上角 */}
            <div className={cn("flex flex-col items-center leading-none", SUITE_COLORS[suite])}>
                <span className="font-bold">{rank}</span>
                <span>{suite}</span>
            </div>

            {/* 中间的大花色 (装饰) */}
            <div
                className={cn("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl opacity-20 pointer-events-none", SUITE_COLORS[suite])}>
                {suite}
            </div>

            {/* 右下角 (倒转) */}
            <div className={cn("flex flex-col items-center leading-none rotate-180", SUITE_COLORS[suite])}>
                <span className="font-bold">{rank}</span>
                <span>{suite}</span>
            </div>
        </div>
    );
}