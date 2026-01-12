"use client"

import React, {useState, useEffect} from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Slider} from "@/components/ui/slider";
import {Badge} from "@/components/ui/badge";
import {Coins} from "lucide-react";

interface BuyInModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (amount: number) => void;
    minBuyIn: number;
    maxBuyIn: number;
    userBalance: number;
}

export default function BuyInModal({
                                       isOpen, onClose, onConfirm, minBuyIn, maxBuyIn, userBalance
                                   }: BuyInModalProps) {
    // 默认买入金额设为最大值或 100BB
    const [amount, setAmount] = useState(minBuyIn);

    // 确保滑块范围正常
    const effectiveMax = Math.min(maxBuyIn, userBalance);
    const canAfford = userBalance >= minBuyIn;

    useEffect(() => {
        if (isOpen) setAmount(minBuyIn);
    }, [isOpen, minBuyIn]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-slate-900 border-gold-main/20 text-white sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-gold-main text-xl flex items-center gap-2">
                        <Coins className="w-5 h-5"/> Buy-in to Seat
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Choose amount to bring to the table.
                    </DialogDescription>
                </DialogHeader>

                {!canAfford ? (
                    <div className="py-6 text-center text-red-500 font-bold">
                        Insufficient Balance! <br/>
                        <span className="text-xs font-normal text-slate-400">You need at least ${minBuyIn}</span>
                    </div>
                ) : (
                    <div className="grid gap-6 py-4">
                        {/* Display Amount */}
                        <div className="flex flex-col items-center justify-center space-y-2">
                            <div className="text-4xl font-bold font-mono text-white">
                                ${amount.toLocaleString()}
                            </div>
                            <div className="flex gap-2 text-xs text-slate-400">
                                <span>Min: ${minBuyIn}</span>
                                <span>Max: ${effectiveMax}</span>
                            </div>
                        </div>

                        {/* Slider */}
                        <div className="px-2">
                            <Slider
                                defaultValue={[minBuyIn]}
                                value={[amount]}
                                onValueChange={(vals) => setAmount(vals[0])}
                                min={minBuyIn}
                                max={effectiveMax}
                                step={10} // 最小单位
                                className="cursor-pointer py-4"
                            />
                        </div>

                        {/* Quick Buttons */}
                        <div className="flex justify-between gap-2">
                            <Button variant="outline" size="sm" onClick={() => setAmount(minBuyIn)}
                                    className="border-slate-700 text-xs text-slate-300">Min</Button>
                            <Button variant="outline" size="sm"
                                    onClick={() => setAmount(Math.floor(effectiveMax * 0.5))}
                                    className="border-slate-700 text-xs text-slate-300">50%</Button>
                            <Button variant="outline" size="sm" onClick={() => setAmount(effectiveMax)}
                                    className="border-slate-700 text-xs text-slate-300">Max</Button>
                        </div>
                    </div>
                )}

                <DialogFooter className="sm:justify-between gap-2">
                    <div className="flex items-center text-xs text-slate-500">
                        Wallet: <span className="text-white ml-1">${userBalance.toLocaleString()}</span>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={onClose}
                                className="text-slate-400 hover:text-white">Cancel</Button>
                        <Button
                            onClick={() => onConfirm(amount)}
                            disabled={!canAfford}
                            className="bg-gold-main text-black hover:bg-yellow-400 font-bold"
                        >
                            Confirm Sit
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}