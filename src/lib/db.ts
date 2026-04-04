// ============================================================
// 数据库操作模块
// 描述: 封装 Memory_Nodes, Hidden_Clues 的 CRUD 操作
// ============================================================

import { supabase } from './supabase';
import type { MemoryNode, HiddenClue } from './supabase';

// 嵌入向量维度
const EMBEDDING_DIM = 768;

// ============================================================
// MemoryNode 操作
// ============================================================

/**
 * 创建新的记忆节点
 * @param node - 节点数据（不含 node_id 和 created_at）
 * @returns 创建的节点
 */
export async function createMemoryNode(
	node: Omit<MemoryNode, 'node_id' | 'created_at'>
): Promise<MemoryNode> {
	const { data, error } = await supabase
		.from('Memory_Nodes')
		.insert([{
			...node,
			embedding: node.embedding || null,
		}])
		.select()
		.single();

	if (error) {
		console.error('[DB] Failed to create memory node:', error);
		throw new Error(`创建记忆节点失败: ${error.message}`);
	}

	return data as MemoryNode;
}

/**
 * 批量创建记忆节点
 * @param nodes - 节点数组
 * @returns 创建的节点数组
 */
export async function createMemoryNodes(
	nodes: Omit<MemoryNode, 'node_id' | 'created_at'>[]
): Promise<MemoryNode[]> {
	const { data, error } = await supabase
		.from('Memory_Nodes')
		.insert(nodes.map(n => ({
			...n,
			embedding: n.embedding || null,
		})))
		.select();

	if (error) {
		console.error('[DB] Failed to create memory nodes:', error);
		throw new Error(`批量创建记忆节点失败: ${error.message}`);
	}

	return data as MemoryNode[];
}

/**
 * 获取用户的所有记忆节点（按日期排序）
 * @param userId - 用户ID
 * @param minSalience - 最小显著性分数（默认7，只返回关键节点）
 * @returns 节点数组
 */
export async function getMemoryNodes(
	userId: string,
	minSalience: number = 7
): Promise<MemoryNode[]> {
	const { data, error } = await supabase
		.from('Memory_Nodes')
		.select('*')
		.eq('user_id', userId)
		.gte('salience_score', minSalience)
		.order('event_date', { ascending: true });

	if (error) {
		console.error('[DB] Failed to fetch memory nodes:', error);
		throw new Error(`获取记忆节点失败: ${error.message}`);
	}

	return (data || []) as MemoryNode[];
}

/**
 * 获取单个记忆节点详情
 * @param nodeId - 节点ID
 * @returns 节点数据或 null
 */
export async function getMemoryNodeById(
	nodeId: string
): Promise<MemoryNode | null> {
	const { data, error } = await supabase
		.from('Memory_Nodes')
		.select('*')
		.eq('node_id', nodeId)
		.single();

	if (error) {
		if (error.code === 'PGRST116') {
			return null;
		}
		console.error('[DB] Failed to fetch memory node:', error);
		throw new Error(`获取记忆节点失败: ${error.message}`);
	}

	return data as MemoryNode;
}

/**
 * 更新记忆节点
 * @param nodeId - 节点ID
 * @param updates - 更新字段
 */
export async function updateMemoryNode(
	nodeId: string,
	updates: Partial<Omit<MemoryNode, 'node_id' | 'user_id' | 'created_at'>>
): Promise<void> {
	const { error } = await supabase
		.from('Memory_Nodes')
		.update(updates)
		.eq('node_id', nodeId);

	if (error) {
		console.error('[DB] Failed to update memory node:', error);
		throw new Error(`更新记忆节点失败: ${error.message}`);
	}
}

/**
 * 删除记忆节点（级联删除关联的线索）
 * @param nodeId - 节点ID
 */
export async function deleteMemoryNode(nodeId: string): Promise<void> {
	const { error } = await supabase
		.from('Memory_Nodes')
		.delete()
		.eq('node_id', nodeId);

	if (error) {
		console.error('[DB] Failed to delete memory node:', error);
		throw new Error(`删除记忆节点失败: ${error.message}`);
	}
}

// ============================================================
// HiddenClue 操作
// ============================================================

/**
 * 为节点创建隐藏线索
 * @param clues - 线索数组
 * @returns 创建的线索数组
 */
export async function createHiddenClues(
	clues: Omit<HiddenClue, 'clue_id' | 'created_at'>[]
): Promise<HiddenClue[]> {
	const { data, error } = await supabase
		.from('Hidden_Clues')
		.insert(clues)
		.select();

	if (error) {
		console.error('[DB] Failed to create hidden clues:', error);
		throw new Error(`创建线索失败: ${error.message}`);
	}

	return (data || []) as HiddenClue[];
}

