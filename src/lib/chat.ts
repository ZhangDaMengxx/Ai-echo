// ============================================================
// Chat API 客户端
// 描述: 节点对话相关 API 调用封装
// ============================================================

export interface ChatMessage {
	id: string
	role: 'system' | 'assistant' | 'user'
	content: string
}

export async function fetchNode(nodeId: string): Promise<{
	node: {
		node_id: string
		core_event: string
		npc_state?: {
			current_emotion?: string
			attitude_towards_user?: string
		}
		memory_source?: string
		opening_mode?: string
	}
	clues: Array<{
		clue_id: string
		trigger_condition: string
		clue_content: string
	}>
}> {
	const res = await fetch(`/api/node/${nodeId}`)
	if (!res.ok) {
		const err = await res.json().catch(() => ({}))
		throw new Error(err.error || '获取节点失败')
	}
	return res.json()
}

export async function sendChatMessage(params: {
	message: string
	conversationHistory: ChatMessage[]
	availableClues: Array<{ clue_id: string; trigger_condition: string }>
	nodeData: {
		core_event: string
		npc_state?: Record<string, unknown>
		memory_source?: string
		opening_mode?: string
	}
	isFirstRound?: boolean
}): Promise<{
	reply: string
	unlockedClues: string[]
}> {
	const res = await fetch('/api/chat', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			...params,
			userProfile: { base_archetype: { style: '克制内敛', logic: '理性压抑型' } },
		}),
	})

	if (!res.ok) {
		const err = await res.json().catch(() => ({}))
		throw new Error(err.error || '对话失败')
	}

	return res.json()
}
