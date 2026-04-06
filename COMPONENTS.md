# Echo Tracks 组件文档

> 项目组件维护手册 - 用于代码导航和维护

---

## 📁 目录结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   ├── m-test/            # M-test 测试页面
│   └── page.tsx           # 主页面
├── components/            # React 组件
├── hooks/                 # 自定义 Hooks
├── lib/                   # 工具库
└── types/                 # TypeScript 类型
```

---

## 🎨 UI 组件 (src/components/)

### 核心对话组件

| 组件 | 文件路径 | 功能描述 | 主要依赖 |
|------|----------|----------|----------|
| **AIDialog** | `src/components/AIDialog.tsx` | AI 对话展示框，集成 ECG 情绪波形 | EmotionWave, EmotionWaveIndicator |
| **UserInput** | `src/components/UserInput.tsx` | 用户输入框组件 | - |
| **DialogueTags** | `src/components/DialogueTags.tsx` | 对话提示标签环绕 | - |
| **FateChoice** | `src/components/FateChoice.tsx` | 命运抉择 UI（拥抱遗憾/逆天改命） | ParticleReassemble |

### 人物系统组件 (Phase 2)

| 组件 | 文件路径 | 功能描述 | 主要依赖 |
|------|----------|----------|----------|
| **CharacterCard** | `src/components/CharacterCard.tsx` | ⭐ 人物卡片（玻璃拟态） | framer-motion |
| **CharacterDetailModal** | `src/components/CharacterDetailModal.tsx` | ⭐ 人物详情弹窗 | framer-motion |
| **CharacterSwitcher** | `src/components/CharacterSwitcher.tsx` | ⭐ 人物切换器（Story页面） | framer-motion |
| **PersonalityTest** | `src/components/PersonalityTest.tsx` | ⭐ 5题性格测试组件 | framer-motion |
| **StepIndicator** | `src/components/StepIndicator.tsx` | ⭐ 步骤指示器 | framer-motion |
| **ProfileSetup** | `src/components/ProfileSetup.tsx` | ⭐ 人物设定（名称+头像+文件） | - |
| **CreateSuccess** | `src/components/CreateSuccess.tsx` | ⭐ 创建成功页 | framer-motion |

### 情绪与氛围组件

| 组件 | 文件路径 | 功能描述 | 主要依赖 |
|------|----------|----------|----------|
| **EmotionWave** | `src/components/EmotionWave.tsx` | ⭐ ECG 心电图波形情绪显示 | Canvas API |
| **EmotionPulse** | `src/components/EmotionPulse.tsx` | 💀 已废弃 - 心跳脉冲效果（被 EmotionWave 替代） | - |
| **DynamicAtmosphere** | `src/components/DynamicAtmosphere.tsx` | 动态背景氛围系统（8种情绪主题） | useResponsive |
| **FluidBackground** | `src/components/FluidBackground.tsx` | 💀 已废弃 - 流体背景（被 DynamicAtmosphere 替代） | Canvas API |
| **ParticleBackground** | `src/components/ParticleBackground.tsx` | 粒子背景效果 | - |

### Story/时间轴组件

| 组件 | 文件路径 | 功能描述 | 主要依赖 |
|------|----------|----------|----------|
| **StoryCarousel** | `src/components/StoryCarousel.tsx` | Story 页面 3D 轮播 | NodeIcon |
| **NodePreview** | `src/components/NodePreview.tsx` | ⭐ 节点预览/确认弹窗（放大+前情介绍） | NodeIcon |
| **NodeIconGenerator** | `src/components/NodeIconGenerator.tsx` | 节点图标生成器（Canvas/ComfyUI预留） | Canvas API |
| **ParticleNodeTimeline** | `src/components/ParticleNodeTimeline.tsx` | 3D 粒子球时间轴 | Three.js, React Three Fiber |
| **HorizontalTimeline** | `src/components/HorizontalTimeline.tsx` | 横向时间轴 | - |
| **MemoryNode** | `src/components/MemoryNode.tsx` | 记忆节点卡片 | - |
| **SandNode** | `src/components/SandNode.tsx` | 沙漏节点效果 | - |

### Memory/输入组件

| 组件 | 文件路径 | 功能描述 | 主要依赖 |
|------|----------|----------|----------|
| **RadarChart** | `src/components/RadarChart.tsx` | 六维性格雷达图 | - |
| **TranslucentContainer** | `src/components/TranslucentContainer.tsx` | 半透明冰块容器（文件上传） | - |
| **PipelineCalibration** | `src/components/PipelineCalibration.tsx` | AI 提取节点校准界面 | - |

### 导航与布局

| 组件 | 文件路径 | 功能描述 | 主要依赖 |
|------|----------|----------|----------|
| **Navigation** | `src/components/Navigation.tsx` | 基础导航栏 | useTheme |
| **ResponsiveNav** | `src/components/ResponsiveNav.tsx` | ⭐ 响应式导航（移动端汉堡菜单） | useResponsive |
| **Layout** | `src/components/Layout.tsx` | 页面布局容器 | Navigation, ThemeProvider |
| **ThemeProvider** | `src/components/ThemeProvider.tsx` | 主题提供者（深色/浅色） | - |

### 特效组件

| 组件 | 文件路径 | 功能描述 | 主要依赖 |
|------|----------|----------|----------|
| **ParticleReassemble** | `src/components/ParticleReassemble.tsx` | 粒子重组特效（命运抉择） | Canvas API |
| **GlassButton** | `src/components/GlassButton.tsx` | 玻璃拟态按钮 | - |
| **GlassDialog** | `src/components/GlassDialog.tsx` | 玻璃拟态对话框 | - |

### 性能优化组件

| 组件 | 文件路径 | 功能描述 | 主要依赖 |
|------|----------|----------|----------|
| **LazyContainer** | `src/components/LazyContainer.tsx` | 懒加载容器 | useLazyLoad |

---

## ⚡ 自定义 Hooks (src/hooks/)

| Hook | 文件路径 | 功能描述 | 主要导出 |
|------|----------|----------|----------|
| **useResponsive** | `src/hooks/useResponsive.ts` | 响应式布局 Hook | useResponsive, useSwipe, getBreakpoint |
| **usePerformance** | `src/hooks/usePerformance.ts` | 性能监控与优化 | usePerformanceMonitor, useLazyLoad, useDebounce, useThrottle, memoize |

---

## 🛠️ 工具库 (src/lib/)

### API 与数据处理

| 库 | 文件路径 | 功能描述 | 主要导出 |
|----|----------|----------|----------|
| **emotion** | `src/lib/emotion.ts` | ⭐ 情绪分析客户端 | analyzeEmotion, analyzeEmotionsBatch, calculateBPM, EMOTION_COLORS |
| **chat** | `src/lib/chat.ts` | 对话 API 封装 | sendChatMessage, fetchNode |
| **pipeline** | `src/lib/pipeline.ts` | 数据流水线 | extractNodes, commitNodes |
| **api** | `src/lib/api.ts` | 基础 API 配置 | - |

### 存储与数据库

| 库 | 文件路径 | 功能描述 | 主要导出 |
|----|----------|----------|----------|
| **localDb** | `src/lib/localDb.ts` | ⭐ IndexedDB 本地存储封装 | localDb (单例) |
| **memoryStore** | `src/lib/memoryStore.ts` | 内存存储（后端使用） | memoryStore |
| **supabase** | `src/lib/supabase.ts` | Supabase 客户端 | supabaseClient |

### AI 与向量

| 库 | 文件路径 | 功能描述 | 主要导出 |
|----|----------|----------|----------|
| **qwen** | `src/lib/qwen.ts` | 通义千问 API 封装 | generateResponse, generateEmbedding |
| **embedding** | `src/lib/embedding.ts` | 向量生成 | generateEmbedding |
| **realtime** | `src/lib/realtime.ts` | Supabase Realtime | subscribeToUnlocks |

### 数据库操作（已废弃，保留兼容性）

| 库 | 文件路径 | 功能描述 | 状态 |
|----|----------|----------|------|
| **db** | `src/lib/db.ts` | 数据库操作 | 💀 已废弃，使用 localDb |

---

## 🔌 API 路由 (src/app/api/)

| 路由 | 文件路径 | 方法 | 功能描述 |
|------|----------|------|----------|
| **/api/emotion/analyze** | `src/app/api/emotion/analyze/route.ts` | POST | ⭐ 实时情绪分析 |
| **/api/emotion/analyze** | `src/app/api/emotion/analyze/route.ts` | GET | 健康检查 |
| **/api/chat** | `src/app/api/chat/route.ts` | POST | AI 对话生成 |
| **/api/pipeline/extract** | `src/app/api/pipeline/extract/route.ts` | POST | 文本提取记忆节点 |
| **/api/pipeline/commit** | `src/app/api/pipeline/commit/route.ts` | POST | 💀 已废弃（改用 localDb） |
| **/api/choice/commit** | `src/app/api/choice/commit/route.ts` | POST | 命运抉择提交 |
| **/api/nodes** | `src/app/api/nodes/route.ts` | GET | 💀 已废弃（改用 localDb） |
| **/api/node/[id]** | `src/app/api/node/[id]/route.ts` | GET | 💀 已废弃（改用 localDb） |

---

## 🔗 组件依赖关系图

```
页面层级:
page.tsx
├── DynamicAtmosphere (全局背景)
├── Navigation/ResponsiveNav
├── StoryCarousel
│   ├── NodeIconGenerator
│   └── NodePreview (点击后)
│       └── NodeIconGenerator
├── AIDialog
│   ├── EmotionWave (背景波形)
│   └── EmotionWaveIndicator (情绪指示)
├── RadarChart
├── TranslucentContainer
└── PipelineCalibration
```

---

## 📝 代码注释规范

### 组件头部注释模板

```typescript
// ============================================================
// [组件名]: [功能简述]
// [功能详细描述]
//
// 文件位置: src/components/[ComponentName].tsx
// 主要依赖: [依赖1], [依赖2]
// 被引用: [引用组件1], [引用组件2]
//
// Props:
//   - prop1: 描述
//   - prop2: 描述
//
// 使用示例:
//   <ComponentName prop1="value" />
//
// 维护记录:
//   - 2026-04-06: 创建
//   - 2026-04-07: 添加 xxx 功能
// ============================================================
```

### Hook 头部注释模板

```typescript
// ============================================================
// [useHookName]: [功能简述]
// [功能详细描述]
//
// 文件位置: src/hooks/[useHookName].ts
// 返回: { field1, field2, method1 }
//
// 使用示例:
//   const { field1, method1 } = useHookName();
// ============================================================
```

### 函数注释模板

```typescript
/**
 * 函数功能描述
 * @param param1 - 参数1描述
 * @param param2 - 参数2描述
 * @returns 返回值描述
 * @throws 异常描述
 * 
 * @example
 * const result = functionName(arg1, arg2);
 */
