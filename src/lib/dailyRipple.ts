// ============================================================
// Daily Ripple: 每日涟漪情绪追踪系统
// 功能: 生成每日情绪推送、计算情绪趋势、提供智能洞察
// 文件位置: src/lib/dailyRipple.ts
// 主要依赖: localDb, emotionResonance
// 被引用: DailyRipple.tsx (每日涟漪组件)
//
// 维护记录:
//   - 2026-04-06: 创建
// ============================================================

import type { MemoryNode } from './localDb';
import { calculateEmotionResonance, type EmotionType } from './emotionResonance';

// 每日涟漪数据
export interface DailyRipple {
	id: string;
	date: string;
	type: 'morning' | 'evening' | 'reflection';
	primaryEmotion: EmotionType;
	resonanceScore: number;
	quote: string;
	insight: RippleInsight;
	relatedNodes: string[];
	trend: EmotionTrend;
	isRead: boolean;
	createdAt: string;
}

// 情绪洞察
export interface RippleInsight {
	type: 'encouragement' | 'support' | 'reflection' | 'suggestion';
	message: string;
	action?: string;
}

// 情绪趋势
export interface EmotionTrend {
	direction: 'upward' | 'downward' | 'stable' | 'neutral';
	strength: number;
	periodDays: number;
}

// 情绪价值映射（用于趋势计算）
const EMOTION_VALUES: Record<EmotionType, number> = {
	joyful: 1.0,
	hopeful: 0.8,
	passionate: 0.7,
	calm: 0.5,
	mysterious: 0.3,
	melancholy: 0.2,
	sad: -0.3,
	angry: -0.5,
};

// 每日语录库
const DAILY_QUOTES: Record<EmotionType, string[]> = {
	joyful: [
		'今天的阳光正好，就像你心中的那份喜悦。',
		'快乐是会传染的，把你的笑容分享给世界吧。',
		'每一个开心的瞬间，都是生命送给你的礼物。',
	],
	hopeful: [
		'希望是心灵的灯塔，照亮前行的路。',
		'即使前方有雾，心中也要有光。',
		'相信美好的事情即将发生。',
	],
	passionate: [
		'热情是生命的燃料，让它燃烧得更旺吧。',
		'用激情点燃每一个平凡的日子。',
		'心中有火，眼里有光。',
	],
	calm: [
		'平静是一种力量，在喧嚣中保持内心的安宁。',
		'如湖水般宁静，才能倒映最美的天空。',
		'深呼吸，感受当下的美好。',
	],
	mysterious: [
		'生活中总有一些未知的惊喜在等你发现。',
		'神秘是生命的调味剂，让每一天都有新鲜感。',
		'保持好奇，世界会向你展示更多。',
	],
	melancholy: [
		'忧郁也是一种美，它让你更懂得珍惜快乐。',
		'雨后的天空，总会有彩虹。',
		'允许自己偶尔低落，这是心灵的自我修复。',
	],
	sad: [
		'悲伤是心灵的雨水，洗去尘埃后会更加清澈。',
		'你并不孤单，每一份痛苦都会过去。',
		'允许自己哭泣，这是治愈的开始。',
	],
	angry: [
		'愤怒是一种信号，提醒你在乎什么。',
		'深呼吸，让内心的风暴渐渐平息。',
		'把愤怒转化为改变的力量。',
	],
};

/**
 * 生成每日涟漪
 * @param memoryNodes - 记忆节点列表
 * @returns 每日涟漪数据
 */
