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

		// 检查 API Key
		if (!QWEN_API_KEY) {
			console.error('[API Embedding] QWEN_API_KEY not set');
			return NextResponse.json(
				{ error: 'API Key not configured' },
				{ status: 500 }
			);
		}

		// 只处理第一个文本
		const text = texts[0].slice(0, 2000);
		
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

		if (!response.ok) {
			const errorText = await response.text();
			console.error('[API Embedding] API failed:', response.status);
			return NextResponse.json(
				{ error: '阿里云API错误', status: response.status },
				{ status: 502 }
			);
		}

		const data = await response.json();
		
		// 解析返回结构
		const embeddings = data.output?.embeddings;
		if (!embeddings || !Array.isArray(embeddings) || embeddings.length === 0) {
			return NextResponse.json(
				{ error: '阿里云返回格式错误' },
				{ status: 502 }
			);
		}

		const firstEmbedding = embeddings[0];
		
		// 提取向量
		let vec: number[];
		if (Array.isArray(firstEmbedding)) {
			vec = firstEmbedding;
		} else if (firstEmbedding && Array.isArray(firstEmbedding.embedding)) {
			vec = firstEmbedding.embedding;
		} else {
			return NextResponse.json(
				{ error: '未知向量格式' },
				{ status: 502 }
			);
		}

		// text-embedding-v2 返回 1536 维
		const EXPECTED_DIM = 1536;
		if (vec.length !== EXPECTED_DIM) {
			return NextResponse.json(
				{ error: '向量维度错误', length: vec.length, expected: EXPECTED_DIM },
				{ status: 502 }
			);
		}

		return NextResponse.json({ embeddings: [vec] });
	} catch (error) {
		console.error('[API Embedding] Error:', error);
		return NextResponse.json(
			{ error: '生成向量失败' },
			{ status: 500 }
		);
	}
}
