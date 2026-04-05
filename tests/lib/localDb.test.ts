// ============================================================
// LocalDB Tests: IndexedDB 本地存储测试 (简化版)
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest';

// 内存存储模拟
const memoryStorage = {
	nodes: new Map<string, unknown>(),
	clues: new Map<string, unknown>(),
	branches: new Map<string, unknown>(),
	profile: new Map<string, unknown>(),
};

// 创建模拟 IDBRequest
const createMockRequest = (result: unknown) => ({
	result,
	onsuccess: null as ((this: IDBRequest, ev: Event) => unknown) | null,
	onerror: null as ((this: IDBRequest, ev: Event) => unknown) | null,
	dispatchEvent: function() {
		if (this.onsuccess) {
			setTimeout(() => this.onsuccess!.call(this as unknown as IDBRequest, new Event('success')), 0);
		}
	},
});

// 创建模拟 ObjectStore
const createMockStore = (storeName: keyof typeof memoryStorage) => {
	const store = memoryStorage[storeName];
	return {
		get: (key: string) => {
			const req = createMockRequest(store.get(key));
			setTimeout(() => req.dispatchEvent(), 0);
			return req;
		},
		getAll: () => {
			const req = createMockRequest(Array.from(store.values()));
			setTimeout(() => req.dispatchEvent(), 0);
			return req;
		},
		put: (value: unknown) => {
			const key = (value as Record<string, string>).node_id 
				|| (value as Record<string, string>).clue_id
				|| (value as Record<string, string>).branch_id
				|| (value as Record<string, string>).id
				|| 'default_key';
			store.set(key, value);
			const req = createMockRequest(undefined);
			setTimeout(() => req.dispatchEvent(), 0);
			return req;
		},
		delete: (key: string) => {
			store.delete(key);
			const req = createMockRequest(undefined);
			setTimeout(() => req.dispatchEvent(), 0);
			return req;
		},
		clear: () => {
			store.clear();
			const req = createMockRequest(undefined);
			setTimeout(() => req.dispatchEvent(), 0);
			return req;
		},
		index: () => ({
			getAll: () => {
				const req = createMockRequest(Array.from(store.values()));
				setTimeout(() => req.dispatchEvent(), 0);
				return req;
			},
		}),
	};
};

// 模拟 IDBDatabase
const mockDB = {
	transaction: (storeName: keyof typeof memoryStorage) => ({
		objectStore: () => createMockStore(storeName),
	}),
	objectStoreNames: {
		contains: () => true,
	},
};

// Mock indexedDB
global.indexedDB = {
	open: () => {
		const req = {
			result: mockDB,
			onsuccess: null as ((this: IDBOpenDBRequest, ev: Event) => unknown) | null,
			onupgradeneeded: null as ((this: IDBOpenDBRequest, ev: IDBVersionChangeEvent) => unknown) | null,
			onerror: null,
			dispatchEvent: function(ev: string) {
				if (ev === 'success' && this.onsuccess) {
					this.onsuccess.call(this as unknown as IDBOpenDBRequest, new Event('success'));
				}
			},
		};
		setTimeout(() => req.dispatchEvent('success'), 0);
		return req as unknown as IDBOpenDBRequest;
	},
} as unknown as typeof indexedDB;

// 导入被测模块
import { localDb } from '@/lib/localDb';

describe('localDb', () => {
	beforeEach(async () => {
		// 清空内存存储
		memoryStorage.nodes.clear();
		memoryStorage.clues.clear();
		memoryStorage.branches.clear();
		memoryStorage.profile.clear();
		
		// 强制重新初始化
		(localDb as unknown as { db: unknown }).db = null;
	});

	describe('节点操作', () => {
		it('应插入新节点并返回带ID的节点', async () => {
			const nodeData = {
				event_date: '2025-01-01',
				salience_score: 8,
				core_event: '测试事件',
				npc_state: { current_emotion: '开心', attitude_towards_user: '友好' },
				memory_source: 'txt_extraction' as const,
				opening_mode: 'dialogue_driven' as const,
			};

			const node = await localDb.insertNode(nodeData);

			expect(node.node_id).toBeDefined();
			expect(node.node_id).toMatch(/^node_/);
			expect(node.created_at).toBeDefined();
			expect(node.core_event).toBe('测试事件');
		});

		it('应获取所有节点', async () => {
			await localDb.insertNode({
				event_date: '2025-02-01',
				salience_score: 5,
				core_event: '事件2',
				npc_state: { current_emotion: '平静', attitude_towards_user: '中性' },
				memory_source: 'txt_extraction',
				opening_mode: 'dialogue_driven',
			});
			await localDb.insertNode({
				event_date: '2025-01-01',
				salience_score: 8,
				core_event: '事件1',
				npc_state: { current_emotion: '开心', attitude_towards_user: '友好' },
				memory_source: 'txt_extraction',
				opening_mode: 'dialogue_driven',
			});

			const nodes = await localDb.getAllNodes();

			expect(nodes).toHaveLength(2);
		});

		it('应通过ID获取节点', async () => {
			const inserted = await localDb.insertNode({
				event_date: '2025-01-01',
				salience_score: 8,
				core_event: '查找测试',
				npc_state: { current_emotion: '开心', attitude_towards_user: '友好' },
				memory_source: 'txt_extraction',
				opening_mode: 'dialogue_driven',
			});

			const found = await localDb.getNodeById(inserted.node_id);

			expect(found).not.toBeNull();
			expect(found?.core_event).toBe('查找测试');
		});
	});
});