export function generateDailyRipple(memoryNodes: MemoryNode[]): DailyRipple {
	const today = new Date().toISOString().split('T')[0];
	
	// 查找今天的节点
	const todayNodes = memoryNodes.filter(
		node => node.event_date === today
	);

	// 查找最近7天的节点
	const recentNodes = memoryNodes.filter(node => {
		const nodeDate = new Date(node.event_date);
		const daysAgo = (Date.now() - nodeDate.getTime()) / (1000 * 60 * 60 * 24);
		return daysAgo <= 7;
	});

	// 确定主要情绪
	let primaryEmotion: EmotionType;
	let relatedNodes: string[] = [];
	
	if (todayNodes.length > 0) {
		// 使用今天的情绪
		primaryEmotion = todayNodes[0].npc_state.current_emotion as EmotionType;
		relatedNodes = todayNodes.map(n => n.node_id);
	} else if (recentNodes.length > 0) {
		// 使用最近的情绪
		primaryEmotion = recentNodes[0].npc_state.current_emotion as EmotionType;
		relatedNodes = [recentNodes[0].node_id];
	} else if (memoryNodes.length > 0) {
		// 随机选择一个历史情绪作为反思
		const randomNode = memoryNodes[Math.floor(Math.random() * memoryNodes.length)];
		primaryEmotion = randomNode.npc_state.current_emotion as EmotionType;
		relatedNodes = [randomNode.node_id];
	} else {
		primaryEmotion = 'calm';
	}

	// 计算趋势
	const trend = calculateEmotionTrend(recentNodes.length > 0 ? recentNodes : memoryNodes);

	// 计算共振分数
	const resonanceScore = calculateResonanceScore(recentNodes);

	// 生成洞察
	const insight = generateInsight(trend.direction, primaryEmotion, resonanceScore);

	// 选择语录
	const quotes = DAILY_QUOTES[primaryEmotion];
	const quote = quotes[Math.floor(Math.random() * quotes.length)];

	// 确定类型
	const hour = new Date().getHours();
	let type: DailyRipple['type'];
	if (hour < 12) {
		type = 'morning';
	} else if (hour < 20) {
		type = 'reflection';
	} else {
		type = 'evening';
	}

	return {
		id: `ripple_${today}`,
		date: today,
		type,
		primaryEmotion,
		resonanceScore,
		quote,
		insight,
		relatedNodes,
		trend,
		isRead: false,
		createdAt: new Date().toISOString(),
	};
}

/**
 * 计算情绪趋势
 * @param nodes - 按时间排序的节点列表
 * @returns 情绪趋势
 */
