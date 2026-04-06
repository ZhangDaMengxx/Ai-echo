// ============================================================
// 文本嵌入向量模块
// 描述: 使用本地 API 生成文本嵌入向量（解决 CORS）
// ============================================================

// 嵌入向量维度 (阿里云 text-embedding-v2 实际返回 1536 维)
export const EMBEDDING_DIM = 1536;

// 缓存（避免重复请求相同文本）
const embeddingCache = new Map<string, number[]>();

/**
 * 生成文本的嵌入向量（通过本地 API）
 * @param text - 输入文本
 * @returns 768维向量
 */
export async function generateEmbedding(text: string): Promise<number[]> {
	// 检查缓存
	const cacheKey = text.slice(0, 100);
	if (embeddingCache.has(cacheKey)) {
		return embeddingCache.get(cacheKey)!;
	}

	// 文本长度限制（防止过长）
	const truncatedText = text.slice(0, 2000);

	try {
		// 使用本地 API 避免 CORS
		const response = await fetch('/api/embedding', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ texts: [truncatedText] }),
		});

		if (!response.ok) {
			const error = await response.json().catch(() => ({}));
			throw new Error(error.error || `Embedding API 错误: ${response.status}`);
		}

		const data = await response.json();
		const embedding = data.embeddings?.[0];

		if (!embedding || embedding.length !== EMBEDDING_DIM) {
			throw new Error(`Invalid embedding response: ${embedding?.length} dims`);
		}

		// 存入缓存
		embeddingCache.set(cacheKey, embedding);

		return embedding;
	} catch (error) {
		console.error('[Embedding] Failed to generate:', error);
		// 返回零向量作为降级方案
		return new Array(EMBEDDING_DIM).fill(0);
	}
}

/**
 * 批量生成嵌入向量（通过本地 API）
 * @param texts - 文本数组
 * @returns 向量数组
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
	// 批量限制（API限制）
	const BATCH_SIZE = 25;
	const results: number[][] = [];

	for (let i = 0; i < texts.length; i += BATCH_SIZE) {
		const batch = texts.slice(i, i + BATCH_SIZE);
		const batchTexts = batch.map(t => t.slice(0, 2000));

		try {
			// 使用本地 API 避免 CORS
			const response = await fetch('/api/embedding', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ texts: batchTexts }),
			});

			if (!response.ok) {
				console.warn(`[Embedding] Batch ${i / BATCH_SIZE} failed, using zero vectors`);
				results.push(...batch.map(() => new Array(EMBEDDING_DIM).fill(0)));
				continue;
			}

			const data = await response.json();
			const embeddings = data.embeddings || [];

			results.push(...embeddings.map((e: number[]) => {
				if (e?.length === EMBEDDING_DIM) {
					return e;
				}
				return new Array(EMBEDDING_DIM).fill(0);
			}));
		} catch (error) {
			console.error('[Embedding] Batch error:', error);
			results.push(...batch.map(() => new Array(EMBEDDING_DIM).fill(0)));
		}
	}

	return results;
}

/**
 * 计算两个向量的余弦相似度
 * @param a - 向量A
 * @param b - 向量B
 * @returns 相似度 (0-1)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
	if (a.length !== b.length) {
		throw new Error('Vector dimension mismatch');
	}

	let dotProduct = 0;
	let normA = 0;
	let normB = 0;

	for (let i = 0; i < a.length; i++) {
		dotProduct += a[i] * b[i];
		normA += a[i] * a[i];
		normB += b[i] * b[i];
	}

	if (normA === 0 || normB === 0) {
		return 0;
	}

	return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * 清空嵌入缓存
 */
export function clearEmbeddingCache(): void {
	embeddingCache.clear();
}

/**
 * 获取缓存大小
 */
export function getEmbeddingCacheSize(): number {
	return embeddingCache.size;
}
