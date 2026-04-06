// ============================================================
// Pipeline API 客户端
// 描述: 数据清洗流水线的 extract / commit 调用封装
// 更新: 使用 IndexedDB 本地存储替代服务器存储
// 更新: v3 - 支持多人物系统
// ============================================================

import { DraftNode } from '@/components/PipelineCalibration';
import { localDb, CharacterProfile, HiddenClue, MemoryNode } from './localDb';

// 生成唯一ID
function generateId(): string {
	return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export interface CharacterBase {
	name: string;
	style: string;
	logic: string;
	dominant_emotions: string[];
	dominant_attitudes: string[];
	summary: string;
}

export async function extractNodes(text: string): Promise<{
	chunks: number;
	nodes: DraftNode[];
	character_base?: CharacterBase;
	message: string;
}> {
	console.log('[Pipeline] Sending extract request, text length:', text.length);

	const res = await fetch('/api/pipeline/extract', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ text }),
	});

	console.log('[Pipeline] Response status:', res.status);

	if (!res.ok) {
		let errMsg = '提取失败';
		try {
			const err = await res.json();
			errMsg = err.error || err.details || `HTTP ${res.status}`;
		} catch {
			errMsg = `HTTP ${res.status}: ${res.statusText}`;
		}
		console.error('[Pipeline] Error:', errMsg);
		throw new Error(errMsg);
	}

	const data = await res.json();
	console.log('[Pipeline] Success:', data.message, 'Nodes:', data.nodes?.length);

	// 为每个节点注入前端使用的 id
	const nodes: DraftNode[] = (data.nodes || []).map(
		(node: Record<string, unknown>, index: number) => ({
			id: `draft-${index}-${Date.now()}`,
			event_date: (node.event_date as string) || undefined,
			core_event: (node.core_event as string) || '',
			npc_state: (node.npc_state as Record<string, string>) || {},
			salience_score: (node.salience_score as number) || 5,
			hidden_clues: (node.hidden_clues as Array<{ trigger: string; content: string }>) || [],
			memory_source: (node.memory_source as string) || 'txt_extraction',
			opening_mode: (node.opening_mode as string) || 'dialogue_driven',
		})
	);

	return {
		chunks: data.chunks || 0,
		nodes,
		character_base: data.character_base,
		message: data.message || '提取完成',
	};
}

/**
 * 提交节点到指定人物
 * @param characterId 目标人物ID
 * @param nodes 草稿节点
 * @param characterBase 性格基座（可选）
 */
export async function commitNodes(
	characterId: string,
	nodes: DraftNode[],
	characterBase?: CharacterBase
): Promise<{
	success: boolean;
	nodeCount: number;
	clueCount: number;
	nodeIds: string[];
}> {
	// 转换为本地存储格式
	const payload = nodes.map((node) => {
		const nodeId = generateId();
		return {
			character_id: characterId,
			event_date: node.event_date || new Date().toISOString().split('T')[0],
			core_event: node.core_event,
			npc_state: {
				current_emotion: node.npc_state?.current_emotion || '平静',
				attitude_towards_user: node.npc_state?.attitude_towards_user || '中性',
			},
			salience_score: node.salience_score,
			hidden_clues: (node.hidden_clues || []).map((c): HiddenClue => ({
				clue_id: generateId(),
				character_id: characterId,
				node_id: nodeId,
				trigger_condition: c.trigger,
				clue_content: c.content,
				is_unlocked: false,
			})),
			memory_source: node.memory_source as 'txt_extraction' | 'user_supplement',
			opening_mode: node.opening_mode as 'action_driven' | 'dialogue_driven',
		};
	});

	// 使用本地 IndexedDB 存储
	const profile: CharacterProfile | undefined = characterBase ? {
		...characterBase,
		global_vibe: 'neutral',
	} : undefined;

	const result = await localDb.commitMemoryBatch(characterId, payload, profile);

	return {
		success: true,
		nodeCount: result.nodeIds.length,
		clueCount: result.clueCount,
		nodeIds: result.nodeIds,
	};
}

/**
 * 提交节点到当前人物（向后兼容）
 * @deprecated 请使用带 characterId 的版本
 */
export async function commitNodesLegacy(
	nodes: DraftNode[],
	characterBase?: CharacterBase
): Promise<{
	success: boolean;
	nodeCount: number;
	clueCount: number;
	nodeIds: string[];
}> {
	// 获取默认人物
	const defaultChar = await localDb.getDefaultCharacter();
	if (!defaultChar) {
		throw new Error('没有可提交的人物，请先创建人物');
	}
	return commitNodes(defaultChar.id, nodes, characterBase);
}
