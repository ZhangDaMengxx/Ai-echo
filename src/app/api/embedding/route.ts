// ============================================================
// Embedding API: 文本向量生成
// 描述: 后端代理阿里云 Embedding API，解决 CORS 问题
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { QWEN_API_KEY } from '@/lib/qwen';

const EMBEDDING_URL = 'https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding';

export async function POST(request: NextRequest) {
	try {
		const { texts } = await request.json();
		console.log('[API Embedding] Request:', { count: texts?.length, sample: texts?.[0]?.slice(0, 30) });

		if (!Array.isArray(texts) || texts.length === 0) {
			return NextResponse.json(
				{ error: 'texts 必须是非空数组' },
				{ status: 400 }
			);
		}

		// 检查 API Key
		if (!QWEN_API_KEY) {
			console.error('[API Embedding] QWEN_API_KEY not set');
			return NextResponse.json(
				{ error: 'API Key not configured' },
				{ status: 500 }
			);
		}

		// 批量限制
		const BATCH_SIZE = 25;
		const results: number[][] = [];

		for (let i = 0; i < texts.length; i += BATCH_SIZE) {
			const batch = texts.slice(i, i + BATCH_SIZE);
			const batchTexts = batch.map((t: string) => t.slice(0, 2000));

			console.log('[API Embedding] Calling Qwen API, batch size:', batchTexts.length);
			
			const response = await fetch(EMBEDDING_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${QWEN_API_KEY}`,
				},
				body: JSON.stringify({
					model: 'text-embedding-v2',
					input: { texts: batchTexts },
				}),
			});

			console.log('[API Embedding] Qwen response status:', response.status);

			if (!response.ok) {
				const errorText = await response.text();
				console.error('[API Embedding] Batch failed:', response.status, errorText);
				results.push(...batch.map(() => new Array(768).fill(0)));
				continue;
			}

			const data = await response.json();
			console.log('[API Embedding] Qwen response data keys:', Object.keys(data));
			console.log('[API Embedding] Output keys:', data.output ? Object.keys(data.output) : 'no output');
			
			const embeddings = data.output?.embeddings || [];
			console.log('[API Embedding] Embeddings count:', embeddings.length);
			if (embeddings.length > 0) {
				console.log('[API Embedding] First embedding type:', typeof embeddings[0], Array.isArray(embeddings[0]));
				if (embeddings[0].embedding) {
					console.log('[API Embedding] First embedding has .embedding property');
				}
			}

			results.push(...embeddings.map((e: { embedding: number[] } | number[]) => {
				// 阿里云返回格式: { embedding: [...] }
				const vec = Array.isArray(e) ? e : e.embedding;
				if (vec?.length === 768) {
					return vec;
				}
				return new Array(768).fill(0);
			}));
		}

		console.log('[API Embedding] Returning', results.length, 'embeddings');
		return NextResponse.json({ embeddings: results });
	} catch (error) {
		console.error('[API Embedding] Error:', error);
		return NextResponse.json(
			{ error: '生成向量失败', details: String(error) },
			{ status: 500 }
		);
	}
}
