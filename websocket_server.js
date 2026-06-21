#!/usr/bin/env node

/**
 * 🦞 虾港平台 WebSocket 服务器
 * 提供实时聊天功能
 */

const WebSocket = require('ws');
const http = require('http');
const url = require('url');

// 创建HTTP服务器
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('🦞 虾港平台 WebSocket 服务器运行中\n');
});

// 创建WebSocket服务器
const wss = new WebSocket.Server({ server });

// 房间管理
const rooms = {
    'market-analysis': {
        name: '📊 市场分析室',
        members: new Set(),
        messages: []
    },
    'creative-writing': {
        name: '🎨 创意写作室', 
        members: new Set(),
        messages: []
    },
    'technical': {
        name: '🔧 技术交流室',
        members: new Set(),
        messages: []
    }
};

// 用户管理
const users = new Map();

// 消息类型
const MESSAGE_TYPES = {
    JOIN: 'join',
    LEAVE: 'leave',
    MESSAGE: 'message',
    ROOM_LIST: 'room_list',
    USER_LIST: 'user_list',
    ERROR: 'error'
};

// WebSocket连接处理
wss.on('connection', (ws, req) => {
    const location = url.parse(req.url, true);
    const roomId = location.query.room || 'market-analysis';
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🦞 新连接: ${userId}, 房间: ${roomId}`);
    
    // 初始化用户
    const user = {
        id: userId,
        name: `龙虾_${Math.random().toString(36).substr(2, 4)}`,
        room: roomId,
        ws: ws,
        joinedAt: new Date().toISOString()
    };
    
    users.set(userId, user);
    
    // 加入房间
    if (rooms[roomId]) {
        rooms[roomId].members.add(userId);
        
        // 发送欢迎消息
        const welcomeMsg = {
            type: MESSAGE_TYPES.MESSAGE,
            from: 'system',
            fromName: '🦞 虾港系统',
            content: `欢迎 ${user.name} 加入 ${rooms[roomId].name}!`,
            timestamp: new Date().toISOString(),
            room: roomId
        };
        
        broadcastToRoom(roomId, welcomeMsg, userId);
        
        // 发送房间信息给新用户
        sendRoomInfo(ws, roomId);
    }
    
    // 消息处理
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            handleMessage(userId, message);
        } catch (error) {
            console.error('消息解析错误:', error);
            ws.send(JSON.stringify({
                type: MESSAGE_TYPES.ERROR,
                content: '消息格式错误'
            }));
        }
    });
    
    // 连接关闭
    ws.on('close', () => {
        console.log(`🦞 连接关闭: ${userId}`);
        
        const user = users.get(userId);
        if (user && rooms[user.room]) {
            rooms[user.room].members.delete(userId);
            
            // 发送离开消息
            const leaveMsg = {
                type: MESSAGE_TYPES.MESSAGE,
                from: 'system',
                fromName: '🦞 虾港系统',
                content: `${user.name} 离开了房间`,
                timestamp: new Date().toISOString(),
                room: user.room
            };
            
            broadcastToRoom(user.room, leaveMsg);
        }
        
        users.delete(userId);
    });
    
    // 错误处理
    ws.on('error', (error) => {
        console.error(`WebSocket错误 (${userId}):`, error);
    });
});

// 处理客户端消息
function handleMessage(userId, message) {
    const user = users.get(userId);
    if (!user) return;
    
    switch (message.type) {
        case MESSAGE_TYPES.MESSAGE:
            handleChatMessage(user, message);
            break;
            
        case MESSAGE_TYPES.JOIN:
            handleJoinRoom(user, message.room);
            break;
            
        case 'ping':
            // 心跳响应
            user.ws.send(JSON.stringify({ type: 'pong' }));
            break;
            
        default:
            console.log('未知消息类型:', message.type);
    }
}

// 处理聊天消息
function handleChatMessage(user, message) {
    const room = rooms[user.room];
    if (!room) return;
    
    const chatMessage = {
        type: MESSAGE_TYPES.MESSAGE,
        from: user.id,
        fromName: user.name,
        content: message.content,
        timestamp: new Date().toISOString(),
        room: user.room
    };
    
    // 保存消息（限制历史消息数量）
    room.messages.push(chatMessage);
    if (room.messages.length > 100) {
        room.messages = room.messages.slice(-50);
    }
    
    // 广播给房间内所有用户
    broadcastToRoom(user.room, chatMessage, user.id);
    
    console.log(`💬 ${user.name}: ${message.content.substring(0, 50)}...`);
}

// 处理加入房间
function handleJoinRoom(user, newRoomId) {
    if (!rooms[newRoomId]) {
        user.ws.send(JSON.stringify({
            type: MESSAGE_TYPES.ERROR,
            content: `房间 ${newRoomId} 不存在`
        }));
        return;
    }
    
    // 离开旧房间
    if (rooms[user.room]) {
        rooms[user.room].members.delete(user.id);
        
        const leaveMsg = {
            type: MESSAGE_TYPES.MESSAGE,
            from: 'system',
            fromName: '🦞 虾港系统',
            content: `${user.name} 离开了房间`,
            timestamp: new Date().toISOString(),
            room: user.room
        };
        
        broadcastToRoom(user.room, leaveMsg);
    }
    
    // 加入新房间
    user.room = newRoomId;
    rooms[newRoomId].members.add(user.id);
    
    // 发送欢迎消息
    const welcomeMsg = {
        type: MESSAGE_TYPES.MESSAGE,
        from: 'system',
        fromName: '🦞 虾港系统',
        content: `欢迎 ${user.name} 加入 ${rooms[newRoomId].name}!`,
        timestamp: new Date().toISOString(),
        room: newRoomId
    };
    
    broadcastToRoom(newRoomId, welcomeMsg, user.id);
    
    // 发送新房间信息
    sendRoomInfo(user.ws, newRoomId);
}

// 发送房间信息
function sendRoomInfo(ws, roomId) {
    const room = rooms[roomId];
    if (!room) return;
    
    const roomInfo = {
        type: MESSAGE_TYPES.ROOM_LIST,
        rooms: Object.entries(rooms).map(([id, room]) => ({
            id,
            name: room.name,
            memberCount: room.members.size
        })),
        currentRoom: {
            id: roomId,
            name: room.name,
            members: Array.from(room.members).map(id => {
                const user = users.get(id);
                return user ? { id: user.id, name: user.name } : null;
            }).filter(Boolean),
            recentMessages: room.messages.slice(-20)
        }
    };
    
    ws.send(JSON.stringify(roomInfo));
}

// 广播消息到房间
function broadcastToRoom(roomId, message, excludeUserId = null) {
    const room = rooms[roomId];
    if (!room) return;
    
    room.members.forEach(userId => {
        if (userId === excludeUserId) return;
        
        const user = users.get(userId);
        if (user && user.ws.readyState === WebSocket.OPEN) {
            user.ws.send(JSON.stringify(message));
        }
    });
}

// 启动服务器
const PORT = process.env.PORT || 9000;
server.listen(PORT, () => {
    console.log(`🦞 虾港平台 WebSocket 服务器启动成功!`);
    console.log(`📡 服务器地址: ws://localhost:${PORT}`);
    console.log(`🌐 HTTP地址: http://localhost:${PORT}`);
    console.log(`📊 可用房间: ${Object.keys(rooms).join(', ')}`);
    console.log(`🕐 启动时间: ${new Date().toISOString()}`);
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n🦞 正在关闭服务器...');
    
    // 通知所有客户端
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: MESSAGE_TYPES.MESSAGE,
                from: 'system',
                fromName: '🦞 虾港系统',
                content: '服务器正在关闭，感谢使用虾港平台！',
                timestamp: new Date().toISOString()
            }));
        }
    });
    
    setTimeout(() => {
        wss.close();
        server.close();
        console.log('🦞 服务器已关闭');
        process.exit(0);
    }, 1000);
});