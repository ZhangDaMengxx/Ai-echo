# Echo Tracks 部署指南

## 快速部署到 Vercel

### 1. 准备工作

```bash
# 确保在 frontend 目录
cd echo-tracks-frontend

# 安装依赖
npm install

# 配置环境变量
cp .env.local.example .env.local
# 编辑 .env.local，填入你的 QWEN_API_KEY
```

### 2. 本地测试

```bash
# 开发模式
npm run dev

# 测试
npm run test:run

# 构建
npm run build
```

### 3. 部署到 Vercel

#### 方式一：Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel --prod
```

#### 方式二：Git 集成

1. 将代码推送到 GitHub/GitLab
2. 在 Vercel 导入项目
3. 配置环境变量 `QWEN_API_KEY`
4. 自动部署

### 4. 环境变量配置

| 变量名 | 必需 | 说明 |
|--------|------|------|
| `QWEN_API_KEY` | ✅ | 阿里云 DashScope API Key |

### 5. 部署后验证

访问部署地址，验证以下功能：
- [ ] 人物列表页显示正常
- [ ] 创建新人物流程完整
- [ ] 5题性格测试可跳过
- [ ] 人物详情弹窗显示正常
- [ ] Story页面人物切换器可用
- [ ] 文件上传和节点提取
- [ ] 节点显示在时间轴
- [ ] 对话功能正常
- [ ] 数据在浏览器本地存储（IndexedDB）
- [ ] 数据导出/导入功能正常

### 6. 隐私说明

**数据存储位置**:
- 所有用户数据存储在浏览器 IndexedDB 中
- 服务器不存储任何个人数据
- 仅调用 Qwen API 进行 AI 处理

**清除数据**:
用户可以通过浏览器开发者工具清除 IndexedDB 数据，或按以下快捷键：
- Chrome: F12 → Application → Storage → Clear site data
