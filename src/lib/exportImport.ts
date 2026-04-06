// ============================================================
// exportImport: JSON 导出/导入功能
// 支持数据备份、迁移和恢复
//
// 文件位置: src/lib/exportImport.ts
// 主要依赖: localDb
// 被引用: Settings 页面
//
// 导出功能:
//   - exportToJSON(): 导出所有数据为 JSON 文件
//   - importFromJSON(file): 从 JSON 文件导入数据
//   - generateChecksum(data): 生成数据校验和
//
// 使用示例:
//   await exportToJSON();
//   await importFromJSON(file, { mode: 'merge' });
//
// 维护记录:
//   - 2026-04-06: 创建
// ============================================================

import { localDb, MemoryNode, HiddenClue, IfLineBranch, CharacterProfileExtended } from '@/lib/localDb';
import { Character } from '@/types/character';

/** 备份数据格式 */
export interface BackupData {
	version: '1.0';
	exportDate: string;
	data: {
		nodes: MemoryNode[];
		clues: HiddenClue[];
		branches: IfLineBranch[];
		profile: CharacterProfileExtended | null;
		characters: Character[];
	};
	checksum: string;
}

/** 导入选项 */
export interface ImportOptions {
	/** 导入模式: merge(合并) 或 replace(替换) */
	mode: 'merge' | 'replace';
}

/** 导入结果 */
export interface ImportResult {
	success: boolean;
	message: string;
	imported?: {
		nodes: number;
		clues: number;
		branches: number;
		characters: number;
	};
}

/**
 * 生成数据校验和（简单的哈希实现）
 */
export function generateChecksum(data: unknown): string {
	const str = JSON.stringify(data) ?? '';
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash = hash & hash;
	}
	return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * 格式化日期为文件名格式
 */
function formatDateForFilename(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');
	return `${year}-${month}-${day}_${hours}-${minutes}`;
}

/**
 * 导出所有数据为 JSON 文件
 * 自动触发浏览器下载
 */
export async function exportToJSON(): Promise<void> {
	try {
		const data = await localDb.exportAll();
		// 防御性编程：确保数据不为 undefined
		const safeData = data || { nodes: [], clues: [], branches: [], profile: null, characters: [] };
		const backup: BackupData = {
			version: '1.0',
			exportDate: new Date().toISOString(),
			data: safeData,
			checksum: generateChecksum(safeData),
		};

		const blob = new Blob([JSON.stringify(backup, null, 2)], {
			type: 'application/json',
		});

		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `echo-tracks-backup-${formatDateForFilename(new Date())}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	} catch (error) {
		throw new Error(`导出失败: ${error instanceof Error ? error.message : '未知错误'}`);
	}
}

/**
 * 从 JSON 文件导入数据
 * @param file - JSON 文件
 * @param options - 导入选项
 * @returns 导入结果
 */
export async function importFromJSON(
	file: File,
	options: ImportOptions = { mode: 'merge' }
): Promise<ImportResult> {
	try {
		const text = await file.text();
		let backup: BackupData;

		try {
			backup = JSON.parse(text);
		} catch {
			return { success: false, message: '文件格式错误: 无效的 JSON' };
		}

		// 校验版本
		if (backup.version !== '1.0') {
			return { success: false, message: `不兼容的备份版本: ${backup.version}` };
		}

		// 校验数据完整性
		if (!backup.data || typeof backup.data !== 'object') {
			return { success: false, message: '备份文件格式错误: 缺少数据' };
		}

		const calculatedChecksum = generateChecksum(backup.data);
		if (backup.checksum !== calculatedChecksum) {
			return { success: false, message: '备份文件已损坏: 校验和不匹配' };
		}

		// 验证数据结构
		const data = backup.data;
		if (!Array.isArray(data.nodes) || !Array.isArray(data.clues) || !Array.isArray(data.branches)) {
			return { success: false, message: '备份文件格式错误: 数据类型不匹配' };
		}

		// 导入数据
		await localDb.importAll(data, options);

		return {
			success: true,
			message: '导入成功',
			imported: {
				nodes: data.nodes.length,
				clues: data.clues.length,
				branches: data.branches.length,
				characters: data.characters?.length || 0,
			},
		};
	} catch (error) {
		return {
			success: false,
			message: `导入失败: ${error instanceof Error ? error.message : '未知错误'}`,
		};
	}
}

/**
 * 检查文件是否是有效的备份文件
 * @param file - 要检查的文件
 * @returns 检查结果
 */
export async function validateBackupFile(file: File): Promise<{
	valid: boolean;
	message: string;
	backup?: BackupData;
}> {
	try {
		const text = await file.text();
		const backup: BackupData = JSON.parse(text);

		if (backup.version !== '1.0') {
			return { valid: false, message: `不兼容的版本: ${backup.version}` };
		}

		const calculatedChecksum = generateChecksum(backup.data);
		if (backup.checksum !== calculatedChecksum) {
			return { valid: false, message: '校验和验证失败' };
		}

		return { valid: true, message: '有效的备份文件', backup };
	} catch {
		return { valid: false, message: '无效的 JSON 格式' };
	}
}
