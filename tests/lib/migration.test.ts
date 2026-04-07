// ============================================================
// migration 测试
// 测试数据迁移功能
//
// 文件位置: tests/lib/migration.test.ts
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	validateMigrationData,
	previewMigration,
	executeMigration,
	rollbackMigration,
	getMigrationHistory,
	MigrationData,
} from '@/lib/migration';

// Mock localDb
const mockGetAllNodes = vi.fn();
const mockGetAllClues = vi.fn();
const mockGetAllBranches = vi.fn();
const mockGetAllCharacters = vi.fn();
const mockGetNodeById = vi.fn();
const mockInsertNode = vi.fn();
const mockExportAll = vi.fn();
const mockImportAll = vi.fn();

vi.mock('@/lib/localDb', () => ({
	localDb: {
		getAllNodes: () => mockGetAllNodes(),
		getAllClues: () => mockGetAllClues(),
		getAllBranches: () => mockGetAllBranches(),
		getAllCharacters: () => mockGetAllCharacters(),
		getNodeById: (id: string) => mockGetNodeById(id),
		insertNode: (node: any) => mockInsertNode(node),
		exportAll: () => mockExportAll(),
		importAll: (data: any, options: any) => mockImportAll(data, options),
		getCharacterById: () => null,
		insertClue: () => Promise.resolve(),
		insertBranch: () => Promise.resolve(),
		updateCharacterStats: () => Promise.resolve(),
		db: {
			transaction: () => ({
				objectStore: () => ({
					put: () => ({ onsuccess: (cb: any) => cb(), onerror: () => {} }),
				}),
			}),
		},
	}
}));