```

---

## ⚠️ 废弃组件清单

以下组件已废弃，请勿在新代码中使用：

| 组件 | 替代组件 | 废弃原因 |
|------|----------|----------|
| FluidBackground | DynamicAtmosphere | 功能重复，DynamicAtmosphere 更完整 |
| EmotionPulse | EmotionWave | 视觉效果不佳，改用 ECG 波形 |
| /api/pipeline/commit | localDb.commitMemoryBatch | 改为本地存储 |
| /api/nodes | localDb.getAllNodes | 改为本地存储 |
| /api/node/[id] | localDb.getNodeById | 改为本地存储 |

---

## 🎯 开发规范

### 添加新组件

1. 在 `src/components/` 创建组件文件
2. 添加标准头部注释
3. 更新此文档（COMPONENTS.md）
4. 编写单元测试（`tests/components/[Name].test.tsx`）
5. 运行 `npm run test:run` 确保测试通过

### 修改现有组件

1. 检查依赖关系（参考此文档）
2. 更新组件头部注释的"维护记录"
3. 更新相关测试
4. 如修改 Props，同步更新此文档

---

## 📊 测试覆盖

| 模块 | 测试文件 | 测试数量 |
|------|----------|----------|
| components | tests/components/*.test.tsx | 120+ |
| hooks | tests/hooks/*.test.ts | 25+ |
| api | tests/api/*.test.ts | 17+ |
| lib | tests/lib/*.test.ts | 20+ |

---

**最后更新**: 2026-04-06  
**版本**: v0.3.3  
**维护者**: Echo Tracks Team
