// ============================================================
// migration: 数据迁移工具
// 支持数据迁移、验证、预览和回滚
//
// 文件位置: src/lib/migration.ts
// 主要依赖: localDb, exportImport
// 被引用: MigrationWizard 组件
//
// 功能:
//   - validateMigrationData: 验证迁移数据
//   - previewMigration: 预览迁移结果
//   - executeMigration: 执行迁移
//   - rollbackMigration: 回滚迁移
//
// 维护记录:
//   - 2026-04-06: 创建
// ============================================================

import { localDb, MemoryNode, HiddenClue, IfLineBranch, CharacterProfileExtended } from '@/lib/localDb';
import { Character } from '@/types/character';
import { BackupData, generateChecksum } from '@/lib/exportImport';

const MIGRATION_HISTORY_KEY = 'migrationHistory';
const MIGRATION_BACKUP_KEY = 'migrationBackup';

/** 迁移数据类型 */
export interface MigrationData {
	nodes: MemoryNode[];
	clues: HiddenClue[];
	branches: IfLineBranch[];
	profile: CharacterProfileExtended | null;
	characters: Character[];
}

/** 迁移预览结果 */
export interface MigrationPreview {
	/** 可导入的新节点数 */
	newNodes: number;
	/** 可导入的新线索数 */
	newClues: number;
	/** 可导入的新分支数 */
	newBranches: number;
	/** 可导入的新人物数 */
	newCharacters: number;
	/** 重复的节点数 */
	duplicateNodes: number;
	/** 冲突的节点数（需要处理） */
	conflictNodes: number;
	/** 预览详情 */
	details: {
		nodes: Array<{ id: string; title: string; status: 'new' | 'duplicate' | 'conflict' }>;
		characters: Array<{ id: string; name: string; status: 'new' | 'duplicate' }>;
	};
}

/** 迁移结果 */
export interface MigrationResult {
	success: boolean;
	message: string;
	/** 实际导入的数量 */
	imported?: {
		nodes: number;
		clues: number;
		branches: number;
		characters: number;
	};
	/** 跳过的数量 */
	skipped?: {
		nodes: number;
		clues: number;
		branches: number;
		characters: number;
	};
	/** 迁移ID（用于回滚） */
	migrationId?: string;
}

/** 迁移历史记录 */
export interface MigrationHistory {
	id: string;
	timestamp: string;
	source: string;
	result: 'success' | 'failed' | 'rolled_back';
	imported: MigrationPreview;
}

/** 冲突解决策略 */
export type ConflictStrategy = 'skip' | 'replace' | 'rename';

/**
 * 验证迁移数据
 */
export function validateMigrationData(data: unknown): { valid: boolean; message?: string } {
	if (!data || typeof data !== 'object') {
		return { valid: false, message: '无效的数据格式' };
	}

	const migrationData = data as Partial<MigrationData>;

	// 检查必要字段
	if (!Array.isArray(migrationData.nodes)) {
		return { valid: false, message: '缺少节点数据' };
	}
	if (!Array.isArray(migrationData.clues)) {
		return { valid: false, message: '缺少线索数据' };
	}
	if (!Array.isArray(migrationData.branches)) {
		return { valid: false, message: '缺少分支数据' };
	}

	// 验证节点数据结构
	for (const node of migrationData.nodes) {
		if (!node.node_id || !node.core_event) {
			return { valid: false, message: '节点数据格式错误：缺少必要字段' };
		}
	}

	return { valid: true };
}

/**
 * 预览迁移结果
 */
export async function previewMigration(sourceData: MigrationData): Promise<MigrationPreview> {
	const existingNodes = await localDb.getAllNodes();
	const existingClues = await localDb.getAllClues();
	const existingBranches = await localDb.getAllBranches();
	const existingCharacters = await localDb.getAllCharacters();

	const existingNodeIds = new Set(existingNodes.map(n => n.node_id));
	const existingClueIds = new Set(existingClues.map(c => c.clue_id));
	const existingBranchIds = new Set(existingBranches.map(b => b.branch_id));
	const existingCharIds = new Set(existingCharacters.map(c => c.id));

	// 分析节点
	let newNodes = 0;
	let duplicateNodes = 0;
	let conflictNodes = 0;
	const nodeDetails: Array<{ id: string; title: string; status: 'new' | 'duplicate' | 'conflict' }> = [];

	for (const node of sourceData.nodes) {
		if (existingNodeIds.has(node.node_id)) {
			// 检查是否为真正的冲突（内容不同）
			const existing = existingNodes.find(n => n.node_id === node.node_id);
			if (existing && JSON.stringify(existing) !== JSON.stringify(node)) {
				conflictNodes++;
				nodeDetails.push({ id: node.node_id, title: node.core_event, status: 'conflict' });
			} else {
				duplicateNodes++;
				nodeDetails.push({ id: node.node_id, title: node.core_event, status: 'duplicate' });
			}
		} else {
			newNodes++;
			nodeDetails.push({ id: node.node_id, title: node.core_event, status: 'new' });
		}
	}

	// 分析人物
	const charDetails: Array<{ id: string; name: string; status: 'new' | 'duplicate' }> = [];
	let newCharacters = 0;
	let duplicateCharacters = 0;

	for (const char of sourceData.characters || []) {
		if (existingCharIds.has(char.id)) {
			duplicateCharacters++;
			charDetails.push({ id: char.id, name: char.name, status: 'duplicate' });
		} else {
			newCharacters++;
			charDetails.push({ id: char.id, name: char.name, status: 'new' });
		}
	}

	// 分析线索和分支
	const newClues = sourceData.clues.filter(c => !existingClueIds.has(c.clue_id)).length;
	const newBranches = sourceData.branches.filter(b => !existingBranchIds.has(b.branch_id)).length;

	return {
		newNodes,
		newClues,
		newBranches,
		newCharacters,
		duplicateNodes,
		conflictNodes,
		details: {
			nodes: nodeDetails,
			characters: charDetails,
		},
	};
}

