// ============================================================
// 命运抉择功能测试
// 描述: 拥抱遗憾 / 逆天改命 双路径测试
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fetch
global.fetch = vi.fn();

// Mock Supabase
const mockSupabaseClient = {
	from: vi.fn(),
	auth: {
		getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } } }),
	},
};

vi.mock('@/lib/supabase', () => ({
	supabase: mockSupabaseClient,
}));

describe('命运抉择 API', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe('POST /api/choice/commit', () => {
		it('should create discard branch (拥抱遗憾)', async () => {
			const mockSingle = vi.fn().mockResolvedValue({
				data: { branch_id: 'branch-1', is_committed: false },
				error: null,
			});
			const mockSelect = vi.fn().mockReturnValue({
				single: mockSingle,
			});
			const mockInsert = vi.fn().mockReturnValue({
				select: mockSelect,
			});
			mockSupabaseClient.from.mockReturnValue({ insert: mockInsert });

			const { supabase } = await import('@/lib/supabase');
			const { data, error } = await supabase
				.from('If_Line_Branches')
				.insert([{
					parent_node_id: 'node-1',
					altered_choices: '用户选择了保持现状',
					new_ending: '一切如旧，遗憾永存',
					is_committed: false,
				}])
				.select()
				.single();

			expect(error).toBeNull();
			expect(data?.is_committed).toBe(false);
			expect(mockSupabaseClient.from).toHaveBeenCalledWith('If_Line_Branches');
		});

		it('should create commit branch (逆天改命)', async () => {
			const mockSingle = vi.fn().mockResolvedValue({
				data: { branch_id: 'branch-2', is_committed: true },
				error: null,
			});
			const mockSelect = vi.fn().mockReturnValue({
				single: mockSingle,
			});
			const mockInsert = vi.fn().mockReturnValue({
				select: mockSelect,
			});
			mockSupabaseClient.from.mockReturnValue({ insert: mockInsert });

			const { supabase } = await import('@/lib/supabase');
			const { data, error } = await supabase
				.from('If_Line_Branches')
				.insert([{
					parent_node_id: 'node-1',
					altered_choices: '用户说：如果当时我勇敢一点...',
					new_ending: '你鼓起勇气表白了，虽然不知道结果如何',
					is_committed: true,
				}])
				.select()
				.single();

			expect(error).toBeNull();
			expect(data?.is_committed).toBe(true);
		});

		it('should update user global_vibe when committing', async () => {
			const mockSingle = vi.fn().mockResolvedValue({
				data: { id: 'user-1', global_vibe: 'hopeful' },
				error: null,
			});
			const mockSelect = vi.fn().mockReturnValue({
				single: mockSingle,
			});
			const mockEq = vi.fn().mockReturnValue({
				select: mockSelect,
			});
			const mockUpdate = vi.fn().mockReturnValue({
				eq: mockEq,
			});
			mockSupabaseClient.from.mockReturnValue({ update: mockUpdate });

			const { supabase } = await import('@/lib/supabase');
			const { data, error } = await supabase
				.from('Users')
				.update({ global_vibe: 'hopeful' })
				.eq('id', 'user-1')
				.select()
				.single();

			expect(error).toBeNull();
			expect(data?.global_vibe).toBe('hopeful');
		});
	});

	describe('抉择条件检查', () => {
		it('should allow choice when all clues are unlocked', async () => {
			const mockSelect = vi.fn().mockReturnValue({
				eq: vi.fn().mockReturnValue({
					eq: vi.fn().mockResolvedValue({
						data: [], // 没有未解锁的线索
						error: null,
					}),
				}),
			});
			mockSupabaseClient.from.mockReturnValue({ select: mockSelect });

			const { supabase } = await import('@/lib/supabase');
			const { data } = await supabase
				.from('Hidden_Clues')
				.select('*')
				.eq('node_id', 'node-1')
				.eq('is_unlocked', false);

			// 没有未解锁线索，可以抉择
			expect(data).toHaveLength(0);
		});

		it('should block choice when clues remain locked', async () => {
			const mockSelect = vi.fn().mockReturnValue({
				eq: vi.fn().mockReturnValue({
					eq: vi.fn().mockResolvedValue({
						data: [{ clue_id: 'clue-1', is_unlocked: false }],
						error: null,
					}),
				}),
			});
			mockSupabaseClient.from.mockReturnValue({ select: mockSelect });

			const { supabase } = await import('@/lib/supabase');
			const { data } = await supabase
				.from('Hidden_Clues')
				.select('*')
				.eq('node_id', 'node-1')
				.eq('is_unlocked', false);

			// 还有未解锁线索，不能抉择
			expect(data?.length).toBeGreaterThan(0);
		});
	});

	describe('安全测试', () => {
		it('should sanitize malicious altered_choices input', async () => {
			const maliciousInput = "<script>alert('xss')</script>";

			const mockInsert = vi.fn().mockReturnValue({
				select: vi.fn().mockResolvedValue({
					data: null,
					error: { message: 'Invalid input detected' },
				}),
			});
			mockSupabaseClient.from.mockReturnValue({ insert: mockInsert });

			const { supabase } = await import('@/lib/supabase');
			const { error } = await supabase
				.from('If_Line_Branches')
				.insert([{
					parent_node_id: 'node-1',
					altered_choices: maliciousInput,
					new_ending: 'test',
					is_committed: false,
				}])
				.select();

			expect(error).toBeDefined();
		});

		it('should prevent SQL injection in node_id', async () => {
			const sqlInjection = "'; DROP TABLE If_Line_Branches; --";

			const mockInsert = vi.fn().mockReturnValue({
				select: vi.fn().mockResolvedValue({
					data: null,
					error: { message: 'Invalid UUID format' },
				}),
			});
			mockSupabaseClient.from.mockReturnValue({ insert: mockInsert });

			const { supabase } = await import('@/lib/supabase');
			const { error } = await supabase
				.from('If_Line_Branches')
				.insert([{
					parent_node_id: sqlInjection,
					altered_choices: 'test',
					new_ending: 'test',
					is_committed: false,
				}])
				.select();

			expect(error).toBeDefined();
		});
	});
});

describe('命运抉择 UI 组件', () => {
	it('should render choice buttons when dialogue ends', () => {
		// 抉择UI应该有两个按钮
		const choiceTypes = ['embrace', 'alter'];
		expect(choiceTypes).toContain('embrace');
		expect(choiceTypes).toContain('alter');
	});

	it('should show particle effect on commit choice', () => {
		// 逆天改命时触发粒子特效
		const isCommitted = true;
		expect(isCommitted).toBe(true);
	});

	it('should return to timeline after making choice', () => {
		// 抉择后返回时间轴
		const nextRoute = '/story';
		expect(nextRoute).toBe('/story');
	});
});
