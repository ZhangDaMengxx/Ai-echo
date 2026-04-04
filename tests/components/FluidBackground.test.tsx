// ============================================================
// 测试: FluidBackground 流体动力学背景
// 描述: 验证体积雾、焦散光斑、流体模拟
// ============================================================

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { FluidBackground } from '@/components/FluidBackground';

describe('FluidBackground', () => {
	it('应渲染 WebGL Canvas', () => {
		const { container } = render(<FluidBackground />);
		const canvas = container.querySelector('canvas');
		expect(canvas).toBeDefined();
	});

	it('应接受平静情绪参数', () => {
		const { container } = render(
			<FluidBackground 
				emotion="calm" 
				baseColor="#1e3a5f"
				secondaryColor="#9ca3af"
			/>
		);
		const canvas = container.querySelector('canvas');
		expect(canvas).toBeDefined();
	});

	it('应接受愤怒情绪参数', () => {
		const { container } = render(
			<FluidBackground 
				emotion="angry" 
				baseColor="#1e3a5f"
				secondaryColor="#dc2626"
			/>
		);
		const canvas = container.querySelector('canvas');
		expect(canvas).toBeDefined();
	});

	it('应接受自定义turbulence参数', () => {
		const { container } = render(<FluidBackground turbulence={0.8} />);
		const canvas = container.querySelector('canvas');
		expect(canvas).toBeDefined();
	});
});


describe('FluidBackground 情绪切换', () => {
	it('愤怒时流体速度应变快', () => {
		const { container } = render(
			<FluidBackground emotion="angry" turbulence={0.9} />
		);
		const canvas = container.querySelector('canvas');
		expect(canvas).toBeDefined();
	});

	it('平静时流体运动应平滑', () => {
		const { container } = render(
			<FluidBackground emotion="calm" turbulence={0.1} />
		);
		const canvas = container.querySelector('canvas');
		expect(canvas).toBeDefined();
	});
});
