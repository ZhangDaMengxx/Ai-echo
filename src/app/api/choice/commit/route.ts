// ============================================================
// 命运抉择 API
// 描述: 处理拥抱遗憾/逆天改命两种选择
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { insertBranch } from '@/lib/memoryStore'

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const {
			nodeId,
			choice,
			alteredChoices,
			newEnding,
			userId,
		} = body as {
			nodeId: string
			choice: 'commit' | 'discard'
			alteredChoices: string
			newEnding: string
			userId: string
		}

		// 验证参数
		if (!nodeId || !choice || !alteredChoices || !newEnding) {
			return NextResponse.json(
				{ error: '缺少必要参数' },
				{ status: 400 }
			)
		}

		if (choice !== 'commit' && choice !== 'discard') {
			return NextResponse.json(
				{ error: '无效的choice参数' },
				{ status: 400 }
			)
		}

		const isCommitted = choice === 'commit'

		// 1. 创建 If_Line_Branches 记录
		let branchId: string | null = null
		let useMemory = false

		try {
			const { data, error } = await supabaseAdmin
				.from('If_Line_Branches')
				.insert([{
					parent_node_id: nodeId,
					altered_choices: alteredChoices,
					new_ending: newEnding,
					is_committed: isCommitted,
				}])
				.select('branch_id')
				.single()

			if (error) throw error
			branchId = data?.branch_id || null
		} catch {
			// Fallback 到 memoryStore
			useMemory = true
			const memId = insertBranch({
				parent_node_id: nodeId,
				altered_choices: alteredChoices,
				new_ending: newEnding,
				is_committed: isCommitted,
			})
			branchId = memId
		}

		// 2. 如果是逆天改命，更新 Users.global_vibe
		if (isCommitted && userId && !useMemory) {
			try {
				// 根据 newEnding 的情感色彩推断新的 vibe
				const newVibe = inferVibeFromEnding(newEnding)

				await supabaseAdmin
					.from('Users')
					.update({ global_vibe: newVibe })
					.eq('id', userId)
			} catch {
				// 忽略更新失败
			}
		}

		return NextResponse.json({
			success: true,
			branchId,
			choice,
			isCommitted,
			message: isCommitted
				? '你已选择逆天改命，世界线开始重构...'
				: '你已选择拥抱遗憾，这段记忆将被珍藏...',
		})

	} catch (error) {
		console.error('Choice commit error:', error)
		return NextResponse.json(
			{ error: '提交抉择失败', details: String(error) },
			{ status: 500 }
		)
	}
}

/**
 * 从结局文本推断情感色调
 */
function inferVibeFromEnding(ending: string): string {
	const lower = ending.toLowerCase()

	// 积极关键词
	if (/勇敢|成功|希望|幸福|快乐|温暖|光明|爱/.test(lower)) {
		return 'hopeful'
	}

	// 消极关键词
	if (/失败|失去|痛苦|绝望|孤独|黑暗/.test(lower)) {
		return 'melancholy'
	}

	// 复杂/中性
	if (/复杂|矛盾|纠结|未知|迷茫/.test(lower)) {
		return 'ambiguous'
	}

	// 默认
	return 'neutral'
}
