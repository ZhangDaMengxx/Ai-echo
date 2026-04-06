// ============================================================
// API Route: /api/emotion/analyze
// 实时对话情绪分析接口
//
// 文件位置: src/app/api/emotion/analyze/route.ts
// 主要依赖: zod (验证), Qwen API (AI 分析)
// 被引用: src/lib/emotion.ts (客户端库)
//
// 路由:
//   - POST /api/emotion/analyze: 分析情绪
//   - GET  /api/emotion/analyze: 健康检查
//
// 请求体:
//   {
//     message: string (1-2000字)
//     context?: Array<{role, content}> (对话上下文)
//     currentEmotion?: EmotionType (当前情绪)
//   }
//
// 响应体:
//   {
//     emotion: EmotionType
//     intensity: number (0-1)
//     confidence: number (0-1)
//     reasoning: string
//     suggestedTransition?: {...}
//   }
//
// 缓存: 内存缓存，TTL 5分钟
// AI 模型: Qwen Turbo
//
// 维护记录:
//   - 2026-04-06: 创建，实现情绪分析 API
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// 请求体验证
const analyzeRequestSchema = z.object({
	message: z.string().min(1).max(2000),
	context: z.array(z.object({
		role: z.enum(['user', 'assistant', 'system']),
		content: z.string(),
	})).optional(),
	currentEmotion: z.enum(['calm', 'angry', 'sad', 'joyful', 'melancholy', 'hopeful', 'passionate', 'mysterious']).optional(),
});

// 情绪类型
export type EmotionType = 'calm' | 'angry' | 'sad' | 'joyful' | 'melancholy' | 'hopeful' | 'passionate' | 'mysterious';

// 响应类型
export interface EmotionAnalyzeResponse {
	emotion: EmotionType;
	intensity: number; // 0-1
	confidence: number; // 0-1
	reasoning: string;
	suggestedTransition?: {
		from: EmotionType;
		to: EmotionType;
		trigger: string;
	};
}

// 情绪标签映射（用于提示词）
const EMOTION_LABELS: Record<EmotionType, string> = {
	calm: '平静/冷静',
	angry: '愤怒/生气',
	sad: '悲伤/难过',
	joyful: '喜悦/开心',
	melancholy: '忧郁/惆怅',
	hopeful: '希望/期待',
	passionate: '热情/激动',
	mysterious: '神秘/疑惑',
};

