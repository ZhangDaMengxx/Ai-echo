// ============================================================
// exportImport 测试
// 测试 JSON 导出/导入功能
//
// 文件位置: tests/lib/exportImport.test.ts
// 测试目标: src/lib/exportImport.ts
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock localDb module
const mockExportAll = vi.fn();
const mockImportAll = vi.fn();

vi.mock('@/lib/localDb', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@/lib/localDb')>();
	return {
		...actual,
		localDb: {
			...actual.localDb,
			exportAll: mockExportAll,
			importAll: mockImportAll,
		}
	};
});

// Import after mock
const { exportToJSON, importFromJSON, generateChecksum } = await import('@/lib/exportImport');

describe('exportImport', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		
		// Mock URL.createObjectURL and revokeObjectURL
		global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
		global.URL.revokeObjectURL = vi.fn();
		
		// Mock document.createElement for download
		const mockAnchor = {
			href: '',
			download: '',
			click: vi.fn(),
		};
		document.createElement = vi.fn((tag) => {
			if (tag === 'a') return mockAnchor as any;
			return {} as any;
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('generateChecksum', () => {
		it('应该为相同数据生成相同的校验和', () => {
			const data = { nodes: [], clues: [] };
			const checksum1 = generateChecksum(data);
			const checksum2 = generateChecksum(data);
			expect(checksum1).toBe(checksum2);
		});

		it('应该为不同数据生成不同的校验和', () => {
			const data1 = { nodes: [{ id: '1' }] };
			const data2 = { nodes: [{ id: '2' }] };
			const checksum1 = generateChecksum(data1);
			const checksum2 = generateChecksum(data2);
			expect(checksum1).not.toBe(checksum2);
		});
	});

	describe('exportToJSON', () => {
		it('应该成功导出数据为 JSON 文件', async () => {
			const mockData = {
				nodes: [{ node_id: 'node_1', core_event: '测试事件' }],
				clues: [],
				branches: [],
				profile: null,
				characters: [],
			};
			mockExportAll.mockResolvedValue(mockData);

			await exportToJSON();

			expect(mockExportAll).toHaveBeenCalled();
			expect(URL.createObjectURL).toHaveBeenCalled();
		});

		it('应该在文件名中包含日期', async () => {
			const mockData = { 
				nodes: [], 
				clues: [], 
				branches: [], 
				profile: null, 
				characters: [] 
			};
			mockExportAll.mockResolvedValue(mockData);

			const mockAnchor = {
				href: '',
				download: '',
				click: vi.fn(),
			};
			document.createElement = vi.fn(() => mockAnchor as any);

			await exportToJSON();

			expect(mockAnchor.download).toMatch(/echo-tracks-backup-\d{4}-\d{2}-\d{2}/);
		});

		it('应该在出错时抛出错误', async () => {
			mockExportAll.mockRejectedValue(new Error('数据库错误'));

			await expect(exportToJSON()).rejects.toThrow('导出失败');
		});
	});

	describe('importFromJSON', () => {
		it('应该成功导入有效的备份文件', async () => {
			const mockData = {
				version: '1.0',
				exportDate: new Date().toISOString(),
				data: {
					nodes: [{ node_id: 'node_1', core_event: '测试' }],
					clues: [],
					branches: [],
					profile: { name: 'Test' },
					characters: [],
				},
				checksum: '',
			};
			mockData.checksum = generateChecksum(mockData.data);

			const file = new File([JSON.stringify(mockData)], 'backup.json', {
				type: 'application/json',
			});

			mockImportAll.mockResolvedValue(undefined);

			const result = await importFromJSON(file);

			expect(result.success).toBe(true);
			expect(result.imported?.nodes).toBe(1);
			expect(mockImportAll).toHaveBeenCalled();
		});

		it('应该拒绝不兼容的版本', async () => {
			const mockData = {
				version: '2.0',
				exportDate: new Date().toISOString(),
				data: {},
				checksum: 'invalid',
			};

			const file = new File([JSON.stringify(mockData)], 'backup.json', {
				type: 'application/json',
			});

			const result = await importFromJSON(file);

			expect(result.success).toBe(false);
			expect(result.message).toContain('不兼容');
		});

		it('应该检测到损坏的备份文件', async () => {
			const mockData = {
				version: '1.0',
				exportDate: new Date().toISOString(),
				data: { nodes: [] },
				checksum: 'invalid-checksum',
			};

			const file = new File([JSON.stringify(mockData)], 'backup.json', {
				type: 'application/json',
			});

			const result = await importFromJSON(file);

			expect(result.success).toBe(false);
			expect(result.message).toContain('损坏');
		});

		it('应该处理无效的 JSON 文件', async () => {
			const file = new File(['invalid json'], 'backup.json', {
				type: 'application/json',
			});

			const result = await importFromJSON(file);

			expect(result.success).toBe(false);
			expect(result.message).toContain('格式错误');
		});

		it('应该支持合并模式导入', async () => {
			const mockData = {
				version: '1.0',
				exportDate: new Date().toISOString(),
				data: {
					nodes: [{ node_id: 'node_1' }],
					clues: [],
					branches: [],
					profile: null,
					characters: [],
				},
				checksum: '',
			};
			mockData.checksum = generateChecksum(mockData.data);

			const file = new File([JSON.stringify(mockData)], 'backup.json', {
				type: 'application/json',
			});

			mockImportAll.mockResolvedValue(undefined);

			await importFromJSON(file, { mode: 'merge' });

			expect(mockImportAll).toHaveBeenCalledWith(
				mockData.data,
				{ mode: 'merge' }
			);
		});

		it('应该支持替换模式导入', async () => {
			const mockData = {
				version: '1.0',
				exportDate: new Date().toISOString(),
				data: {
					nodes: [],
					clues: [],
					branches: [],
					profile: null,
					characters: [],
				},
				checksum: '',
			};
			mockData.checksum = generateChecksum(mockData.data);

			const file = new File([JSON.stringify(mockData)], 'backup.json', {
				type: 'application/json',
			});

			mockImportAll.mockResolvedValue(undefined);

			await importFromJSON(file, { mode: 'replace' });

			expect(mockImportAll).toHaveBeenCalledWith(
				mockData.data,
				{ mode: 'replace' }
			);
		});
	});
});
