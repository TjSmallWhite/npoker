import React from 'react';
import {Smartphone} from 'lucide-react'; // 需要安装 lucide-react 图标库

export default function LandscapeGuard() {
    return (
        // 默认隐藏 (hidden)，仅在竖屏 (portrait) 时显示 (flex)
        // z-50 保证它覆盖在所有游戏元素之上
        <div
            className="hidden portrait:flex fixed inset-0 z-50 bg-black/90 text-white flex-col items-center justify-center p-8 text-center animate-in fade-in">
            <Smartphone className="w-16 h-16 mb-6 animate-spin-slow"/>
            <h2 className="text-2xl font-bold mb-2">请旋转手机</h2>
            <p className="text-gray-300">
                为了保证德州扑克的最佳体验，<br/>本游戏仅支持横屏模式。
            </p>

            {/* 这是一个小的视觉提示动画 */}
            <div className="mt-8 w-12 h-20 border-2 border-white/30 rounded-lg relative animate-pulse">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full"></div>
            </div>
        </div>
    );
}