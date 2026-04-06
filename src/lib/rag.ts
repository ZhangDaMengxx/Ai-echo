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
		console.log('[RAG] 开始检索:', { query: query.slice(0, 30), characterId });
		
		// 1. 生成查询向量
		const queryEmbedding = await generateEmbedding(query);
		const nonZeroCount = queryEmbedding.filter(v => v !== 0).length;
		const sum = queryEmbedding.reduce((a, b) => a + b, 0);
		console.log('[RAG] 查询向量:', { 
			length: queryEmbedding.length, 
			nonZeroCount, 
			sum: sum.toFixed(6),
			first5: queryEmbedding.slice(0, 5).map(v => v.toFixed(4))
		});
		
		// 2. 获取该人物的所有节点
		const nodes = await localDb.getNodesByCharacter(characterId);
		console.log('[RAG] 人物节点数:', nodes.length);
		
		if (nodes.length === 0) {
			console.log('[RAG] 无节点数据，跳过检索');
			return [];
		}
		
		// 显示前3个节点摘要
		nodes.slice(0, 3).forEach((n, i) => {
			console.log(`[RAG] 节点[${i}]`, n.node_id, n.core_event?.slice(0, 30));
		});
		
		// 3. 计算相似度并排序
		const scoredNodes = await Promise.all(
			nodes.map(async (node, idx) => {
				const nodeEmbedding = await getNodeEmbedding(node);
				
				// 调试第一个节点
				if (idx === 0) {
					const nodeNonZero = nodeEmbedding.filter(v => v !== 0).length;
					const nodeSum = nodeEmbedding.reduce((a, b) => a + b, 0);
					console.log('[RAG] 第一个节点向量:', {
						length: nodeEmbedding.length,
						nonZeroCount: nodeNonZero,
						sum: nodeSum.toFixed(6),
						first5: nodeEmbedding.slice(0, 5).map(v => v.toFixed(4))
					});
				}
				
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
		
		// 显示所有相似度（用于调试）
		console.log('[RAG] 相似度结果:');
		scoredNodes
			.sort((a, b) => b.similarity - a.similarity)
			.slice(0, 5)
			.forEach((n, i) => {
				console.log(`  [${i}] ${n.similarity.toFixed(3)} - ${n.core_event?.slice(0, 30)}`);
			});
		
		// 4. 过滤并排序
		const filtered = scoredNodes
			.filter((item) => item.similarity >= threshold)
			.sort((a, b) => b.similarity - a.similarity)
			.slice(0, topK);
		
		console.log(`[RAG] 检索完成: ${filtered.length}/${nodes.length} 条通过阈值(${threshold})`);
		
		return filtered;
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
