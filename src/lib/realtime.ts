// ============================================================
// Supabase Realtime 实时推送模块
// 描述: 线索解锁事件的实时订阅和通知
// ============================================================

import { supabase, supabaseAdmin } from './supabase';
import type { HiddenClue } from './supabase';

// 订阅句柄类型
export type RealtimeSubscription = ReturnType<typeof supabase.channel>;

// 线索解锁回调类型
export type ClueUnlockCallback = (clue: HiddenClue) => void;

// 当前活动的订阅映射
const activeSubscriptions = new Map<string, RealtimeSubscription>();

// ============================================================
// 线索解锁订阅
// ============================================================

/**
 * 订阅特定节点的线索解锁事件
 * @param nodeId - 节点ID
 * @param callback - 解锁回调函数
 * @returns 取消订阅函数
 */
export function subscribeToClueUnlocks(
	nodeId: string,
	callback: ClueUnlockCallback
): () => void {
	const channelName = `node-${nodeId}-clues`;

	// 如果已存在订阅，先取消
	if (activeSubscriptions.has(channelName)) {
		unsubscribeFromClueUnlocks(nodeId);
	}

	// 创建新订阅
	const channel = supabase
		.channel(channelName)
		.on(
			'postgres_changes',
			{
				event: 'UPDATE',
				schema: 'public',
				table: 'Hidden_Clues',
				filter: `node_id=eq.${nodeId}`,
			},
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(payload: any) => {
				const oldRecord = payload.old as HiddenClue;
				const newRecord = payload.new as HiddenClue;

				// 只处理从未解锁到已解锁的状态变化
				if (!oldRecord.is_unlocked && newRecord.is_unlocked) {
					console.log('[Realtime] Clue unlocked:', newRecord.clue_id);
					callback(newRecord);
				}
			}
		)
		.subscribe();

	// 保存订阅
	activeSubscriptions.set(channelName, channel);
	console.log(`[Realtime] Subscribed to ${channelName}`);

	// 返回取消订阅函数
	return () => unsubscribeFromClueUnlocks(nodeId);
}

/**
 * 取消特定节点的线索订阅
 * @param nodeId - 节点ID
 */
export function unsubscribeFromClueUnlocks(nodeId: string): void {
	const channelName = `node-${nodeId}-clues`;
	const channel = activeSubscriptions.get(channelName);

	if (channel) {
		channel.unsubscribe();
		supabase.removeChannel(channel);
		activeSubscriptions.delete(channelName);
		console.log(`[Realtime] Unsubscribed from ${channelName}`);
	}
}

// ============================================================
// 全局线索订阅（所有节点）
// ============================================================

/**
 * 订阅当前用户的所有线索解锁事件
 * @param callback - 解锁回调函数
 * @returns 取消订阅函数
 */
export function subscribeToAllClueUnlocks(
	callback: ClueUnlockCallback
): () => void {
	const channelName = 'all-clues';

	// 如果已存在订阅，先取消
	if (activeSubscriptions.has(channelName)) {
		const oldChannel = activeSubscriptions.get(channelName)!;
		oldChannel.unsubscribe();
		supabase.removeChannel(oldChannel);
		activeSubscriptions.delete(channelName);
	}

	// 创建新订阅（使用RLS，自动过滤用户数据）
	const channel = supabase
		.channel(channelName)
		.on(
			'postgres_changes',
			{
				event: 'UPDATE',
				schema: 'public',
				table: 'Hidden_Clues',
				filter: 'is_unlocked=eq.true',
			},
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(payload: any) => {
				const oldRecord = payload.old as HiddenClue;
				const newRecord = payload.new as HiddenClue;

				// 只处理状态变化
				if (!oldRecord.is_unlocked && newRecord.is_unlocked) {
					console.log('[Realtime] Global clue unlocked:', newRecord.clue_id);
					callback(newRecord);
				}
			}
		)
		.subscribe();

	activeSubscriptions.set(channelName, channel);
	console.log('[Realtime] Subscribed to all clues');

	return () => {
		const ch = activeSubscriptions.get(channelName);
		if (ch) {
			ch.unsubscribe();
			supabase.removeChannel(ch);
			activeSubscriptions.delete(channelName);
		}
	};
}

// ============================================================
// 清理函数
// ============================================================

/**
 * 取消所有活动的订阅
 */
export function unsubscribeAll(): void {
	activeSubscriptions.forEach((channel) => {
		channel.unsubscribe();
		supabase.removeChannel(channel);
	});
	activeSubscriptions.clear();
	console.log('[Realtime] All subscriptions cleared');
}

/**
 * 获取活动订阅数量
 */
export function getActiveSubscriptionCount(): number {
	return activeSubscriptions.size;
}

// ============================================================
// 后端广播函数（API路由使用）
// ============================================================

/**
 * 广播线索解锁事件
 * @param clue - 已解锁的线索
 */
export async function broadcastClueUnlock(clue: HiddenClue): Promise<void> {
	// 检查是否有真实的 Supabase 配置
	const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL
	if (!hasSupabase) {
		console.log('[Realtime] Skipping broadcast (no Supabase config)')
		return
	}

	try {
		// 使用 Supabase broadcast 功能向所有客户端推送
		const channel = supabaseAdmin.channel('clue-unlocks')

		await channel.subscribe()

		await channel.send({
			type: 'broadcast',
			event: 'clue_unlocked',
			payload: {
				clue_id: clue.clue_id,
				node_id: clue.node_id,
				clue_content: clue.clue_content,
				unlocked_at: clue.unlocked_at,
			},
		})

		console.log('[Realtime] Broadcasted clue unlock:', clue.clue_id)
	} catch (error) {
		console.error('[Realtime] Failed to broadcast:', error)
	}
}

/**
 * 触发数据库更新并通过 Realtime 推送
 * @param clueId - 线索ID
 */
export async function unlockClueAndNotify(clueId: string): Promise<HiddenClue | null> {
	try {
		const { data, error } = await supabaseAdmin
			.from('Hidden_Clues')
			.update({ is_unlocked: true, unlocked_at: new Date().toISOString() })
			.eq('clue_id', clueId)
			.select()
			.single()

		if (error) {
			console.error('[Realtime] Failed to unlock clue:', error)
			return null
		}

		// 广播解锁事件
		await broadcastClueUnlock(data as HiddenClue)

		return data as HiddenClue
	} catch (error) {
		console.error('[Realtime] Failed to unlock and notify:', error)
		return null
	}
}
