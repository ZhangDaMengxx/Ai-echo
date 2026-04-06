import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	analyzeEmotion,
	analyzeEmotionsBatch,
	checkEmotionServiceHealth,
	calculateBPM,
	shouldTransitionEmotion,
	escalateEmotion,
	EMOTION_LABELS,
	EMOTION_COLORS,
	EMOTION_BPM,
} from '@/lib/emotion';
import type { EmotionAnalyzeResponse } from '@/app/api/emotion/analyze/route';

// ============================================================
// 情绪分析 API 测试
// ============================================================

// Mock fetch
global.fetch = vi.fn();

describe('情绪分析 API', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('analyzeEmotion', () => {
		it('应成功分析情绪', async () => {
			const mockResponse: EmotionAnalyzeResponse = {
				emotion: 'joyful',
				intensity: 0.8,
				confidence: 0.9,
				reasoning: '用户表达开心',
			};

			(fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			});

			const result = await analyzeEmotion({
				message: '今天真开心！',
				currentEmotion: 'calm',
			});

			expect(result.emotion).toBe('joyful');
			expect(result.intensity).toBe(0.8);
			expect(result.confidence).toBe(0.9);
			expect(fetch).toHaveBeenCalledWith('/api/emotion/analyze', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					message: '今天真开心！',
					currentEmotion: 'calm',
				}),
			});
		});

		it('应在请求失败时抛出错误', async () => {
			(fetch as any).mockResolvedValueOnce({
				ok: false,
				status: 500,
				json: () => Promise.resolve({ error: 'Server error' }),
			});

			await expect(analyzeEmotion({ message: 'test' })).rejects.toThrow('Server error');
		});
	});

	describe('analyzeEmotionsBatch', () => {
		it('应批量分析多条消息', async () => {
			const mockResponses: EmotionAnalyzeResponse[] = [
				{ emotion: 'calm', intensity: 0.5, confidence: 0.8, reasoning: '平静' },
				{ emotion: 'angry', intensity: 0.9, confidence: 0.85, reasoning: '愤怒' },
			];

			(fetch as any)
				.mockResolvedValueOnce({
					ok: true,
					json: () => Promise.resolve(mockResponses[0]),
				})
				.mockResolvedValueOnce({
					ok: true,
					json: () => Promise.resolve(mockResponses[1]),
				});

			const messages = [
				{ id: '1', content: '还好吧', role: 'user' as const },
				{ id: '2', content: '我很生气！', role: 'user' as const },
			];

			const results = await analyzeEmotionsBatch(messages);

			expect(results.size).toBe(2);
			expect(results.get('1')?.emotion).toBe('calm');
			expect(results.get('2')?.emotion).toBe('angry');
		});
	});

	describe('checkEmotionServiceHealth', () => {
		it('应返回服务健康状态', async () => {
			const mockHealth = {
				status: 'ok',
				supportedEmotions: ['calm', 'angry', 'sad'],
				cacheSize: 10,
			};

			(fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockHealth),
			});

			const result = await checkEmotionServiceHealth();

			expect(result.status).toBe('ok');
			expect(result.supportedEmotions).toContain('calm');
			expect(fetch).toHaveBeenCalledWith('/api/emotion/analyze');
		});
	});
});

describe('情绪工具函数', () => {
	describe('calculateBPM', () => {
		it('应根据强度计算 BPM', () => {
			const bpm = calculateBPM('calm', 0.5);
			const expected = Math.round(30 + (50 - 30) * 0.5);
			expect(bpm).toBe(expected);
		});

		it('angry 在高强度时应有高 BPM', () => {
			const bpm = calculateBPM('angry', 1);
			expect(bpm).toBe(200);
		});

		it('sad 在低强度时应有低 BPM', () => {
			const bpm = calculateBPM('sad', 0);
			expect(bpm).toBe(20);
		});
	});

	describe('shouldTransitionEmotion', () => {
		it('应在置信度高且情绪不同时建议转换', () => {
			const shouldTransition = shouldTransitionEmotion('calm', 'angry', 0.8);
			expect(shouldTransition).toBe(true);
		});

		it('应在置信度低时不建议转换', () => {
			const shouldTransition = shouldTransitionEmotion('calm', 'angry', 0.5);
			expect(shouldTransition).toBe(false);
		});

		it('应在情绪相同时不建议转换', () => {
			const shouldTransition = shouldTransitionEmotion('calm', 'calm', 0.9);
			expect(shouldTransition).toBe(false);
		});
	});

	describe('escalateEmotion', () => {
		it('应将 calm 升级为 hopeful', () => {
			const result = escalateEmotion('calm');
			expect(result).toBe('hopeful');
		});

		it('应将 hopeful 升级为 joyful', () => {
			const result = escalateEmotion('hopeful');
			expect(result).toBe('joyful');
		});

		it('应将 joyful 升级为 passionate', () => {
			const result = escalateEmotion('joyful');
			expect(result).toBe('passionate');
		});

		it('没有升级路径时应返回原情绪', () => {
			const result = escalateEmotion('mysterious');
			expect(result).toBe('mysterious');
		});
	});
});

describe('情绪常量', () => {
	it('应定义 8 种情绪的中文标签', () => {
		expect(Object.keys(EMOTION_LABELS)).toHaveLength(8);
		expect(EMOTION_LABELS.calm).toBe('平静');
		expect(EMOTION_LABELS.angry).toBe('愤怒');
	});

	it('应定义 8 种情绪的颜色', () => {
		expect(Object.keys(EMOTION_COLORS)).toHaveLength(8);
		expect(EMOTION_COLORS.calm).toMatch(/^#[0-9a-fA-F]{6}$/);
	});

	it('应定义 8 种情绪的 BPM 范围', () => {
		expect(Object.keys(EMOTION_BPM)).toHaveLength(8);
		Object.values(EMOTION_BPM).forEach((range) => {
			expect(range).toHaveProperty('min');
			expect(range).toHaveProperty('max');
			expect(range.min).toBeLessThan(range.max);
		});
	});
});
