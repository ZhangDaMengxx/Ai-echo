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
import { MemoryNode } from '../../src/lib/localDb';

describe('Growth Tree', () => {
	describe('generateGrowthTree', () => {
		it('should generate tree from memory nodes', () => {
			const nodes: MemoryNode[] = [
				{
					node_id: '1',
					event_date: '2026-01-01',
					npc_state: { current_emotion: 'calm', attitude_towards_user: 'friendly' },
					salience_score: 7,
					core_event: '事件1',
					memory_source: 'txt_extraction',
					opening_mode: 'dialogue_driven',
					created_at: new Date().toISOString(),
				},
				{
					node_id: '2',
					event_date: '2026-02-01',
					npc_state: { current_emotion: 'joyful', attitude_towards_user: 'close' },
					salience_score: 8,
					core_event: '事件2',
					memory_source: 'txt_extraction',
					opening_mode: 'dialogue_driven',
					created_at: new Date().toISOString(),
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
			const nodes: MemoryNode[] = [
				{
					node_id: '1',
					event_date: '2026-01-01',
					npc_state: { current_emotion: 'calm', attitude_towards_user: 'neutral' },
					salience_score: 5,
					core_event: '事件1',
					memory_source: 'txt_extraction',
					opening_mode: 'dialogue_driven',
					created_at: new Date().toISOString(),
				},
			];

			const tree = generateGrowthTree(nodes);
			const node = tree.nodes[0];
			expect(node.level).toBeDefined();
		});

		it('should sort nodes by date', () => {
			const nodes: MemoryNode[] = [
				{
					node_id: '2',
					event_date: '2026-02-01',
					npc_state: { current_emotion: 'joyful', attitude_towards_user: 'close' },
					salience_score: 8,
					core_event: '事件2',
					memory_source: 'txt_extraction',
					opening_mode: 'dialogue_driven',
					created_at: new Date().toISOString(),
				},
				{
					node_id: '1',
					event_date: '2026-01-01',
					npc_state: { current_emotion: 'calm', attitude_towards_user: 'friendly' },
					salience_score: 7,
					core_event: '事件1',
					memory_source: 'txt_extraction',
					opening_mode: 'dialogue_driven',
					created_at: new Date().toISOString(),
				},
			];

			const tree = generateGrowthTree(nodes);
			expect(tree.nodes[0].id).toBe('1');
			expect(tree.nodes[1].id).toBe('2');
		});
	});

	describe('calculateGrowthMetrics', () => {
		it('should calculate emotional growth', () => {
			const nodes: MemoryNode[] = [
				{
					node_id: '1',
					event_date: '2026-01-01',
					npc_state: { current_emotion: 'sad', attitude_towards_user: 'distant' },
					salience_score: 5,
					core_event: '事件1',
					memory_source: 'txt_extraction',
					opening_mode: 'dialogue_driven',
					created_at: new Date().toISOString(),
				},
				{
					node_id: '2',
					event_date: '2026-02-01',
					npc_state: { current_emotion: 'joyful', attitude_towards_user: 'close' },
					salience_score: 9,
					core_event: '事件2',
					memory_source: 'txt_extraction',
					opening_mode: 'dialogue_driven',
					created_at: new Date().toISOString(),
				},
			];

			const metrics = calculateGrowthMetrics(nodes);
			expect(metrics.emotionalGrowth).toBeGreaterThan(0);
		});

		it('should calculate relationship depth', () => {
			const nodes: MemoryNode[] = [
				{
					node_id: '1',
					event_date: '2026-01-01',
					npc_state: { current_emotion: 'calm', attitude_towards_user: 'neutral' },
					salience_score: 5,
					core_event: '事件1',
					memory_source: 'txt_extraction',
					opening_mode: 'dialogue_driven',
					created_at: new Date().toISOString(),
				},
			];

			const metrics = calculateGrowthMetrics(nodes);
			expect(metrics.relationshipDepth).toBeGreaterThanOrEqual(0);
			expect(metrics.relationshipDepth).toBeLessThanOrEqual(1);
		});

		it('should calculate total memories', () => {
			const nodes: MemoryNode[] = [
				{ node_id: '1', event_date: '2026-01-01', npc_state: { current_emotion: 'calm', attitude_towards_user: '中性' }, salience_score: 7, core_event: '事件1', memory_source: 'txt_extraction', opening_mode: 'dialogue_driven', created_at: new Date().toISOString() },
				{ node_id: '2', event_date: '2026-02-01', npc_state: { current_emotion: 'joyful', attitude_towards_user: '友好' }, salience_score: 8, core_event: '事件2', memory_source: 'txt_extraction', opening_mode: 'dialogue_driven', created_at: new Date().toISOString() },
			];

			const metrics = calculateGrowthMetrics(nodes);
			expect(metrics.totalMemories).toBe(2);
		});

		it('should calculate timespan', () => {
			const nodes: MemoryNode[] = [
				{
					node_id: '1',
					event_date: '2026-01-01',
					npc_state: { current_emotion: 'calm', attitude_towards_user: '中性' },
					salience_score: 7,
					core_event: '事件1',
					memory_source: 'txt_extraction',
					opening_mode: 'dialogue_driven',
					created_at: new Date().toISOString(),
				},
				{
					node_id: '2',
					event_date: '2026-03-01',
					npc_state: { current_emotion: 'joyful', attitude_towards_user: '友好' },
					salience_score: 8,
					core_event: '事件2',
					memory_source: 'txt_extraction',
					opening_mode: 'dialogue_driven',
					created_at: new Date().toISOString(),
				},
			];

			const metrics = calculateGrowthMetrics(nodes);
			expect(metrics.timespanDays).toBeGreaterThan(0);
		});
	});
});
