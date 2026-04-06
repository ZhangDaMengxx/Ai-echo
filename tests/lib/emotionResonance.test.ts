// ============================================================
// 情感共振网络测试
// 功能: 测试跨节点情感关联分析和共振指数计算
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest';
import {
	calculateEmotionResonance,
	findEmotionClusters,
	generateEmotionGraph,
	calculateResonanceIndex,
	EMOTION_RELATIONSHIPS,
	type EmotionNode,
	type EmotionEdge,
	type EmotionCluster,
} from '../../src/lib/emotionResonance';

describe('Emotion Resonance Network', () => {
	describe('EMOTION_RELATIONSHIPS', () => {
		it('should define emotion compatibility matrix', () => {
			expect(EMOTION_RELATIONSHIPS.calm).toBeDefined();
			expect(EMOTION_RELATIONSHIPS.angry).toBeDefined();
			expect(EMOTION_RELATIONSHIPS.joyful).toBeDefined();
		});

		it('should have symmetric relationships', () => {
			const calmToAngry = EMOTION_RELATIONSHIPS.calm.angry;
			const angryToCalm = EMOTION_RELATIONSHIPS.angry.calm;
			expect(calmToAngry).toBe(angryToCalm);
		});

		it('should have positive compatibility for similar emotions', () => {
			expect(EMOTION_RELATIONSHIPS.calm.joyful).toBeGreaterThan(0);
			expect(EMOTION_RELATIONSHIPS.angry.sad).toBeGreaterThan(0);
		});

		it('should have negative compatibility for opposite emotions', () => {
			expect(EMOTION_RELATIONSHIPS.joyful.sad).toBeLessThan(0);
			expect(EMOTION_RELATIONSHIPS.angry.calm).toBeLessThan(0);
		});
	});

	describe('calculateEmotionResonance', () => {
		it('should return high resonance for same emotion', () => {
			const score = calculateEmotionResonance('calm', 'calm');
			expect(score).toBe(1.0);
		});

		it('should return positive resonance for compatible emotions', () => {
			const score = calculateEmotionResonance('calm', 'joyful');
			expect(score).toBeGreaterThan(0);
		});

		it('should return negative resonance for conflicting emotions', () => {
			const score = calculateEmotionResonance('angry', 'calm');
			expect(score).toBeLessThan(0);
		});

		it('should handle all defined emotions', () => {
			const emotions = ['calm', 'angry', 'sad', 'joyful', 'melancholy', 'hopeful', 'passionate', 'mysterious'];
			for (const e1 of emotions) {
				for (const e2 of emotions) {
					const score = calculateEmotionResonance(e1, e2);
					expect(typeof score).toBe('number');
					expect(score).toBeGreaterThanOrEqual(-1);
					expect(score).toBeLessThanOrEqual(1);
				}
			}
		});
	});

	describe('findEmotionClusters', () => {
		it('should group similar emotions together', () => {
			const nodes: EmotionNode[] = [
				{ id: '1', emotion: 'calm', intensity: 0.8, date: '2026-01-01' },
				{ id: '2', emotion: 'joyful', intensity: 0.7, date: '2026-01-02' },
				{ id: '3', emotion: 'angry', intensity: 0.9, date: '2026-01-03' },
				{ id: '4', emotion: 'sad', intensity: 0.6, date: '2026-01-04' },
			];

			const clusters = findEmotionClusters(nodes);
			expect(clusters.length).toBeGreaterThan(0);
		});

		it('should identify positive and negative clusters', () => {
			const nodes: EmotionNode[] = [
				{ id: '1', emotion: 'joyful', intensity: 0.8, date: '2026-01-01' },
				{ id: '2', emotion: 'hopeful', intensity: 0.7, date: '2026-01-02' },
				{ id: '3', emotion: 'angry', intensity: 0.9, date: '2026-01-03' },
				{ id: '4', emotion: 'sad', intensity: 0.8, date: '2026-01-04' },
			];

			const clusters = findEmotionClusters(nodes);
			const positiveCluster = clusters.find(c => c.dominantEmotion === 'joyful');
			const negativeCluster = clusters.find(c => c.dominantEmotion === 'angry');
			
			expect(positiveCluster || negativeCluster).toBeDefined();
		});

		it('should calculate cluster intensity correctly', () => {
			const nodes: EmotionNode[] = [
				{ id: '1', emotion: 'calm', intensity: 0.8, date: '2026-01-01' },
				{ id: '2', emotion: 'calm', intensity: 0.6, date: '2026-01-02' },
			];

			const clusters = findEmotionClusters(nodes);
			const cluster = clusters.find(c => c.dominantEmotion === 'calm');
			if (cluster) {
				expect(cluster.avgIntensity).toBeCloseTo(0.7, 1);
			}
		});
	});

	describe('generateEmotionGraph', () => {
		it('should generate nodes for each memory node', () => {
			const memoryNodes = [
				{ node_id: '1', event_date: '2026-01-01', npc_state: { current_emotion: 'calm' } },
				{ node_id: '2', event_date: '2026-01-02', npc_state: { current_emotion: 'joyful' } },
			];

			const graph = generateEmotionGraph(memoryNodes as any);
			expect(graph.nodes.length).toBe(2);
		});

		it('should create edges between temporally close nodes', () => {
			const memoryNodes = [
				{ node_id: '1', event_date: '2026-01-01', npc_state: { current_emotion: 'calm' } },
				{ node_id: '2', event_date: '2026-01-02', npc_state: { current_emotion: 'joyful' } },
				{ node_id: '3', event_date: '2026-06-01', npc_state: { current_emotion: 'angry' } },
			];

			const graph = generateEmotionGraph(memoryNodes as any);
			const edge12 = graph.edges.find(e => 
				(e.source === '1' && e.target === '2') || (e.source === '2' && e.target === '1')
			);
			expect(edge12).toBeDefined();
		});

		it('should calculate edge weights based on emotion resonance', () => {
			const memoryNodes = [
				{ node_id: '1', event_date: '2026-01-01', npc_state: { current_emotion: 'calm' } },
				{ node_id: '2', event_date: '2026-01-02', npc_state: { current_emotion: 'joyful' } },
			];

			const graph = generateEmotionGraph(memoryNodes as any);
			expect(graph.edges[0].weight).toBeGreaterThan(0);
		});
	});

	describe('calculateResonanceIndex', () => {
		it('should return 0 for empty graph', () => {
			const index = calculateResonanceIndex({ nodes: [], edges: [] });
			expect(index).toBe(0);
		});

		it('should return high index for strongly connected positive emotions', () => {
			const graph = {
				nodes: [
					{ id: '1', emotion: 'joyful', intensity: 0.8 },
					{ id: '2', emotion: 'hopeful', intensity: 0.7 },
				],
				edges: [
					{ source: '1', target: '2', weight: 0.8, resonance: 0.8 },
				],
			};

			const index = calculateResonanceIndex(graph as any);
			expect(index).toBeGreaterThan(0.5);
		});

		it('should return low index for conflicting emotions', () => {
			const graph = {
				nodes: [
					{ id: '1', emotion: 'angry', intensity: 0.9 },
					{ id: '2', emotion: 'calm', intensity: 0.3 },
				],
				edges: [
					{ source: '1', target: '2', weight: 0.3, resonance: -0.5 },
				],
			};

			const index = calculateResonanceIndex(graph as any);
			expect(index).toBeLessThan(0.5);
		});
	});
});
