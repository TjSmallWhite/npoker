// 定义后端返回的数据结构 (DTO)

export interface UserProfile {
    id: number;
    name: string;
    avatar: string;
    chips: number;      // 游戏币
    gems: number;       // 充值币 (用于买道具/表情)
    vipLevel: number;
    level: number;      // 经验等级
    exp: number;
    nextLevelExp: number;
}

export interface GameRoom {
    id: string;
    name: string;
    type: 'NLHE' | 'PLO'; // 德州 / 奥马哈
    blinds: string;       // e.g., "5/10"
    minBuyIn: number;
    maxPlayers: number;
    currentPlayers: number;
    isHot?: boolean;      // 是否火爆
}

export interface Promotion {
    id: number;
    title: string;
    imageUrl: string; // 实际开发用图片，现在用 CSS 渐变模拟
    link: string;
}

// --- Mock API 方法 ---

export const getLobbyData = async () => {
    // 模拟网络延迟 500ms
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
        user: {
            id: 1001,
            name: "PokerKing_99",
            avatar: "/avatars/1.png",
            chips: 25800,
            gems: 120,
            vipLevel: 3,
            level: 12,
            exp: 450,
            nextLevelExp: 1000,
        } as UserProfile,

        promotions: [
            { id: 1, title: "Welcome Bonus Package", imageUrl: "bg-gradient-to-r from-purple-600 to-blue-600", link: "/shop" },
            { id: 2, title: "Weekend Tournament", imageUrl: "bg-gradient-to-r from-orange-500 to-red-600", link: "/tournament" },
        ] as Promotion[],

        rooms: [
            { id: "8888", name: "Novice Room", type: "NLHE", blinds: "1/2", minBuyIn: 100, currentPlayers: 8, maxPlayers: 9, isHot: true },
            { id: "8889", name: "Regular Table", type: "NLHE", blinds: "5/10", minBuyIn: 500, currentPlayers: 5, maxPlayers: 9 },
            { id: "8890", name: "High Rollers", type: "NLHE", blinds: "50/100", minBuyIn: 5000, currentPlayers: 2, maxPlayers: 6 },
            { id: "8891", name: "PLO Fast", type: "PLO", blinds: "2/4", minBuyIn: 200, currentPlayers: 4, maxPlayers: 6 },
        ] as GameRoom[]
    };
};