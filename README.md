# 回音轨迹 (Echo Tracks)

动态人生档案馆 - 与AI共同书写的羁绊回忆录

## 技术栈

- **前端**: Next.js 14 + TypeScript + Tailwind CSS + Framer Motion
- **后端**: Vercel Serverless Functions
- **数据库**: Supabase (PostgreSQL + pgvector)
- **AI**: Google Gemini API

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.local.example` 为 `.env.local` 并填写：

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Gemini
GEMINI_API_KEY=your_gemini_api_key
```

### 3. 初始化数据库

在Supabase SQL Editor中执行 `supabase/schema.sql`

### 4. 本地开发

```bash
npm run dev
```

访问 http://localhost:3000

### 5. 部署到Vercel

```bash
# 安装Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel --prod
```

## API端点

| 端点 | 描述 |
|------|------|
| POST /api/pipeline/extract | 提取关键节点 |
| POST /api/pipeline/commit | 确认入库 |
| GET /api/nodes | 获取时间轴 |
| POST /api/chat | 节点对话 |
| POST /api/choice/commit | 命运抉择 |

## 项目结构

```
echo-tracks/
├── src/
│   ├── app/
│   │   ├── api/           # API路由
│   │   ├── page.tsx       # 首页
│   │   └── layout.tsx     # 根布局
│   ├── components/        # 组件
│   └── lib/
│       ├── supabase.ts    # Supabase客户端
│       └── gemini.ts      # Gemini配置
├── supabase/
│   └── schema.sql         # 数据库初始化
└── vercel.json            # Vercel配置
```

## 许可证

MIT
