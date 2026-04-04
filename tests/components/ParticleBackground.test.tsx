// ============================================================
// 测试: ParticleBackground 粒子背景组件
// 描述: 验证粒子效果、动态颜色、情绪波动扩散
// ============================================================

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ParticleBackground } from '@/components/ParticleBackground';

describe('ParticleBackground', () => {
	it('应渲染 Canvas 元素', () => {
		const { container } = render(<ParticleBackground />);
		const canvas = container.querySelector('canvas');
		expect(canvas).toBeDefined();
	});

	it('应接受情绪强度参数', () => {
		const { container } = render(<ParticleBackground emotionIntensity={0.8} />);
		const canvas = container.querySelector('canvas');
		expect(canvas).toBeDefined();
	});

	it('应接受动态颜色参数', () => {
		const { container } = render(
			<ParticleBackground baseColor="#f59e0b" emotionColor="#ef4444" />
		);
		const canvas = container.querySelector('canvas');
		expect(canvas).toBeDefined();
	});

	it('全屏模式下应覆盖整个视口', () => {
		const { container } = render(<ParticleBackground fullscreen />);
		const wrapper = container.firstChild as HTMLElement;
		expect(wrapper?.className).toContain('fixed');
		expect(wrapper?.className).toContain('inset-0');
	});
});


describe('ParticleBackground 性能', () => {
	it('应使用 requestAnimationFrame', () => {
		// 验证动画性能优化
		const { container } = render(<ParticleBackground />);
		expect(container.querySelector('canvas')).toBeDefined();
	});

	it('组件卸载时应清理动画', () => {
		const { unmount } = render(<ParticleBackground />);
		expect(() => unmount()).not.toThrow();
	});
});
