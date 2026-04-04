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
