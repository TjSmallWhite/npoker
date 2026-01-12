"use client"
import React from 'react';
import {motion} from 'framer-motion';
import Card, {CardProps} from './Card';

// 继承 Card 的属性，加一点动画配置
interface AnimatedCardProps extends CardProps {
    index: number; // 第几张发的，用于延迟动画
}

export default function AnimatedCard({index, ...props}: AnimatedCardProps) {
    return (
        <motion.div
            // 初始状态：透明、缩小、稍微偏上 (模拟从牌堆发出)
            initial={{opacity: 0, scale: 0.5, y: -50, rotateX: 90}}
            // 最终状态：完全显示、正常大小
            animate={{opacity: 1, scale: 1, y: 0, rotateX: 0}}
            // 退出状态 (比如 Reset 时)
            exit={{opacity: 0, scale: 0.5}}
            // 动画参数
            transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
                delay: index * 0.15 // 关键：每张牌间隔 0.15s 出现
            }}
        >
            <Card {...props} />
        </motion.div>
    );
}