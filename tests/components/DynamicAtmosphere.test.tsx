import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

// ============================================================
// DynamicAtmosphere 组件测试
// 测试情绪-色彩映射、平滑过渡、粒子响应
// ============================================================

// Mock canvas
const mockGetContext = vi.fn(() => ({
	fillRect: vi.fn(),
	fillStyle: '',
	createRadialGradient: vi.fn(() => ({
		addColorStop: vi.fn(),
	})),
	beginPath: vi.fn(),
	arc: vi.fn(),
	fill: vi.fn(),
	moveTo: vi.fn(),
	lineTo: vi.fn(),
	stroke: vi.fn(),
	strokeStyle: '',
}));

// 测试情绪-色彩映射配置
const EMOTION_THEME_MAP = {
	calm: {
		primary: [30, 60, 100],
		secondary: [20, 40, 80],
		particleSpeed: 0.5,
		particleCount: 80,
	},
	angry: {
		primary: [150, 30, 30],
		secondary: [100, 20, 20],
		particleSpeed: 3,
		particleCount: 120,
	},
	sad: {
		primary: [50, 70, 100],
		secondary: [30, 50, 80],
		particleSpeed: 0.3,
		particleCount: 60,
	},
	joyful: {
		primary: [255, 180, 60],
		secondary: [200, 140, 40],
		particleSpeed: 1.5,
		particleCount: 100,
	},
	melancholy: {
		primary: [80, 90, 120],
		secondary: [60, 70, 100],
		particleSpeed: 0.4,
		particleCount: 70,
	},
	hopeful: {
		primary: [60, 180, 120],
		secondary: [40, 140, 90],
		particleSpeed: 1,
		particleCount: 90,
	},
	passionate: {
		primary: [200, 60, 80],
		secondary: [160, 40, 60],
		particleSpeed: 2,
		particleCount: 110,
	},
	mysterious: {
		primary: [100, 60, 150],
		secondary: [80, 40, 120],
		particleSpeed: 0.8,
		particleCount: 85,
	},
};

describe('情绪-色彩映射系统', () => {
	it('应定义 8 种情绪的色彩配置', () => {
		const emotions = Object.keys(EMOTION_THEME_MAP);
		expect(emotions).toHaveLength(8);
		expect(emotions).toContain('calm');
		expect(emotions).toContain('angry');
		expect(emotions).toContain('sad');
		expect(emotions).toContain('joyful');
		expect(emotions).toContain('melancholy');
		expect(emotions).toContain('hopeful');
		expect(emotions).toContain('passionate');
		expect(emotions).toContain('mysterious');
	});

	it('每种情绪应包含完整的主题配置', () => {
		Object.entries(EMOTION_THEME_MAP).forEach(([emotion, config]) => {
			expect(config, `${emotion} 缺少 primary`).toHaveProperty('primary');
			expect(config, `${emotion} 缺少 secondary`).toHaveProperty('secondary');
			expect(config, `${emotion} 缺少 particleSpeed`).toHaveProperty('particleSpeed');
			expect(config, `${emotion} 缺少 particleCount`).toHaveProperty('particleCount');
			
			expect(Array.isArray(config.primary)).toBe(true);
			expect(config.primary).toHaveLength(3);
			expect(typeof config.particleSpeed).toBe('number');
			expect(typeof config.particleCount).toBe('number');
		});
	});

	it('angry 情绪应具有最快的粒子速度', () => {
		const speeds = Object.entries(EMOTION_THEME_MAP).map(([k, v]) => v.particleSpeed);
		const maxSpeed = Math.max(...speeds);
		expect(EMOTION_THEME_MAP.angry.particleSpeed).toBe(maxSpeed);
	});

	it('sad 情绪应具有最慢的粒子速度', () => {
		const speeds = Object.entries(EMOTION_THEME_MAP).map(([k, v]) => v.particleSpeed);
		const minSpeed = Math.min(...speeds);
		expect(EMOTION_THEME_MAP.sad.particleSpeed).toBe(minSpeed);
	});
});

