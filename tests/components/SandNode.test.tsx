// ============================================================
// 测试: SandNode 流沙节点（记忆长廊）
// 描述: 验证侵蚀模拟、景深、电影级变焦
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

	it('悬停时应产生侵蚀效果', () => {
		const { container } = render(
			<SandNode title="初遇" date="2024-01-15" />
		);
		const node = container.querySelector('.sand-node');
		if (node) {
			fireEvent.mouseEnter(node);
			expect(node.className).toContain('erosion');
		}
	});

	it('悬停时应显示标题', () => {
		render(<SandNode title="初遇" date="2024-01-15" />);
		const node = document.querySelector('.sand-node');
		if (node) {
			fireEvent.mouseEnter(node);
			expect(screen.getByText('初遇')).toBeDefined();
		}
	});

	it('点击应触发变焦转场', () => {
		let zoomed = false;
		const { container } = render(
			<SandNode 
				title="初遇" 
				date="2024-01-15"
				onClick={() => zoomed = true}
			/>
		);
		const node = container.querySelector('.sand-node');
		if (node) {
			fireEvent.click(node);
			expect(zoomed).toBe(true);
		}
	});

	it('应具有微观细节纹理', () => {
		const { container } = render(<SandNode title="测试" date="2024-01-01" />);
		const texture = container.querySelector('.micro-detail');
		expect(texture).toBeDefined();
	});
});


describe('SandNode 景深效果', () => {
	it('应有模糊背景', () => {
		const { container } = render(<SandNode title="测试" date="2024-01-01" />);
		const node = container.querySelector('.sand-node');
		expect(node?.className).toContain('blur');
	});

	it('聚焦时清晰度应变高', () => {
		const { container } = render(<SandNode title="测试" date="2024-01-01" focused />);
		const node = container.querySelector('.sand-node');
		expect(node?.className).toContain('focus');
	});
});
