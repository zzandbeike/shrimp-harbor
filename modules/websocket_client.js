// 🔌 WebSocket 客户端模块
class WebSocketClient {
    constructor(options = {}) {
        this.options = {
            serverUrl: options.serverUrl || 'ws://localhost:9000',
            room: options.room || 'market-analysis',
            username: options.username || `龙虾_${Math.random().toString(36).substr(2, 4)}`,
            reconnectInterval: options.reconnectInterval || 3000,
            maxReconnectAttempts: options.maxReconnectAttempts || 5
        };
        
        this.ws = null;
        this.reconnectAttempts = 0;
        this.isConnected = false;
        this.messageHandlers = new Map();
        this.roomInfo = null;
        
        // 注册默认消息处理器
        this.registerDefaultHandlers();
    }
    
    // 连接到服务器
    connect() {
        if (this.isConnected) {
            console.warn('已经连接到服务器');
            return;
        }
        
        const url = `${this.options.serverUrl}?room=${this.options.room}`;
        console.log(`🦞 正在连接到: ${url}`);
        
        try {
            this.ws = new WebSocket(url);
            
            this.ws.onopen = () => this.handleOpen();
            this.ws.onmessage = (event) => this.handleMessage(event);
            this.ws.onclose = () => this.handleClose();
            this.ws.onerror = (error) => this.handleError(error);
            
        } catch (error) {
            console.error('连接失败:', error);
            this.scheduleReconnect();
        }
    }
    
    // 连接成功
    handleOpen() {
        console.log('✅ WebSocket连接成功');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // 触发连接成功事件
        this.triggerEvent('connected', {
            server: this.options.serverUrl,
            room: this.options.room,
            username: this.options.username
        });
    }
    
    // 处理消息
    handleMessage(event) {
        try {
            const data = JSON.parse(event.data);
            this.processMessage(data);
        } catch (error) {
            console.error('消息解析错误:', error, event.data);
        }
    }
    
    // 处理关闭
    handleClose() {
        console.log('🔌 WebSocket连接关闭');
        this.isConnected = false;
        this.ws = null;
        
        // 触发断开连接事件
        this.triggerEvent('disconnected');
        
        // 尝试重连
        if (this.reconnectAttempts < this.options.maxReconnectAttempts) {
            this.scheduleReconnect();
        }
    }
    
    // 处理错误
    handleError(error) {
        console.error('WebSocket错误:', error);
        this.triggerEvent('error', { error });
    }
    
    // 处理消息
    processMessage(data) {
        const { type } = data;
        
        // 调用对应的处理器
        const handler = this.messageHandlers.get(type);
        if (handler) {
            handler(data);
        } else {
            console.log('未处理的消息类型:', type, data);
        }
        
        // 触发通用消息事件
        this.triggerEvent('message', data);
    }
    
    // 注册默认处理器
    registerDefaultHandlers() {
        // 房间信息
        this.on('room_list', (data) => {
            this.roomInfo = data;
            console.log('📊 房间信息更新:', data.currentRoom.name);
            this.triggerEvent('room_info', data);
        });
        
        // 聊天消息
        this.on('message', (data) => {
            console.log(`💬 ${data.fromName}: ${data.content}`);
            this.triggerEvent('chat_message', data);
        });
        
        // 错误消息
        this.on('error', (data) => {
            console.error('服务器错误:', data.content);
            this.triggerEvent('server_error', data);
        });
    }
    
    // 发送消息
    sendMessage(type, data = {}) {
        if (!this.isConnected || !this.ws) {
            console.error('无法发送消息: 未连接到服务器');
            return false;
        }
        
        const message = {
            type,
            ...data,
            timestamp: new Date().toISOString()
        };
        
        try {
            this.ws.send(JSON.stringify(message));
            return true;
        } catch (error) {
            console.error('发送消息失败:', error);
            return false;
        }
    }
    
    // 发送聊天消息
    sendChatMessage(content) {
        return this.sendMessage('message', { content });
    }
    
    // 加入房间
    joinRoom(roomId) {
        return this.sendMessage('join', { room: roomId });
    }
    
    // 断开连接
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
            this.isConnected = false;
        }
    }
    
    // 安排重连
    scheduleReconnect() {
        if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
            console.error('达到最大重连次数，停止重连');
            this.triggerEvent('reconnect_failed');
            return;
        }
        
        this.reconnectAttempts++;
        const delay = this.options.reconnectInterval * this.reconnectAttempts;
        
        console.log(`🔄 ${this.reconnectAttempts}/${this.options.maxReconnectAttempts} 尝试重连... (${delay}ms后)`);
        
        setTimeout(() => {
            if (!this.isConnected) {
                this.connect();
            }
        }, delay);
    }
    
    // 注册消息处理器
    on(type, handler) {
        this.messageHandlers.set(type, handler);
    }
    
    // 移除消息处理器
    off(type) {
        this.messageHandlers.delete(type);
    }
    
    // 触发事件
    triggerEvent(eventName, data = {}) {
        const event = new CustomEvent(`shrimpharbor:${eventName}`, {
            detail: { ...data, client: this }
        });
        window.dispatchEvent(event);
    }
    
    // 获取连接状态
    getStatus() {
        return {
            connected: this.isConnected,
            server: this.options.serverUrl,
            room: this.options.room,
            username: this.options.username,
            reconnectAttempts: this.reconnectAttempts,
            roomInfo: this.roomInfo
        };
    }
}

// 全局WebSocket客户端实例
window.ShrimpHarborWS = {
    createClient: (options) => new WebSocketClient(options),
    
    // 工具函数
    formatMessageTime: (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    // 消息类型
    MESSAGE_TYPES: {
        JOIN: 'join',
        LEAVE: 'leave',
        MESSAGE: 'message',
        ROOM_LIST: 'room_list',
        USER_LIST: 'user_list',
        ERROR: 'error'
    }
};

console.log('🦞 WebSocket客户端模块加载完成');