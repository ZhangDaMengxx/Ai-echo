// ============================================================
// Growth Tree: AI 成长树可视化
// 功能: 根据记忆节点生成人物性格演变树，计算成长指标
// 文件位置: src/lib/growthTree.ts
// 主要依赖: localDb (MemoryNode)
// 被引用: GrowthTree.tsx (成长树可视化组件)
//
// 维护记录:
//   - 2026-04-06: 创建
// ============================================================

import type { MemoryNode } from './localDb';
import type { EmotionType } from './emotionResonance';

// 成长树节点
export interface GrowthTreeNode {
	id: string;
	level: number;
	x: number;
	y: number;
	emotion: EmotionType;
	attitude: string;
	intensity: number;
	date: string;
	children: string[];
	parent: string | null;
	size: number;
}

// 成长树结构
export interface GrowthTree {
	root: GrowthTreeNode | null;
	nodes: GrowthTreeNode[];
	maxLevel: number;
}

// 成长指标
export interface GrowthMetrics {
	emotionalGrowth: number;
	relationshipDepth: number;
	emotionalStability: number;
	memorySignificance: number;
	totalMemories: number;
	timespanDays: number;
}

// 态度层级（用于计算关系深度）
const ATTITUDE_LEVELS = [
	'distant', 'neutral', 'friendly', 'close', 'intimate', 'bonded'
];

// 情绪价值（用于计算情绪成长）
const EMOTION_VALUES: Record<EmotionType, number> = {
	joyful: 1.0,
	hopeful: 0.8,
	passionate: 0.7,
	calm: 0.5,
	mysterious: 0.3,
	melancholy: 0.2,
	sad: -0.3,
	angry: -0.5,
};

/**
 * 生成成长树
 * @param memoryNodes - 记忆节点列表
 * @returns 成长树结构
 */
