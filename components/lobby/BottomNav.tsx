import React from 'react';
import { Home, ShoppingBag, Users, Menu, UserCircle } from 'lucide-react';
import { cn } from "@/lib/utils";

const navItems = [
    { icon: Home, label: "Lobby", active: true },
    { icon: Users, label: "Friends", active: false },
    { icon: ShoppingBag, label: "Shop", active: false, highlight: true }, // Shop 通常高亮
    { icon: UserCircle, label: "Profile", active: false },
    { icon: Menu, label: "Menu", active: false },
];

export default function BottomNav() {
    return (
        <div className="fixed bottom-0 left-0 w-full h-16 bg-black/80 backdrop-blur-md border-t border-white/10 flex justify-around items-center z-50">
            {navItems.map((item, idx) => (
                <button key={idx} className="flex flex-col items-center justify-center w-full h-full gap-1 active:scale-95 transition-transform">
                    <item.icon
                        className={cn(
                            "w-6 h-6",
                            item.active ? "text-gold-main" : "text-slate-400",
                            item.highlight && "text-gold-main drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]"
                        )}
                    />
                    <span className={cn(
                        "text-[10px]",
                        item.active ? "text-gold-main" : "text-slate-500"
                    )}>
            {item.label}
          </span>
                </button>
            ))}
        </div>
    );
}