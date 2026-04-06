# AI人物目录系统设计文档

> 版本: v1.0
> 日期: 2026-04-06
> 状态: 设计方案

---

## 1. 需求概述

### 核心功能
- 支持创建多个人物（AI角色）
- 人物目录展示（头像 + 名称 + 简介）
- 点击切换当前人物
- 每个人物拥有独立的记忆节点、线索、IF线

---

## 2. 数据模型设计

### 2.1 人物实体 (新增)

interface Character {
  id: string;
  name: string;
  slug: string;
  avatar?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  isDefault: boolean;
  stats: {
    nodeCount: number;
    clueCount: number;
    branchCount: number;
    lastInteraction?: string;
  };
}

### 2.2 现有实体扩展
为 MemoryNode、HiddenClue、IfLineBranch、CharacterProfile 添加 character_id 字段

### 2.3 IndexedDB 升级
- DB_VERSION 从 1 升级到 2
- 新增 characters 表
- 现有表添加 character_id 索引

---

## 3. UI设计

### 3.1 导航入口
顶部导航栏显示当前人物头像和名称，点击进入人物目录

### 3.2 人物目录页面
- 人物网格展示
- 创建新人物按钮
- 人物卡片: 头像、名称、记忆数、最后交互

### 3.3 人物卡片
- 玻璃拟态设计
- 60px圆形头像区域
- 支持emoji或图片
- 活跃状态: 发光边框

---

## 4. 实施优先级

| 优先级 | 功能 | 预估工时 |
| P0 | IndexedDB Schema升级 | 2h |
| P0 | Character数据模型 | 1h |
| P0 | 人物数据库操作 | 2h |
| P1 | 当前人物状态管理 | 1h |
| P1 | 人物卡片组件 | 2h |
| P1 | 人物目录页面 | 3h |
| P2 | 创建人物功能 | 2h |
| P2 | 主页面集成 | 2h |
| P3 | 单元测试 | 2h |

总计: 17小时

---

## 5. 关键设计决策

1. 数据隔离: 所有数据通过 character_id 关联
2. 默认人物: 自动创建ELARA作为默认人物
3. 头像方案: 支持emoji和图片
4. 状态持久化: 使用Zustand + localStorage
5. 备份兼容: v1.1导出格式包含人物信息
