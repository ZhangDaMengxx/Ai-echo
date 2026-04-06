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

		// 只处理第一个文本（简化调试）
		const text = texts[0].slice(0, 2000);
		console.log('[API Embedding] Calling Qwen API with text:', text.slice(0, 50));
		
		const response = await fetch(EMBEDDING_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${QWEN_API_KEY}`,
			},
			body: JSON.stringify({
				model: 'text-embedding-v2',
				input: { texts: [text] },
			}),
		});

		console.log('[API Embedding] Qwen response status:', response.status);

		if (!response.ok) {
			const errorText = await response.text();
			console.error('[API Embedding] API failed:', response.status, errorText);
			return NextResponse.json(
				{ error: '阿里云API错误', status: response.status, details: errorText },
				{ status: 502 }
			);
		}

		const data = await response.json();
		console.log('[API Embedding] Qwen full response:', JSON.stringify(data, null, 2).slice(0, 500));
		
		// 详细解析返回结构
		const embeddings = data.output?.embeddings;
		if (!embeddings || !Array.isArray(embeddings) || embeddings.length === 0) {
			console.error('[API Embedding] No embeddings in response, data:', data);
			return NextResponse.json(
				{ error: '阿里云返回格式错误', data },
				{ status: 502 }
			);
		}

		const firstEmbedding = embeddings[0];
		console.log('[API Embedding] First embedding type:', typeof firstEmbedding, Array.isArray(firstEmbedding), firstEmbedding?.embedding ? 'has .embedding' : 'no .embedding');
		
		// 提取向量
		let vec: number[];
		if (Array.isArray(firstEmbedding)) {
			vec = firstEmbedding;
		} else if (firstEmbedding && Array.isArray(firstEmbedding.embedding)) {
			vec = firstEmbedding.embedding;
		} else {
			console.error('[API Embedding] Unknown embedding format:', firstEmbedding);
			return NextResponse.json(
				{ error: '未知向量格式', embedding: firstEmbedding },
				{ status: 502 }
			);
		}

		if (vec.length !== 768) {
			console.error('[API Embedding] Wrong dimension:', vec.length);
			return NextResponse.json(
				{ error: '向量维度错误', length: vec.length },
				{ status: 502 }
			);
		}

		const nonZeroCount = vec.filter((v: number) => v !== 0).length;
		console.log('[API Embedding] Success! Non-zero count:', nonZeroCount, 'First 5:', vec.slice(0, 5));

		return NextResponse.json({ embeddings: [vec] });
	} catch (error) {
		console.error('[API Embedding] Error:', error);
		return NextResponse.json(
			{ error: '生成向量失败', details: String(error) },
			{ status: 500 }
		);
	}
}
