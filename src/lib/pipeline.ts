// ============================================================
// Pipeline API 客户端
// 描述: 数据清洗流水线的 extract / commit 调用封装
// ============================================================

import { DraftNode } from '@/components/PipelineCalibration';

export async function extractNodes(text: string): Promise<{
	chunks: number;
	nodes: DraftNode[];
	message: string;
}> {
	const res = await fetch('/api/pipeline/extract', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ text }),
	});

	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error(err.error || '提取失败');
	}

	const data = await res.json();

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
		message: data.message || '提取完成',
	};
}

export async function commitNodes(nodes: DraftNode[]): Promise<{
	success: boolean;
	nodeCount: number;
	clueCount: number;
	nodeIds: string[];
}> {
	// 过滤掉前端临时 id，后端会自动生成 UUID
	const payload = nodes.map((node) => ({
		event_date: node.event_date,
		core_event: node.core_event,
		npc_state: node.npc_state,
		salience_score: node.salience_score,
		hidden_clues: node.hidden_clues,
		memory_source: node.memory_source,
		opening_mode: node.opening_mode,
	}));

	const res = await fetch('/api/pipeline/commit', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ nodes: payload, userId: 'test-user' }),
	});

	if (!res.ok) {
		const err = await res.json().catch(() => ({}));
		throw new Error(err.error || '提交失败');
	}

	return res.json();
}
