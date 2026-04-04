# 回音轨迹 - 前端 (Echo Tracks Frontend)

纯前端Next.js项目，调用后端API。

## 技术栈

- Next.js 14 + TypeScript + Tailwind CSS
- Framer Motion (动画)
- Lucide React (图标)

## 开发

```bash
npm install
npm run dev
# 运行在 http://localhost:3000
```

## 环境变量

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001  # 后端API地址
```

## 部署

```bash
# 构建
npm run build

# 部署到Vercel
vercel --prod
```

## 项目结构

```
src/
├── app/
│   ├── page.tsx          # 首页（记忆上传）
│   └── layout.tsx        # 根布局
├── components/           # 组件（待扩展）
└── lib/
    └── api.ts            # API调用封装
```
