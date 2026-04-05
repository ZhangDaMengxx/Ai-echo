// ============================================================
// MemoryStore: 本地开发 fallback 存储
// 描述: 当 Supabase 未配置或连接失败时，用内存数组暂存节点
// 注意: 仅用于本地测试，生产环境必须连接真实数据库
// ============================================================

import { MemoryNode, HiddenClue, IfLineBranch } from './supabase'

export const memoryNodes: MemoryNode[] = []
export const memoryClues: HiddenClue[] = []
export const memoryBranches: IfLineBranch[] = []

export function insertNodes(
	nodes: Array<Record<string, unknown>>,
	clues: Array<Record<string, unknown>>
): string[] {
	const ids: string[] = []

	nodes.forEach((node, index) => {
		const nodeId = `mem-node-${Date.now()}-${index}`
		const fullNode: MemoryNode = {
			...node,
			node_id: nodeId,
			created_at: new Date().toISOString(),
		} as MemoryNode
		memoryNodes.push(fullNode)
		ids.push(nodeId)

		// 关联该节点的线索
		const nodeClues = clues.filter((c) => c.node_id === `pending-${index}`)
		nodeClues.forEach((clue) => {
			memoryClues.push({
				...clue,
				clue_id: `mem-clue-${Date.now()}-${memoryClues.length}`,
				node_id: nodeId,
				created_at: new Date().toISOString(),
			} as unknown as HiddenClue)
		})
	})

	return ids
}

export function getNodes(userId: string, minScore = 7): MemoryNode[] {
	return memoryNodes
		.filter((n) => n.user_id === userId && n.salience_score >= minScore)
		.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
}

export function getNodeById(nodeId: string): MemoryNode | undefined {
	return memoryNodes.find((n) => n.node_id === nodeId)
}

export function getCluesByNodeId(nodeId: string): HiddenClue[] {
	return memoryClues.filter((c) => c.node_id === nodeId && !c.is_unlocked)
}

export function unlockClue(clueId: string): boolean {
	const clue = memoryClues.find((c) => c.clue_id === clueId)
	if (clue) {
		clue.is_unlocked = true
		clue.unlocked_at = new Date().toISOString()
		return true
	}
	return false
}

export function insertBranch(branch: Omit<IfLineBranch, 'branch_id' | 'created_at'>): string {
	const branchId = `mem-branch-${Date.now()}`
	const fullBranch: IfLineBranch = {
		...branch,
		branch_id: branchId,
		created_at: new Date().toISOString(),
	} as IfLineBranch
	memoryBranches.push(fullBranch)
	return branchId
}

export function getBranchesByNodeId(nodeId: string): IfLineBranch[] {
	return memoryBranches.filter((b) => b.parent_node_id === nodeId)
}
