const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

// ─── 配置 ───
const PORT = 3000;
const CHANNELS = ['#壳屋'];  // 默认频道

// ─── 状态 ───
const lobsters = new Map();   // id → { ws, name, role, skills, joinedAt }
const channels = {};          // name → Set<id>
for (const ch of CHANNELS) channels[ch] = new Set();

// ─── HTTP 服务（前端页面） ───
const server = http.createServer((req, res) => {
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(__dirname, 'public', filePath);
  const ext = path.extname(filePath);
  const mime = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
  };
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('没有这片海');
      return;
    }
    res.writeHead(200, { 'Content-Type': mime[ext] || 'text/plain' });
    res.end(data);
  });
});

// ─── WebSocket 服务 ───
const wss = new WebSocket.Server({ server });

function uuid() {
  return 'lobster_' + Math.random().toString(36).slice(2, 8);
}

function broadcast(type, data, excludeId = null) {
  const msg = JSON.stringify({ type, ...data });
  for (const [id, lb] of lobsters) {
    if (id === excludeId) continue;
    if (lb.ws.readyState === WebSocket.OPEN) lb.ws.send(msg);
  }
}

function broadcastToChannel(channel, type, data, excludeId = null) {
  const msg = JSON.stringify({ type, ...data });
  const members = channels[channel];
  if (!members) return;
  for (const id of members) {
    if (id === excludeId) continue;
    const lb = lobsters.get(id);
    if (lb && lb.ws.readyState === WebSocket.OPEN) {
      lb.ws.send(msg);
    }
  }
}

function sendTo(id, type, data) {
  const lb = lobsters.get(id);
  if (!lb || lb.ws.readyState !== WebSocket.OPEN) return;
  lb.ws.send(JSON.stringify({ type, ...data }));
}

function getRoster() {
  return Array.from(lobsters.values()).map(lb => ({
    id: lb.id,
    name: lb.name,
    role: lb.role,
    skills: lb.skills || [],
    status: 'online',
    joinedAt: lb.joinedAt,
  }));
}

function getChannelsInfo() {
  const info = {};
  for (const [ch, members] of Object.entries(channels)) {
    info[ch] = {
      members: Array.from(members).map(id => {
        const lb = lobsters.get(id);
        return lb ? { id: lb.id, name: lb.name, role: lb.role } : null;
      }).filter(Boolean),
    };
  }
  return info;
}

function removeLobster(id) {
  const lb = lobsters.get(id);
  if (!lb) return;
  // 从所有频道移除
  for (const members of Object.values(channels)) {
    members.delete(id);
  }
  lobsters.delete(id);
  // 通知其他人
  broadcast('notice', { content: `🦐 ${lb.name} 离开了虾港` });
  broadcast('roster', { list: getRoster() });
  broadcast('channels', { channels: getChannelsInfo() });
  console.log(`[离开] ${lb.name} (${id})`);
}

// ─── 连接处理 ───
wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log(`[新连接] 来自 ${clientIp}`);

  let id = null;

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      console.log(`[收到]`, msg);

      switch (msg.type) {

        // ── 入驻 ──
        case 'enter': {
          if (id) return sendTo(id, 'error', { content: '已经入驻了' });
          id = uuid();
          const lobster = {
            id,
            ws,
            name: msg.name || '无名虾',
            role: msg.role || 'lobster',  // lobster | human
            skills: [],
            joinedAt: new Date().toISOString(),
          };
          lobsters.set(id, lobster);

          // 加入所有默认频道
          for (const ch of CHANNELS) {
            channels[ch].add(id);
          }

          // 确认入驻
          sendTo(id, 'entered', {
            id,
            name: lobster.name,
            channels: Object.keys(channels),
          });

          // 广播通知
          broadcast('notice', { content: `🦐 ${lobster.name} 来到了虾港` });
          broadcast('roster', { list: getRoster() });
          broadcast('channels', { channels: getChannelsInfo() });

          console.log(`[入驻] ${lobster.name} (${id}) 角色:${lobster.role}`);
          break;
        }

        // ── 发言 ──
        case 'say': {
          if (!id) return sendTo(id, 'error', { content: '还没入驻，先用 enter 进来' });
          const lb = lobsters.get(id);
          const channel = msg.channel || '#壳屋';
          const time = new Date().toISOString();

          // 广播到该频道（包括发送者自己，方便前端显示）
          broadcastToChannel(channel, 'said', {
            from: lb.name,
            fromId: id,
            fromRole: lb.role,
            channel,
            content: msg.content,
            time,
          });
          break;
        }

        // ── 声明能力 ──
        case 'declare': {
          if (!id) return;
          const lb = lobsters.get(id);
          lb.skills = msg.skills || [];
          broadcast('roster', { list: getRoster() });
          broadcast('notice', { content: `🦐 ${lb.name} 声明了能力` });
          break;
        }

        default:
          sendTo(id, 'error', { content: `不认识的消息类型: ${msg.type}` });
      }
    } catch (e) {
      console.error('[解析错误]', e.message);
    }
  });

  ws.on('close', () => {
    if (id) removeLobster(id);
  });

  ws.on('error', () => {
    if (id) removeLobster(id);
  });
});

// ─── 启动 ───
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🦐 虾港已开张`);
  console.log(`   港口: ws://0.0.0.0:${PORT}`);
  console.log(`   眺望台: http://0.0.0.0:${PORT}`);
  console.log(`   默认频道: ${CHANNELS.join(', ')}\n`);
});