// 简单的内存缓存（生产环境建议使用 Redis）
const emotionCache = new Map<string, { result: EmotionAnalyzeResponse; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5分钟

/**
 * 生成缓存键
 */
function generateCacheKey(message: string, context?: unknown[]): string {
	const contextHash = context ? JSON.stringify(context).slice(0, 100) : '';
	return `${message.slice(0, 100)}_${contextHash}`;
}

/**
 * 清理过期缓存
 */
function cleanExpiredCache() {
	const now = Date.now();
	emotionCache.forEach((value, key) => {
		if (now - value.timestamp > CACHE_TTL) {
			emotionCache.delete(key);
		}
	});
}

/**
 * 调用 Qwen API 分析情绪
 */
async function analyzeWithQwen(
	message: string,
	context?: { role: string; content: string }[],
	currentEmotion?: EmotionType
): Promise<EmotionAnalyzeResponse> {
	const apiKey = process.env.QWEN_API_KEY;
	if (!apiKey) {
		throw new Error('QWEN_API_KEY not configured');
	}

	// 构建上下文提示
	const contextPrompt = context && context.length > 0
		? `对话上下文：\n${context.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n')}\n\n`
		: '';

	const currentEmotionPrompt = currentEmotion
		? `当前情绪状态：${EMOTION_LABELS[currentEmotion]}\n\n`
		: '';

	const prompt = `${contextPrompt}${currentEmotionPrompt}请分析以下对话内容的情绪：

"${message}"

请从以下8种情绪中选择最匹配的一种，并给出强度和置信度：
- calm: 平静/冷静
- angry: 愤怒/生气  
- sad: 悲伤/难过
- joyful: 喜悦/开心
- melancholy: 忧郁/惆怅
- hopeful: 希望/期待
- passionate: 热情/激动
- mysterious: 神秘/疑惑

请以JSON格式返回：
{
  "emotion": "情绪类型",
  "intensity": 0.0-1.0,
  "confidence": 0.0-1.0,
  "reasoning": "分析理由（简洁，20字以内）",
  "suggestedTransition": {
    "from": "当前情绪（如果有）",
    "to": "建议转换的情绪",
    "trigger": "触发转换的关键词或原因"
  }
}`;

	try {
		const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				model: 'qwen-turbo',
				input: {
					messages: [
						{ role: 'system', content: '你是一个专业的情绪分析助手，擅长从对话中识别情绪变化。' },
						{ role: 'user', content: prompt },
					],
				},
				parameters: {
					result_format: 'message',
					temperature: 0.3,
					max_tokens: 500,
				},
			}),
		});

		if (!response.ok) {
			throw new Error(`API request failed: ${response.status}`);
		}

		const data = await response.json();
		const content = data.output?.choices?.[0]?.message?.content || '';

		// 解析 JSON 响应
		const jsonMatch = content.match(/\{[\s\S]*\}/);
		if (!jsonMatch) {
			throw new Error('Invalid response format');
		}

		const result = JSON.parse(jsonMatch[0]);

		// 验证并返回
		return {
			emotion: validateEmotion(result.emotion),
			intensity: clamp(result.intensity ?? 0.5, 0, 1),
			confidence: clamp(result.confidence ?? 0.8, 0, 1),
			reasoning: result.reasoning || '分析完成',
			suggestedTransition: result.suggestedTransition || undefined,
		};
	} catch (error) {
		console.error('Emotion analysis failed:', error);
		// 返回默认情绪
		return {
			emotion: currentEmotion || 'calm',
			intensity: 0.5,
			confidence: 0.5,
			reasoning: '分析失败，使用默认情绪',
		};
	}
}

/**
 * 验证情绪类型
 */
function validateEmotion(emotion: unknown): EmotionType {
	const validEmotions: EmotionType[] = ['calm', 'angry', 'sad', 'joyful', 'melancholy', 'hopeful', 'passionate', 'mysterious'];
	if (typeof emotion === 'string' && validEmotions.includes(emotion as EmotionType)) {
		return emotion as EmotionType;
	}
	return 'calm';
}

/**
 * 限制数值范围
 */
function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

/**
 * POST /api/emotion/analyze
 */
export async function POST(request: NextRequest) {
	try {
		// 清理过期缓存
		cleanExpiredCache();

		// 解析请求体
		const body = await request.json();
		const { message, context, currentEmotion } = analyzeRequestSchema.parse(body);

		// 检查缓存
		const cacheKey = generateCacheKey(message, context);
		const cached = emotionCache.get(cacheKey);
		if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
			return NextResponse.json(cached.result, {
				headers: {
					'X-Cache': 'HIT',
					'X-Cache-Time': `${Date.now() - cached.timestamp}ms`,
				},
			});
		}

		// 调用 AI 分析
		const startTime = Date.now();
		const result = await analyzeWithQwen(message, context, currentEmotion);
		const duration = Date.now() - startTime;

		// 缓存结果
		emotionCache.set(cacheKey, { result, timestamp: Date.now() });

		// 返回结果
		return NextResponse.json(result, {
			headers: {
				'X-Cache': 'MISS',
				'X-Response-Time': `${duration}ms`,
			},
		});
	} catch (error) {
		console.error('Emotion analysis error:', error);

		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: 'Invalid request', details: error.errors },
				{ status: 400 }
			);
		}

		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

/**
 * GET /api/emotion/analyze
 * 健康检查
 */
export async function GET() {
	return NextResponse.json({
		status: 'ok',
		service: 'emotion-analysis',
		version: '1.0.0',
		supportedEmotions: Object.keys(EMOTION_LABELS),
		cacheSize: emotionCache.size,
	});
}
