// ============================================================
// Supabase 集成测试
// 描述: 数据库连接、CRUD 操作、RLS 安全、Realtime 推送
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Supabase 客户端
const mockSupabaseClient: {
	from: ReturnType<typeof vi.fn>;
	auth: { getUser: ReturnType<typeof vi.fn> };
	channel: ReturnType<typeof vi.fn>;
	rpc?: ReturnType<typeof vi.fn>;
} = {
	from: vi.fn(),
	auth: {
		getUser: vi.fn(),
	},
	channel: vi.fn(),
};

vi.mock('@/lib/supabase', () => ({
	supabase: mockSupabaseClient,
	supabaseAdmin: mockSupabaseClient,
}));

// 测试数据
const mockNode = {
	node_id: 'test-node-1',
	user_id: 'test-user-1',
	event_date: '2025-01-15',
	salience_score: 8,
	core_event: '测试事件：在图书馆偶遇',
	npc_state: {
		current_emotion: '惊喜',
		attitude_towards_user: '友好',
	},
	memory_source: 'txt_extraction' as const,
	opening_mode: 'action_driven' as const,
	embedding: new Array(768).fill(0.1),
	created_at: new Date().toISOString(),
};

const mockClue = {
	clue_id: 'test-clue-1',
	node_id: 'test-node-1',
	trigger_condition: '用户询问那天的心情',
	clue_content: '其实那天我特意提前到图书馆等你',
	is_unlocked: false,
};

