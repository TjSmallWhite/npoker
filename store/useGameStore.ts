import {create} from 'zustand';
import api from '@/lib/api';
import {toast} from "sonner";
// --- 类型定义 (Types) ---

export type Suite = '♠' | '♥' | '♣' | '♦';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

// 一张牌的结构 (例如: { suite: '♠', rank: 'A', code: 'As' })
export interface Card {
    suite: Suite;
    rank: Rank;
    code: string; // 用于匹配图片文件名，如 'As', 'Td'
}

export type PlayerAction = 'CHECK' | 'CALL' | 'RAISE' | 'FOLD' | 'ALL_IN' | null;

export interface Player {
    id: number;
    name: string;
    avatar: string;
    chips: number;        // 剩余筹码
    bet: number;          // 当前轮次已下注金额
    status: 'active' | 'folded' | 'sitting_out';
    position: number;     // 0-8，座位号
    cards: Card[] | null; // 别人的牌是 null (除非摊牌)，自己的是 Card[]
    lastAction: PlayerAction;
    isDealer: boolean;    // 是否是庄家位 (Button)
    timeLeft: number;     // 倒计时剩余秒数
}

export type GameStage = 'PREFLOP' | 'FLOP' | 'TURN' | 'RIVER' | 'SHOWDOWN';

const MOCK_DECK: Card[] = [
    {suite: '♠', rank: 'A', code: 'As'}, {suite: '♥', rank: 'K', code: 'Kh'}, // Hero
    {suite: '♣', rank: '2', code: '2c'}, {suite: '♦', rank: '7', code: '7d'}, // Bot
    // Flop
    {suite: '♠', rank: 'J', code: 'Js'},
    {suite: '♥', rank: '10', code: 'Th'},
    {suite: '♣', rank: '5', code: '5c'},
    // Turn
    {suite: '♦', rank: 'Q', code: 'Qd'},
    // River
    {suite: '♠', rank: 'K', code: 'Ks'},
];

interface User {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
    chips: string; // decimal 在 JSON 里通常是 string，前端需转 number
    gems: string;
    vip_level: number;
}

// --- Store 状态接口 ---

interface GameState {
    // 基础信息
    token: string | null;
    currentUser: User | null;
    isAuthenticated: boolean;
    login: (username: string, password: string, avatar: string) => Promise<boolean>;
    roomId: string | null;
    stage: GameStage;
    pot: number;          // 总底池
    currentBet: number;   // 当前这一轮最大的下注额 (别人要跟注的金额)

    roomConfig: {
        name: string;
        smallBlind: number;
        bigBlind: number;
        minBuyIn: number;
        maxBuyIn: number;
    } | null;

    setRoomConfig: (config: any) => void;
    // 核心数据
    communityCards: Card[];
    players: any[];

    // 轮次控制
    activePlayerId: number | null; // 当前轮到谁行动
    myPlayerId: number | null;     // 我是谁 (用于区分 Hero / Villain)

    // 辅助状态
    isLoading: boolean;
    winnerIds: number[] | null;    // 赢家 ID 数组 (用于高亮)

    // --- Actions (操作方法) ---
    setRoomInfo: (roomId: string, myId: number) => void;
    updateGameState: (payload: Partial<GameState>) => void; // 接收后端 WebSocket 推送的大更新
    playerAction: (playerId: number, action: PlayerAction, amount?: number) => void;
    resetRound: () => void;
    sitDown: (roomId: string, seatIndex: number, amount: number) => Promise<boolean>;
    standUp: () => void;
    nextPhase: () => void;
    updateProfile: (name: string, avatar: string) => void;
    logout: () => void;
    fetchProfile: () => Promise<void>;
    setMyCards: (cards: string[]) => void;
}

