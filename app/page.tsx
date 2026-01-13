"use client"

import React, {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {useGameStore} from '@/store/useGameStore';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter} from '@/components/ui/card';
import {Label} from '@/components/ui/label';
import {toast} from "sonner";
import {Loader2, Spade, Club, Heart, Diamond} from 'lucide-react';

export default function AuthPage() {
    const router = useRouter();
    const {login, register} = useGameStore();

    // 模式切换: 'login' | 'register'
    const [mode, setMode] = useState<'login' | 'register'>('login');

    const [name, setName] = useState(''); // 注册才用
    const [email, setEmail] = useState(''); // 也就是 username
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);


    useEffect(() => {
        const token = localStorage.getItem('poker_token');
        if (token) {
            // 如果本地有 Token，直接跳去大厅，不让他看登录框
            router.replace('/game');
        }
    }, [router]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password || (mode === 'register' && !name)) {
            toast.error("Please fill in all fields");
            return;
        }

        setLoading(true);
        let success = false;

        if (mode === 'login') {
            success = await login(email, password);
        } else {
            success = await register(name, email, password);
        }

        setLoading(false);

        if (success) {
            toast.success(mode === 'login' ? "Welcome back!" : "Account created!");
            router.push('/game');
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#0a0a0a] flex items-center justify-center relative overflow-hidden">
            {/* 背景装饰 (保持不变) ... */}

            <div className="relative z-10 w-full max-w-md px-4">
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-6xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-700 drop-shadow-sm">
                        TEXAS HOLD'EM
                    </h1>
                    <p className="text-slate-400 mt-2 font-mono text-sm tracking-widest uppercase">High Stakes • Real
                        Time</p>
                </div>

                <Card className="bg-black/60 border-yellow-900/30 backdrop-blur-xl shadow-2xl">
                    <CardHeader>
                        <CardTitle className="text-xl text-yellow-500 text-center">
                            {mode === 'login' ? 'Player Login' : 'New Player Registration'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">

                            {/* 仅注册模式显示 Name */}
                            {mode === 'register' && (
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Nickname</Label>
                                    <Input
                                        placeholder="Your table name"
                                        className="bg-slate-900/50 border-slate-700 text-white focus:border-yellow-600"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label className="text-slate-300">Email / Username</Label>
                                <Input
                                    type="email"
                                    placeholder="pokerface@example.com"
                                    className="bg-slate-900/50 border-slate-700 text-white focus:border-yellow-600"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-300">Password</Label>
                                <Input
                                    type="password"
                                    className="bg-slate-900/50 border-slate-700 text-white focus:border-yellow-600"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>

                            <Button type="submit"
                                    className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold mt-4"
                                    disabled={loading}>
                                {loading ? <Loader2
                                    className="animate-spin"/> : (mode === 'login' ? 'Enter Lobby' : 'Create Account')}
                            </Button>
                        </form>
                    </CardContent>

                    <CardFooter className="justify-center border-t border-white/5 pt-4">
                        <div className="text-xs text-slate-400">
                            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                            <button
                                onClick={() => {
                                    setMode(mode === 'login' ? 'register' : 'login');
                                    // 清空密码防止混淆
                                    setPassword('');
                                }}
                                className="text-yellow-500 hover:underline font-bold ml-1"
                            >
                                {mode === 'login' ? "Sign Up" : "Log In"}
                            </button>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}