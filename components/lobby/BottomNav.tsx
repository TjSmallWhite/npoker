"use client"

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Wallet, History, UserCircle, Menu } from 'lucide-react'; // 换了几个更准确的图标
import { cn } from "@/lib/utils";

const navItems = [
    { icon: Home, label: "Lobby", href: "/game" },
    { icon: History, label: "History", href: "/game/history" },
    { icon: Wallet, label: "Wallet", href: "/game/wallet", highlight: true }, // 钱包通常高亮
    { icon: UserCircle, label: "Profile", href: "/game/profile" },
    // { icon: Menu, label: "Menu", href: "/game/menu" }, // 暂时先不做这个
];

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <div className="fixed bottom-0 left-0 w-full h-16 bg-black/90 backdrop-blur-xl border-t border-white/10 flex justify-around items-center z-50 px-2 pb-safe">
            {navItems.map((item, idx) => {
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={idx}
                        href={item.href}
                        className="flex flex-col items-center justify-center w-full h-full gap-1 active:scale-95 transition-transform"
                    >
                        <item.icon
                            className={cn(
                                "w-6 h-6 transition-colors",
                                isActive ? "text-gold-main" : "text-slate-500",
                                item.highlight && !isActive && "text-slate-300"
                            )}
                        />
                        <span className={cn(
                            "text-[10px] font-medium transition-colors",
                            isActive ? "text-gold-main" : "text-slate-600"
                        )}>
              {item.label}
            </span>
                    </Link>
                );
            })}
        </div>
    );
}