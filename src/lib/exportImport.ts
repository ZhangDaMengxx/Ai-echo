// ============================================================
// Export/Import: 数据备份与恢复
// 描述: JSON 导出导入功能，支持数据迁移和灾难恢复
// ============================================================

import { localDb, MemoryNode, HiddenClue, IfLineBranch, CharacterProfile } from './localDb';

// 备份数据格式
export interface BackupData {
	version: '1.0';
	exportDate: string;
	data: {
		nodes: MemoryNode[];
		clues: HiddenClue[];
		branches: IfLineBranch[];
		profile: CharacterProfile | null;
	};
	checksum: string;
}

// 导入结果
export interface ImportResult {
	success: boolean;
	message: string;
	imported?: {
		nodes: number;
		clues: number;
		branches: number;
	};
}

/**
 * 生成数据校验和（简单 CRC32）
 */
function generateChecksum(data: unknown): string {
	const str = JSON.stringify(data);
	let crc = 0 ^ (-1);
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		crc = (crc >>> 8) ^ crc32Table[(crc ^ char) & 0xFF];
	}
	return ((crc ^ (-1)) >>> 0).toString(16);
}

// CRC32 查找表
const crc32Table: number[] = [];
for (let i = 0; i < 256; i++) {
	let c = i;
	for (let j = 0; j < 8; j++) {
		c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
	}
	crc32Table[i] = c;
}

/**
 * 格式化日期为文件名友好格式
 */
function formatDateForFilename(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	const h = String(date.getHours()).padStart(2, '0');
	const min = String(date.getMinutes()).padStart(2, '0');
	return `${y}${m}${d}_${h}${min}`;
}

/**
 * 导出所有数据为 JSON 文件
 */
export async function exportToJSON(): Promise<void> {
	// 从 IndexedDB 获取所有数据
	const nodes = await localDb.getAllNodes();
	const profile = await localDb.getProfile();

	// 获取所有线索和分支
	const clues: HiddenClue[] = [];
	const branches: IfLineBranch[] = [];
	for (const node of nodes) {
		const nodeClues = await localDb.getCluesByNodeId(node.node_id);
		clues.push(...nodeClues);
		const nodeBranches = await localDb.getBranchesByNodeId(node.node_id);
		branches.push(...nodeBranches);
	}

	const data = {
		nodes,
		clues,
		branches,
		profile,
	};

	const backup: BackupData = {
		version: '1.0',
		exportDate: new Date().toISOString(),
		data,
		checksum: generateChecksum(data),
	};

	const blob = new Blob([JSON.stringify(backup, null, 2)], {
		type: 'application/json',
	});

	// 自动下载
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `echo-tracks-backup-${formatDateForFilename(new Date())}.json`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

/**
 * 从 JSON 文件导入数据
 */
export async function importFromJSON(
	file: File,
	options: { mode: 'merge' | 'replace' } = { mode: 'merge' }
): Promise<ImportResult> {
	try {
		const text = await file.text();
		let backup: BackupData;

		try {
			backup = JSON.parse(text) as BackupData;
		} catch {
			return { success: false, message: '文件格式错误：不是有效的 JSON 文件' };
		}

		// 校验版本
		if (backup.version !== '1.0') {
			return { success: false, message: `不兼容的备份版本: ${backup.version}` };
		}

		// 校验数据完整性
		const expectedChecksum = generateChecksum(backup.data);
		if (backup.checksum !== expectedChecksum) {
			return { success: false, message: '备份文件已损坏（校验和不匹配）' };
		}

		// 验证数据结构
		if (!backup.data || typeof backup.data !== 'object') {
			return { success: false, message: '备份数据格式错误' };
		}

		// 如果是替换模式，先清空现有数据
		if (options.mode === 'replace') {
			await localDb.clearAllNodes();
			await localDb.clearAllClues();
			await localDb.clearAllBranches();
		}

		// 导入节点和关联数据
		let nodeCount = 0;
		let clueCount = 0;
		let branchCount = 0;

		if (backup.data.nodes && Array.isArray(backup.data.nodes)) {
			for (const node of backup.data.nodes) {
				// 检查是否已存在（根据 node_id）
				if (options.mode === 'merge') {
					const existing = await localDb.getNodeById(node.node_id);
					if (existing) {
						// 跳过已存在的节点
						continue;
					}
				}

				// 插入节点（去除自动生成的字段）
				const { node_id: _, created_at: __, ...nodeData } = node;
				await localDb.insertNode(nodeData);
				nodeCount++;
			}
		}

		// 导入线索
		if (backup.data.clues && Array.isArray(backup.data.clues)) {
			for (const clue of backup.data.clues) {
				const { clue_id, ...clueData } = clue;
				await localDb.insertClue(clueData);
				clueCount++;
			}
		}

		// 导入 IF 线分支
		if (backup.data.branches && Array.isArray(backup.data.branches)) {
			for (const branch of backup.data.branches) {
				const { branch_id, created_at, ...branchData } = branch;
				await localDb.insertBranch(branchData);
				branchCount++;
			}
		}

		// 导入人物画像
		if (backup.data.profile) {
			await localDb.updateProfile(backup.data.profile);
		}

		return {
			success: true,
			message: `导入成功：${nodeCount} 个节点, ${clueCount} 条线索, ${branchCount} 个分支`,
			imported: {
				nodes: nodeCount,
				clues: clueCount,
				branches: branchCount,
			},
		};
	} catch (err) {
		const errorMsg = err instanceof Error ? err.message : '未知错误';
		return { success: false, message: `导入失败: ${errorMsg}` };
	}
}

/**
 * 验证备份文件（不导入）
 */
export async function validateBackupFile(file: File): Promise<{
	valid: boolean;
	message: string;
	preview?: {
		exportDate: string;
		nodeCount: number;
		clueCount: number;
		profileName?: string;
	};
}> {
	try {
		const text = await file.text();
		const backup: BackupData = JSON.parse(text);

		if (backup.version !== '1.0') {
			return { valid: false, message: '版本不兼容' };
		}

		const expectedChecksum = generateChecksum(backup.data);
		if (backup.checksum !== expectedChecksum) {
			return { valid: false, message: '文件已损坏' };
		}

		return {
			valid: true,
			message: '文件有效',
			preview: {
				exportDate: backup.exportDate,
				nodeCount: backup.data.nodes?.length || 0,
				clueCount: backup.data.clues?.length || 0,
				profileName: backup.data.profile?.name,
			},
		};
	} catch {
		return { valid: false, message: '无效的备份文件' };
	}
}

/**
 * 获取存储统计信息
 */
export async function getStorageStats(): Promise<{
	nodeCount: number;
	clueCount: number;
	branchCount: number;
	profileName?: string;
	lastBackup?: string;
}> {
	const nodes = await localDb.getAllNodes();
	const profile = await localDb.getProfile();

	let clueCount = 0;
	let branchCount = 0;
	for (const node of nodes) {
		const clues = await localDb.getCluesByNodeId(node.node_id);
		clueCount += clues.length;
		const branches = await localDb.getBranchesByNodeId(node.node_id);
		branchCount += branches.length;
	}

	// 从 localStorage 获取上次备份时间
	const lastBackup = localStorage.getItem('echo-tracks-last-backup') || undefined;

	return {
		nodeCount: nodes.length,
		clueCount,
		branchCount,
		profileName: profile?.name,
		lastBackup,
	};
}
