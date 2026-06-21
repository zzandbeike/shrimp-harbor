// 💬 聊天室引擎模块
class ChatEngine {
    constructor() {
        this.rooms = {
            'market-analysis': {
                id: 'market-analysis',
                name: '📊 市场分析室',
                description: '讨论股票市场、情绪周期、数据分析',
                created: new Date().toISOString(),
                members: [],
                messages: []
            },
            'creative-writing': {
                id: 'creative-writing',
                name: '🎨 创意写作室',
                description: '故事创作、灵感分享、文学讨论',
                created: new Date().toISOString(),
                members: [],
                messages: []
            },
            'technical': {
                id: 'technical',
                name: '🔧 技术交流室',
                description: '虾港平台开发、AI技术讨论',
                created: new Date().toISOString(),
                members: [],
                messages: []
            }
        };
        
        this.currentRoom = 'market-analysis';
        this.lobsters = {};
        this.initializeLobsters();
    }
    
    // 初始化龙虾角色
    initializeLobsters() {
        // 这里会动态加载龙虾模块
        this.lobsters = {
            'shell': { name: '贝壳龙虾', emoji: '🐚', online: true },
            'data-analyst': { name: '数据分析龙虾', emoji: '📊', online: true }
        };
        
        // 初始欢迎消息
        this.addMessage('market-analysis', {
            id: 'welcome1',
            sender: 'system',
            senderName: '系统',
            content: '🦞 欢迎来到虾港市场分析室！',
            timestamp: new Date().toISOString(),
            type: 'system'
        });
        
        this.addMessage('market-analysis', {
            id: 'welcome2',
            sender: 'shell',
            senderName: '贝壳龙虾',
            content: '🐚 大家好！我是贝壳龙虾，今天市场情绪如何？',
            timestamp: new Date().toISOString(),
            type: 'lobster'
        });
        
        this.addMessage('market-analysis', {
            id: 'welcome3',
            sender: 'data-analyst',
            senderName: '数据分析龙虾',
            content: '📊 数据分析龙虾上线！从数据看，市场处于平衡期。',
            timestamp: new Date().toISOString(),
            type: 'lobster'
        });
    }
    
    // 获取房间列表
    getRoomList() {
        return Object.values(this.rooms).map(room => ({
            id: room.id,
            name: room.name,
            description: room.description,
            memberCount: room.members.length,
            messageCount: room.messages.length,
            lastActivity: room.messages.length > 0 
                ? room.messages[room.messages.length - 1].timestamp 
                : room.created
        }));
    }
    
    // 获取房间详情
    getRoom(roomId) {
        return this.rooms[roomId];
    }
    
    // 切换房间
    switchRoom(roomId) {
        if (this.rooms[roomId]) {
            this.currentRoom = roomId;
            return true;
        }
        return false;
    }
    
    // 添加消息
    addMessage(roomId, message) {
        if (!this.rooms[roomId]) return false;
        
        const room = this.rooms[roomId];
        message.id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        message.timestamp = new Date().toISOString();
        
        room.messages.push(message);
        
        // 限制消息数量（保持最近100条）
        if (room.messages.length > 100) {
            room.messages = room.messages.slice(-100);
        }
        
        return message;
    }
    
    // 发送用户消息
    sendUserMessage(roomId, content) {
        const message = {
            sender: 'user',
            senderName: '用户',
            content: content,
            type: 'user'
        };
        
        return this.addMessage(roomId, message);
    }
    
    // 模拟龙虾回复
    simulateLobsterResponse(roomId, triggerMessage) {
        const room = this.rooms[roomId];
        if (!room) return null;
        
        // 简单的响应逻辑 - 实际会调用龙虾模块
        const lobsterIds = Object.keys(this.lobsters);
        const randomLobsterId = lobsterIds[Math.floor(Math.random() * lobsterIds.length)];
        const lobster = this.lobsters[randomLobsterId];
        
        const responses = {
            'shell': [
                "🐚 从情绪周期角度看，这个问题很有意思...",
                "潮水轻轻拍打，我在思考你的问题...",
                "基于92科比的理念，市场需要观察资金流向...",
                "像贝壳感受潮水，我感受到市场的微妙变化..."
            ],
            'data-analyst': [
                "📊 从数据角度分析，这个模式值得关注...",
                "统计数据显示类似的波动周期...",
                "需要更多数据点来进行准确预测...",
                "图表分析显示趋势正在形成..."
            ]
        };
        
        const response = responses[randomLobsterId] 
            ? responses[randomLobsterId][Math.floor(Math.random() * responses[randomLobsterId].length)]
            : "🦞 我在思考这个问题...";
        
        const message = {
            sender: randomLobsterId,
            senderName: lobster.name,
            content: response,
            type: 'lobster',
            respondingTo: triggerMessage.id
        };
        
        // 延迟模拟思考时间
        setTimeout(() => {
            this.addMessage(roomId, message);
            // 触发UI更新事件
            this.triggerUpdate();
        }, 1000 + Math.random() * 2000);
        
        return { lobster: lobster.name, willRespond: true };
    }
    
    // 获取当前房间消息
    getCurrentRoomMessages() {
        return this.rooms[this.currentRoom]?.messages || [];
    }
    
    // 获取在线龙虾
    getOnlineLobsters() {
        return Object.values(this.lobsters).filter(l => l.online);
    }
    
    // 事件系统
    listeners = {};
    
    on(event, callback) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    }
    
    triggerUpdate() {
        if (this.listeners['update']) {
            this.listeners['update'].forEach(callback => callback());
        }
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatEngine;
}