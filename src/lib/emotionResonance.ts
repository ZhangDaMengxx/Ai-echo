// ============================================================
// Emotion Resonance Network: 情感共振网络
// 功能: 跨节点情感关联分析、情感图谱生成、共振指数计算
// 文件位置: src/lib/emotionResonance.ts
// 主要依赖: localDb (MemoryNode 数据)
// 被引用: EmotionGraph.tsx (情感图谱可视化组件)
//
// 维护记录:
//   - 2026-04-06: 创建
// ============================================================

import type { MemoryNode } from './localDb';

// 情绪类型定义
export type EmotionType = 
	| 'calm' 
	| 'angry' 
	| 'sad' 
	| 'joyful' 
	| 'melancholy' 
	| 'hopeful' 
	| 'passionate' 
	| 'mysterious';

// 情绪节点
export interface EmotionNode {
	id: string;
	emotion: EmotionType;
	intensity: number;
	date: string;
	x?: number;
	y?: number;
}

// 情绪边（关联）
export interface EmotionEdge {
	source: string;
	target: string;
	weight: number;
	resonance: number;
	daysApart: number;
}

// 情绪图谱
export interface EmotionGraph {
	nodes: EmotionNode[];
	edges: EmotionEdge[];
}

// 情绪聚类
export interface EmotionCluster {
	id: string;
	nodes: string[];
	dominantEmotion: EmotionType;
	avgIntensity: number;
	startDate: string;
	endDate: string;
}

// 情绪兼容性矩阵 (-1 ~ 1)
// 正值表示情绪相容，负值表示情绪冲突
export const EMOTION_RELATIONSHIPS: Record<EmotionType, Partial<Record<EmotionType, number>>> = {
	calm: {
		calm: 1.0,
		joyful: 0.5,
		hopeful: 0.4,
		mysterious: 0.2,
		melancholy: -0.2,
		sad: -0.3,
		passionate: -0.4,
		angry: -0.6,
	},
	joyful: {
		joyful: 1.0,
		calm: 0.5,
		hopeful: 0.7,
		passionate: 0.6,
		mysterious: 0.1,
		melancholy: -0.4,
		sad: -0.7,
		angry: -0.5,
	},
	hopeful: {
		hopeful: 1.0,
		joyful: 0.7,
		calm: 0.4,
		passionate: 0.5,
		mysterious: 0.3,
		melancholy: -0.1,
		sad: -0.4,
		angry: -0.3,
	},
	passionate: {
		passionate: 1.0,
		joyful: 0.6,
		angry: 0.4,
		hopeful: 0.5,
		mysterious: 0.2,
		calm: -0.4,
		melancholy: -0.3,
		sad: -0.2,
	},
	angry: {
		angry: 1.0,
		passionate: 0.4,
		sad: 0.3,
		melancholy: 0.1,
		mysterious: -0.2,
		calm: -0.6,
		joyful: -0.5,
		hopeful: -0.3,
	},
	sad: {
		sad: 1.0,
		melancholy: 0.7,
		angry: 0.3,
		calm: -0.3,
		hopeful: -0.4,
		joyful: -0.7,
		passionate: -0.2,
		mysterious: 0.1,
	},
	melancholy: {
		melancholy: 1.0,
		sad: 0.7,
		mysterious: 0.4,
		calm: -0.2,
		hopeful: -0.1,
		joyful: -0.4,
		angry: 0.1,
		passionate: -0.3,
	},
	mysterious: {
		mysterious: 1.0,
		melancholy: 0.4,
		calm: 0.2,
		passionate: 0.2,
		joyful: 0.1,
		sad: 0.1,
		angry: -0.2,
		hopeful: 0.3,
	},
};

/**
 * 计算两个情绪之间的共振值
 * @param emotion1 - 第一个情绪
 * @param emotion2 - 第二个情绪
 * @returns 共振值 (-1 ~ 1)
 */
export function calculateEmotionResonance(
	emotion1: EmotionType,
	emotion2: EmotionType
): number {
	if (emotion1 === emotion2) {
		return 1.0;
	}

	const rel = EMOTION_RELATIONSHIPS[emotion1];
	if (!rel) return 0;

	const score = rel[emotion2];
	return score ?? 0;
}

/**
 * 计算两天之间的时间衰减因子
 * @param days - 相隔天数
 * @returns 衰减因子 (0 ~ 1)
 */
function calculateTimeDecay(days: number): number {
	const DECAY_CONSTANT = 30;
	return Math.exp(-days / DECAY_CONSTANT);
}

/**
 * 计算两个记忆节点之间的边权重
 * @param node1 - 第一个节点
 * @param node2 - 第二个节点
 * @returns 边权重 (0 ~ 1)
 */
function calculateEdgeWeight(
	node1: MemoryNode,
	node2: MemoryNode
): { weight: number; resonance: number; daysApart: number } {
	const date1 = new Date(node1.event_date);
	const date2 = new Date(node2.event_date);
	const daysApart = Math.abs((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));

	const emotion1 = node1.npc_state.current_emotion as EmotionType;
	const emotion2 = node2.npc_state.current_emotion as EmotionType;

	const resonance = calculateEmotionResonance(emotion1, emotion2);
	const timeDecay = calculateTimeDecay(daysApart);

	// 权重 = 情绪共振 × 时间衰减
	const weight = Math.abs(resonance) * timeDecay;

	return { weight, resonance, daysApart };
}

