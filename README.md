# 回音轨迹 - 前端 (Echo Tracks Frontend)

## 启动顺序（重要！）

### 1. 先启动后端 (Port 3001)
```bash
cd echo-tracks-backend
npm run dev
# 等待显示: Ready on http://localhost:3001
```

### 2. 再启动前端 (Port 3000)
```bash
cd echo-tracks-frontend
npm run dev
# 自动打开: http://localhost:3000
```

## 端口说明

| 服务 | 端口 | 地址 |
|------|------|------|
| 前端 | 3000 | http://localhost:3000 |
| 后端API | 3001 | http://localhost:3001 |

## 环境变量

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 技术栈

- Next.js 14 + TypeScript + Tailwind CSS
- Framer Motion (动画)
- Lucide React (图标)
- IndexedDB (本地数据存储)

## 功能特性

- **AI人物系统**: 创建多个人物，每个独立的数据和记忆
- **心理学测试**: 5题性格测试生成人物画像
- **记忆管理**: 文件上传、节点提取、校准
- **Story轮播**: 3D轮播展示记忆节点
- **沉浸对话**: AI对话系统，支持线索解锁
- **数据导出**: JSON格式备份和恢复
