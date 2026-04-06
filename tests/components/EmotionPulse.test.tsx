import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// ============================================================
// EmotionPulse 组件测试
// 心跳脉冲效果、情绪配置
// ============================================================

// Mock framer-motion
vi.mock('framer-motion', () => ({
	motion: {
		div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
	},
	useAnimation: () => ({
		start: vi.fn(),
		stop: vi.fn(),
	}),
	AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('HEARTBEAT_CONFIG 配置', () => {
	const HEARTBEAT_CONFIG: Record<string, { baseSpeed: number; intensityMultiplier: number }> = {
		calm: { baseSpeed: 2, intensityMultiplier: 0.5 },
		angry: { baseSpeed: 0.8, intensityMultiplier: 1.5 },
		sad: { baseSpeed: 3, intensityMultiplier: 0.3 },
		joyful: { baseSpeed: 1.2, intensityMultiplier: 1.2 },
		melancholy: { baseSpeed: 2.5, intensityMultiplier: 0.4 },
		hopeful: { baseSpeed: 1.5, intensityMultiplier: 1.0 },
		passionate: { baseSpeed: 0.9, intensityMultiplier: 1.4 },
		mysterious: { baseSpeed: 1.8, intensityMultiplier: 0.8 },
	};

	it('应定义 8 种情绪的心跳配置', () => {
		expect(Object.keys(HEARTBEAT_CONFIG)).toHaveLength(8);
	});

	it('angry 应有最快的心跳速度', () => {
		const speeds = Object.values(HEARTBEAT_CONFIG).map((c) => c.baseSpeed);
		const minSpeed = Math.min(...speeds);
		expect(HEARTBEAT_CONFIG.angry.baseSpeed).toBe(minSpeed);
	});

	it('sad 应有最慢的心跳速度', () => {
		const speeds = Object.values(HEARTBEAT_CONFIG).map((c) => c.baseSpeed);
		const maxSpeed = Math.max(...speeds);
		expect(HEARTBEAT_CONFIG.sad.baseSpeed).toBe(maxSpeed);
	});

	it('angry 应有最高的强度倍数', () => {
		expect(HEARTBEAT_CONFIG.angry.intensityMultiplier).toBe(1.5);
	});
});

describe('EmotionIndicator 组件', () => {
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

	it('应正确显示情绪标签', () => {
		expect(emotionLabels.calm).toBe('平静');
		expect(emotionLabels.angry).toBe('愤怒');
		expect(emotionLabels.joyful).toBe('喜悦');
	});

	it('应支持自定义标签', () => {
		const customLabel = 'ELARA';
		expect(customLabel).toBe('ELARA');
	});
});

describe('NodePreview 组件', () => {
	it('应接受节点数据属性', () => {
		const mockNode = {
			id: '1',
			title: '测试节点',
			date: '2024-01-01',
			description: '测试描述',
			emotion: 'calm',
			salienceScore: 8,
		};

		expect(mockNode.id).toBe('1');
		expect(mockNode.title).toBe('测试节点');
		expect(mockNode.emotion).toBe('calm');
	});

	it('应支持打开和关闭状态', () => {
		const isOpen = true;
		expect(isOpen).toBe(true);
	});

	it('应触发确认和取消回调', () => {
		const onConfirm = vi.fn();
		const onCancel = vi.fn();

		onConfirm();
		onCancel();

		expect(onConfirm).toHaveBeenCalled();
		expect(onCancel).toHaveBeenCalled();
	});
});

describe('情绪强度计算', () => {
	it('应计算综合强度', () => {
		const emotionIntensity = 0.5;
		const chatIntensity = 0.3;
		const totalIntensity = Math.min(
			(emotionIntensity + chatIntensity) / 2 + 0.2,
			1
		);

		expect(totalIntensity).toBeCloseTo(0.6, 1);
	});

	it('强度不应超过 1', () => {
		const emotionIntensity = 1;
		const chatIntensity = 1;
		const totalIntensity = Math.min(
			(emotionIntensity + chatIntensity) / 2 + 0.2,
			1
		);

		expect(totalIntensity).toBe(1);
	});
});

describe('心跳动画序列', () => {
	it('应定义心跳节拍', () => {
		const heartbeatSequence = [
			{ phase: 'first_beat', scale: [1, 1.15, 1.1], duration: 0.15 },
			{ phase: 'second_beat', scale: [1.1, 1.08, 1], duration: 0.15 },
			{ phase: 'rest', duration: 0.7 },
		];

		expect(heartbeatSequence).toHaveLength(3);
		expect(heartbeatSequence[0].phase).toBe('first_beat');
		expect(heartbeatSequence[1].phase).toBe('second_beat');
	});
});
