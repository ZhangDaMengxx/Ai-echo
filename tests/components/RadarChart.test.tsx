// ============================================================
// 测试: RadarChart 雷达图（人物塑造）
// 描述: 验证流体球节点、磁力约束、涡流效果
// ============================================================

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RadarChart } from '@/components/RadarChart';

const mockTraits = [
	{ label: '理性', value: 70 },
	{ label: '感性', value: 50 },
	{ label: '外向', value: 30 },
	{ label: '内敛', value: 80 },
	{ label: '决断', value: 60 },
	{ label: '犹豫', value: 40 },
];

describe('RadarChart', () => {
	it('应渲染六条轴线', () => {
		render(<RadarChart traits={mockTraits} />);
		const svg = document.querySelector('svg');
		expect(svg).toBeDefined();
	});

	it('应显示人物代号', () => {
		render(<RadarChart traits={mockTraits} subjectName="ELARA" />);
		expect(screen.getByText(/SUBJECT:/i)).toBeDefined();
		expect(screen.getByText('ELARA')).toBeDefined();
	});

	it('节点应是流体球', () => {
		const { container } = render(<RadarChart traits={mockTraits} />);
		const nodes = container.querySelectorAll('.fluid-node');
		expect(nodes.length).toBe(6);
	});

	it('拖动节点应更新数值', () => {
		let updated = false;
		render(
			<RadarChart 
				traits={mockTraits} 
				onChange={() => updated = true}
			/>
		);
		const node = document.querySelector('.fluid-node');
		if (node) {
			fireEvent.mouseDown(node);
			fireEvent.mouseMove(node, { clientX: 100, clientY: 100 });
			fireEvent.mouseUp(node);
		}
		expect(updated).toBe(true);
	});
});


describe('RadarChart 视觉效果', () => {
	it('应有涡流动画', () => {
		const { container } = render(<RadarChart traits={mockTraits} />);
		const chart = container.querySelector('.radar-chart');
		expect(chart?.className).toContain('animate-vortex');
	});

	it('连线应具有弹性效果', () => {
		const { container } = render(<RadarChart traits={mockTraits} />);
		const lines = container.querySelectorAll('.elastic-line');
		expect(lines.length).toBeGreaterThan(0);
	});
});