/**
 * 获取节点的所有线索
 * @param nodeId - 节点ID
 * @returns 线索数组
 */
export async function getHiddenCluesByNode(nodeId: string): Promise<HiddenClue[]> {
	const { data, error } = await supabase
		.from('Hidden_Clues')
		.select('*')
		.eq('node_id', nodeId)
		.order('created_at', { ascending: true });

	if (error) {
		console.error('[DB] Failed to fetch hidden clues:', error);
		throw new Error(`获取线索失败: ${error.message}`);
	}

	return (data || []) as HiddenClue[];
}

/**
 * 获取节点的未解锁线索（用于AI判断触发条件）
 * @param nodeId - 节点ID
 * @returns 未解锁线索数组
 */
export async function getUnlockedClues(nodeId: string): Promise<HiddenClue[]> {
	const { data, error } = await supabase
		.from('Hidden_Clues')
		.select('*')
		.eq('node_id', nodeId)
		.eq('is_unlocked', false);

	if (error) {
		console.error('[DB] Failed to fetch unlocked clues:', error);
		throw new Error(`获取线索失败: ${error.message}`);
	}

	return (data || []) as HiddenClue[];
}

/**
 * 解锁线索
 * @param clueId - 线索ID
 * @returns 更新后的线索
 */
export async function unlockClue(clueId: string): Promise<HiddenClue> {
	const { data, error } = await supabase
		.from('Hidden_Clues')
		.update({ is_unlocked: true })
		.eq('clue_id', clueId)
		.select()
		.single();

	if (error) {
		console.error('[DB] Failed to unlock clue:', error);
		throw new Error(`解锁线索失败: ${error.message}`);
	}

	return data as HiddenClue;
}

// ============================================================
// 向量搜索
// ============================================================

/**
 * 执行向量相似度搜索
 * @param queryEmbedding - 查询向量
 * @param matchThreshold - 相似度阈值（0-1）
 * @param matchCount - 返回结果数
 * @param userId - 可选用户ID过滤
 * @returns 匹配的节点及相似度
 */
export async function searchSimilarNodes(
	queryEmbedding: number[],
	matchThreshold: number = 0.8,
	matchCount: number = 10,
	userId?: string
): Promise<Array<MemoryNode & { similarity: number }>> {
	// 验证向量维度
	if (queryEmbedding.length !== EMBEDDING_DIM) {
		throw new Error(`向量维度不匹配: 期望 ${EMBEDDING_DIM}, 实际 ${queryEmbedding.length}`);
	}

	const { data, error } = await supabase.rpc('match_memory_nodes', {
		query_embedding: queryEmbedding,
		match_threshold: matchThreshold,
		match_count: matchCount,
		p_user_id: userId || null,
	});

	if (error) {
		console.error('[DB] Vector search failed:', error);
		throw new Error(`向量搜索失败: ${error.message}`);
	}

	return (data || []) as Array<MemoryNode & { similarity: number }>;
}

// ============================================================
// 批量事务操作
// ============================================================

/**
 * 提交完整的记忆节点批次（节点 + 线索）
 * @param userId - 用户ID
 * @param nodes - 节点数组
 * @param cluesMap - 节点ID到线索数组的映射
 * @returns 创建的节点和线索
 */
export async function commitMemoryBatch(
	userId: string,
	nodes: Omit<MemoryNode, 'node_id' | 'user_id' | 'created_at'>[],
	cluesMap: Record<string, Omit<HiddenClue, 'clue_id' | 'node_id' | 'created_at'>[]>
): Promise<{
	nodes: MemoryNode[];
	clues: HiddenClue[];
}> {
	// 1. 创建节点
	const nodesWithUser = nodes.map(n => ({
		...n,
		user_id: userId,
	}));

	const createdNodes = await createMemoryNodes(nodesWithUser);

	// 2. 收集线索（使用临时ID映射）
	const tempIdMap = new Map<string, string>();
	nodes.forEach((n, i) => {
		const nodeWithId = n as unknown as { node_id?: string };
		const tempId = nodeWithId.node_id || `temp-${i}`;
		tempIdMap.set(tempId, createdNodes[i].node_id);
	});

	// 3. 创建线索
	const allClues: Omit<HiddenClue, 'clue_id' | 'created_at'>[] = [];
	Object.entries(cluesMap).forEach(([tempNodeId, clues]) => {
		const realNodeId = tempIdMap.get(tempNodeId);
		if (realNodeId) {
			clues.forEach(c => {
				allClues.push({
					...c,
					node_id: realNodeId,
				});
			});
		}
	});

	let createdClues: HiddenClue[] = [];
	if (allClues.length > 0) {
		createdClues = await createHiddenClues(allClues);
	}

	return {
		nodes: createdNodes,
		clues: createdClues,
	};
}