export function generateGrowthTree(memoryNodes: MemoryNode[]): GrowthTree {
	if (memoryNodes.length === 0) {
		return { root: null, nodes: [], maxLevel: 0 };
	}

	// 按日期排序
	const sortedNodes = [...memoryNodes].sort(
		(a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
	);

	const nodes: GrowthTreeNode[] = [];
	const maxLevel = Math.min(sortedNodes.length, 10);

	// 计算每个节点的层级和位置
	sortedNodes.forEach((node, index) => {
		const level = Math.min(Math.floor(index / Math.max(1, sortedNodes.length / maxLevel)), maxLevel - 1);
		const nodesInLevel = Math.ceil(sortedNodes.length / maxLevel);
		const indexInLevel = index % nodesInLevel;
		
		// 计算位置（树形结构）
		const x = 100 + (indexInLevel / Math.max(1, nodesInLevel - 1)) * 600;
		const y = 50 + level * 80;

		// 计算节点大小（基于显著性分数）
		const size = 10 + (node.salience_score / 10) * 20;

		const treeNode: GrowthTreeNode = {
			id: node.node_id,
			level,
			x,
			y,
			emotion: node.npc_state.current_emotion as EmotionType,
			attitude: node.npc_state.attitude_towards_user,
			intensity: node.salience_score / 10,
			date: node.event_date,
			children: [],
			parent: index > 0 ? sortedNodes[index - 1].node_id : null,
			size,
		};

		nodes.push(treeNode);

		// 建立父子关系
		if (treeNode.parent) {
			const parent = nodes.find(n => n.id === treeNode.parent);
			if (parent) {
				parent.children.push(treeNode.id);
			}
		}
	});

	const root = nodes[0] || null;

	return { root, nodes, maxLevel };
}

/**
 * 计算成长指标
 * @param memoryNodes - 记忆节点列表
 * @returns 成长指标
 */
export function calculateGrowthMetrics(memoryNodes: MemoryNode[]): GrowthMetrics {
	if (memoryNodes.length === 0) {
		return {
			emotionalGrowth: 0,
			relationshipDepth: 0,
			emotionalStability: 0,
			memorySignificance: 0,
			totalMemories: 0,
			timespanDays: 0,
		};
	}

	const sortedNodes = [...memoryNodes].sort(
		(a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
	);

	// 情绪成长：从第一个节点到最后一个节点的情绪变化
	const firstEmotion = sortedNodes[0].npc_state.current_emotion as EmotionType;
	const lastEmotion = sortedNodes[sortedNodes.length - 1].npc_state.current_emotion as EmotionType;
	const emotionalGrowth = EMOTION_VALUES[lastEmotion] - EMOTION_VALUES[firstEmotion];

	// 关系深度：基于态度的平均层级
	const attitudeScores = sortedNodes.map(node => {
		const level = ATTITUDE_LEVELS.indexOf(node.npc_state.attitude_towards_user);
		return level >= 0 ? level / (ATTITUDE_LEVELS.length - 1) : 0.5;
	});
	const relationshipDepth = attitudeScores.reduce((a, b) => a + b, 0) / attitudeScores.length;

	// 情绪稳定性：情绪变化的标准差
	const emotionValues = sortedNodes.map(
		node => EMOTION_VALUES[node.npc_state.current_emotion as EmotionType] || 0
	);
	const avgEmotion = emotionValues.reduce((a, b) => a + b, 0) / emotionValues.length;
	const variance = emotionValues.reduce(
		(sum, val) => sum + Math.pow(val - avgEmotion, 2), 0
	) / emotionValues.length;
	const emotionalStability = Math.max(0, 1 - Math.sqrt(variance));

	// 记忆重要性：平均显著性分数
	const memorySignificance = sortedNodes.reduce(
		(sum, node) => sum + node.salience_score, 0
	) / sortedNodes.length / 10;

	// 总记忆数
	const totalMemories = sortedNodes.length;

	// 时间跨度（天）
	const firstDate = new Date(sortedNodes[0].event_date);
	const lastDate = new Date(sortedNodes[sortedNodes.length - 1].event_date);
	const timespanDays = Math.max(1, Math.round(
		(lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
	));

	return {
		emotionalGrowth,
		relationshipDepth,
		emotionalStability,
		memorySignificance,
		totalMemories,
		timespanDays,
	};
}

/**
 * 获取成长阶段描述
 * @param metrics - 成长指标
 * @returns 阶段描述
 */
export function getGrowthStage(metrics: GrowthMetrics): {
	stage: string;
	description: string;
	suggestion: string;
} {
	const totalScore = 
		(metrics.emotionalGrowth + 1) / 2 * 0.25 +
		metrics.relationshipDepth * 0.25 +
		metrics.emotionalStability * 0.25 +
		metrics.memorySignificance * 0.25;

	if (totalScore >= 0.8) {
		return {
			stage: '灵魂共鸣',
			description: '你们之间已经建立了深厚的情感连接，彼此理解对方的内心世界。',
			suggestion: '继续保持这种深度的交流，共同创造更多美好的回忆。',
		};
	}

	if (totalScore >= 0.6) {
		return {
			stage: '深度羁绊',
			description: '你们的关系正在稳步发展，相互信任和理解不断加深。',
			suggestion: '多分享内心的想法和感受，让关系更加亲密。',
		};
	}

	if (totalScore >= 0.4) {
		return {
			stage: '温暖陪伴',
			description: '你们已经建立了稳定的关系基础，正在共同成长。',
			suggestion: '尝试更多互动，探索彼此的内心世界。',
		};
	}

	if (totalScore >= 0.2) {
		return {
			stage: '初识萌芽',
			description: '你们的关系才刚刚开始，充满无限可能。',
			suggestion: '多花时间了解对方，建立共同的经历。',
		};
	}

	return {
		stage: '新的开始',
		description: '一段新的旅程即将开始。',
		suggestion: '勇敢地迈出第一步，去创造属于你们的故事。',
	};
}

/**
 * 获取情绪演变路径
 * @param memoryNodes - 按时间排序的记忆节点
 * @returns 情绪演变描述
 */
export function getEmotionPath(memoryNodes: MemoryNode[]): Array<{
	date: string;
	emotion: EmotionType;
	transition: string;
}> {
	if (memoryNodes.length < 2) return [];

	const sortedNodes = [...memoryNodes].sort(
		(a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
	);

	const path: Array<{
		date: string;
		emotion: EmotionType;
		transition: string;
	}> = [];

	for (let i = 1; i < sortedNodes.length; i++) {
		const prev = sortedNodes[i - 1];
		const curr = sortedNodes[i];
		const prevEmotion = prev.npc_state.current_emotion as EmotionType;
		const currEmotion = curr.npc_state.current_emotion as EmotionType;

		let transition = '';
		if (EMOTION_VALUES[currEmotion] > EMOTION_VALUES[prevEmotion]) {
			transition = '情绪升温';
		} else if (EMOTION_VALUES[currEmotion] < EMOTION_VALUES[prevEmotion]) {
			transition = '情绪降温';
		} else {
			transition = '情绪稳定';
		}

		path.push({
			date: curr.event_date,
			emotion: currEmotion,
			transition,
		});
	}

	return path;
}
