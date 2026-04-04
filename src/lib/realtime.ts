// ============================================================
// Supabase Realtime 实时推送模块
// 描述: 线索解锁事件的实时订阅和通知
// ============================================================

import { supabase } from './supabase';
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
			(payload) => {
				const oldRecord = payload.old as HiddenClue;
				const newRecord = payload.new as HiddenClue;

				// 只处理从未解锁到解锁的状态变化
				if (!oldRecord.is_unlocked && newRecord.is_unlocked) {
					console.log('[Realtime] Clue unlocked:', newRecord.clue_id);
					callback(newRecord);
				}
			}
		)
		.subscribe((status) => {
			console.log(`[Realtime] Channel ${channelName} status:`, status);
		});

	activeSubscriptions.set(channelName, channel);

	// 返回取消订阅函数
	return () => unsubscribeFromClueUnlocks(nodeId);
}

/**
 * 取消订阅节点的线索解锁事件
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
			(payload) => {
				const oldRecord = payload.old as HiddenClue;
				const newRecord = payload.new as HiddenClue;

				// 只处理状态变化
				if (!oldRecord.is_unlocked && newRecord.is_unlocked) {
					console.log('[Realtime] Global clue unlocked:', newRecord.clue_id);
					callback(newRecord);
				}
			}
		)
		.subscribe((status) => {
			console.log(`[Realtime] Channel ${channelName} status:`, status);
		});

	activeSubscriptions.set(channelName, channel);

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
// 广播消息（用于跨标签页通信）
// ============================================================

/**
 * 发送自定义广播消息
 * @param channel - 频道名称
 * @param event - 事件名称
 * @param payload - 消息内容
 */
export async function broadcastMessage(
	channel: string,
	event: string,
	payload: Record<string, unknown>
): Promise<void> {
	const broadcastChannel = supabase.channel(channel);

	await broadcastChannel.subscribe();
	await broadcastChannel.send({
		type: 'broadcast',
		event,
		payload,
	});

	// 发送后立即断开（一次性广播）
	supabase.removeChannel(broadcastChannel);
}

/**
 * 监听自定义广播消息
 * @param channel - 频道名称
 * @param event - 事件名称
 * @param callback - 消息回调
 * @returns 取消监听函数
 */
export function listenToBroadcast(
	channel: string,
	event: string,
	callback: (payload: Record<string, unknown>) => void
): () => void {
	const broadcastChannel = supabase
		.channel(channel)
		.on(
			'broadcast',
			{ event },
			(payload) => {
				callback(payload.payload as Record<string, unknown>);
			}
		)
		.subscribe();

	return () => {
		supabase.removeChannel(broadcastChannel);
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
