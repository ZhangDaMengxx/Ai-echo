// ============================================================
// emotion: 情绪分析客户端库
// 封装 /api/emotion/analyze 接口调用，提供情绪分析相关工具函数
//
// 文件位置: src/lib/emotion.ts
// 主要依赖: /app/api/emotion/analyze/route (API 类型)
// 被引用: page.tsx (Dialogue 情绪分析), AIDialog
//
// 导出函数:
//   - analyzeEmotion(): 分析单条消息情绪
//   - analyzeEmotionsBatch(): 批量分析
//   - checkEmotionServiceHealth(): 健康检查
//   - calculateBPM(): 根据情绪计算 BPM
//   - shouldTransitionEmotion(): 判断是否转换情绪
//   - escalateEmotion(): 情绪升级
//
// 导出常量:
//   - EMOTION_LABELS: 中文标签
//   - EMOTION_COLORS: 颜色映射
//   - EMOTION_ICONS: 图标映射
//   - EMOTION_BPM: BPM 范围
//
// 使用示例:
//   const result = await analyzeEmotion({ message: '你好', currentEmotion: 'calm' });
//   const bpm = calculateBPM(result.emotion, result.intensity);
//
// 维护记录:
//   - 2026-04-06: 创建，实现情绪分析客户端
// ============================================================

import type { EmotionType, EmotionAnalyzeResponse } from '@/app/api/emotion/analyze/route';

export type { EmotionType, EmotionAnalyzeResponse };

interface AnalyzeEmotionOptions {
	message: string;
	context?: Array<{
		role: 'user' | 'assistant' | 'system';
		content: string;
	}>;
	currentEmotion?: EmotionType;
}

/**
 * 分析单条消息的情绪
 */
export async function analyzeEmotion(
	options: AnalyzeEmotionOptions
): Promise<EmotionAnalyzeResponse> {
	const { message, context, currentEmotion } = options;

	const response = await fetch('/api/emotion/analyze', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			message,
			context,
			currentEmotion,
		}),
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({ error: 'Unknown error' }));
		throw new Error(error.error || `HTTP ${response.status}`);
	}

	return response.json();
}

/**
 * 批量分析多条消息的情绪
 */
export async function analyzeEmotionsBatch(
	messages: Array<{ id: string; content: string; role: 'user' | 'assistant' }>,
	currentEmotion?: EmotionType
): Promise<Map<string, EmotionAnalyzeResponse>> {
	const results = new Map<string, EmotionAnalyzeResponse>();

	// 串行处理以避免并发限制
	for (const msg of messages) {
		try {
			const result = await analyzeEmotion({
				message: msg.content,
				currentEmotion,
			});
			results.set(msg.id, result);
		} catch (error) {
			console.error(`Failed to analyze message ${msg.id}:`, error);
			results.set(msg.id, {
				emotion: currentEmotion || 'calm',
				intensity: 0.5,
				confidence: 0.5,
				reasoning: '分析失败',
			});
		}
	}

	return results;
}

/**
 * 检查情绪分析服务健康状态
 */
export async function checkEmotionServiceHealth(): Promise<{
	status: string;
	supportedEmotions: string[];
	cacheSize: number;
}> {
	const response = await fetch('/api/emotion/analyze');
	if (!response.ok) {
		throw new Error('Service unavailable');
	}
	return response.json();
}

// 情绪中文标签
export const EMOTION_LABELS: Record<EmotionType, string> = {
	calm: '平静',
	angry: '愤怒',
	sad: '悲伤',
	joyful: '喜悦',
	melancholy: '忧郁',
	hopeful: '希望',
	passionate: '热情',
	mysterious: '神秘',
};

// 情绪颜色映射（用于 UI）
export const EMOTION_COLORS: Record<EmotionType, string> = {
	calm: '#3b82f6',
	angry: '#dc2626',
	sad: '#64748b',
	joyful: '#f59e0b',
	melancholy: '#6366f1',
	hopeful: '#10b981',
	passionate: '#f43f5e',
	mysterious: '#a855f7',
};

// 情绪图标（emoji）
export const EMOTION_ICONS: Record<EmotionType, string> = {
	calm: '😌',
	angry: '😠',
	sad: '😢',
	joyful: '😄',
	melancholy: '😔',
	hopeful: '🌱',
	passionate: '🔥',
	mysterious: '🔮',
};

// 情绪 BPM 范围（用于波形显示）
export const EMOTION_BPM: Record<EmotionType, { min: number; max: number }> = {
	calm: { min: 30, max: 50 },
	angry: { min: 150, max: 200 },
	sad: { min: 20, max: 35 },
	joyful: { min: 90, max: 130 },
	melancholy: { min: 45, max: 65 },
	hopeful: { min: 65, max: 90 },
	passionate: { min: 130, max: 160 },
	mysterious: { min: 80, max: 105 },
};

/**
 * 根据强度计算 BPM
 */
export function calculateBPM(emotion: EmotionType, intensity: number): number {
	const range = EMOTION_BPM[emotion];
	const bpm = range.min + (range.max - range.min) * intensity;
	return Math.round(bpm);
}

/**
 * 判断情绪是否应该转换
 */
export function shouldTransitionEmotion(
	currentEmotion: EmotionType,
	newEmotion: EmotionType,
	confidence: number
): boolean {
	// 置信度足够高且情绪不同
	return confidence > 0.7 && currentEmotion !== newEmotion;
}

// 情绪升级路径
const EMOTION_ESCALATION: Partial<Record<EmotionType, EmotionType>> = {
	calm: 'hopeful',
	hopeful: 'joyful',
	joyful: 'passionate',
	passionate: 'angry',
	sad: 'melancholy',
	melancholy: 'mysterious',
};

/**
 * 获取升级后的情绪
 */
export function escalateEmotion(emotion: EmotionType): EmotionType {
	return EMOTION_ESCALATION[emotion] || emotion;
}
