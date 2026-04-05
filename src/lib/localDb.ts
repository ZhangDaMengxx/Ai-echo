// ============================================================
// Local Database: IndexedDB 封装
// 描述: 浏览器本地存储，替代 Supabase，零隐私风险
// ============================================================

export interface MemoryNode {
	node_id: string;
	event_date: string;
	salience_score: number;
	core_event: string;
	npc_state: {
		current_emotion: string;
		attitude_towards_user: string;
	};
	memory_source: 'txt_extraction' | 'user_supplement';
	opening_mode: 'action_driven' | 'dialogue_driven';
	character_name?: string;
	created_at: string;
}

export interface HiddenClue {
	clue_id: string;
	node_id: string;
	trigger_condition: string;
	clue_content: string;
	is_unlocked: boolean;
	unlocked_at?: string;
}

export interface IfLineBranch {
	branch_id: string;
	parent_node_id: string;
	altered_choices: string;
	new_ending: string;
	emotional_tone: string;
	is_committed: boolean;
	created_at: string;
}

export interface CharacterProfile {
	name: string;
	style: string;
	logic: string;
	dominant_emotions: string[];
	dominant_attitudes: string[];
	summary: string;
	global_vibe: string;
}

const DB_NAME = 'EchoTracksDB';
const DB_VERSION = 1;

class LocalDatabase {
	private db: IDBDatabase | null = null;

	async init(): Promise<void> {
		if (this.db) return;

		return new Promise((resolve, reject) => {
			const request = indexedDB.open(DB_NAME, DB_VERSION);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => {
				this.db = request.result;
				resolve();
			};

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;

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
			};
		});
	}

	// ========== 节点操作 ==========
	async getAllNodes(): Promise<MemoryNode[]> {
		await this.init();
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
		return new Promise((resolve, reject) => {
			const tx = this.db!.transaction('nodes', 'readonly');
			const store = tx.objectStore('nodes');
			const request = store.get(nodeId);

			request.onsuccess = () => resolve(request.result || null);
			request.onerror = () => reject(request.error);
		});
	}

	async insertNode(node: Omit<MemoryNode, 'node_id' | 'created_at'>): Promise<MemoryNode> {
		await this.init();
		const newNode: MemoryNode = {
			...node,
			node_id: `node_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
			created_at: new Date().toISOString(),
		};

		return new Promise((resolve, reject) => {
			const tx = this.db!.transaction('nodes', 'readwrite');
			const store = tx.objectStore('nodes');
			const request = store.put(newNode);

			request.onsuccess = () => resolve(newNode);
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
		return new Promise((resolve, reject) => {
			const tx = this.db!.transaction('nodes', 'readwrite');
			const store = tx.objectStore('nodes');
			const request = store.delete(nodeId);

			request.onsuccess = () => resolve();
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

	// ========== 线索操作 ==========
	async getCluesByNodeId(nodeId: string): Promise<HiddenClue[]> {
		await this.init();
		return new Promise((resolve, reject) => {
			const tx = this.db!.transaction('clues', 'readonly');
			const store = tx.objectStore('clues');
			const index = store.index('node_id');
			const request = index.getAll(nodeId);

			request.onsuccess = () => resolve(request.result || []);
			request.onerror = () => reject(request.error);
		});
	}

	async insertClue(clue: Omit<HiddenClue, 'clue_id'>): Promise<HiddenClue> {
		await this.init();
		const newClue: HiddenClue = {
			...clue,
			clue_id: `clue_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
		};

		return new Promise((resolve, reject) => {
			const tx = this.db!.transaction('clues', 'readwrite');
			const store = tx.objectStore('clues');
			const request = store.put(newClue);

			request.onsuccess = () => resolve(newClue);
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

	// ========== IF线操作 ==========
	async getBranchesByNodeId(nodeId: string): Promise<IfLineBranch[]> {
		await this.init();
		return new Promise((resolve, reject) => {
			const tx = this.db!.transaction('branches', 'readonly');
			const store = tx.objectStore('branches');
			const index = store.index('parent_node_id');
			const request = index.getAll(nodeId);

			request.onsuccess = () => resolve(request.result || []);
			request.onerror = () => reject(request.error);
		});
	}

	async insertBranch(branch: Omit<IfLineBranch, 'branch_id' | 'created_at'>): Promise<IfLineBranch> {
		await this.init();
		const newBranch: IfLineBranch = {
			...branch,
			branch_id: `branch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
			created_at: new Date().toISOString(),
		};

		return new Promise((resolve, reject) => {
			const tx = this.db!.transaction('branches', 'readwrite');
			const store = tx.objectStore('branches');
			const request = store.put(newBranch);

			request.onsuccess = () => resolve(newBranch);
			request.onerror = () => reject(request.error);
		});
	}

	// ========== 人物画像操作 ==========
	async getProfile(): Promise<CharacterProfile | null> {
		await this.init();
		return new Promise((resolve, reject) => {
			const tx = this.db!.transaction('profile', 'readonly');
			const store = tx.objectStore('profile');
			const request = store.get('main');

			request.onsuccess = () => resolve(request.result || null);
			request.onerror = () => reject(request.error);
		});
	}

	async updateProfile(profile: Partial<CharacterProfile>): Promise<void> {
		await this.init();
		const existing = await this.getProfile();

		return new Promise((resolve, reject) => {
			const tx = this.db!.transaction('profile', 'readwrite');
			const store = tx.objectStore('profile');
			const newProfile = {
				id: 'main',
				...(existing || {}),
				...profile,
			};
			const request = store.put(newProfile);

			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}

	// ========== 批量操作 ==========
	async commitMemoryBatch(
		nodes: Array<Omit<MemoryNode, 'node_id' | 'created_at'>>,
		characterBase?: CharacterProfile
	): Promise<{ nodeIds: string[]; clueCount: number }> {
		const nodeIds: string[] = [];
		let clueCount = 0;

		for (const nodeData of nodes) {
			const node = await this.insertNode(nodeData);
			nodeIds.push(node.node_id);

			// 插入关联线索
			if (nodeData.hidden_clues) {
				for (const clue of nodeData.hidden_clues as HiddenClue[]) {
					await this.insertClue({
						...clue,
						node_id: node.node_id,
						is_unlocked: false,
					});
					clueCount++;
				}
			}
		}

		// 更新人物画像
		if (characterBase) {
			await this.updateProfile(characterBase);
		}

		return { nodeIds, clueCount };
	}
}

// 单例导出
export const localDb = new LocalDatabase();