describe('migration', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();
		mockGetAllNodes.mockResolvedValue([]);
		mockGetAllClues.mockResolvedValue([]);
		mockGetAllBranches.mockResolvedValue([]);
		mockGetAllCharacters.mockResolvedValue([]);
	});

	describe('validateMigrationData', () => {
		it('应该验证有效的迁移数据', () => {
			const data: MigrationData = {
				nodes: [{ node_id: '1', core_event: 'Test' }],
				clues: [],
				branches: [],
				profile: null,
				characters: [],
			};
			const result = validateMigrationData(data);
			expect(result.valid).toBe(true);
		});

		it('应该拒绝 null 数据', () => {
			const result = validateMigrationData(null);
			expect(result.valid).toBe(false);
		});

		it('应该拒绝缺少必要字段的数据', () => {
			const data = { nodes: 'not-array' };
			const result = validateMigrationData(data);
			expect(result.valid).toBe(false);
		});

		it('应该拒绝缺少 node_id 的节点', () => {
			const data = {
				nodes: [{ core_event: 'Test' }],
				clues: [],
				branches: [],
			};
			const result = validateMigrationData(data);
			expect(result.valid).toBe(false);
		});
	});

	describe('previewMigration', () => {
		it('应该正确统计新数据', async () => {
			const sourceData: MigrationData = {
				nodes: [
					{ node_id: 'new1', core_event: 'New Node 1' },
					{ node_id: 'new2', core_event: 'New Node 2' },
				],
				clues: [{ clue_id: 'new-clue', node_id: 'new1' }],
				branches: [{ branch_id: 'new-branch', parent_node_id: 'new1' }],
				profile: null,
				characters: [{ id: 'char1', name: 'Character 1' }],
			};

			const preview = await previewMigration(sourceData);

			expect(preview.newNodes).toBe(2);
			expect(preview.newClues).toBe(1);
			expect(preview.newBranches).toBe(1);
			expect(preview.newCharacters).toBe(1);
			expect(preview.duplicateNodes).toBe(0);
		});

		it('应该检测重复节点', async () => {
			mockGetAllNodes.mockResolvedValue([
				{ node_id: 'existing', core_event: 'Existing' },
			]);

			const sourceData: MigrationData = {
				nodes: [{ node_id: 'existing', core_event: 'Existing' }],
				clues: [],
				branches: [],
				profile: null,
				characters: [],
			};

			const preview = await previewMigration(sourceData);

			expect(preview.duplicateNodes).toBe(1);
			expect(preview.newNodes).toBe(0);
		});

		it('应该检测冲突节点（相同ID不同内容）', async () => {
			mockGetAllNodes.mockResolvedValue([
				{ node_id: 'conflict', core_event: 'Original' },
			]);

			const sourceData: MigrationData = {
				nodes: [{ node_id: 'conflict', core_event: 'Different' }],
				clues: [],
				branches: [],
				profile: null,
				characters: [],
			};

			const preview = await previewMigration(sourceData);

			expect(preview.conflictNodes).toBe(1);
			expect(preview.duplicateNodes).toBe(0);
		});
	});

	describe('executeMigration', () => {
		it('应该成功迁移新数据', async () => {
			mockExportAll.mockResolvedValue({ nodes: [], clues: [], branches: [], profile: null, characters: [] });
			mockInsertNode.mockResolvedValue({});

			const sourceData: MigrationData = {
				nodes: [{ node_id: 'new1', core_event: 'New Node' }],
				clues: [],
				branches: [],
				profile: null,
				characters: [],
			};

			const result = await executeMigration(sourceData);

			expect(result.success).toBe(true);
			expect(result.imported?.nodes).toBe(1);
		});

		it('skip 策略应跳过重复节点', async () => {
			mockExportAll.mockResolvedValue({ nodes: [], clues: [], branches: [], profile: null, characters: [] });
			mockGetNodeById.mockResolvedValue({ node_id: 'existing' });

			const sourceData: MigrationData = {
				nodes: [{ node_id: 'existing', core_event: 'Node' }],
				clues: [],
				branches: [],
				profile: null,
				characters: [],
			};

			const result = await executeMigration(sourceData, 'skip');

			expect(result.success).toBe(true);
			expect(result.skipped?.nodes).toBe(1);
			expect(result.imported?.nodes).toBe(0);
		});

		it('应该记录迁移历史', async () => {
			mockExportAll.mockResolvedValue({ nodes: [], clues: [], branches: [], profile: null, characters: [] });
			mockInsertNode.mockResolvedValue({});

			const sourceData: MigrationData = {
				nodes: [{ node_id: 'new1', core_event: 'Node' }],
				clues: [],
				branches: [],
				profile: null,
				characters: [],
			};

			await executeMigration(sourceData);

			const history = getMigrationHistory();
			expect(history).toHaveLength(1);
			expect(history[0].result).toBe('success');
		});
	});

	describe('rollbackMigration', () => {
		it('应该成功回滚迁移', async () => {
			const backupData = {
				migrationId: 'test123',
				data: { nodes: [], clues: [], branches: [], profile: null, characters: [] },
			};
			localStorage.setItem('migrationBackup', JSON.stringify(backupData));

			const result = await rollbackMigration('test123');

			expect(result.success).toBe(true);
			expect(mockImportAll).toHaveBeenCalled();
		});

		it('应该拒绝不匹配的迁移ID', async () => {
			const backupData = {
				migrationId: 'different',
				data: {},
			};
			localStorage.setItem('migrationBackup', JSON.stringify(backupData));

			const result = await rollbackMigration('test123');

			expect(result.success).toBe(false);
			expect(result.message).toContain('不匹配');
		});

		it('应该处理无备份的情况', async () => {
			const result = await rollbackMigration('test123');

			expect(result.success).toBe(false);
			expect(result.message).toContain('未找到');
		});
	});

	describe('getMigrationHistory', () => {
		it('应该返回空数组当无历史', () => {
			const history = getMigrationHistory();
			expect(history).toEqual([]);
		});

		it('应该解析存储的历史', () => {
			const mockHistory = [
				{ id: '1', timestamp: '2024-01-01', source: 'import', result: 'success', imported: {} },
			];
			localStorage.setItem('migrationHistory', JSON.stringify(mockHistory));

			const history = getMigrationHistory();
			expect(history).toHaveLength(1);
			expect(history[0].id).toBe('1');
		});
	});
});
