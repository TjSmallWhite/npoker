"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from "framer-motion";
import {
    Settings, LogOut, Camera, Edit2, Copy,
    ChevronRight, Volume2, Bell, Shield, HelpCircle
} from 'lucide-react';
import { toast } from "sonner";

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import BottomNav from '@/components/lobby/BottomNav';
import LandscapeGuard from '@/components/game/LandscapeGuard';
import { useGameStore } from "@/store/useGameStore";

// --- Mock Stats Data ---
const POKER_STATS = [
    { label: "Hands", value: "1,204" },
    { label: "Win Rate", value: "58.4%", highlight: true },
    { label: "VPIP", value: "24%", desc: "Voluntarily Put In Pot" },
    { label: "PFR", value: "18%", desc: "Pre-Flop Raiser" },
    { label: "AF", value: "2.5", desc: "Aggression Factor" },
    { label: "WTSD", value: "32%", desc: "Went To Showdown" },
];

// --- 预设头像列表 ---
const AVATAR_LIST = ["/avatars/1.png", "/avatars/2.png", "/avatars/3.png", "/avatars/4.png", "/avatars/5.png", "/avatars/6.png"];

export default function ProfilePage() {
    const router = useRouter();
    const { players, myPlayerId, logout, updateProfile } = useGameStore();

    const me = players.find(p => p.id === myPlayerId);
    const userAvatar = me?.avatar || "/avatars/1.png";
    const userName = me?.name || "Guest";

    // State for Edit Modal
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [tempName, setTempName] = useState(userName);
    const [tempAvatar, setTempAvatar] = useState(userAvatar);

    // Handlers
    const handleCopyId = () => {
        navigator.clipboard.writeText(String(myPlayerId || "1001"));
        toast.success("User ID copied to clipboard");
    };

    const handleLogout = () => {
        logout();
        toast.info("Logged out successfully");
        router.replace('/');
    };

    const handleSaveProfile = () => {
        if (!tempName.trim()) {
            toast.error("Nickname cannot be empty");
            return;
        }
        updateProfile(tempName, tempAvatar);
        setIsEditOpen(false);
        toast.success("Profile updated!");
    };

    return (
        <div className="min-h-screen bg-table-bg text-white pb-24 relative">
            <LandscapeGuard />

            {/* --- Header --- */}
            <header className="sticky top-0 z-40 bg-black/60 backdrop-blur-md border-b border-white/5 px-4 py-4 flex justify-between items-center">
                <h1 className="text-xl font-bold font-serif text-gold-main">My Profile</h1>
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white" onClick={handleLogout}>
                    <LogOut className="w-5 h-5" />
                </Button>
            </header>

            <main className="p-4 space-y-6">

                {/* 1. Hero Profile Card */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-gradient-to-br from-slate-900 to-black rounded-2xl p-6 border border-white/10 relative overflow-hidden"
                >
                    {/* Background Glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gold-main/10 rounded-full blur-3xl" />

                    <div className="flex items-center gap-5 relative z-10">
                        {/* Avatar with Edit Badge */}
                        <div className="relative group cursor-pointer" onClick={() => setIsEditOpen(true)}>
                            <Avatar className="w-20 h-20 border-2 border-gold-main shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                                <AvatarImage src={userAvatar} />
                                <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                            <div className="absolute bottom-0 right-0 bg-slate-800 p-1.5 rounded-full border border-white/20 text-white group-hover:bg-gold-main group-hover:text-black transition-colors">
                                <Camera className="w-3 h-3" />
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h2 className="text-2xl font-bold text-white">{userName}</h2>
                                <Edit2 className="w-4 h-4 text-slate-500 cursor-pointer hover:text-gold-main" onClick={() => setIsEditOpen(true)} />
                            </div>

                            <div className="flex items-center gap-2 text-xs text-slate-400 mb-3 cursor-pointer hover:text-white" onClick={handleCopyId}>
                                <span>ID: {myPlayerId || 10086}</span>
                                <Copy className="w-3 h-3" />
                            </div>

                            {/* VIP Progress */}
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px] text-gold-main font-bold">
                                    <span>VIP 3</span>
                                    <span>1,250 / 2,000 EXP</span>
                                </div>
                                <Progress value={65} className="h-1.5 bg-slate-800"  />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* 2. Poker Statistics (Grid) */}
                <section>
                    <h3 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">Career Stats</h3>
                    <div className="grid grid-cols-3 gap-3">
                        {POKER_STATS.map((stat, i) => (
                            <Card key={i} className="bg-slate-900/50 border-white/5 hover:bg-slate-800 transition-colors">
                                <CardContent className="p-3 text-center">
                                    <div className="text-[10px] text-slate-500 mb-1">{stat.label}</div>
                                    <div className={`font-mono font-bold text-lg ${stat.highlight ? 'text-green-500' : 'text-white'}`}>
                                        {stat.value}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* 3. Settings List */}
                <section>
                    <h3 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">Settings</h3>
                    <div className="bg-slate-900/50 rounded-xl border border-white/5 divide-y divide-white/5 overflow-hidden">

                        {/* Sound */}
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-800 rounded-lg text-slate-300"><Volume2 className="w-4 h-4" /></div>
                                <span className="text-sm font-medium">Sound Effects</span>
                            </div>
                            <Switch defaultChecked />
                        </div>

                        {/* Notifications */}
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-800 rounded-lg text-slate-300"><Bell className="w-4 h-4" /></div>
                                <span className="text-sm font-medium">Notifications</span>
                            </div>
                            <Switch />
                        </div>

                        {/* Account Security (Clickable) */}
                        <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-800 rounded-lg text-slate-300"><Shield className="w-4 h-4" /></div>
                                <span className="text-sm font-medium">Account Security</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-500" />
                        </div>

                        {/* Help */}
                        <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-800 rounded-lg text-slate-300"><HelpCircle className="w-4 h-4" /></div>
                                <span className="text-sm font-medium">Help & Support</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-500" />
                        </div>

                    </div>
                </section>

                {/* Logout Button (Mobile Only) */}
                <Button
                    variant="destructive"
                    className="w-full bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900/50"
                    onClick={handleLogout}
                >
                    Log Out
                </Button>
            </main>

            <BottomNav />

            {/* --- Edit Profile Modal --- */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="bg-slate-900 border-white/10 text-white sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Update your nickname and avatar.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        {/* Avatar Selection */}
                        <div className="space-y-2">
                            <Label className="text-xs text-slate-400">Avatar</Label>
                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                {AVATAR_LIST.map((av, i) => (
                                    <div
                                        key={i}
                                        onClick={() => setTempAvatar(av)}
                                        className={`flex-shrink-0 cursor-pointer rounded-full p-0.5 border-2 transition-all ${tempAvatar === av ? 'border-gold-main scale-110' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                    >
                                        <Avatar className="w-12 h-12 bg-slate-800">
                                            <AvatarImage src={av} />
                                            <AvatarFallback>{i}</AvatarFallback>
                                        </Avatar>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Nickname Input */}
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-xs text-slate-400">Nickname</Label>
                            <Input
                                id="name"
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                className="bg-black/40 border-white/10 focus-visible:ring-gold-main"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsEditOpen(false)} className="text-slate-400">Cancel</Button>
                        <Button onClick={handleSaveProfile} className="bg-gold-main text-black hover:bg-yellow-400">Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}