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

		if (!Array.isArray(texts) || texts.length === 0) {
			return NextResponse.json(
				{ error: 'texts 必须是非空数组' },
				{ status: 400 }
			);
		}

		// 批量限制
		const BATCH_SIZE = 25;
		const results: number[][] = [];

		for (let i = 0; i < texts.length; i += BATCH_SIZE) {
			const batch = texts.slice(i, i + BATCH_SIZE);
			const batchTexts = batch.map((t: string) => t.slice(0, 2000));

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

			if (!response.ok) {
				console.error('[API Embedding] Batch failed:', response.status);
				results.push(...batch.map(() => new Array(768).fill(0)));
				continue;
			}

			const data = await response.json();
			const embeddings = data.output?.embeddings || [];

			results.push(...embeddings.map((e: { embedding: number[] }) => {
				if (e.embedding?.length === 768) {
					return e.embedding;
				}
				return new Array(768).fill(0);
			}));
		}

		return NextResponse.json({ embeddings: results });
	} catch (error) {
		console.error('[API Embedding] Error:', error);
		return NextResponse.json(
			{ error: '生成向量失败', details: String(error) },
			{ status: 500 }
		);
	}
}
