# 修复记录: AI对话人物画像接入

> 日期: 2026-04-06  
> 类型: Bug修复  
> 影响范围: 对话系统

---

## 问题描述

AI对话系统使用了硬编码的人物画像：
```typescript
userProfile: { base_archetype: { style: '克制内敛', logic: '理性压抑型' } }
```

这导致无论用户选择哪个人物，AI都按照固定的"克制内敛/理性压抑型"风格回应。

---

## 修复内容

### 1. src/lib/chat.ts
- 添加 `ChatParams` 接口，包含 `characterId` 可选参数
- `sendChatMessage` 函数现在会根据 `characterId` 从 `localDb` 获取人物画像
- 如果获取失败，使用默认值（温和平衡/理性感性并重）

### 2. src/app/api/chat/route.ts
- 添加 `UserProfile` 类型定义
- API 现在正确接收并使用传入的 `userProfile` 参数

### 3. src/app/story/page.tsx
- 所有调用 `sendChatMessage` 的地方都传入了 `characterId: character?.id`
- 共修改3处调用

---

## 数据流

```
用户对话
  ↓
story/page.tsx (传入 character?.id)
  ↓
chat.ts sendChatMessage (从 localDb 获取画像)
  ↓
/api/chat (接收 profile 并传给 buildSystemPrompt)
  ↓
Qwen API (使用真实人物画像生成回复)
```

---

## 测试建议

1. 创建不同性格的人物（如：活泼开朗 vs 沉稳内敛）
2. 与不同人物对话，观察AI回复风格是否符合人设
3. 切换人物后，对话风格应立即切换

---

## 后续优化

- [ ] 添加画像加载失败的降级UI提示
- [ ] 考虑缓存画像数据避免重复查询
