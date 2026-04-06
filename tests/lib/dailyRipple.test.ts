// ============================================================
// Daily Ripple 测试
// 功能: 测试每日涟漪情绪追踪系统
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	generateDailyRipple,
	calculateEmotionTrend,
	generateInsight,
	shouldShowRipple,
	type DailyRipple,
	type RippleInsight,
} from '../../src/lib/dailyRipple';

describe('Daily Ripple', () => {
	describe('generateDailyRipple', () => {
		it('should generate ripple for today', () => {
			const memoryNodes = [
				{
					node_id: '1',
					event_date: new Date().toISOString().split('T')[0],
					npc_state: { current_emotion: 'joyful' },
					salience_score: 8,
					core_event: '开心的事情',
				},
			];

			const ripple = generateDailyRipple(memoryNodes);
			expect(ripple).toBeDefined();
			expect(ripple.date).toBe(new Date().toISOString().split('T')[0]);
		});

		it('should use historical data when no recent nodes', () => {
			const memoryNodes = [
				{
					node_id: '1',
					event_date: '2025-01-01',
					npc_state: { current_emotion: 'calm' },
					salience_score: 7,
					core_event: '过去的事情',
				},
			];

			const ripple = generateDailyRipple(memoryNodes);
			expect(ripple).toBeDefined();
			expect(['morning', 'reflection', 'evening']).toContain(ripple.type);
		});

		it('should include quote when generating ripple', () => {
			const ripple = generateDailyRipple([]);
			expect(ripple.quote).toBeDefined();
			expect(ripple.quote.length).toBeGreaterThan(0);
		});

		it('should calculate resonance score', () => {
			const memoryNodes = [
				{
					node_id: '1',
					event_date: new Date().toISOString().split('T')[0],
					npc_state: { current_emotion: 'joyful' },
					salience_score: 8,
					core_event: '事件1',
				},
				{
					node_id: '2',
					event_date: new Date().toISOString().split('T')[0],
					npc_state: { current_emotion: 'hopeful' },
					salience_score: 7,
					core_event: '事件2',
				},
			];

			const ripple = generateDailyRipple(memoryNodes);
			expect(ripple.resonanceScore).toBeGreaterThanOrEqual(0);
			expect(ripple.resonanceScore).toBeLessThanOrEqual(1);
		});
	});

	describe('calculateEmotionTrend', () => {
		it('should calculate upward trend', () => {
			const nodes = [
				{ event_date: '2026-01-01', npc_state: { current_emotion: 'sad' } },
				{ event_date: '2026-01-02', npc_state: { current_emotion: 'calm' } },
				{ event_date: '2026-01-03', npc_state: { current_emotion: 'joyful' } },
			];

			const trend = calculateEmotionTrend(nodes as any);
			expect(trend.direction).toBe('upward');
		});

		it('should calculate downward trend', () => {
			const nodes = [
				{ event_date: '2026-01-01', npc_state: { current_emotion: 'joyful' } },
				{ event_date: '2026-01-02', npc_state: { current_emotion: 'calm' } },
				{ event_date: '2026-01-03', npc_state: { current_emotion: 'sad' } },
			];

			const trend = calculateEmotionTrend(nodes as any);
			expect(trend.direction).toBe('downward');
		});

		it('should calculate stable trend', () => {
			const nodes = [
				{ event_date: '2026-01-01', npc_state: { current_emotion: 'calm' } },
				{ event_date: '2026-01-02', npc_state: { current_emotion: 'calm' } },
				{ event_date: '2026-01-03', npc_state: { current_emotion: 'calm' } },
			];

			const trend = calculateEmotionTrend(nodes as any);
			expect(trend.direction).toBe('stable');
		});

		it('should return neutral for insufficient data', () => {
			const trend = calculateEmotionTrend([]);
			expect(trend.direction).toBe('neutral');
		});
	});

	describe('generateInsight', () => {
		it('should generate positive insight for positive trend', () => {
			const insight = generateInsight('upward', 'joyful', 0.8);
			expect(insight.type).toBe('encouragement');
			expect(insight.message).toContain('积极');
		});

		it('should generate supportive insight for negative trend', () => {
			const insight = generateInsight('downward', 'sad', 0.3);
			expect(insight.type).toBe('support');
		});

		it('should generate reflection for stable trend', () => {
			const insight = generateInsight('stable', 'calm', 0.6);
			expect(insight.type).toBe('reflection');
		});
	});

	describe('shouldShowRipple', () => {
		it('should show ripple if never shown before', () => {
			const result = shouldShowRipple(null);
			expect(result).toBe(true);
		});

		it('should show ripple if last shown yesterday', () => {
			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);
			
			const result = shouldShowRipple(yesterday.toISOString());
			expect(result).toBe(true);
		});

		it('should not show ripple if already shown today', () => {
			const today = new Date().toISOString();
			const result = shouldShowRipple(today);
			expect(result).toBe(false);
		});
	});
});
