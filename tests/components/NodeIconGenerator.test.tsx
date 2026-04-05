// ============================================================
// NodeIconGenerator Tests
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { NodeIcon, generateNodeIconDataURL } from '@/components/NodeIconGenerator';

// Mock canvas
const mockContext = {
	fillRect: vi.fn(),
	beginPath: vi.fn(),
	arc: vi.fn(),
	fill: vi.fn(),
	stroke: vi.fn(),
	moveTo: vi.fn(),
	lineTo: vi.fn(),
	createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
};

beforeEach(() => {
	// @ts-expect-error - Mock canvas
	HTMLCanvasElement.prototype.getContext = vi.fn(() => mockContext);
});

describe('NodeIcon', () => {
	it('应渲染 canvas 元素', () => {
		const { container } = render(
			<NodeIcon
				nodeId="test-node-1"
				emotion="开心"
				salienceScore={8}
				size={120}
			/>
		);

		const canvas = container.querySelector('canvas');
		expect(canvas).toBeTruthy();
	});

	it('应应用正确的尺寸样式', () => {
		const { container } = render(
			<NodeIcon
				nodeId="test-node-2"
				emotion="平静"
				salienceScore={5}
				size={80}
			/>
		);

		const canvas = container.querySelector('canvas');
		expect(canvas?.style.width).toBe('80px');
		expect(canvas?.style.height).toBe('80px');
	});

	it('应应用 rounded-full 类名', () => {
		const { container } = render(
			<NodeIcon
				nodeId="test-node-3"
				emotion="忧郁"
				salienceScore={7}
				className="custom-class"
			/>
		);

		const canvas = container.querySelector('canvas');
		expect(canvas?.classList.contains('rounded-full')).toBe(true);
		expect(canvas?.classList.contains('custom-class')).toBe(true);
	});
});

describe('generateNodeIconDataURL', () => {
	it('应返回 data URL', () => {
		// Mock document.createElement
		const mockCanvas = {
			width: 0,
			height: 0,
			getContext: vi.fn(() => mockContext),
			toDataURL: vi.fn(() => 'data:image/png;base64,mock'),
		};
		// @ts-expect-error - Mock createElement
		document.createElement = vi.fn(() => mockCanvas);
		
		const dataURL = generateNodeIconDataURL('test-id', '开心', 8, 120);
		expect(dataURL).toMatch(/^data:image\/png;base64,/);
	});
});
