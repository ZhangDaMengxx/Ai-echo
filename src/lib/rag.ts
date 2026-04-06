// ============================================================
// RAG: Retrieval-Augmented Generation
// 描述: 记忆检索增强生成，根据用户输入检索相关历史记忆
// ============================================================

import { localDb } from './localDb';
import { generateEmbedding, cosineSimilarity } from './embedding';

export interface RetrievedMemory {
	node_id: string;
	core_event: string;
	event_date: string;
	npc_state: {
		current_emotion: string;
		attitude_towards_user: string;
	};
	similarity: number;
	memory_source: string;
}

export interface RAGContext {
	retrievedMemories: RetrievedMemory[];
	contextString: string;
}

// 本地缓存节点向量（避免重复计算）
const nodeEmbeddingCache = new Map<string, number[]>();

/**
 * 为节点生成或获取缓存的向量
 */
async function getNodeEmbedding(node: {
	node_id: string;
	core_event: string;
	embedding?: number[];
}): Promise<number[]> {
	// 如果节点已有 embedding 字段，直接使用
	if (node.embedding && node.embedding.length > 0) {
		return node.embedding;
	}
	
	// 检查内存缓存
	if (nodeEmbeddingCache.has(node.node_id)) {
		return nodeEmbeddingCache.get(node.node_id)!;
	}
	
	// 生成新向量
	const embedding = await generateEmbedding(node.core_event);
	nodeEmbeddingCache.set(node.node_id, embedding);
	
	return embedding;
}

/**
 * 检索与查询相关的记忆节点
 * @param query - 用户输入/查询文本
 * @param characterId - 当前人物ID
 * @param topK - 返回最相关的K个记忆
 * @param threshold - 相似度阈值 (0-1)
 */
export async function retrieveRelevantMemories(
	query: string,
	characterId: string,
	topK = 3,
	threshold = 0.6
): Promise<RetrievedMemory[]> {
	try {
		// 1. 生成查询向量
		const queryEmbedding = await generateEmbedding(query);
		
		// 2. 获取该人物的所有节点
		const nodes = await localDb.getNodesByCharacter(characterId);
		
		if (nodes.length === 0) {
			return [];
		}
		
		// 3. 计算相似度并排序
		const scoredNodes = await Promise.all(
			nodes.map(async (node) => {
				const nodeEmbedding = await getNodeEmbedding(node);
				const similarity = cosineSimilarity(queryEmbedding, nodeEmbedding);
				
				return {
					node_id: node.node_id,
					core_event: node.core_event,
					event_date: node.event_date,
					npc_state: node.npc_state,
					memory_source: node.memory_source,
					similarity,
				};
			})
		);
		
		// 4. 过滤并排序
		return scoredNodes
			.filter((item) => item.similarity >= threshold)
			.sort((a, b) => b.similarity - a.similarity)
			.slice(0, topK);
	} catch (error) {
		console.error('[RAG] 检索记忆失败:', error);
		return [];
	}
}

/**
 * 构建 RAG 上下文字符串
 */
export function buildRAGContext(memories: RetrievedMemory[]): string {
	if (memories.length === 0) {
		return '';
	}
	
	const parts = ['【相关记忆】'];
	
	memories.forEach((mem, index) => {
		parts.push(`[记忆${index + 1}] ${mem.event_date}`);
		parts.push(`事件: ${mem.core_event}`);
		parts.push(`当时情绪: ${mem.npc_state.current_emotion}`);
		parts.push(`对你的态度: ${mem.npc_state.attitude_towards_user}`);
		parts.push('');
	});
	
	parts.push('【记忆使用准则】');
	parts.push('- 自然地提及记忆中的细节，但不要一次性说完');
	parts.push('- 如果记忆与当前话题相关，可以引用当时的情绪或态度');
	parts.push('- 不要让用户察觉你在"读取档案"，而是像回忆往事');
	
	return parts.join('\n');
}

/**
 * 完整的 RAG 流程
 */
export async function getRAGContext(
	query: string,
	characterId: string
): Promise<RAGContext> {
	const retrievedMemories = await retrieveRelevantMemories(query, characterId);
	const contextString = buildRAGContext(retrievedMemories);
	
	return {
		retrievedMemories,
		contextString,
	};
}

/**
 * 清空节点向量缓存
 */
export function clearNodeEmbeddingCache(): void {
	nodeEmbeddingCache.clear();
}
