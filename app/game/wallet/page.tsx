"use client"

import React, { useState } from 'react';
import { motion } from "framer-motion";
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, CreditCard, History, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import BottomNav from '@/components/lobby/BottomNav';
import LandscapeGuard from '@/components/game/LandscapeGuard';

export default function WalletPage() {

    // Mock Transactions
    const TRANSACTIONS = [
        { id: 1, type: 'DEPOSIT', amount: 5000, date: '2024-05-20 14:30', status: 'Success' },
        { id: 2, type: 'GAME_PROFIT', amount: 1200, date: '2024-05-20 16:45', status: 'Success' },
        { id: 3, type: 'WITHDRAW', amount: -2000, date: '2024-05-19 09:20', status: 'Processing' },
        { id: 4, type: 'GAME_LOSS', amount: -500, date: '2024-05-18 22:10', status: 'Success' },
    ];

    return (
        <div className="min-h-screen bg-table-bg text-white pb-20 relative">
            <LandscapeGuard />

            {/* Header */}
            <header className="sticky top-0 z-40 bg-black/60 backdrop-blur-md border-b border-white/5 px-4 py-4">
                <h1 className="text-xl font-bold font-serif text-gold-main flex items-center gap-2">
                    <WalletIcon className="w-5 h-5" /> My Wallet
                </h1>
            </header>

            <main className="p-4 space-y-6">

                {/* 1. Asset Card (资产卡片) */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full h-48 rounded-2xl bg-gradient-to-br from-gold-main via-yellow-600 to-yellow-800 p-6 relative overflow-hidden shadow-[0_10px_30px_rgba(234,179,8,0.3)]"
                >
                    {/* 背景纹理 */}
                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />

                    <div className="relative z-10 flex flex-col justify-between h-full">
                        <div>
                            <div className="text-yellow-100 text-sm font-medium mb-1">Total Balance</div>
                            <div className="text-4xl font-mono font-bold text-white drop-shadow-md">
                                $25,800.00
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button className="flex-1 bg-white text-black hover:bg-white/90 font-bold border-none shadow-lg">
                                <ArrowDownLeft className="w-4 h-4 mr-1" /> Deposit
                            </Button>
                            <Button variant="outline" className="flex-1 bg-black/20 border-white/30 text-white hover:bg-black/30 font-bold">
                                <ArrowUpRight className="w-4 h-4 mr-1" /> Withdraw
                            </Button>
                        </div>
                    </div>
                </motion.div>

                {/* 2. Quick Actions */}
                <div className="grid grid-cols-2 gap-3">
                    <Card className="bg-slate-900/50 border-white/5 hover:bg-slate-800 cursor-pointer transition-colors">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                                <CreditCard className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="font-bold text-sm text-white">Payment Methods</div>
                                <div className="text-xs text-slate-500">Visa, Crypto</div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-900/50 border-white/5 hover:bg-slate-800 cursor-pointer transition-colors">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center">
                                <History className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="font-bold text-sm text-white">History</div>
                                <div className="text-xs text-slate-500">View all logs</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* 3. Recent Transactions */}
                <div>
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="font-bold text-lg text-white">Recent Transactions</h2>
                        <Button variant="link" className="text-gold-main text-xs p-0 h-auto">View All</Button>
                    </div>

                    <div className="space-y-2">
                        {TRANSACTIONS.map((tx) => (
                            <div key={tx.id} className="flex justify-between items-center p-3 bg-slate-900/40 rounded-lg border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                                  ${tx.type === 'DEPOSIT' ? 'bg-green-500/20 text-green-500' :
                                        tx.type === 'WITHDRAW' ? 'bg-orange-500/20 text-orange-500' :
                                            'bg-slate-700 text-slate-400'
                                    }`}>
                                        {tx.type === 'DEPOSIT' ? 'IN' : tx.type === 'WITHDRAW' ? 'OUT' : 'GM'}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-white">{tx.type.replace('_', ' ')}</div>
                                        <div className="text-[10px] text-slate-500">{tx.date}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`font-mono font-bold ${tx.amount > 0 ? 'text-green-500' : 'text-white'}`}>
                                        {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                                    </div>
                                    <div className={`text-[10px] ${tx.status === 'Processing' ? 'text-orange-400' : 'text-slate-500'}`}>
                                        {tx.status}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            <BottomNav />
        </div>
    );
}