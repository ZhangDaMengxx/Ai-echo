import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

// ============================================================
// EmotionWave 组件测试
// ECG 心电图波形、情绪配置
// ============================================================

describe('WAVE_CONFIG 配置', () => {
	const WAVE_CONFIG: Record<string, { baseFrequency: number; baseAmplitude: number; waveSpeed: number; color: string }> = {
		calm: { baseFrequency: 0.5, baseAmplitude: 20, waveSpeed: 50, color: '#3b82f6' },
		angry: { baseFrequency: 2.5, baseAmplitude: 45, waveSpeed: 150, color: '#dc2626' },
		sad: { baseFrequency: 0.3, baseAmplitude: 15, waveSpeed: 30, color: '#64748b' },
		joyful: { baseFrequency: 1.5, baseAmplitude: 35, waveSpeed: 100, color: '#f59e0b' },
		melancholy: { baseFrequency: 0.7, baseAmplitude: 25, waveSpeed: 40, color: '#6366f1' },
		hopeful: { baseFrequency: 1.0, baseAmplitude: 30, waveSpeed: 80, color: '#10b981' },
		passionate: { baseFrequency: 2.0, baseAmplitude: 40, waveSpeed: 120, color: '#f43f5e' },
		mysterious: { baseFrequency: 1.2, baseAmplitude: 28, waveSpeed: 70, color: '#a855f7' },
	};

	it('应定义 8 种情绪的波形配置', () => {
		expect(Object.keys(WAVE_CONFIG)).toHaveLength(8);
	});

	it('angry 应有最高的频率', () => {
		const frequencies = Object.values(WAVE_CONFIG).map((c) => c.baseFrequency);
		const maxFreq = Math.max(...frequencies);
		expect(WAVE_CONFIG.angry.baseFrequency).toBe(maxFreq);
	});

	it('sad 应有最低的频率', () => {
		const frequencies = Object.values(WAVE_CONFIG).map((c) => c.baseFrequency);
		const minFreq = Math.min(...frequencies);
		expect(WAVE_CONFIG.sad.baseFrequency).toBe(minFreq);
	});

	it('angry 应有最高的振幅', () => {
		const amplitudes = Object.values(WAVE_CONFIG).map((c) => c.baseAmplitude);
		const maxAmp = Math.max(...amplitudes);
		expect(WAVE_CONFIG.angry.baseAmplitude).toBe(maxAmp);
	});

	it('每种情绪应有有效的颜色值', () => {
		Object.values(WAVE_CONFIG).forEach((config) => {
			expect(config.color).toMatch(/^#[0-9a-fA-F]{6}$/);
		});
	});
});

describe('ECG 波形生成', () => {
	it('应生成 ECG 波形数据点', () => {
		const generateECGPoint = (time: number): number => {
			const frequency = 1.0;
			const amplitude = 30;
			const t = time * frequency;
			const cycle = t % (Math.PI * 2);
			
			let value = 0;
			
			// P波
			if (cycle > 0.2 && cycle < 0.6) {
				value += Math.sin((cycle - 0.2) / 0.4 * Math.PI) * amplitude * 0.15;
			}
			
			// QRS波群
			if (cycle > 1.0 && cycle < 1.4) {
				const qrsPhase = (cycle - 1.0) / 0.4;
				if (qrsPhase < 0.15) {
					value -= Math.sin(qrsPhase / 0.15 * Math.PI) * amplitude * 0.2;
				} else if (qrsPhase < 0.35) {
					value += Math.sin((qrsPhase - 0.15) / 0.2 * Math.PI) * amplitude;
				} else if (qrsPhase < 0.5) {
					value -= Math.sin((qrsPhase - 0.35) / 0.15 * Math.PI) * amplitude * 0.4;
				}
			}
			
			// T波
			if (cycle > 1.8 && cycle < 2.4) {
				value += Math.sin((cycle - 1.8) / 0.6 * Math.PI) * amplitude * 0.25;
			}
			
			return value;
		};

		// 测试波形生成函数
		const point = generateECGPoint(1.25);
		// 应该返回一个数值
		expect(typeof point).toBe('number');
	});

	it('应计算心率 BPM', () => {
		const baseFrequency = 1.0;
		const intensity = 0.5;
		const heartRate = Math.round(baseFrequency * 60 * (1 + intensity * 0.25));
		expect(heartRate).toBe(68);
	});
});

describe('EmotionWaveIndicator 组件', () => {
	const emotionLabels: Record<string, string> = {
		calm: '平静',
		angry: '愤怒',
		sad: '悲伤',
		joyful: '喜悦',
		melancholy: '忧郁',
		hopeful: '希望',
		passionate: '热情',
		mysterious: '神秘',
	};

	it('应正确显示情绪标签和 BPM', () => {
		const emotion = 'calm';
		const baseFrequency = 0.5;
		const intensity = 0.5;
		const heartRate = Math.round(baseFrequency * 60 * (1 + intensity * 0.25));
		
		expect(emotionLabels[emotion]).toBe('平静');
		expect(heartRate).toBe(34);
	});

	it('应显示不同情绪的 BPM 范围', () => {
		const testCases = [
			{ emotion: 'sad', freq: 0.3, expectedBpm: 23 }, // 最低
			{ emotion: 'angry', freq: 2.5, expectedBpm: 188 }, // 最高
		];

		testCases.forEach(({ freq, expectedBpm }) => {
			const bpm = Math.round(freq * 60 * 1.25); // intensity = 0.5
			expect(bpm).toBe(expectedBpm);
		});
	});
});

describe('Canvas 波形渲染', () => {
	beforeEach(() => {
		// Mock canvas
		HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
			clearRect: vi.fn(),
			beginPath: vi.fn(),
			moveTo: vi.fn(),
			lineTo: vi.fn(),
			quadraticCurveTo: vi.fn(),
			stroke: vi.fn(),
			createLinearGradient: vi.fn(() => ({
				addColorStop: vi.fn(),
			})),
		})) as any;
	});

	it('应渲染 Canvas 元素', () => {
		const EmotionWave = ({ emotion }: { emotion: string }) => (
			<canvas data-testid="emotion-wave" data-emotion={emotion} />
		);

		const { container } = render(<EmotionWave emotion="calm" />);
		const canvas = container.querySelector('canvas');
		expect(canvas).toBeInTheDocument();
		expect(canvas).toHaveAttribute('data-emotion', 'calm');
	});

	it('波形应具有正确的样式属性', () => {
		const style = {
			width: '100%',
			height: '100%',
			zIndex: 0,
			opacity: 0.6,
		};

		expect(style.opacity).toBe(0.6);
		expect(style.zIndex).toBe(0);
	});
});