// --- Zustand Store 实现 ---
const parseCardsForFrontend = (cardCodes: string[]): Card[] => {
    if (!cardCodes || !Array.isArray(cardCodes)) return [];

    const suiteMap: Record<string, Suite> = {'s': '♠', 'h': '♥', 'c': '♣', 'd': '♦'};

    return cardCodes.map(code => {
        // code 可能是 "As" 或 "10d" (后端如果是 Td 需要转 10)
        // 取最后一位作为花色
        const suiteChar = code.slice(-1).toLowerCase();
        // 取前面所有位作为点数
        let rankStr = code.slice(0, -1);

        // 处理特殊的 'T' -> '10' (如果后端发的是 Td, Ts 等)
        if (rankStr === 'T') rankStr = '10';

        return {
            code: code,
            rank: rankStr as Rank,
            suite: suiteMap[suiteChar] || '♠' // 默认给黑桃防止报错
        };
    });
};


export const useGameStore = create<GameState>((set, get) => ({
    roomConfig: null,
    setRoomConfig: (config) => set({ roomConfig: config }),
    token: typeof window !== 'undefined' ? localStorage.getItem('poker_token') : null,
    currentUser: null,
    isAuthenticated: false,
    setMyCards: (cards: string[]) => {
        const {players, myPlayerId} = get();
        // 把牌塞给"我"
        const updatedPlayers = players.map(p =>
            p.id === myPlayerId ? {...p, cards: parseCardsForFrontend(cards)} : p
        );
        set({players: updatedPlayers});
    },
    updateProfile: (name, avatar) => {
        const {players, myPlayerId} = get();
        // 更新 players 数组里那个代表"我"的人
        const updatedPlayers = players.map(p =>
            p.id === myPlayerId ? {...p, name, avatar} : p
        );
        set({players: updatedPlayers});
    },

    logout: async () => {
        try {
            await api.post('/logout'); // 告诉后端销毁 Token
        } catch (e) {
            // 忽略错误，强制前端登出
        }
        localStorage.removeItem('poker_token');
        set({token: null, currentUser: null, isAuthenticated: false});
    },
    nextPhase: () => {
        const {stage, communityCards, players, myPlayerId} = get();

        // 简单的状态机
        switch (stage) {
            case 'PREFLOP':
                // 进入 FLOP：发 3 张公共牌
                set({
                    stage: 'FLOP',
                    communityCards: [MOCK_DECK[4], MOCK_DECK[5], MOCK_DECK[6]],
                    pot: 2400 // 模拟有人下注导致底池变大
                });
                break;

            case 'FLOP':
                // 进入 TURN：发第 4 张
                set({
                    stage: 'TURN',
                    communityCards: [...communityCards, MOCK_DECK[7]],
                    pot: 3500
                });
                break;

            case 'TURN':
                // 进入 RIVER：发第 5 张
                set({
                    stage: 'RIVER',
                    communityCards: [...communityCards, MOCK_DECK[8]],
                    pot: 5000
                });
                break;

            case 'RIVER':
                // 进入 SHOWDOWN：摊牌 (给所有机器人发牌)
                const showdownPlayers = players.map(p => {
                    if (p.id === myPlayerId) return p; // 自己已有牌
                    // 给机器人随机两张牌用于展示
                    return {
                        ...p,
                        cards: [{suite: '♦', rank: '2', code: '2d'}, {suite: '♣', rank: '7', code: '7c'}]
                    };
                });
                set({
                    stage: 'SHOWDOWN',
                    players: showdownPlayers,
                    winnerIds: [myPlayerId!] // 假设我赢了
                });
                break;

            case 'SHOWDOWN':
                // 重置下一局
                get().resetRound(); // 调用你之前写好的 resetRound
                // 重新发手牌 (Preflop)
                set({
                    stage: 'PREFLOP',
                    // 模拟发牌给 Hero
                    players: get().players.map(p => {
                        if (p.id === myPlayerId) {
                            return {...p, cards: [MOCK_DECK[0], MOCK_DECK[1]]};
                        }
                        return p;
                    })
                });
                break;
        }
    },
    login: async (username, password, avatar) => {
        // 模拟网络请求
        try {
            const {data} = await api.post('/login', {username, password});

            // 登录成功
            const token = data.token;
            const user = data.user;

            // 保存 Token
            localStorage.setItem('poker_token', token);
            console.log(`Logging in with: ${username} / ${password}`);

            // 模拟生成 ID
            const myId = Math.floor(Math.random() * 10000) + 1000;
            set({
                token,
                currentUser: user,
                isAuthenticated: true,
                // 同时把"我"加入到 players 列表 (兼容之前的逻辑)
                myPlayerId: user.id,
                players: [{
                    id: user.id,
                    name: user.name,
                    chips: Number(user.chips), // 转数字
                    avatar: user.avatar || "/avatars/1.png",
                    position: 0,
                    status: 'active',
                    cards: null,
                    bet: 0,
                    lastAction: null,
                    isDealer: false,
                    timeLeft: 0
                }]
            });

            return true;
        } catch (error: any) {
            console.error("Login failed", error);
            toast.error(error.response?.data?.message || "Login failed");
            return false;
        }
    },
    // 初始状态
    roomId: null,
    stage: 'PREFLOP',
    pot: 0,
    currentBet: 0,
    communityCards: [],
    players: [],
    activePlayerId: null,
    myPlayerId: null,
    isLoading: false,
    winnerIds: null,

    // Actions

    setRoomInfo: (roomId, myId) => set({roomId, myPlayerId: myId}),

    // 这是最常用的方法：直接把后端通过 Socket 推送过来的数据并入 Store
    updateGameState: (payload) => {
        set((state) => ({
            ...state,
            ...payload,
        }));
    },

    // 模拟玩家动作 (在等待后端确认前，可以做乐观更新，也可以不做，视网络情况定)
    // 这里暂时只做简单的状态标记，实际逻辑通常依赖 updateGameState
    playerAction: (playerId, action, amount = 0) => {
        set((state) => {
            const newPlayers = state.players.map(p => {
                if (p.id !== playerId) return p;
                return {
                    ...p,
                    lastAction: action,
                    bet: p.bet + amount,
                    chips: p.chips - amount
                };
            });

            // 如果是加注，更新当前的 currentBet
            const newCurrentBet = amount > state.currentBet ? amount : state.currentBet;

            return {players: newPlayers, currentBet: newCurrentBet};
        });
    },

    resetRound: () => set({
        stage: 'PREFLOP',
        communityCards: [],
        pot: 0,
        currentBet: 0,
        winnerIds: null,
        players: get().players.map(p => ({
            ...p,
            bet: 0,
            cards: null, // 清空手牌
            lastAction: null,
            status: p.chips > 0 ? 'active' : 'sitting_out'
        }))
    }),
    fetchProfile: async () => {
        try {
            const {data} = await api.get('/me');
            set({
                currentUser: data,
                myPlayerId: data.id
            });
        } catch (error) {
            console.error("Failed to fetch profile");
            // 如果获取失败，可能是 token 过期，执行登出
            get().logout();
        }
    },
    sitDown: async (roomId, seatIndex, amount) => {
        try {
            // 调用刚才写的 Laravel API
            await api.post(`/rooms/${roomId}/sit`, {seatIndex, amount});

            // 成功后，刷新一下房间状态 (包含座位信息)
            // 实际项目中这里应该等待 WebSocket 推送，但现在先手动刷一下
            const {data} = await api.get(`/rooms/${roomId}/state`);

            // 更新本地数据
            set({
                players: data.players, // 后端返回的格式化好的 players
                myPlayerId: get().currentUser?.id
            });

            return true;
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to sit down");
            return false;
        }
    },

    standUp: () => {
        const {players, myPlayerId} = get();
        set({
            players: players.filter(p => p.id !== myPlayerId),
            myPlayerId: null // 变成旁观者
        });
    }
}));