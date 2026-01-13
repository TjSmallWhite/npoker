import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import axios from 'axios';

// 挂载 Pusher 到 window 对象 (Echo 需要)
if (typeof window !== 'undefined') {
    (window as any).Pusher = Pusher;
}

const createEcho = () => {
    if (typeof window === 'undefined') return null;

    const token = localStorage.getItem('poker_token');

    return new Echo({
        broadcaster: 'reverb',
        key: process.env.NEXT_PUBLIC_REVERB_APP_KEY || 'your_app_key_here', // 对应后端 .env
        wsHost: process.env.NEXT_PUBLIC_REVERB_HOST || 'localhost',
        wsPort: process.env.NEXT_PUBLIC_REVERB_PORT || 8080,
        wssPort: process.env.NEXT_PUBLIC_REVERB_PORT || 8080,
        forceTLS: false, // 本地开发设为 false，线上设为 true
        enabledTransports: ['ws', 'wss'],

        // --- 关键：自定义认证，带上 Token ---
        authorizer: (channel: any, options: any) => {
            return {
                authorize: (socketId: string, callback: Function) => {
                    axios.post('http://localhost:8000/api/broadcasting/auth', {
                        socket_id: socketId,
                        channel_name: channel.name
                    }, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                        .then(response => {
                            callback(false, response.data);
                        })
                        .catch(error => {
                            callback(true, error);
                        });
                }
            };
        },
    });
};

export const echo = createEcho();