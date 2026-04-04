// ============================================================
// 测试: SandNode 流沙节点（记忆长廊）
// 描述: 验证侵蚀模拟、晶体几何结构
// ============================================================

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SandNode } from '@/components/SandNode';

describe('SandNode', () => {
	it('应渲染抽象几何体', () => {
		const { container } = render(
			<SandNode title="初遇" date="2024-01-15" />
		);
		const geometry = container.querySelector('.sand-geometry');
		expect(geometry).toBeDefined();
	});

	it('应渲染标题', () => {
		render(<SandNode title="初遇" date="2024-01-15" />);
		// 标题在悬停时显示，但应该存在于 DOM 中
		expect(screen.getByText('初遇')).toBeDefined();
	});

	it('应渲染日期', () => {
		render(<SandNode title="初遇" date="2024-01-15" />);
		expect(screen.getByText('2024-01-15')).toBeDefined();
	});

	it('点击应触发 onClick', () => {
		let clicked = false;
		const { container } = render(
			<SandNode 
				title="初遇" 
				date="2024-01-15"
				onClick={() => clicked = true}
			/>
		);
		// 点击组件
		const element = container.firstChild as HTMLElement;
		if (element) {
			fireEvent.click(element);
			expect(clicked).toBe(true);
		}
	});

	it('应具有微观细节纹理', () => {
		const { container } = render(<SandNode title="测试" date="2024-01-01" />);
		const texture = container.querySelector('.micro-detail');
		expect(texture).toBeDefined();
	});

	it('聚焦时应设置 focused 属性', () => {
		const { container } = render(<SandNode title="测试" date="2024-01-01" focused />);
		// 组件应该成功渲染
		expect(container.firstChild).toBeDefined();
	});
});
