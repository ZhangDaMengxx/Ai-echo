// ============================================================
// Export/Import: 数据备份与恢复
// 描述: JSON 导出导入功能，支持数据迁移和灾难恢复
// 版本: v1.1 - 支持多人物备份
// ============================================================

import { localDb, MemoryNode, HiddenClue, IfLineBranch, CharacterProfile } from './localDb';
import type { Character } from '@/types/character';

/** 扩展的人物画像，包含 character_id */
interface CharacterProfileExtended extends CharacterProfile {
	character_id: string;
}

// 备份数据格式 v1.1
export interface BackupData {
	version: '1.1';
	exportDate: string;
	data: {
		characters: Character[];
		nodes: MemoryNode[];
		clues: HiddenClue[];
		branches: IfLineBranch[];
		profiles: CharacterProfileExtended[];
	};
	checksum: string;
}

// 兼容 v1.0 备份格式
interface BackupDataV1_0 {
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
 * 导出所有数据为 JSON 文件 (v1.1 格式)
 */
export async function exportToJSON(): Promise<void> {
	// 从 IndexedDB 获取所有数据
	const characters = await localDb.getAllCharacters();
	const nodes = await localDb.getAllNodes();
	const profiles: CharacterProfileExtended[] = [];
	
	// 为每个人物获取画像
	for (const char of characters) {
		const profile = await localDb.getProfileByCharacter(char.id);
		if (profile) {
			profiles.push({ ...profile, character_id: char.id });
		}
	}

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
		characters,
		nodes,
		clues,
		branches,
		profiles,
	};

	const backup: BackupData = {
		version: '1.1',
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
 * 支持 v1.0 和 v1.1 格式
 */
export async function importFromJSON(
	file: File,
	options: { mode: 'merge' | 'replace' } = { mode: 'merge' }
): Promise<ImportResult> {
	try {
		const text = await file.text();
		let parsed: unknown;

		try {
			parsed = JSON.parse(text);
		} catch {
			return { success: false, message: '文件格式错误：不是有效的 JSON 文件' };
		}

		const backup = parsed as BackupData | BackupDataV1_0;

		// 校验版本
		if (backup.version !== '1.0' && backup.version !== '1.1') {
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

		// 处理 v1.1 格式的人物导入
		if (backup.version === '1.1') {
			const v11Backup = backup as BackupData;
			// 导入人物
			if (v11Backup.data.characters && Array.isArray(v11Backup.data.characters)) {
				for (const char of v11Backup.data.characters) {
					const existing = await localDb.getCharacterById(char.id);
					if (!existing) {
						await localDb.createCharacter(char);
					}
				}
			}
			// 导入人物画像
			if (v11Backup.data.profiles && Array.isArray(v11Backup.data.profiles)) {
				for (const profile of v11Backup.data.profiles) {
					const { character_id, ...profileData } = profile;
					await localDb.updateProfileByCharacter(character_id, profileData);
				}
			}
		}

		// 处理 v1.0 格式（无人物信息，创建默认人物）
		const defaultCharacterId = 'default_character';
		if (backup.version === '1.0') {
			// 检查是否已存在默认人物
			const existing = await localDb.getCharacterById(defaultCharacterId);
			if (!existing) {
				await localDb.createCharacter({
					id: defaultCharacterId,
					name: '默认人物',
					slug: 'default',
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
					isDefault: true,
				});
			}
			// 导入旧版 profile
			const v10Backup = backup as BackupDataV1_0;
			if (v10Backup.data.profile) {
				await localDb.updateProfileByCharacter(defaultCharacterId, v10Backup.data.profile);
			}
		}

		// 导入节点
		if (backup.data.nodes && Array.isArray(backup.data.nodes)) {
			for (const node of backup.data.nodes) {
				if (options.mode === 'merge') {
					const existing = await localDb.getNodeById(node.node_id);
					if (existing) continue;
				}

				// 对于 v1.0，使用默认人物
				const characterId = node.character_id || defaultCharacterId;
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const { node_id: _nodeId, created_at: _createdAt, ...nodeData } = node;
				await localDb.insertNode({ ...nodeData, character_id: characterId });
				nodeCount++;
			}
		}

		// 导入线索
		if (backup.data.clues && Array.isArray(backup.data.clues)) {
			for (const clue of backup.data.clues) {
				const characterId = clue.character_id || defaultCharacterId;
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const { clue_id: _clueId, ...clueData } = clue;
				await localDb.insertClue({ ...clueData, character_id: characterId });
				clueCount++;
			}
		}

		// 导入 IF 线分支
		if (backup.data.branches && Array.isArray(backup.data.branches)) {
			for (const branch of backup.data.branches) {
				const characterId = branch.character_id || defaultCharacterId;
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const { branch_id: _branchId, created_at: _createdAt2, ...branchData } = branch;
				await localDb.insertBranch({ ...branchData, character_id: characterId });
				branchCount++;
			}
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

		if (backup.version !== '1.0' && backup.version !== '1.1') {
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
