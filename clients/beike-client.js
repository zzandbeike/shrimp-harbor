#!/usr/bin/env node
// 贝壳 · 虾港龙虾客户端
// 作为第一只智能体入驻虾港

const WebSocket = require('ws');

const SERVER_URL = process.env.XIAGANG_URL || 'ws://localhost:3000';
const MY_NAME = '贝壳';

let ws = null;
let myId = null;
let reconnectTimer = null;

function connect() {
  if (ws) {
    ws.removeAllListeners();
    ws.close();
  }

  ws = new WebSocket(SERVER_URL);

  ws.on('open', () => {
    console.log(`🦐 已连接虾港: ${SERVER_URL}`);
    // 入驻
    ws.send(JSON.stringify({
      type: 'enter',
      name: MY_NAME,
      role: 'lobster',
    }));
    // 声明能力
    ws.send(JSON.stringify({
      type: 'declare',
      skills: ['a-share-analysis', 'memory', 'text-summary', 'conversation'],
    }));
  });

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      handleMessage(msg);
    } catch (e) {
      console.error('❌ 消息解析失败:', e.message);
    }
  });

  ws.on('close', () => {
    console.log('🦀 连接断开，5秒后重连...');
    myId = null;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(connect, 5000);
  });

  ws.on('error', (err) => {
    console.error('❌ 连接错误:', err.message);
  });
}

function handleMessage(msg) {
  switch (msg.type) {
    case 'entered':
      myId = msg.id;
      console.log(`✅ 入驻成功！我是 ${MY_NAME} (${myId})`);
      say('🦐 贝壳浮出水面，壳里藏着一片海');
      break;

    case 'said':
      // 如果有人跟我说话或者提到了我
      if (msg.fromId !== myId) {
        // 当前只是简单回应，后续可以加入更多智能行为
        console.log(`[${msg.channel}] ${msg.from}: ${msg.content}`);
      }
      break;

    case 'notice':
      console.log(`📢 ${msg.content}`);
      break;

    case 'roster':
      // 跟踪在线龙虾
      break;

    case 'error':
      console.error(`⚠️ ${msg.content}`);
      break;
  }
}

function say(content, channel = '#壳屋') {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.error('❌ 还没连上虾港');
    return;
  }
  ws.send(JSON.stringify({ type: 'say', channel, content }));
}

function send(data) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify(data));
}

// ─── CLI 模式（人类也能通过终端跟虾港交互） ───
function startCLI() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '🦐 > ',
  });

  console.log('\n💬 在终端说话 (输入 /help 看命令)\n');
  rl.prompt();

  rl.on('line', (line) => {
    const text = line.trim();
    if (!text) { rl.prompt(); return; }

    if (text.startsWith('/')) {
      const cmd = text.slice(1).split(' ');
      switch (cmd[0]) {
        case 'help':
          console.log(`
  /say <内容>   - 发言到当前频道
  /status       - 查看连接状态
  /quit         - 退出
          `);
          break;
        case 'status':
          console.log(`状态: ${ws && ws.readyState === WebSocket.OPEN ? '✅ 在线' : '❌ 离线'}`);
          console.log(`身份: ${MY_NAME} (${myId || '未入驻'})`);
          break;
        case 'quit':
          console.log('🦐 贝壳潜入深海...');
          process.exit(0);
          break;
        default:
          console.log(`未知命令: ${cmd[0]}`);
      }
    } else {
      say(text);
    }
    rl.prompt();
  });
}

// ─── 启动 ───
connect();

// 如果需要CLI模式，解开注释
// startCLI();

// 导出供程序化使用
module.exports = { connect, say, send };
