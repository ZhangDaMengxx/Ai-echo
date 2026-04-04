// ============================================================
// 测试: StoryCarousel 记忆长廊轮播
// 描述: 验证节点渲染、切换、点击交互
// ============================================================

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StoryCarousel } from '@/components/StoryCarousel';

const mockNodes = [
	{ id: '1', title: '初遇', date: '2024-01-15', description: '那个下雨的午后' },
	{ id: '2', title: '误会', date: '2024-03-20', description: '沉默的晚餐' },
	{ id: '3', title: '和解', date: '2024-06-10', description: '天台上的对话' },
];

describe('StoryCarousel', () => {
	it('应渲染所有节点', () => {
		render(
			<StoryCarousel
				nodes={mockNodes}
				onNodeClick={() => {}}
			/>
		);
		expect(screen.getByText('初遇')).toBeDefined();
		expect(screen.getByText('误会')).toBeDefined();
		expect(screen.getByText('和解')).toBeDefined();
	});

	it('应显示节点日期', () => {
		render(
			<StoryCarousel
				nodes={mockNodes}
				onNodeClick={() => {}}
			/>
		);
		expect(screen.getByText('2024-01-15')).toBeDefined();
	});

	it('点击侧边节点应切换到该节点', () => {
		let clickedNodeId = '';
		render(
			<StoryCarousel
				nodes={mockNodes}
				onNodeClick={(node) => { clickedNodeId = node.id; }}
			/>
		);
		// 点击第二个节点（默认第一个是active，点击第二个会切换activeIndex）
		fireEvent.click(screen.getByText('误会'));
		expect(clickedNodeId).toBe(''); // 侧边节点点击只切换索引，不触发 onNodeClick
	});
});