/**
 * 执行数据迁移
 */
export async function executeMigration(
	sourceData: MigrationData,
	strategy: ConflictStrategy = 'skip'
): Promise<MigrationResult> {
	const migrationId = `migration_${Date.now()}`;

	try {
		// 1. 创建迁移前备份
		const currentData = await localDb.exportAll();
		localStorage.setItem(MIGRATION_BACKUP_KEY, JSON.stringify({
			migrationId,
			timestamp: Date.now(),
			data: currentData,
		}));

		// 2. 获取预览
		const preview = await previewMigration(sourceData);

		// 3. 处理冲突并导入
		let importedNodes = 0;
		let importedClues = 0;
		let importedBranches = 0;
		let importedCharacters = 0;
		let skippedNodes = 0;

		// 导入人物
		for (const char of sourceData.characters || []) {
			const existing = await localDb.getCharacterById(char.id);
			if (!existing) {
				await new Promise<void>((resolve, reject) => {
					const tx = (localDb as any).db.transaction('characters', 'readwrite');
					const store = tx.objectStore('characters');
					const request = store.put(char);
					request.onsuccess = () => resolve();
					request.onerror = () => reject(request.error);
				});
				importedCharacters++;
			}
		}

		// 导入节点（处理冲突）
		for (const node of sourceData.nodes) {
			const existing = await localDb.getNodeById(node.node_id);
			if (!existing) {
				await localDb.insertNode(node);
				importedNodes++;
			} else {
				switch (strategy) {
					case 'replace':
						await localDb.updateNode(node.node_id, node);
						importedNodes++;
						break;
					case 'rename':
						const newNode = { ...node, node_id: `${node.node_id}_imported_${Date.now()}` };
						await localDb.insertNode(newNode);
						importedNodes++;
						break;
					case 'skip':
					default:
						skippedNodes++;
						break;
				}
			}
		}

		// 导入线索
		for (const clue of sourceData.clues) {
			try {
				await localDb.insertClue(clue);
				importedClues++;
			} catch {
				// 已存在则跳过
			}
		}

		// 导入分支
		for (const branch of sourceData.branches) {
			try {
				await localDb.insertBranch(branch);
				importedBranches++;
			} catch {
				// 已存在则跳过
			}
		}

		// 4. 更新人物统计
		const characters = await localDb.getAllCharacters();
		await Promise.all(characters.map(c => localDb.updateCharacterStats(c.id)));

		// 5. 记录迁移历史
		addMigrationHistory({
			id: migrationId,
			timestamp: new Date().toISOString(),
			source: 'import',
			result: 'success',
			imported: preview,
		});

		return {
			success: true,
			message: '迁移成功完成',
			imported: {
				nodes: importedNodes,
				clues: importedClues,
				branches: importedBranches,
				characters: importedCharacters,
			},
			skipped: {
				nodes: skippedNodes,
				clues: 0,
				branches: 0,
				characters: 0,
			},
			migrationId,
		};
	} catch (error) {
		// 记录失败
		addMigrationHistory({
			id: migrationId,
			timestamp: new Date().toISOString(),
			source: 'import',
			result: 'failed',
			imported: await previewMigration(sourceData),
		});

		return {
			success: false,
			message: `迁移失败: ${error instanceof Error ? error.message : '未知错误'}`,
		};
	}
}

/**
 * 回滚最后一次迁移
 */
export async function rollbackMigration(migrationId: string): Promise<MigrationResult> {
	try {
		const backupData = localStorage.getItem(MIGRATION_BACKUP_KEY);
		if (!backupData) {
			return { success: false, message: '未找到迁移备份，无法回滚' };
		}

		const backup = JSON.parse(backupData);
		if (backup.migrationId !== migrationId) {
			return { success: false, message: '迁移ID不匹配，无法回滚' };
		}

		// 恢复数据
		await localDb.importAll(backup.data, { mode: 'replace' });

		// 更新迁移历史
		updateMigrationHistory(migrationId, 'rolled_back');

		// 清除备份
		localStorage.removeItem(MIGRATION_BACKUP_KEY);

		return {
			success: true,
			message: '迁移已回滚',
			migrationId,
		};
	} catch (error) {
		return {
			success: false,
			message: `回滚失败: ${error instanceof Error ? error.message : '未知错误'}`,
		};
	}
}

/**
 * 获取迁移历史
 */
export function getMigrationHistory(): MigrationHistory[] {
	const history = localStorage.getItem(MIGRATION_HISTORY_KEY);
	return history ? JSON.parse(history) : [];
}

/**
 * 添加迁移历史
 */
function addMigrationHistory(record: MigrationHistory): void {
	const history = getMigrationHistory();
	history.unshift(record);
	// 只保留最近 10 条
	if (history.length > 10) {
		history.pop();
	}
	localStorage.setItem(MIGRATION_HISTORY_KEY, JSON.stringify(history));
}

/**
 * 更新迁移历史状态
 */
function updateMigrationHistory(migrationId: string, result: MigrationHistory['result']): void {
	const history = getMigrationHistory();
	const record = history.find(h => h.id === migrationId);
	if (record) {
		record.result = result;
		localStorage.setItem(MIGRATION_HISTORY_KEY, JSON.stringify(history));
	}
}

/**
 * 导出迁移报告
 */
export function exportMigrationReport(result: MigrationResult): string {
	const report = {
		...result,
		exportDate: new Date().toISOString(),
	};
	return JSON.stringify(report, null, 2);
}
