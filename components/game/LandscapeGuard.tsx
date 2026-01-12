import React from 'react';
import { Smartphone } from 'lucide-react';

export default function LandscapeGuard() {
    return (
        // Hidden by default, shows only in portrait mode
        <div className="hidden portrait:flex fixed inset-0 z-50 bg-black/95 text-white flex-col items-center justify-center p-8 text-center animate-in fade-in backdrop-blur-sm">
            <Smartphone className="w-16 h-16 mb-6 animate-spin-slow text-gold-main" />
            <h2 className="text-2xl font-bold mb-2 font-serif text-gold-main">
                Please Rotate Device
            </h2>
            <p className="text-slate-300 max-w-xs leading-relaxed">
                For the best Texas Hold'em experience, <br/>
                this game only supports <span className="text-white font-bold">Landscape Mode</span>.
            </p>

            {/* Visual hint animation */}
            <div className="mt-10 w-12 h-20 border-2 border-white/20 rounded-lg relative animate-pulse">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-0.5 bg-white/20 rotate-90"></div>
                </div>
            </div>
        </div>
    );
}