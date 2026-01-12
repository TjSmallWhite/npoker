import { create } from 'zustand';

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
    { suite: '♠', rank: 'A', code: 'As' }, { suite: '♥', rank: 'K', code: 'Kh' }, // Hero
    { suite: '♣', rank: '2', code: '2c' }, { suite: '♦', rank: '7', code: '7d' }, // Bot
    // Flop
    { suite: '♠', rank: 'J', code: 'Js' },
    { suite: '♥', rank: '10', code: 'Th' },
    { suite: '♣', rank: '5', code: '5c' },
    // Turn
    { suite: '♦', rank: 'Q', code: 'Qd' },
    // River
    { suite: '♠', rank: 'K', code: 'Ks' },
];

// --- Store 状态接口 ---

interface GameState {
    // 基础信息
    login: (username: string, password: string, avatar: string) => Promise<boolean>;
    roomId: string | null;
    stage: GameStage;
    pot: number;          // 总底池
    currentBet: number;   // 当前这一轮最大的下注额 (别人要跟注的金额)

    // 核心数据
    communityCards: Card[];
    players: Player[];

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
    sitDown: (playerId: number, seatIndex: number, buyInAmount: number) => void;
    standUp: () => void;
    nextPhase: () => void;
    updateProfile: (name: string, avatar: string) => void;
    logout: () => void;

}

// --- Zustand Store 实现 ---

export const useGameStore = create<GameState>((set, get) => ({
    updateProfile: (name, avatar) => {
        const { players, myPlayerId } = get();
        // 更新 players 数组里那个代表"我"的人
        const updatedPlayers = players.map(p =>
            p.id === myPlayerId ? { ...p, name, avatar } : p
        );
        set({ players: updatedPlayers });
    },

    logout: () => {
        set({
            myPlayerId: null,
            roomId: null,
            players: [], // 清空当前缓存的玩家
            // 注意：不要清空 settings，那些应该 persist
        });
    },
    nextPhase: () => {
        const { stage, communityCards, players, myPlayerId } = get();

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
                        cards: [{ suite: '♦', rank: '2', code: '2d' }, { suite: '♣', rank: '7', code: '7c' }]
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
                            return { ...p, cards: [MOCK_DECK[0], MOCK_DECK[1]] };
                        }
                        return p;
                    })
                });
                break;
        }
    },
    login: async (username, password, avatar) => {
        // 模拟网络请求
        console.log(`Logging in with: ${username} / ${password}`);

        // 模拟生成 ID
        const myId = Math.floor(Math.random() * 10000) + 1000;

        set({
            myPlayerId: myId,
            players: [
                {
                    id: myId,
                    name: username, // 使用用户名作为显示名
                    avatar: avatar,
                    chips: 10000,
                    position: 0,
                    status: 'active',
                    cards: null,
                    bet: 0,
                    lastAction: null,
                    isDealer: false,
                    timeLeft: 0
                }
            ]
        });
        return true;
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

    setRoomInfo: (roomId, myId) => set({ roomId, myPlayerId: myId }),

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

            return { players: newPlayers, currentBet: newCurrentBet };
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
    sitDown: (playerId, seatIndex, buyInAmount) => {
        const { players } = get();

        // 检查该座位是否有人
        if (players.find(p => p.position === seatIndex)) return;

        // 构造新玩家对象
        const newPlayer: any = { // 这里为了省事用了any，实际请用 Player 类型
            id: playerId,
            name: "Hero", // 应该从 UserProfile 取
            avatar: "/avatars/1.png",
            chips: buyInAmount, // 带入的钱
            position: seatIndex,
            status: 'active',
            cards: null,
            bet: 0,
            lastAction: null,
            isDealer: false,
            timeLeft: 30
        };

        set({
            players: [...players, newPlayer],
            myPlayerId: playerId // 标记我自己坐下了
        });
    },

    standUp: () => {
        const { players, myPlayerId } = get();
        set({
            players: players.filter(p => p.id !== myPlayerId),
            myPlayerId: null // 变成旁观者
        });
    }
}));