# Echo Tracks 本地存储测试指南

## 快速开始

### 1. 启动开发服务器

```bash
cd echo-tracks-frontend

# 确保依赖已安装
npm install

# 配置环境变量（填入你的 Qwen API Key）
cp .env.local.example .env.local
# 编辑 .env.local，设置 QWEN_API_KEY=your_key_here

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000

---

## 测试场景

### 场景 1: 基础文件上传测试

**步骤**:
1. 打开浏览器访问 `http://localhost:3000`
2. 在 Memory 页面，找到一个 TXT 文件或创建测试文本：

```txt
2025年1月15日
今天和他在咖啡厅见面。他看起来有点疲惫，但还是很认真地听我说话。
我抱怨了工作上的不顺，他没有给建议，只是静静地陪着我。

2025年2月3日
大吵了一架。他说我总是不考虑他的感受，我觉得他太冷漠。
最后我们不欢而散，整整一周没有联系。

2025年2月14日
情人节，他发来一条消息："要不要出来走走？"
我们去了江边，谁也没提之前的事，就像什么都没发生过。
```

3. 拖拽文件到上传区域，或粘贴文本
4. 点击"提取记忆节点"

**预期结果**:
- 显示提取的节点列表（2-3个节点）
- 每个节点显示：日期、核心事件、显著性分数
- 显示人物性格基座分析

---

### 场景 2: 节点校准与提交

**步骤**:
1. 在提取结果页面，尝试以下操作：
   - 删除某个节点（点击删除按钮）
   - 修改节点的日期或描述
   - 调整显著性分数
2. 点击"确认提交"

**预期结果**:
- 显示"提交成功"
- 跳转到 Story 页面
- 时间轴上显示提交的记忆节点

---

### 场景 3: 验证 IndexedDB 存储

**Chrome 开发者工具**:
1. 按 `F12` 打开开发者工具
2. 切换到 **Application** 标签
3. 左侧找到 **Storage** → **IndexedDB**
4. 展开 **EchoTracksDB**

**验证内容**:
```
EchoTracksDB
├── nodes (对象存储)
│   └── 应该包含你提交的节点记录
├── clues (对象存储)
│   └── 如果有线索，会显示在这里
├── branches (对象存储)
│   └── IF线分支（如有逆天改命操作）
└── profile (对象存储)
    └── 人物画像数据
```

**查看数据**:
- 点击 `nodes` → 查看存储的节点详情
- 确认字段完整：`node_id`, `event_date`, `core_event`, `npc_state` 等

---

### 场景 4: 刷新页面测试持久性

**步骤**:
1. 提交节点后，记录节点的标题
2. 刷新浏览器页面（F5）
3. 进入 Story 页面

**预期结果**:
- 节点仍然显示在时间轴上
- 数据没有丢失

---

### 场景 5: 节点对话测试

**步骤**:
1. 在 Story 页面，点击一个记忆节点
2. 进入 Dialogue 页面
3. 观察 AI 开场白
4. 发送几条消息进行对话
5. 尝试触发线索解锁（如有设置）

**预期结果**:
- AI 根据节点数据生成合适的开场白
- 对话上下文连贯
- 数据从 IndexedDB 正确读取

---

### 场景 6: 清除数据测试

**步骤**:
1. 确认 IndexedDB 中有数据
2. 清除站点数据：
   - F12 → Application → Storage → Clear site data
   - 或浏览器设置 → 隐私 → 清除浏览数据
3. 刷新页面

**预期结果**:
- Story 页面显示为空（没有节点）
- IndexedDB 中 `nodes` 对象存储为空

---

## 自动化测试

### 运行测试套件

```bash
# 运行所有测试
npm run test:run

# 只运行 IndexedDB 测试
npm run test:run -- tests/lib/localDb.test.ts

# 运行特定组件测试
npm run test:run -- tests/components/PipelineCalibration.test.tsx
```

### 关键测试用例

```bash
# 测试本地存储核心功能
npm run test:run -- tests/lib/localDb.test.ts

# 预期输出:
# ✓ 应插入新节点并返回带ID的节点
# ✓ 应获取所有节点
# ✓ 应通过ID获取节点
```

---

## 常见问题排查

### 问题 1: 提取节点失败

**现象**: 点击"提取"后无响应或报错

**排查**:
```bash
# 检查 API Key 是否配置
cat .env.local | grep QWEN

# 检查后端日志
# 浏览器 Network 标签查看 /api/pipeline/extract 请求
```

### 问题 2: IndexedDB 无法访问

**现象**: 页面空白，控制台报错

**可能原因**:
- 浏览器隐私模式（某些浏览器限制 IndexedDB）
- 存储配额已满

**解决**:
```javascript
// 浏览器控制台测试 IndexedDB 可用性
indexedDB.open('EchoTracksDB').onsuccess = (e) => {
  console.log('IndexedDB 可用:', e.target.result);
};
```

### 问题 3: 刷新后数据丢失

**现象**: 提交成功但刷新后节点消失

**排查步骤**:
1. F12 → Application → IndexedDB
2. 检查 `nodes` 是否有数据
3. 检查控制台是否有错误日志

### 问题 4: 跨标签页数据不同步

**现象**: 在标签页 A 提交节点，标签页 B 看不到

**说明**: 这是正常行为，IndexedDB 需要在页面刷新后重新读取

**解决**: 在标签页 B 刷新页面即可

---

## 性能测试

### 大数据量测试

创建包含 50+ 日期的测试文本：

```javascript
// 生成测试数据
let text = '';
for (let i = 1; i <= 50; i++) {
  text += `2025年1月${i}日\n今天发生了一些事情，感觉${i % 2 === 0 ? '开心' : '难过'}。\n\n`;
}
console.log(text); // 复制到文本文件
```

**预期**:
- 提取时间 < 30 秒
- IndexedDB 存储成功
- 时间轴渲染流畅

---

## 测试检查清单

- [ ] 文件上传正常
- [ ] AI 提取节点成功
- [ ] 校准界面可编辑节点
- [ ] 提交后数据存入 IndexedDB
- [ ] Story 页面显示节点
- [ ] 刷新页面数据不丢失
- [ ] 对话功能读取节点数据
- [ ] 清除数据后为空

全部通过 ✅ 则本地存储功能正常！
