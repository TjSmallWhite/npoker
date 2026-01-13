"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/useGameStore';
import { Loader2 } from 'lucide-react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { token, fetchProfile, isAuthenticated } = useGameStore();
    const [isChecking, setIsChecking] = useState(true); // 正在检查中

    useEffect(() => {
        const checkAuth = async () => {
            // 1. 获取本地 Token
            const storedToken = localStorage.getItem('poker_token');

            // 2. 如果完全没 Token -> 滚回首页
            if (!storedToken) {
                console.log("No token, redirecting to login...");
                router.replace('/'); // 使用 replace 防止用户点“返回”键又回来
                return;
            }

            // 3. 有 Token 但 Store 还没同步 (比如刷新页面后) -> 尝试恢复身份
            if (storedToken && !isAuthenticated) {
                try {
                    await fetchProfile(); // 去后端验证 Token 是否有效
                } catch (e) {
                    // 验证失败（Token过期）-> api.ts 的拦截器会处理跳转，或者这里手动跳
                    router.replace('/');
                    return;
                }
            }

            // 4. 检查通过
            setIsChecking(false);
        };

        checkAuth();
    }, [router, isAuthenticated, fetchProfile]);

    // 检查期间显示 Loading，防止闪现游戏界面
    if (isChecking) {
        return (
            <div className="w-full h-screen bg-black flex flex-col items-center justify-center text-gold-main gap-4">
                <Loader2 className="animate-spin w-8 h-8" />
                <div className="text-sm font-mono">Verifying Access...</div>
            </div>
        );
    }

    // 检查通过，渲染子组件
    return <>{children}</>;
}