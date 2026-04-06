// ============================================================
// 数据库操作模块
// 描述: 使用 IndexedDB 本地存储替代 Supabase
// ============================================================

import { localDb, MemoryNode, HiddenClue, CharacterProfile } from './localDb';
export type { MemoryNode, HiddenClue, CharacterProfile } from './localDb';

// ============================================================
// MemoryNode 操作
// ============================================================

/**
 * 创建新的记忆节点
 * @param node - 节点数据
 * @returns 创建的节点
 */
export async function createMemoryNode(
	node: Omit<MemoryNode, 'node_id' | 'created_at'>
): Promise<MemoryNode> {
	return localDb.insertNode(node);
}

/**
 * 批量创建记忆节点
 * @param nodes - 节点数组
 * @returns 创建的节点数组
 */
export async function createMemoryNodes(
	nodes: Omit<MemoryNode, 'node_id' | 'created_at'>[]
): Promise<MemoryNode[]> {
	const created: MemoryNode[] = [];
	for (const node of nodes) {
		const n = await localDb.insertNode(node);
		created.push(n);
	}
	return created;
}

/**
 * 获取所有记忆节点（按日期排序）
 * @param minSalience - 最小显著性分数
 * @returns 节点数组
 */
export async function getMemoryNodes(
	_minSalience: number = 7
): Promise<MemoryNode[]> {
	const nodes = await localDb.getAllNodes();
	// 过滤显著性分数
	return nodes.filter(n => n.salience_score >= _minSalience);
}

/**
 * 获取单个记忆节点详情
 * @param nodeId - 节点ID
 * @returns 节点数据或 null
 */
export async function getMemoryNodeById(
	nodeId: string
): Promise<MemoryNode | null> {
	return localDb.getNodeById(nodeId);
}

/**
 * 更新记忆节点
 * @param nodeId - 节点ID
 * @param updates - 更新字段
 */
export async function updateMemoryNode(
	nodeId: string,
	updates: Partial<Omit<MemoryNode, 'node_id' | 'created_at'>>
): Promise<void> {
	return localDb.updateNode(nodeId, updates);
}

/**
 * 删除记忆节点
 * @param nodeId - 节点ID
 */
export async function deleteMemoryNode(nodeId: string): Promise<void> {
	return localDb.deleteNode(nodeId);
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
	characterId: string,
	clues: Omit<HiddenClue, 'clue_id' | 'character_id' | 'created_at'>[]
): Promise<HiddenClue[]> {
	const created: HiddenClue[] = [];
	for (const clue of clues) {
		const c = await localDb.insertClue({
			...clue,
			character_id: characterId
		});
		created.push(c);
	}
	return created;
}

/**
 * 获取节点的所有线索
 * @param nodeId - 节点ID
 * @returns 线索数组
 */
export async function getHiddenCluesByNode(nodeId: string): Promise<HiddenClue[]> {
	return localDb.getCluesByNodeId(nodeId);
}

/**
 * 获取节点的未解锁线索
 * @param nodeId - 节点ID
 * @returns 未解锁线索数组
 */
export async function getUnlockedClues(nodeId: string): Promise<HiddenClue[]> {
	const clues = await localDb.getCluesByNodeId(nodeId);
	return clues.filter(c => !c.is_unlocked);
}

/**
 * 解锁线索
 * @param clueId - 线索ID
 */
export async function unlockClue(clueId: string): Promise<HiddenClue> {
	await localDb.unlockClue(clueId);
	// 返回更新后的线索
	const nodeId = clueId.split('_')[1]; // 简化处理
	const clues = await localDb.getCluesByNodeId(nodeId);
	const clue = clues.find(c => c.clue_id === clueId);
	if (!clue) throw new Error('Clue not found');
	return clue;
}

// ============================================================
// 向量搜索 (本地简化版)
// ============================================================

/**
 * 执行向量相似度搜索（本地简化版，实际使用文本匹配）
 * @param _queryEmbedding - 查询向量（不使用）
 * @param _matchThreshold - 相似度阈值
 * @param matchCount - 返回结果数
 * @returns 匹配的节点
 */
export async function searchSimilarNodes(
	_queryEmbedding: number[],
	// _matchThreshold: number = 0.8,
	matchCount: number = 10
): Promise<Array<MemoryNode & { similarity: number }>> {
	// 本地版本暂时返回所有节点，按显著性排序
	const nodes = await localDb.getAllNodes();
	return nodes
		.sort((a, b) => b.salience_score - a.salience_score)
		.slice(0, matchCount)
		.map(n => ({ ...n, similarity: n.salience_score / 10 }));
}

// ============================================================
// 批量事务操作
// ============================================================

/**
 * 提交完整的记忆节点批次（节点 + 线索）
 * @param nodes - 节点数组
 * @param cluesMap - 节点ID到线索数组的映射
 * @returns 创建的节点和线索
 */
export async function commitMemoryBatch(
	characterId: string,
	nodes: Omit<MemoryNode, 'node_id' | 'character_id' | 'created_at'>[],
	cluesMap: Record<string, Omit<HiddenClue, 'clue_id' | 'character_id' | 'node_id' | 'created_at'>[]>
): Promise<{
	nodes: MemoryNode[];
	clues: HiddenClue[];
}> {
	const createdNodes: MemoryNode[] = [];
	const createdClues: HiddenClue[] = [];

	for (const node of nodes) {
		// 创建节点
		const createdNode = await localDb.insertNode({
			...node,
			character_id: characterId
		});
		createdNodes.push(createdNode);

		// 创建关联线索
		const clues = cluesMap[node.event_date] || [];
		for (const clue of clues) {
			const createdClue = await localDb.insertClue({
				...clue,
				character_id: characterId,
				node_id: createdNode.node_id,
			});
			createdClues.push(createdClue);
		}
	}

	return {
		nodes: createdNodes,
		clues: createdClues,
	};
}

// ============================================================
// 人物画像操作
// ============================================================

/**
 * 获取人物画像
 * @returns 人物画像或 null
 */
export async function getCharacterProfile(): Promise<CharacterProfile | null> {
	return localDb.getProfile();
}

/**
 * 更新人物画像
 * @param profile - 画像数据
 */
export async function updateCharacterProfile(
	profile: Partial<CharacterProfile>
): Promise<void> {
	return localDb.updateProfile(profile);
}
