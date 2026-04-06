// ============================================================
// Growth Tree 测试
// 功能: 测试 AI 成长树可视化功能
// ============================================================

import { describe, it, expect } from 'vitest';
import {
	generateGrowthTree,
	calculateGrowthMetrics,
	type GrowthTreeNode,
	type GrowthMetrics,
} from '../../src/lib/growthTree';

describe('Growth Tree', () => {
	describe('generateGrowthTree', () => {
		it('should generate tree from memory nodes', () => {
			const nodes = [
				{
					node_id: '1',
					event_date: '2026-01-01',
					npc_state: { current_emotion: 'calm', attitude_towards_user: 'friendly' },
					salience_score: 7,
				},
				{
					node_id: '2',
					event_date: '2026-02-01',
					npc_state: { current_emotion: 'joyful', attitude_towards_user: 'close' },
					salience_score: 8,
				},
			];

			const tree = generateGrowthTree(nodes);
			expect(tree).toBeDefined();
			expect(tree.root).toBeDefined();
			expect(tree.nodes.length).toBeGreaterThan(0);
		});

		it('should handle empty nodes', () => {
			const tree = generateGrowthTree([]);
			expect(tree.nodes.length).toBe(0);
			expect(tree.root).toBeNull();
		});

		it('should calculate node levels correctly', () => {
			const nodes = [
				{
					node_id: '1',
					event_date: '2026-01-01',
					npc_state: { current_emotion: 'calm', attitude_towards_user: 'neutral' },
					salience_score: 5,
				},
			];

			const tree = generateGrowthTree(nodes);
			const node = tree.nodes[0];
			expect(node.level).toBeDefined();
		});

		it('should sort nodes by date', () => {
			const nodes = [
				{
					node_id: '2',
					event_date: '2026-02-01',
					npc_state: { current_emotion: 'joyful', attitude_towards_user: 'close' },
					salience_score: 8,
				},
				{
					node_id: '1',
					event_date: '2026-01-01',
					npc_state: { current_emotion: 'calm', attitude_towards_user: 'friendly' },
					salience_score: 7,
				},
			];

			const tree = generateGrowthTree(nodes);
			expect(tree.nodes[0].id).toBe('1');
			expect(tree.nodes[1].id).toBe('2');
		});
	});

	describe('calculateGrowthMetrics', () => {
		it('should calculate emotional growth', () => {
			const nodes = [
				{
					node_id: '1',
					event_date: '2026-01-01',
					npc_state: { current_emotion: 'sad', attitude_towards_user: 'distant' },
					salience_score: 5,
				},
				{
					node_id: '2',
					event_date: '2026-02-01',
					npc_state: { current_emotion: 'joyful', attitude_towards_user: 'close' },
					salience_score: 9,
				},
			];

			const metrics = calculateGrowthMetrics(nodes);
			expect(metrics.emotionalGrowth).toBeGreaterThan(0);
		});

		it('should calculate relationship depth', () => {
			const nodes = [
				{
					node_id: '1',
					event_date: '2026-01-01',
					npc_state: { current_emotion: 'calm', attitude_towards_user: 'neutral' },
					salience_score: 5,
				},
			];

			const metrics = calculateGrowthMetrics(nodes);
			expect(metrics.relationshipDepth).toBeGreaterThanOrEqual(0);
			expect(metrics.relationshipDepth).toBeLessThanOrEqual(1);
		});

		it('should calculate total memories', () => {
			const nodes = [
				{ node_id: '1', event_date: '2026-01-01', npc_state: { current_emotion: 'calm' }, salience_score: 7 },
				{ node_id: '2', event_date: '2026-02-01', npc_state: { current_emotion: 'joyful' }, salience_score: 8 },
			];

			const metrics = calculateGrowthMetrics(nodes);
			expect(metrics.totalMemories).toBe(2);
		});

		it('should calculate timespan', () => {
			const nodes = [
				{
					node_id: '1',
					event_date: '2026-01-01',
					npc_state: { current_emotion: 'calm' },
					salience_score: 7,
				},
				{
					node_id: '2',
					event_date: '2026-03-01',
					npc_state: { current_emotion: 'joyful' },
					salience_score: 8,
				},
			];

			const metrics = calculateGrowthMetrics(nodes);
			expect(metrics.timespanDays).toBeGreaterThan(0);
		});
	});
});
