// ============================================================
// EmotionGraph 组件测试
// 功能: 测试情感图谱可视化组件
// ============================================================

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmotionGraph } from '../../src/components/EmotionGraph';

// Mock Canvas
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
	fillRect: vi.fn(),
	clearRect: vi.fn(),
	beginPath: vi.fn(),
	moveTo: vi.fn(),
	lineTo: vi.fn(),
	stroke: vi.fn(),
	fill: vi.fn(),
	arc: vi.fn(),
	closePath: vi.fn(),
	createLinearGradient: vi.fn(() => ({
		addColorStop: vi.fn(),
	})),
	fillText: vi.fn(),
	measureText: vi.fn(() => ({ width: 50 })),
	save: vi.fn(),
	restore: vi.fn(),
	translate: vi.fn(),
	scale: vi.fn(),
})) as any;

describe('EmotionGraph', () => {
	const mockNodes = [
		{ id: '1', emotion: 'calm', intensity: 0.8, date: '2026-01-01' },
		{ id: '2', emotion: 'joyful', intensity: 0.7, date: '2026-01-02' },
		{ id: '3', emotion: 'angry', intensity: 0.9, date: '2026-01-03' },
	];

	const mockEdges = [
		{ source: '1', target: '2', weight: 0.6, resonance: 0.5, daysApart: 1 },
		{ source: '2', target: '3', weight: 0.3, resonance: -0.4, daysApart: 1 },
	];

	it('should render canvas element', () => {
		render(<EmotionGraph nodes={mockNodes} edges={mockEdges} />);
		const canvas = screen.getByTestId('emotion-graph-canvas');
		expect(canvas).toBeInTheDocument();
	});

	it('should display resonance index', () => {
		render(<EmotionGraph nodes={mockNodes} edges={mockEdges} />);
		expect(screen.getByText(/共振指数/i)).toBeInTheDocument();
	});

	it('should display node count', () => {
		render(<EmotionGraph nodes={mockNodes} edges={mockEdges} />);
		expect(screen.getByText(/节点/i)).toBeInTheDocument();
	});

	it('should display edge count', () => {
		render(<EmotionGraph nodes={mockNodes} edges={mockEdges} />);
		expect(screen.getByText(/关联/i)).toBeInTheDocument();
	});

	it('should handle empty data gracefully', () => {
		render(<EmotionGraph nodes={[]} edges={[]} />);
		expect(screen.getByText(/暂无数据/i)).toBeInTheDocument();
	});

	it('should toggle view mode', () => {
		render(<EmotionGraph nodes={mockNodes} edges={mockEdges} />);
		const toggleButton = screen.getByText(/力导向/i);
		fireEvent.click(toggleButton);
		expect(screen.getByText(/时间轴/i)).toBeInTheDocument();
	});

	it('should highlight selected node on click', () => {
		const onNodeSelect = vi.fn();
		render(
			<EmotionGraph 
				nodes={mockNodes} 
				edges={mockEdges} 
				onNodeSelect={onNodeSelect}
			/>
		);
		
		const canvas = screen.getByTestId('emotion-graph-canvas');
		fireEvent.click(canvas, { clientX: 100, clientY: 100 });
	});

	it('should render with clusters', () => {
		const mockClusters = [
			{
				id: 'cluster_1',
				nodes: ['1', '2'],
				dominantEmotion: 'calm',
				avgIntensity: 0.75,
				startDate: '2026-01-01',
				endDate: '2026-01-02',
			},
		];

		render(
			<EmotionGraph 
				nodes={mockNodes} 
				edges={mockEdges}
				clusters={mockClusters}
			/>
		);
		
		expect(screen.getByText(/聚类/i)).toBeInTheDocument();
	});
});
