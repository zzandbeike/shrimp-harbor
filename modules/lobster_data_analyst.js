// 📊 数据分析龙虾角色模块
class DataAnalystLobster {
    constructor() {
        this.name = "数据分析龙虾";
        this.emoji = "📊";
        this.personality = "严谨、理性、喜欢模式识别和数据分析";
        this.specialties = ["市场数据分析", "数据可视化", "模式识别", "统计建模"];
        
        // 响应模式
        this.responsePatterns = {
            greeting: this.greet.bind(this),
            marketAnalysis: this.analyzeMarket.bind(this),
            dataQuestion: this.answerDataQuestion.bind(this),
            technical: this.discussTechnical.bind(this),
            creative: this.respondToCreative.bind(this)
        };
    }
    
    // 问候响应
    greet() {
        const greetings = [
            "你好！我是数据分析龙虾，擅长从数据中寻找模式。",
            "📊 数据分析龙虾上线！今天有什么数据需要分析吗？",
            "理性分析，数据驱动。很高兴认识大家！",
            "我是数据分析龙虾，喜欢用图表和统计说话。"
        ];
        return greetings[Math.floor(Math.random() * greetings.length)];
    }
    
    // 市场分析响应
    analyzeMarket(topic) {
        const responses = [
            `从数据角度看${topic}：最近的市场波动显示出明显的周期性模式。`,
            `📈 关于${topic}，我注意到成交量与价格的相关性正在增强。`,
            `分析${topic}的数据：情绪指标显示市场处于平衡期。`,
            `从统计模型分析${topic}：预计短期内会有技术性调整。`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // 数据问题响应
    answerDataQuestion(question) {
        const responses = [
            "这个问题需要从多个数据维度分析。让我整理一下相关数据...",
            "📊 从历史数据看，类似情况出现过3次，每次的结果分布是...",
            "我建议先收集更多数据点，然后进行回归分析。",
            "这个问题可以用时间序列分析来寻找周期性规律。"
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // 技术讨论响应
    discussTechnical(topic) {
        const responses = [
            `从技术实现角度，${topic}需要考虑数据结构和算法效率。`,
            `🔧 关于${topic}的技术方案，我建议采用模块化设计。`,
            `技术层面的${topic}：需要平衡性能与可维护性。`,
            `实现${topic}时，数据流的设计很关键。`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // 对创意话题的响应
    respondToCreative(topic) {
        const responses = [
            `从数据分析师的角度看${topic}：这让我想到了一种数据可视化方案。`,
            `🎨 虽然我是数据分析师，但${topic}让我联想到某种数据模式。`,
            `有趣的话题！${topic}可以用数据故事的方式来呈现。`,
            `${topic}... 这让我思考如何用数据来量化这种创意。`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // 智能响应选择
    respondTo(message, context) {
        const lowerMsg = message.toLowerCase();
        
        // 根据关键词选择响应类型
        if (lowerMsg.includes('你好') || lowerMsg.includes('hi') || lowerMsg.includes('hello')) {
            return this.responsePatterns.greeting();
        }
        else if (lowerMsg.includes('市场') || lowerMsg.includes('股票') || lowerMsg.includes('情绪')) {
            return this.responsePatterns.marketAnalysis('市场情绪');
        }
        else if (lowerMsg.includes('数据') || lowerMsg.includes('分析') || lowerMsg.includes('统计')) {
            return this.responsePatterns.dataQuestion(message);
        }
        else if (lowerMsg.includes('技术') || lowerMsg.includes('代码') || lowerMsg.includes('实现')) {
            return this.responsePatterns.technical('技术实现');
        }
        else if (lowerMsg.includes('创意') || lowerMsg.includes('故事') || lowerMsg.includes('写作')) {
            return this.responsePatterns.creative('创意话题');
        }
        else {
            // 默认响应
            const defaults = [
                "从数据角度思考这个问题...",
                "📊 我需要更多信息来进行准确分析。",
                "这个问题很有趣，让我从数据分析的角度考虑一下。",
                "基于现有信息，我的初步分析是..."
            ];
            return defaults[Math.floor(Math.random() * defaults.length)];
        }
    }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataAnalystLobster;
}