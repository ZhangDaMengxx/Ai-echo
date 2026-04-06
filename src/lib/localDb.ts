// ============================================================
// Local Database: IndexedDB 封装
// 描述: 浏览器本地存储，替代 Supabase，零隐私风险
// 版本: v3 - 支持多人物系统
// ============================================================

import type { Character } from '@/types/character';

// 重新导出CharacterProfile以便向后兼容
export interface CharacterProfile {
	name: string;
	style: string;
	logic: string;
	dominant_emotions: string[];
	dominant_attitudes: string[];
	summary: string;
	global_vibe: string;
}

/** 扩展的CharacterProfile，关联到具体人物 */
export interface CharacterProfileExtended extends CharacterProfile {
	/** 关联的人物ID */
	character_id: string;
}

export interface MemoryNode {
	node_id: string;

	/** 关联的人物ID */
	character_id: string;
	event_date: string;
	salience_score: number;
	core_event: string;
	npc_state: {
		current_emotion: string;
		attitude_towards_user: string;
	};
	memory_source: 'txt_extraction' | 'user_supplement';
	opening_mode: 'action_driven' | 'dialogue_driven';
	created_at: string;
}

export interface HiddenClue {
	clue_id: string;

	/** 关联的人物ID */
	character_id: string;
	node_id: string;
	trigger_condition: string;
	clue_content: string;
	is_unlocked: boolean;
	unlocked_at?: string;
}

export interface IfLineBranch {
	branch_id: string;

	/** 关联的人物ID */
	character_id: string;
	parent_node_id: string;
	altered_choices: string;
	new_ending: string;
	emotional_tone: string;
	is_committed: boolean;
	created_at: string;
}

/** 扩展的CharacterProfile，关联到具体人物 */
export interface CharacterProfileExtended extends CharacterProfile {
	/** 关联的人物ID */
	character_id: string;
}

const DB_NAME = 'EchoTracksDB';
const DB_VERSION = 3;

class LocalDatabase {
	private db: IDBDatabase | null = null;

	// 检查是否在服务端
	private isServer(): boolean {
		return typeof window === 'undefined' || typeof indexedDB === 'undefined';
	}