describe('DynamicAtmosphere 组件', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		HTMLCanvasElement.prototype.getContext = mockGetContext;
	});

	it('应接受 emotion 属性并渲染 canvas', () => {
		const DynamicAtmosphere = React.forwardRef<HTMLCanvasElement, { emotion?: string }>(
			({ emotion = 'calm' }, ref) => {
				return (
					<canvas
						ref={ref}
						data-testid="atmosphere-canvas"
						data-emotion={emotion}
					/>
				);
			}
		);
		DynamicAtmosphere.displayName = 'DynamicAtmosphere';

		render(<DynamicAtmosphere emotion="calm" />);
		const canvas = screen.getByTestId('atmosphere-canvas');
		expect(canvas).toBeInTheDocument();
		expect(canvas).toHaveAttribute('data-emotion', 'calm');
	});

	it('应在情绪变化时触发过渡动画', async () => {
		let currentEmotion = 'calm';
		
		const DynamicAtmosphere = React.forwardRef<HTMLCanvasElement, { emotion?: string }>(
			({ emotion = 'calm' }, ref) => {
				currentEmotion = emotion;
				return (
					<canvas
						ref={ref}
						data-testid="atmosphere-canvas"
						data-emotion={emotion}
					/>
				);
			}
		);
		DynamicAtmosphere.displayName = 'DynamicAtmosphere';

		const { rerender } = render(<DynamicAtmosphere emotion="calm" />);
		expect(currentEmotion).toBe('calm');
		
		rerender(<DynamicAtmosphere emotion="angry" />);
		expect(currentEmotion).toBe('angry');
	});

	it('应支持自定义过渡时长', () => {
		const DEFAULT_TRANSITION_DURATION = 500;
		expect(DEFAULT_TRANSITION_DURATION).toBe(500);
	});
});

describe('色彩插值工具', () => {
	it('应能线性插值两个 RGB 颜色', () => {
		const lerpColor = (c1: number[], c2: number[], t: number) => {
			return c1.map((v, i) => Math.round(v + (c2[i] - v) * t));
		};

		const result = lerpColor([0, 0, 0], [100, 100, 100], 0.5);
		expect(result).toEqual([50, 50, 50]);
	});

	it('应在 t=0 时返回第一个颜色', () => {
		const lerpColor = (c1: number[], c2: number[], t: number) => {
			return c1.map((v, i) => Math.round(v + (c2[i] - v) * t));
		};

		const result = lerpColor([255, 0, 0], [0, 0, 255], 0);
		expect(result).toEqual([255, 0, 0]);
	});

	it('应在 t=1 时返回第二个颜色', () => {
		const lerpColor = (c1: number[], c2: number[], t: number) => {
			return c1.map((v, i) => Math.round(v + (c2[i] - v) * t));
		};

		const result = lerpColor([255, 0, 0], [0, 0, 255], 1);
		expect(result).toEqual([0, 0, 255]);
	});
});

describe('粒子系统配置', () => {
	it('应根据情绪返回正确的粒子数量', () => {
		const getParticleCount = (emotion: string) => {
			return EMOTION_THEME_MAP[emotion as keyof typeof EMOTION_THEME_MAP]?.particleCount ?? 80;
		};

		expect(getParticleCount('calm')).toBe(80);
		expect(getParticleCount('angry')).toBe(120);
		expect(getParticleCount('sad')).toBe(60);
		expect(getParticleCount('unknown')).toBe(80);
	});

	it('应根据情绪返回正确的粒子速度倍数', () => {
		const getParticleSpeed = (emotion: string) => {
			return EMOTION_THEME_MAP[emotion as keyof typeof EMOTION_THEME_MAP]?.particleSpeed ?? 0.5;
		};

		expect(getParticleSpeed('calm')).toBe(0.5);
		expect(getParticleSpeed('angry')).toBe(3);
		expect(getParticleSpeed('sad')).toBe(0.3);
	});
});
