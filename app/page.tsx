"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from "framer-motion";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card as UICard, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Card from '@/components/game/Card';
import { useGameStore } from '@/store/useGameStore';
import { toast } from "sonner";
import { Lock, User } from 'lucide-react'; // 记得安装 lucide-react 图标

export default function LoginPage() {
  const router = useRouter();
  const { login } = useGameStore();

  // 表单状态
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // 预设头像
  const avatars = ["/avatars/1.png", "/avatars/2.png", "/avatars/3.png", "/avatars/4.png"];
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // 防止表单提交刷新

    if (!username.trim() || !password.trim()) {
      toast.error("Please enter both username and password");
      return;
    }

    setLoading(true);

    // 模拟登录请求
    setTimeout(async () => {
      await login(username, password, selectedAvatar);
      toast.success(`Welcome back, ${username}!`);
      router.push('/game');
    }, 1000);
  };

  return (
      // 使用 globals.css 定义的 bg-table-bg (深绿色背景)
      <div className="w-full h-screen bg-table-bg flex flex-col items-center justify-center relative overflow-hidden">

        {/* --- 背景装饰 (保持不变) --- */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
              initial={{ x: -200, y: -200, rotate: -45 }}
              animate={{ x: 50, y: 50, rotate: -15 }}
              transition={{ duration: 1, type: "spring" }}
              className="absolute top-10 left-10 opacity-50"
          >
            <Card rank="A" suite="♠" size="lg" />
          </motion.div>

          <motion.div
              initial={{ x: 200, y: 200, rotate: 45 }}
              animate={{ x: -50, y: -100, rotate: 15 }}
              transition={{ duration: 1.2, delay: 0.2, type: "spring" }}
              className="absolute bottom-10 right-10 opacity-50"
          >
            <Card rank="K" suite="♥" size="lg" />
          </motion.div>
        </div>

        {/* --- 登录卡片 --- */}
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="z-10 w-full max-w-md px-4"
        >
          <UICard className="bg-slate-950/80 border-slate-800 text-white backdrop-blur-md shadow-2xl">
            <CardHeader className="text-center pb-2">
              {/* 使用 globals.css 定义的 gold-main */}
              <CardTitle className="text-4xl font-bold text-gold-main drop-shadow-md font-serif tracking-wide">
                TEXAS HOLD'EM
              </CardTitle>
              <CardDescription className="text-slate-400">
                Sign in to start your journey
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleLogin} className="space-y-6">

                {/* Avatar Selection */}
                <div className="flex flex-col items-center gap-3 mb-6">
                  <span className="text-xs text-slate-500 uppercase tracking-widest">Select Avatar</span>
                  <div className="flex justify-center gap-4">
                    {avatars.map((av, i) => (
                        <motion.div
                            key={i}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedAvatar(av)}
                            className={`cursor-pointer rounded-full p-1 border-2 transition-colors ${selectedAvatar === av ? 'border-gold-main shadow-[0_0_10px_var(--color-gold-main)]' : 'border-transparent hover:border-slate-600'}`}
                        >
                          <Avatar className="w-12 h-12 bg-slate-800">
                            <AvatarFallback className="bg-slate-800 text-slate-400 text-xs">P{i+1}</AvatarFallback>
                          </Avatar>
                        </motion.div>
                    ))}
                  </div>
                </div>

                {/* Inputs */}
                <div className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <Input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Username"
                        className="pl-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-gold-main focus-visible:border-gold-main"
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="pl-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-gold-main focus-visible:border-gold-main"
                    />
                  </div>
                </div>

                {/* Login Button */}
                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gold-main hover:bg-gold-light text-black font-bold py-6 text-lg shadow-lg transition-all active:scale-95"
                >
                  {loading ? "Verifying..." : "LOGIN"}
                </Button>

                <div className="text-center text-xs text-slate-500 mt-4">
                  No account? <span className="text-gold-main cursor-pointer hover:underline">Create one</span>
                </div>

              </form>
            </CardContent>
          </UICard>
        </motion.div>

        <div className="absolute bottom-4 text-slate-600 text-xs">
          &copy; 2024 Poker Master. All rights reserved.
        </div>
      </div>
  );
}