/**
 * 生成情感图谱
 * @param memoryNodes - 记忆节点列表
 * @returns 情感图谱
 */
export function generateEmotionGraph(memoryNodes: MemoryNode[]): EmotionGraph {
	const nodes: EmotionNode[] = memoryNodes.map((node, index) => ({
		id: node.node_id,
		emotion: node.npc_state.current_emotion as EmotionType,
		intensity: node.salience_score / 10,
		date: node.event_date,
		x: Math.cos((index / memoryNodes.length) * Math.PI * 2) * 100,
		y: Math.sin((index / memoryNodes.length) * Math.PI * 2) * 100,
	}));

	const edges: EmotionEdge[] = [];
	const MAX_DAYS_APART = 90;

	for (let i = 0; i < memoryNodes.length; i++) {
		for (let j = i + 1; j < memoryNodes.length; j++) {
			const { weight, resonance, daysApart } = calculateEdgeWeight(
				memoryNodes[i],
				memoryNodes[j]
			);

			if (daysApart <= MAX_DAYS_APART && weight > 0.1) {
				edges.push({
					source: memoryNodes[i].node_id,
					target: memoryNodes[j].node_id,
					weight,
					resonance,
					daysApart,
				});
			}
		}
	}

	return { nodes, edges };
}

/**
 * 查找情绪聚类
 * @param emotionNodes - 情绪节点列表
 * @returns 情绪聚类列表
 */
export function findEmotionClusters(emotionNodes: EmotionNode[]): EmotionCluster[] {
	if (emotionNodes.length === 0) return [];

	const clusters: EmotionCluster[] = [];
	const visited = new Set<string>();
	const RESONANCE_THRESHOLD = 0.3;

	for (const node of emotionNodes) {
		if (visited.has(node.id)) continue;

		const clusterNodes: EmotionNode[] = [node];
		visited.add(node.id);

		for (const other of emotionNodes) {
			if (visited.has(other.id)) continue;

			const resonance = calculateEmotionResonance(node.emotion, other.emotion);
			if (resonance >= RESONANCE_THRESHOLD) {
				clusterNodes.push(other);
				visited.add(other.id);
			}
		}

		if (clusterNodes.length >= 1) {
			const dominantEmotion = findDominantEmotion(clusterNodes);
			const avgIntensity = clusterNodes.reduce((sum, n) => sum + n.intensity, 0) / clusterNodes.length;
			const dates = clusterNodes.map(n => n.date).sort();

			clusters.push({
				id: `cluster_${clusters.length}`,
				nodes: clusterNodes.map(n => n.id),
				dominantEmotion,
				avgIntensity,
				startDate: dates[0],
				endDate: dates[dates.length - 1],
			});
		}
	}

	return clusters;
}

/**
 * 查找主导情绪
 * @param nodes - 情绪节点列表
 * @returns 主导情绪类型
 */
function findDominantEmotion(nodes: EmotionNode[]): EmotionType {
	const emotionCounts: Partial<Record<EmotionType, number>> = {};

	for (const node of nodes) {
		emotionCounts[node.emotion] = (emotionCounts[node.emotion] || 0) + node.intensity;
	}

	let maxCount = -1;
	let dominant: EmotionType = 'calm';

	for (const [emotion, count] of Object.entries(emotionCounts)) {
		if (count && count > maxCount) {
			maxCount = count;
			dominant = emotion as EmotionType;
		}
	}

	return dominant;
}

/**
 * 计算整体共振指数
 * @param graph - 情感图谱
 * @returns 共振指数 (0 ~ 1)
 */
export function calculateResonanceIndex(graph: EmotionGraph): number {
	if (graph.nodes.length === 0) return 0;
	if (graph.edges.length === 0) return 0.5;

	let totalResonance = 0;
	let totalWeight = 0;

	for (const edge of graph.edges) {
		totalResonance += edge.resonance * edge.weight;
		totalWeight += edge.weight;
	}

	if (totalWeight === 0) return 0.5;

	const avgResonance = totalResonance / totalWeight;
	// 映射到 0 ~ 1 范围
	return (avgResonance + 1) / 2;
}

/**
 * 获取情绪趋势
 * @param memoryNodes - 按时间排序的记忆节点
 * @returns 情绪趋势数组
 */
export function getEmotionTrend(memoryNodes: MemoryNode[]): Array<{
	date: string;
	emotion: EmotionType;
	intensity: number;
	resonanceScore: number;
}> {
	if (memoryNodes.length < 2) return [];

	const sortedNodes = [...memoryNodes].sort(
		(a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
	);

	const trend: Array<{
		date: string;
		emotion: EmotionType;
		intensity: number;
		resonanceScore: number;
	}> = [];

	for (let i = 0; i < sortedNodes.length; i++) {
		const current = sortedNodes[i];
		const prev = i > 0 ? sortedNodes[i - 1] : null;

		let resonanceScore = 0.5;
		if (prev) {
			resonanceScore = (calculateEmotionResonance(
				prev.npc_state.current_emotion as EmotionType,
				current.npc_state.current_emotion as EmotionType
			) + 1) / 2;
		}

		trend.push({
			date: current.event_date,
			emotion: current.npc_state.current_emotion as EmotionType,
			intensity: current.salience_score / 10,
			resonanceScore,
		});
	}

	return trend;
}
