"use client"

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from "framer-motion";
import {
    Plus, Settings, Bell, Search, Users, Trophy, ChevronRight, Gamepad2
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from "sonner";

import LandscapeGuard from '@/components/game/LandscapeGuard';
import BottomNav from '@/components/lobby/BottomNav'; // 刚才建的
import { getLobbyData, type UserProfile, type GameRoom, type Promotion } from '@/services/lobby';

export default function GameLobby() {
    const router = useRouter();

    // Data State
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [rooms, setRooms] = useState<GameRoom[]>([]);
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [activeTab, setActiveTab] = useState("cash");

    // Fetch Data (Simulation of Laravel API)
    useEffect(() => {
        const initLobby = async () => {
            try {
                const data = await getLobbyData();
                setUser(data.user);
                setRooms(data.rooms);
                setPromotions(data.promotions);
            } catch (error) {
                toast.error("Failed to load lobby data");
            } finally {
                setLoading(false);
            }
        };
        initLobby();
    }, []);

    const handleJoinRoom = (roomId: string) => {
        // 商业逻辑：检查余额是否足够 BuyIn
        if (user && user.chips < 100) {
            toast.error("Insufficient chips! Please visit the shop.");
            return;
        }
        toast.success(`Joining Room #${roomId}...`);
        setTimeout(() => router.push('/game/room'), 500);
    };

    return (
        <div className="min-h-screen bg-table-bg text-white pb-20 relative overflow-x-hidden">
            <LandscapeGuard />

            {/* --- 1. Top Header (Assets & Profile) --- */}
            <header className="sticky top-0 z-40 w-full bg-black/60 backdrop-blur-md border-b border-white/5 px-4 py-3 flex justify-between items-center shadow-lg">
                {/* User Info */}
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Avatar className="h-10 w-10 border-2 border-gold-main cursor-pointer hover:scale-105 transition-transform">
                            <AvatarImage src={user?.avatar} />
                            <AvatarFallback className="bg-slate-800 animate-pulse">...</AvatarFallback>
                        </Avatar>
                        {/* VIP Badge */}
                        {!loading && (
                            <div className="absolute -bottom-1 -right-1 bg-gold-main text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-black">
                                V{user?.vipLevel}
                            </div>
                        )}
                    </div>

                    {/* Balance Display (Chip & Gem) */}
                    <div className="flex flex-col gap-1">
                        {/* Chips */}
                        <div className="flex items-center bg-black/40 rounded-full px-2 py-0.5 border border-white/10 gap-2">
                            <div className="w-4 h-4 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)] border border-yellow-300" />
                            <span className="text-xs font-mono font-bold text-gold-light min-w-[60px]">
                        {loading ? "..." : user?.chips.toLocaleString()}
                    </span>
                            <button className="bg-green-600 hover:bg-green-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                                <Plus className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex gap-3 text-slate-400">
                    <Search className="w-6 h-6 cursor-pointer hover:text-white" />
                    <div className="relative cursor-pointer hover:text-white">
                        <Bell className="w-6 h-6" />
                        <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-black" />
                    </div>
                    <Settings className="w-6 h-6 cursor-pointer hover:text-white" />
                </div>
            </header>

            <main className="container mx-auto max-w-4xl px-4 py-4 space-y-6">

                {/* --- 2. Promotions Carousel (运营位) --- */}
                <section>
                    <ScrollArea className="w-full whitespace-nowrap rounded-xl">
                        <div className="flex w-max space-x-4">
                            {loading ? (
                                [1,2].map(i => <Skeleton key={i} className="w-[300px] h-[140px] rounded-xl bg-slate-800" />)
                            ) : (
                                promotions.map((promo) => (
                                    <motion.div
                                        key={promo.id}
                                        whileTap={{ scale: 0.98 }}
                                        className={`w-[300px] h-[140px] shrink-0 rounded-xl ${promo.imageUrl} relative overflow-hidden cursor-pointer p-5 flex flex-col justify-end shadow-lg`}
                                        onClick={() => router.push(promo.link)}
                                    >
                                        <div className="absolute inset-0 bg-black/20 hover:bg-transparent transition-colors" />
                                        <Badge className="self-start mb-auto bg-white/20 hover:bg-white/30 backdrop-blur-sm border-none text-white">Event</Badge>
                                        <h3 className="text-xl font-bold text-white drop-shadow-md z-10">{promo.title}</h3>
                                    </motion.div>
                                ))
                            )}
                        </div>
                        <ScrollBar orientation="horizontal" className="hidden" />
                    </ScrollArea>
                </section>

                {/* --- 3. Game Mode Tabs --- */}
                <Tabs defaultValue="cash" onValueChange={setActiveTab} className="w-full">
                    <TabsList className="w-full bg-slate-900/50 border border-white/5 p-1 h-12">
                        <TabsTrigger value="cash" className="flex-1 data-[state=active]:bg-gold-main data-[state=active]:text-black font-bold">Cash Game</TabsTrigger>
                        <TabsTrigger value="mtt" className="flex-1 data-[state=active]:bg-gold-main data-[state=active]:text-black font-bold">Tournament</TabsTrigger>
                        <TabsTrigger value="plo" className="flex-1 data-[state=active]:bg-gold-main data-[state=active]:text-black font-bold">PLO</TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* --- 4. Room List (核心房间列表) --- */}
                <section className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                        <h2 className="text-lg font-bold text-gold-main flex items-center gap-2">
                            <Gamepad2 className="w-5 h-5" /> Recommended
                        </h2>
                        <span className="text-xs text-slate-500 flex items-center">
                    Filter <ChevronRight className="w-3 h-3" />
                </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {loading ? (
                            [1,2,3,4].map(i => <Skeleton key={i} className="h-24 w-full bg-slate-800 rounded-lg" />)
                        ) : (
                            rooms.map((room) => (
                                <motion.div
                                    key={room.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    whileHover={{ scale: 1.02 }}
                                    onClick={() => handleJoinRoom(room.id)}
                                    className="bg-slate-900/60 border border-white/5 hover:border-gold-main/50 rounded-lg p-4 cursor-pointer relative overflow-hidden group transition-all"
                                >
                                    {/* Hot Badge */}
                                    {room.isHot && (
                                        <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg z-10">
                                            HOT
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="font-bold text-white group-hover:text-gold-light">{room.name}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
                                                    Blinds: ${room.blinds}
                                                </Badge>
                                                <span className="text-xs text-slate-500">Min: ${room.minBuyIn}</span>
                                            </div>
                                        </div>

                                        {/* Players Circular Indicator */}
                                        <div className="flex flex-col items-end">
                                            <div className="flex items-center gap-1 text-slate-400 text-xs mb-1">
                                                <Users className="w-3 h-3" />
                                                <span>{room.currentPlayers}/{room.maxPlayers}</span>
                                            </div>
                                            <Button size="sm" className="h-8 bg-table-felt hover:bg-table-felt-dark text-white text-xs px-4">
                                                Play
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </section>

                {/* --- 5. Leaderboard Teaser --- */}
                <section className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-4 border border-white/5 flex justify-between items-center cursor-pointer hover:border-gold-main/30">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center border border-gold-main/30 text-gold-main">
                            <Trophy className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm text-white">Weekly Ranking</h4>
                            <p className="text-xs text-slate-400">You are top 15% this week!</p>
                        </div>
                    </div>
                    <ChevronRight className="text-slate-500" />
                </section>

            </main>

            {/* --- Bottom Navigation --- */}
            <BottomNav />
        </div>
    );
}