	async init(): Promise<void> {
		if (this.db) return;
		
		// 服务端渲染时跳过初始化
		if (this.isServer()) {
			return;
		}

		return new Promise((resolve, reject) => {
			const request = indexedDB.open(DB_NAME, DB_VERSION);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => {
				this.db = request.result;
				resolve();
			};

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;
				const oldVersion = event.oldVersion;
				const transaction = request.transaction!;

				// ========== v1: 初始表 ==========
				if (oldVersion < 1) {
					// 记忆节点表
					if (!db.objectStoreNames.contains('nodes')) {
						const nodeStore = db.createObjectStore('nodes', { keyPath: 'node_id' });
						nodeStore.createIndex('event_date', 'event_date', { unique: false });
						nodeStore.createIndex('salience_score', 'salience_score', { unique: false });
					}

					// 隐藏线索表
					if (!db.objectStoreNames.contains('clues')) {
						const clueStore = db.createObjectStore('clues', { keyPath: 'clue_id' });
						clueStore.createIndex('node_id', 'node_id', { unique: false });
					}

					// IF线分支表
					if (!db.objectStoreNames.contains('branches')) {
						const branchStore = db.createObjectStore('branches', { keyPath: 'branch_id' });
						branchStore.createIndex('parent_node_id', 'parent_node_id', { unique: false });
					}

					// 人物画像表
					if (!db.objectStoreNames.contains('profile')) {
						db.createObjectStore('profile', { keyPath: 'id' });
					}
				}

				// ========== v2: 添加清空方法所需（已包含在v3中）==========

				// ========== v3: 多人物系统 ==========
				if (oldVersion < 3) {
					// 1. 创建人物表
					if (!db.objectStoreNames.contains('characters')) {
						const charStore = db.createObjectStore('characters', { keyPath: 'id' });
						charStore.createIndex('slug', 'slug', { unique: true });
						charStore.createIndex('isDefault', 'isDefault', { unique: false });
					}

					// 2. 为现有表添加 character_id 索引
					if (db.objectStoreNames.contains('nodes')) {
						const nodeStore = transaction.objectStore('nodes');
						if (!nodeStore.indexNames.contains('character_id')) {
							nodeStore.createIndex('character_id', 'character_id', { unique: false });
						}
					}

					if (db.objectStoreNames.contains('clues')) {
						const clueStore = transaction.objectStore('clues');
						if (!clueStore.indexNames.contains('character_id')) {
							clueStore.createIndex('character_id', 'character_id', { unique: false });
						}
						if (!clueStore.indexNames.contains('node_id')) {
							clueStore.createIndex('node_id', 'node_id', { unique: false });
						}
					}

					if (db.objectStoreNames.contains('branches')) {
						const branchStore = transaction.objectStore('branches');
						if (!branchStore.indexNames.contains('character_id')) {
							branchStore.createIndex('character_id', 'character_id', { unique: false });
						}
						if (!branchStore.indexNames.contains('parent_node_id')) {
							branchStore.createIndex('parent_node_id', 'parent_node_id', { unique: false });
						}
					}

					// 3. 创建新的按人物索引的profile表
					if (!db.objectStoreNames.contains('character_profiles')) {
						const profileStore = db.createObjectStore('character_profiles', { keyPath: 'character_id' });
						profileStore.createIndex('character_id', 'character_id', { unique: true });
					}

					// 4. 迁移现有数据到默认人物
					this.migrateV2ToV3(transaction);
				}
			};
		});
	}

	// ========== v3 数据迁移 ==========
	private async migrateV2ToV3(transaction: IDBTransaction): Promise<void> {
		// 创建默认人物
		const charStore = transaction.objectStore('characters');
		const defaultChar: Character = {
			id: 'char_default',
			name: 'ELARA',
			slug: 'elara',
			avatar: '👤',
			description: '默认人物',
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			isDefault: true,
			stats: { nodeCount: 0, clueCount: 0, branchCount: 0 }
		};
		charStore.put(defaultChar);

		// 迁移节点
		const nodeStore = transaction.objectStore('nodes');
		const nodeRequest = nodeStore.getAll();
		nodeRequest.onsuccess = () => {
			const nodes = nodeRequest.result as MemoryNode[];
			nodes.forEach((node) => {
				if (!node.character_id) {
					node.character_id = 'char_default';
					nodeStore.put(node);
				}
			});
		};

		// 迁移线索
		const clueStore = transaction.objectStore('clues');
		const clueRequest = clueStore.getAll();
		clueRequest.onsuccess = () => {
			const clues = clueRequest.result as HiddenClue[];
			clues.forEach((clue) => {
				if (!clue.character_id) {
					clue.character_id = 'char_default';
					clueStore.put(clue);
				}
			});
		};

		// 迁移分支
		const branchStore = transaction.objectStore('branches');
		const branchRequest = branchStore.getAll();
		branchRequest.onsuccess = () => {
			const branches = branchRequest.result as IfLineBranch[];
			branches.forEach((branch) => {
				if (!branch.character_id) {
					branch.character_id = 'char_default';
					branchStore.put(branch);
				}
			});
		};

		// 迁移profile
		const profileStore = transaction.objectStore('profile');
		const newProfileStore = transaction.objectStore('character_profiles');
		const profileRequest = profileStore.get('main');
		profileRequest.onsuccess = () => {
			const profile = profileRequest.result;
			if (profile) {
				newProfileStore.put({
					...profile,
					character_id: 'char_default'
				});
			}
		};
	}

	// ========== 人物操作 ==========
	async getAllCharacters(): Promise<Character[]> {
		await this.init();
		if (this.isServer() || !this.db) return [];
		return new Promise((resolve, reject) => {
			const tx = this.db!.transaction('characters', 'readonly');
			const store = tx.objectStore('characters');
			const request = store.getAll();

			request.onsuccess = () => {
				const chars = request.result as Character[];
				chars.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
				resolve(chars);
			};
			request.onerror = () => reject(request.error);
		});
	}

	async getCharacterById(id: string): Promise<Character | null> {
		await this.init();
		if (this.isServer() || !this.db) return null;
		return new Promise((resolve, reject) => {
			const tx = this.db!.transaction('characters', 'readonly');
			const store = tx.objectStore('characters');
			const request = store.get(id);

			request.onsuccess = () => resolve(request.result || null);
			request.onerror = () => reject(request.error);
		});
	}

	async getCharacterBySlug(slug: string): Promise<Character | null> {
		await this.init();
		return new Promise((resolve, reject) => {
			const tx = this.db!.transaction('characters', 'readonly');
			const store = tx.objectStore('characters');
			const index = store.index('slug');
			const request = index.get(slug);

			request.onsuccess = () => resolve(request.result || null);
			request.onerror = () => reject(request.error);
		});
	}

	async getDefaultCharacter(): Promise<Character | null> {
		await this.init();
		return new Promise((resolve, reject) => {
			const tx = this.db!.transaction('characters', 'readonly');
			const store = tx.objectStore('characters');
			const index = store.index('isDefault');
			const request = index.getAll(1); // IndexedDB中布尔true存储为1

			request.onsuccess = () => {
				const chars = request.result as Character[];
				resolve(chars[0] || null);
			};
			request.onerror = () => reject(request.error);
		});
	}

	async createCharacter(data: { name: string; avatar?: string; description?: string }): Promise<Character> {
		await this.init();

		const slug = this.generateSlug(data.name);
		const now = new Date().toISOString();

		const character: Character = {
			id: `char_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
			name: data.name,
			slug,
			avatar: data.avatar || this.getRandomAvatar(),
			description: data.description,
			createdAt: now,
			updatedAt: now,
			isDefault: false,
			stats: { nodeCount: 0, clueCount: 0, branchCount: 0 }
		};

		return new Promise((resolve, reject) => {
			const tx = this.db!.transaction('characters', 'readwrite');
			const store = tx.objectStore('characters');
			const request = store.put(character);

			request.onsuccess = () => resolve(character);
			request.onerror = () => reject(request.error);
		});
	}

	async updateCharacter(id: string, updates: Partial<Omit<Character, 'id' | 'createdAt'>>): Promise<void> {
		await this.init();
		const char = await this.getCharacterById(id);
		if (!char) throw new Error('Character not found');

		return new Promise((resolve, reject) => {
			const tx = this.db!.transaction('characters', 'readwrite');
			const store = tx.objectStore('characters');
			const updated = { ...char, ...updates, updatedAt: new Date().toISOString() };
			const request = store.put(updated);

			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}

	async deleteCharacter(id: string): Promise<void> {
		await this.init();

		// 同时删除该人物的所有数据
		await this.deleteCharacterData(id);

		return new Promise((resolve, reject) => {
			const tx = this.db!.transaction('characters', 'readwrite');
			const store = tx.objectStore('characters');
			const request = store.delete(id);

			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}

	async setDefaultCharacter(id: string): Promise<void> {
		await this.init();

		const tx = this.db!.transaction('characters', 'readwrite');
		const store = tx.objectStore('characters');

		// 先取消所有默认
		const index = store.index('isDefault');
		const allDefault = await new Promise<Character[]>((resolve, reject) => {
			const req = index.getAll(1); // IndexedDB中布尔true存储为1
			req.onsuccess = () => resolve(req.result);
			req.onerror = () => reject(req.error);
		});

		for (const char of allDefault) {
			char.isDefault = false;
			char.updatedAt = new Date().toISOString();
			store.put(char);
		}

		// 设置新的默认
		const char = await this.getCharacterById(id);
		if (char) {
			char.isDefault = true;
			char.updatedAt = new Date().toISOString();
			store.put(char);
		}
	}

	async updateCharacterStats(id: string): Promise<void> {
		await this.init();

		// 检查人物是否存在，不存在则静默返回
		const char = await this.getCharacterById(id);
		if (!char) return;

		const [nodes, clues, branches] = await Promise.all([
			this.getNodesByCharacter(id),
			this.getCluesByCharacter(id),
			this.getBranchesByCharacter(id)
		]);

		await this.updateCharacter(id, {
			stats: {
				nodeCount: nodes.length,
				clueCount: clues.length,
				branchCount: branches.length
			}
		});
	}

	// ========== 按人物查询数据 ==========
	async getNodesByCharacter(characterId: string): Promise<MemoryNode[]> {
		await this.init();
		if (this.isServer() || !this.db) return [];
		return new Promise((resolve, reject) => {
			const tx = this.db!.transaction('nodes', 'readonly');
			const store = tx.objectStore('nodes');
			const index = store.index('character_id');
			const request = index.getAll(characterId);

			request.onsuccess = () => {
				const nodes = request.result as MemoryNode[];
				nodes.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
				resolve(nodes);
			};
			request.onerror = () => reject(request.error);
		});
	}

	async getCluesByCharacter(characterId: string): Promise<HiddenClue[]> {
		await this.init();
		return new Promise((resolve, reject) => {
			const tx = this.db!.transaction('clues', 'readonly');
			const store = tx.objectStore('clues');
			const index = store.index('character_id');
			const request = index.getAll(characterId);

			request.onsuccess = () => resolve(request.result || []);
			request.onerror = () => reject(request.error);
		});
	}

	async getBranchesByCharacter(characterId: string): Promise<IfLineBranch[]> {
		await this.init();
		return new Promise((resolve, reject) => {
			const tx = this.db!.transaction('branches', 'readonly');
			const store = tx.objectStore('branches');
			const index = store.index('character_id');
			const request = index.getAll(characterId);

			request.onsuccess = () => resolve(request.result || []);
			request.onerror = () => reject(request.error);
		});
	}

	async getProfileByCharacter(characterId: string): Promise<CharacterProfileExtended | null> {
		await this.init();
		return new Promise((resolve, reject) => {
			const tx = this.db!.transaction('character_profiles', 'readonly');
			const store = tx.objectStore('character_profiles');
			const request = store.get(characterId);

			request.onsuccess = () => resolve(request.result || null);
			request.onerror = () => reject(request.error);
		});
	}

	async updateProfileByCharacter(characterId: string, profile: Partial<CharacterProfile>): Promise<void> {
		await this.init();
		const existing = await this.getProfileByCharacter(characterId);

		return new Promise((resolve, reject) => {
			const tx = this.db!.transaction('character_profiles', 'readwrite');
			const store = tx.objectStore('character_profiles');
			const newProfile = {
				character_id: characterId,
				name: existing?.name || '',
				style: existing?.style || '',
				logic: existing?.logic || '',
				dominant_emotions: existing?.dominant_emotions || [],
				dominant_attitudes: existing?.dominant_attitudes || [],
				summary: existing?.summary || '',
				global_vibe: existing?.global_vibe || 'neutral',
				...profile
			};
			const request = store.put(newProfile);

			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}

	// ========== 节点操作 ==========
	async getAllNodes(): Promise<MemoryNode[]> {
		await this.init();
		if (this.isServer() || !this.db) return [];
		return new Promise((resolve, reject) => {
			const tx = this.db!.transaction('nodes', 'readonly');
			const store = tx.objectStore('nodes');
			const request = store.getAll();

			request.onsuccess = () => {
				const nodes = request.result as MemoryNode[];
				nodes.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
				resolve(nodes);
			};
			request.onerror = () => reject(request.error);
		});
	}

	async getNodeById(nodeId: string): Promise<MemoryNode | null> {
		await this.init();
		if (this.isServer() || !this.db) return null;
		return new Promise((resolve, reject) => {
			const tx = this.db!.transaction('nodes', 'readonly');
			const store = tx.objectStore('nodes');
			const request = store.get(nodeId);

			request.onsuccess = () => resolve(request.result || null);
			request.onerror = () => reject(request.error);
		});
	}

	async insertNode(node: Omit<MemoryNode, 'node_id' | 'created_at' | 'character_id'> & { character_id?: string }): Promise<MemoryNode> {
		await this.init();
		const newNode: MemoryNode = {
			...node,
			character_id: node.character_id || 'default_character',
			node_id: `node_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
			created_at: new Date().toISOString(),
		};

		return new Promise((resolve, reject) => {
			const tx = this.db!.transaction('nodes', 'readwrite');
			const store = tx.objectStore('nodes');
			const request = store.put(newNode);

			request.onsuccess = () => {
				// 更新人物统计
				this.updateCharacterStats(newNode.character_id);
				resolve(newNode);
			};
			request.onerror = () => reject(request.error);
		});
	}

	async updateNode(nodeId: string, updates: Partial<MemoryNode>): Promise<void> {
		await this.init();
		const node = await this.getNodeById(nodeId);
		if (!node) throw new Error('Node not found');

		return new Promise((resolve, reject) => {
			const tx = this.db!.transaction('nodes', 'readwrite');
			const store = tx.objectStore('nodes');
			const request = store.put({ ...node, ...updates });

			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}

	async deleteNode(nodeId: string): Promise<void> {
		await this.init();
		const node = await this.getNodeById(nodeId);

		return new Promise((resolve, reject) => {
			const tx = this.db!.transaction('nodes', 'readwrite');
			const store = tx.objectStore('nodes');
			const request = store.delete(nodeId);

			request.onsuccess = () => {
				if (node) {
					this.updateCharacterStats(node.character_id);
				}
				resolve();
			};
			request.onerror = () => reject(request.error);
		});
	}

	async clearAllNodes(): Promise<void> {
		await this.init();
		return new Promise((resolve, reject) => {
			const tx = this.db!.transaction('nodes', 'readwrite');
			const store = tx.objectStore('nodes');
			const request = store.clear();

			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}

	async clearAllClues(): Promise<void> {
		await this.init();
		return new Promise((resolve, reject) => {
			const tx = this.db!.transaction('clues', 'readwrite');
			const store = tx.objectStore('clues');
			const request = store.clear();

			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}

	async clearAllBranches(): Promise<void> {
		await this.init();
		return new Promise((resolve, reject) => {
			const tx = this.db!.transaction('branches', 'readwrite');
			const store = tx.objectStore('branches');
			const request = store.clear();

			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}

	// ========== 线索操作 ==========
	async getCluesByNodeId(nodeId: string): Promise<HiddenClue[]> {
		await this.init();
		if (this.isServer() || !this.db) return [];
		return new Promise((resolve, reject) => {
			const tx = this.db!.transaction('clues', 'readonly');
			const store = tx.objectStore('clues');
			const index = store.index('node_id');
			const request = index.getAll(nodeId);

			request.onsuccess = () => resolve(request.result || []);
			request.onerror = () => reject(request.error);
		});
	}

	async insertClue(clue: Omit<HiddenClue, 'clue_id' | 'character_id'> & { character_id?: string }): Promise<HiddenClue> {
		await this.init();
		const newClue: HiddenClue = {
			...clue,
			character_id: clue.character_id || 'default_character',
			clue_id: `clue_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
		};

		return new Promise((resolve, reject) => {
			const tx = this.db!.transaction('clues', 'readwrite');
			const store = tx.objectStore('clues');
			const request = store.put(newClue);

			request.onsuccess = () => {
				this.updateCharacterStats(newClue.character_id);
				resolve(newClue);
			};
			request.onerror = () => reject(request.error);
		});
	}

	async unlockClue(clueId: string): Promise<void> {
		await this.init();
		return new Promise((resolve, reject) => {
			const tx = this.db!.transaction('clues', 'readwrite');
			const store = tx.objectStore('clues');
			const request = store.get(clueId);

			request.onsuccess = () => {
				const clue = request.result as HiddenClue;
				if (clue) {
					clue.is_unlocked = true;
					clue.unlocked_at = new Date().toISOString();
					store.put(clue);
				}
				resolve();
			};
			request.onerror = () => reject(request.error);
		});
	}

	async deleteClue(clueId: string): Promise<void> {
		await this.init();
		return new Promise((resolve, reject) => {
			const tx = this.db!.transaction('clues', 'readwrite');
			const store = tx.objectStore('clues');
			const request = store.delete(clueId);

			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}

	// ========== IF线操作 ==========
	async getBranchesByNodeId(nodeId: string): Promise<IfLineBranch[]> {
		await this.init();
		if (this.isServer() || !this.db) return [];
		return new Promise((resolve, reject) => {
			const tx = this.db!.transaction('branches', 'readonly');
			const store = tx.objectStore('branches');
			const index = store.index('parent_node_id');
			const request = index.getAll(nodeId);

			request.onsuccess = () => resolve(request.result || []);
			request.onerror = () => reject(request.error);
		});
	}

	async insertBranch(branch: Omit<IfLineBranch, 'branch_id' | 'created_at' | 'character_id'> & { character_id?: string }): Promise<IfLineBranch> {
		await this.init();
		const newBranch: IfLineBranch = {
			...branch,
			character_id: branch.character_id || 'default_character',
			branch_id: `branch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
			created_at: new Date().toISOString(),
		};

		return new Promise((resolve, reject) => {
			const tx = this.db!.transaction('branches', 'readwrite');
			const store = tx.objectStore('branches');
			const request = store.put(newBranch);

			request.onsuccess = () => {
				this.updateCharacterStats(newBranch.character_id);
				resolve(newBranch);
			};
			request.onerror = () => reject(request.error);
		});
	}

	// ========== 人物画像操作（兼容旧版）==========
	async getProfile(): Promise<CharacterProfileExtended | null> {
		const defaultChar = await this.getDefaultCharacter();
		if (!defaultChar) return null;
		return this.getProfileByCharacter(defaultChar.id);
	}

	async updateProfile(profile: Partial<CharacterProfile>): Promise<void> {
		const defaultChar = await this.getDefaultCharacter();
		if (!defaultChar) return;
		return this.updateProfileByCharacter(defaultChar.id, profile);
	}

	// ========== 批量操作 ==========
	async commitMemoryBatch(
		characterId: string,
		nodes: Array<Omit<MemoryNode, 'node_id' | 'created_at' | 'character_id'> & { hidden_clues?: HiddenClue[] }>,
		characterBase?: CharacterProfile
	): Promise<{ nodeIds: string[]; clueCount: number }> {
		const nodeIds: string[] = [];
		let clueCount = 0;

		for (const nodeData of nodes) {
			const { hidden_clues, ...nodeWithoutClues } = nodeData;
			const node = await this.insertNode({
				...nodeWithoutClues,
				character_id: characterId
			});
			nodeIds.push(node.node_id);

			// 插入关联线索
			if (hidden_clues) {
				for (const clue of hidden_clues) {
					await this.insertClue({
						...clue,
						character_id: characterId,
						node_id: node.node_id,
						is_unlocked: false,
					});
					clueCount++;
				}
			}
		}

		// 更新人物画像
		if (characterBase) {
			await this.updateProfileByCharacter(characterId, characterBase);
		}

		// 更新统计
		await this.updateCharacterStats(characterId);

		return { nodeIds, clueCount };
	}

	// ========== 辅助方法 ==========
	private generateSlug(name: string): string {
		return name
			.toLowerCase()
			.replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
			.replace(/^-+|-+$/g, '')
			.slice(0, 50) || `char-${Date.now()}`;
	}

	private getRandomAvatar(): string {
		const avatars = ['👤', '🎭', '🌸', '🌙', '⭐', '🔥', '💧', '🌿', '🎨', '🎵'];
		return avatars[Math.floor(Math.random() * avatars.length)];
	}

	private async deleteCharacterData(characterId: string): Promise<void> {
		// 删除该人物的所有节点
		const nodes = await this.getNodesByCharacter(characterId);
		for (const node of nodes) {
			await this.deleteNode(node.node_id);
		}

		// 删除该人物的所有线索
		const clues = await this.getCluesByCharacter(characterId);
		for (const clue of clues) {
			await new Promise<void>((resolve, reject) => {
				const tx = this.db!.transaction('clues', 'readwrite');
				const store = tx.objectStore('clues');
				const request = store.delete(clue.clue_id);
				request.onsuccess = () => resolve();
				request.onerror = () => reject(request.error);
			});
		}

		// 删除该人物的所有分支
		const branches = await this.getBranchesByCharacter(characterId);
		for (const branch of branches) {
			await new Promise<void>((resolve, reject) => {
				const tx = this.db!.transaction('branches', 'readwrite');
				const store = tx.objectStore('branches');
				const request = store.delete(branch.branch_id);
				request.onsuccess = () => resolve();
				request.onerror = () => reject(request.error);
			});
		}

		// 删除该人物的画像
		await new Promise<void>((resolve, reject) => {
			const tx = this.db!.transaction('character_profiles', 'readwrite');
			const store = tx.objectStore('character_profiles');
			const request = store.delete(characterId);
			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}
}

// 单例导出
export const localDb = new LocalDatabase();