export function calculateEmotionTrend(nodes: MemoryNode[]): EmotionTrend {
	if (nodes.length < 2) {
		return { direction: 'neutral', strength: 0, periodDays: 0 };
	}

	const sortedNodes = [...nodes].sort(
		(a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
	);

	const values = sortedNodes.map(node => 
		EMOTION_VALUES[node.npc_state.current_emotion as EmotionType] || 0
	);

	// 计算线性回归斜率
	const n = values.length;
	const xMean = (n - 1) / 2;
	const yMean = values.reduce((a, b) => a + b, 0) / n;

	let numerator = 0;
	let denominator = 0;

	for (let i = 0; i < n; i++) {
		numerator += (i - xMean) * (values[i] - yMean);
		denominator += (i - xMean) ** 2;
	}

	const slope = denominator !== 0 ? numerator / denominator : 0;

	// 确定方向
	const threshold = 0.05;
	let direction: EmotionTrend['direction'];
	if (slope > threshold) {
		direction = 'upward';
	} else if (slope < -threshold) {
		direction = 'downward';
	} else {
		direction = 'stable';
	}

	// 计算趋势强度
	const strength = Math.min(Math.abs(slope) * 5, 1);

	// 计算周期
	const firstDate = new Date(sortedNodes[0].event_date);
	const lastDate = new Date(sortedNodes[sortedNodes.length - 1].event_date);
	const periodDays = Math.max(1, Math.round(
		(lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
	));

	return { direction, strength, periodDays };
}

/**
 * 计算共振分数
 * @param nodes - 节点列表
 * @returns 共振分数 (0 ~ 1)
 */
function calculateResonanceScore(nodes: MemoryNode[]): number {
	if (nodes.length < 2) return 0.5;

	let totalResonance = 0;
	let count = 0;

	for (let i = 0; i < nodes.length - 1; i++) {
		for (let j = i + 1; j < nodes.length; j++) {
			const emotion1 = nodes[i].npc_state.current_emotion as EmotionType;
			const emotion2 = nodes[j].npc_state.current_emotion as EmotionType;
			totalResonance += (calculateEmotionResonance(emotion1, emotion2) + 1) / 2;
			count++;
		}
	}

	return count > 0 ? totalResonance / count : 0.5;
}

/**
 * 生成洞察
 * @param trend - 情绪趋势
 * @param emotion - 当前情绪
 * @param score - 共振分数
 * @returns 洞察信息
 */
export function generateInsight(
	trend: EmotionTrend['direction'],
	emotion: EmotionType,
	score: number
): RippleInsight {
	// 积极趋势 + 积极情绪
	if (trend === 'upward' && score > 0.6) {
		return {
			type: 'encouragement',
			message: '你的情绪正在向上发展，保持这份积极的心态！',
			action: '记录下让你开心的事情，分享给重要的人。',
		};
	}

	// 消极趋势 + 消极情绪
	if (trend === 'downward' && score < 0.4) {
		return {
			type: 'support',
			message: '最近可能有些不顺心，但请相信一切都会好起来的。',
			action: '尝试做一些让自己放松的事情，或者和信任的人聊聊。',
		};
	}

	// 稳定趋势
	if (trend === 'stable') {
		return {
			type: 'reflection',
			message: '你的情绪保持平稳，这是一种难得的宁静。',
			action: '利用这份平静，思考一下自己真正想要的是什么。',
		};
	}

	// 混合情况
	if (score > 0.7) {
		return {
			type: 'encouragement',
			message: '你的情绪状态很和谐，不同情绪之间产生了美好的共鸣。',
			action: '继续保持，让这种平衡感延续下去。',
		};
	}

	if (score < 0.3) {
		return {
			type: 'suggestion',
			message: '情绪波动较大，可能需要一些时间来整理思绪。',
			action: '尝试冥想或写日记，帮助自己理清情绪。',
		};
	}

	// 默认
	return {
		type: 'reflection',
		message: '每一天都是新的开始，带着好奇去面对今天吧。',
	};
}

/**
 * 检查是否应该显示每日涟漪
 * @param lastShownDate - 最后显示日期 (ISO 字符串)
 * @returns 是否应该显示
 */
export function shouldShowRipple(lastShownDate: string | null): boolean {
	if (!lastShownDate) return true;

	const lastDate = new Date(lastShownDate).toISOString().split('T')[0];
	const today = new Date().toISOString().split('T')[0];

	return lastDate !== today;
}

/**
 * 存储每日涟漪到本地
 * @param ripple - 涟漪数据
 */
export async function storeDailyRipple(ripple: DailyRipple): Promise<void> {
	const DB_NAME = 'EchoTracksDB';
	const STORE_NAME = 'ripples';

	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME);

		request.onsuccess = () => {
			const db = request.result;
			
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				resolve();
				return;
			}

			const tx = db.transaction(STORE_NAME, 'readwrite');
			const store = tx.objectStore(STORE_NAME);
			store.put(ripple);

			tx.oncomplete = () => resolve();
			tx.onerror = () => reject(tx.error);
		};

		request.onerror = () => reject(request.error);
	});
}

/**
 * 获取今日涟漪
 * @returns 今日涟漪或 null
 */
export async function getTodayRipple(): Promise<DailyRipple | null> {
	const DB_NAME = 'EchoTracksDB';
	const STORE_NAME = 'ripples';
	const today = new Date().toISOString().split('T')[0];

	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME);

		request.onsuccess = () => {
			const db = request.result;
			
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				resolve(null);
				return;
			}

			const tx = db.transaction(STORE_NAME, 'readonly');
			const store = tx.objectStore(STORE_NAME);
			const getRequest = store.get(`ripple_${today}`);

			getRequest.onsuccess = () => {
				resolve(getRequest.result || null);
			};
			getRequest.onerror = () => reject(getRequest.error);
		};

		request.onerror = () => reject(request.error);
	});
}
