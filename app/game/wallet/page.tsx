"use client"

import React, { useState, useEffect } from 'react';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from "framer-motion";
import BottomNav from '@/components/lobby/BottomNav';
import LandscapeGuard from '@/components/game/LandscapeGuard';
import api from '@/lib/api'; // 引入 API
import { useGameStore } from '@/store/useGameStore'; // 引入 Store 拿余额

export default function WalletPage() {
    const { currentUser } = useGameStore();
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<any[]>([]);

    useEffect(() => {
        const fetchTx = async () => {
            try {
                const { data } = await api.get('/wallet/transactions');
                setTransactions(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchTx();
    }, []);

    return (
        <div className="min-h-screen bg-table-bg text-white pb-20 relative">
            <LandscapeGuard />

            <header className="sticky top-0 z-40 bg-black/60 backdrop-blur-md border-b border-white/5 px-4 py-4">
                <h1 className="text-xl font-bold font-serif text-gold-main flex items-center gap-2">
                    <WalletIcon className="w-5 h-5" /> My Wallet
                </h1>
            </header>

            <main className="p-4 space-y-6">

                {/* Asset Card - 显示真实余额 */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full h-48 rounded-2xl bg-gradient-to-br from-gold-main via-yellow-600 to-yellow-800 p-6 relative overflow-hidden shadow-[0_10px_30px_rgba(234,179,8,0.3)]"
                >
                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                    <div className="relative z-10 flex flex-col justify-between h-full">
                        <div>
                            <div className="text-yellow-100 text-sm font-medium mb-1">Total Balance</div>
                            <div className="text-4xl font-mono font-bold text-white drop-shadow-md">
                                ${Number(currentUser?.chips || 0).toLocaleString()}
                            </div>
                        </div>
                        {/* ... Buttons ... */}
                    </div>
                </motion.div>

                {/* Recent Transactions List */}
                <div>
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="font-bold text-lg text-white">Recent Transactions</h2>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-4"><Loader2 className="animate-spin" /></div>
                    ) : (
                        <div className="space-y-2">
                            {transactions.map((tx) => (
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
                                            <div className="text-sm font-medium text-white">{tx.type}</div>
                                            <div className="text-[10px] text-slate-500">{tx.date}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`font-mono font-bold ${Number(tx.amount) > 0 ? 'text-green-500' : 'text-white'}`}>
                                            {Number(tx.amount) > 0 ? '+' : ''}{Number(tx.amount).toLocaleString()}
                                        </div>
                                        <div className="text-[10px] text-slate-500">
                                            Bal: ${Number(tx.balance_after).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <BottomNav />
        </div>
    );
}