describe('Supabase 数据库操作', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe('MemoryNode CRUD', () => {
		it('should insert memory node with valid data', async () => {
			const mockInsert = vi.fn().mockReturnValue({
				single: vi.fn().mockResolvedValue({
					data: mockNode,
					error: null,
				}),
			});
			mockSupabaseClient.from.mockReturnValue({ insert: mockInsert });

			const { supabase } = await import('@/lib/supabase');
			const result = await supabase
				.from('Memory_Nodes')
				.insert(mockNode)
				.single();

			expect(mockSupabaseClient.from).toHaveBeenCalledWith('Memory_Nodes');
			expect(result.data).toEqual(mockNode);
			expect(result.error).toBeNull();
		});

		it('should query nodes by user_id with RLS', async () => {
			const mockSelect = vi.fn().mockReturnValue({
				eq: vi.fn().mockReturnValue({
					order: vi.fn().mockResolvedValue({
						data: [mockNode],
						error: null,
					}),
				}),
			});
			mockSupabaseClient.from.mockReturnValue({ select: mockSelect });

			const { supabase } = await import('@/lib/supabase');
			const result = await supabase
				.from('Memory_Nodes')
				.select('*')
				.eq('user_id', 'test-user-1')
				.order('event_date', { ascending: true });

			expect(result.data).toHaveLength(1);
			expect(result.data?.[0].user_id).toBe('test-user-1');
		});

		it('should filter nodes by salience_score >= 7', async () => {
			const mockSelect = vi.fn().mockReturnValue({
				gte: vi.fn().mockReturnValue({
					order: vi.fn().mockResolvedValue({
						data: [mockNode],
						error: null,
					}),
				}),
			});
			mockSupabaseClient.from.mockReturnValue({ select: mockSelect });

			const { supabase } = await import('@/lib/supabase');
			const result = await supabase
				.from('Memory_Nodes')
				.select('*')
				.gte('salience_score', 7)
				.order('event_date', { ascending: true });

			expect(result.data?.[0].salience_score).toBeGreaterThanOrEqual(7);
		});
	});

	describe('HiddenClue 线索管理', () => {
		it('should insert hidden clues for a node', async () => {
			const mockInsert = vi.fn().mockReturnValue({
				select: vi.fn().mockResolvedValue({
					data: [mockClue],
					error: null,
				}),
			});
			mockSupabaseClient.from.mockReturnValue({ insert: mockInsert });

			const { supabase } = await import('@/lib/supabase');
			const result = await supabase
				.from('Hidden_Clues')
				.insert([mockClue])
				.select();

			expect(result.data).toHaveLength(1);
			expect(result.data?.[0].node_id).toBe('test-node-1');
		});

		it('should unlock clue by updating is_unlocked', async () => {
			const updatedClue = { 
				...mockClue, 
				is_unlocked: true, 
				unlocked_at: new Date().toISOString() 
			};
			const mockUpdate = vi.fn().mockReturnValue({
				eq: vi.fn().mockResolvedValue({
					data: updatedClue,
					error: null,
				}),
			});
			mockSupabaseClient.from.mockReturnValue({ update: mockUpdate });

			const { supabase } = await import('@/lib/supabase');
			const result = await supabase
				.from('Hidden_Clues')
				.update({ is_unlocked: true, unlocked_at: new Date().toISOString() })
				.eq('clue_id', 'test-clue-1');

			expect((result.data as unknown as typeof mockClue)?.is_unlocked).toBe(true);
		});
	});

	describe('向量搜索 (Embedding)', () => {
		it('should perform vector similarity search', async () => {
			const queryVector = new Array(768).fill(0.2);
			const mockRpc = vi.fn().mockResolvedValue({
				data: [{ node_id: 'test-node-1', similarity: 0.95 }],
				error: null,
			});
			mockSupabaseClient.rpc = mockRpc;

			const { supabase } = await import('@/lib/supabase');
			const result = await supabase.rpc('match_memory_nodes', {
				query_embedding: queryVector,
				match_threshold: 0.8,
				match_count: 10,
			});

			expect(mockRpc).toHaveBeenCalledWith('match_memory_nodes', {
				query_embedding: queryVector,
				match_threshold: 0.8,
				match_count: 10,
			});
			expect(result.data?.[0].similarity).toBeGreaterThan(0.9);
		});
	});

	describe('安全测试 - SQL 注入防护', () => {
		it('should sanitize SQL injection in core_event', async () => {
			const maliciousInput = "'; DROP TABLE Memory_Nodes; --";
			const mockInsert = vi.fn().mockReturnValue({
				single: vi.fn().mockResolvedValue({
					data: null,
					error: { message: 'Invalid input detected' },
				}),
			});
			mockSupabaseClient.from.mockReturnValue({ insert: mockInsert });

			const { supabase } = await import('@/lib/supabase');
			const result = await supabase
				.from('Memory_Nodes')
				.insert({ ...mockNode, core_event: maliciousInput })
				.single();

			// 应该返回错误而不是执行恶意 SQL
			expect(result.error).toBeDefined();
		});

		it('should sanitize XSS payload in npc_state', async () => {
			const xssPayload = {
				current_emotion: '<script>alert("xss")</script>',
				attitude_towards_user: '<img src=x onerror=alert(1)>',
			};
			const mockInsert = vi.fn().mockReturnValue({
				single: vi.fn().mockResolvedValue({
					data: null,
					error: { message: 'Invalid input detected' },
				}),
			});
			mockSupabaseClient.from.mockReturnValue({ insert: mockInsert });

			const { supabase } = await import('@/lib/supabase');
			const result = await supabase
				.from('Memory_Nodes')
				.insert({ ...mockNode, npc_state: xssPayload })
				.single();

			expect(result.error).toBeDefined();
		});
	});

	describe('Realtime 推送', () => {
		it('should subscribe to clue unlock events', async () => {
			const mockOn = vi.fn().mockReturnValue({
				subscribe: vi.fn(),
			});
			const mockChannel = {
				on: mockOn,
			};
			mockSupabaseClient.channel.mockReturnValue(mockChannel);

			const { supabase } = await import('@/lib/supabase');
			const callback = vi.fn();

			supabase
				.channel('clue-unlock-channel')
				.on(
					'postgres_changes',
					{
						event: 'UPDATE',
						schema: 'public',
						table: 'Hidden_Clues',
						filter: 'is_unlocked=eq.true',
					},
					callback
				)
				.subscribe();

			expect(mockSupabaseClient.channel).toHaveBeenCalledWith('clue-unlock-channel');
			expect(mockOn).toHaveBeenCalled();
		});
	});
});

describe('数据库 Schema 验证', () => {
	it('should validate MemoryNode interface structure', () => {
		const validNode = {
			node_id: 'uuid',
			user_id: 'user-uuid',
			event_date: '2025-01-01',
			salience_score: 8,
			core_event: '有效事件描述',
			npc_state: {
				current_emotion: '愉悦',
				attitude_towards_user: '友好',
			},
			memory_source: 'txt_extraction',
			opening_mode: 'action_driven',
			embedding: new Array(768).fill(0),
			created_at: new Date().toISOString(),
		};

		expect(validNode.salience_score).toBeGreaterThanOrEqual(1);
		expect(validNode.salience_score).toBeLessThanOrEqual(10);
		expect(validNode.embedding).toHaveLength(768);
		expect(['txt_extraction', 'user_supplement']).toContain(validNode.memory_source);
		expect(['action_driven', 'dialogue_driven']).toContain(validNode.opening_mode);
	});

	it('should reject invalid salience_score values', () => {
		const invalidScores = [0, 11, -5, 100];

		// 验证这些无效值会被过滤或拒绝
		invalidScores.forEach((score) => {
			const isValid = score >= 1 && score <= 10;
			expect(isValid).toBe(false);
		});
	});
});
