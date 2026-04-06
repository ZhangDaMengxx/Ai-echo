// ============================================================
// Character Types: AI人物类型定义
// 描述: 人物系统核心类型
// ============================================================

// ============================================================
// 人物基础实体
// ============================================================

export interface Character {
	/** 唯一标识: char_${timestamp}_${random} */
	id: string;

	/** 显示名称 */
	name: string;

	/** URL友好的标识 */
	slug: string;

	/** 头像: emoji字符或Base64图片 */
	avatar?: string;

	/** 简短描述 */
	description?: string;

	/** 创建时间 ISO */
	createdAt: string;

	/** 更新时间 ISO */
	updatedAt: string;

	/** 是否为默认人物 */
	isDefault: boolean;

	/** 统计数据 */
	stats: {
		/** 记忆节点数量 */
		nodeCount: number;

		/** 隐藏线索数量 */
		clueCount: number;

		/** IF线分支数量 */
		branchCount: number;

		/** 最后交互时间 ISO */
		lastInteraction?: string;
	};
}

// ============================================================
// 创建人物请求
// ============================================================

export interface CreateCharacterRequest {
	name: string;
	avatar?: string;
	description?: string;
}

// ============================================================
// 心理学测试相关
// ============================================================

export interface PersonalityQuestion {
	/** 问题ID */
	id: string;

	/** 问题文本 */
	text: string;

	/** 选项 */
	options: {
		/** 选项值: A/B/C/D */
		value: string;

		/** 选项文本 */
		label: string;

		/** 对应性格维度得分 */
		scores: PersonalityScores;
	}[];
}

/** 性格维度得分 */
export interface PersonalityScores {
	/** 内向(-10) ~ 外向(+10) */
	extraversion?: number;

	/** 理性(-10) ~ 感性(+10) */
	sensing?: number;

	/** 独立(-10) ~ 依赖(+10) */
	independence?: number;

	/** 直接(-10) ~ 回避(+10) */
	directness?: number;

	/** 思考(-10) ~ 感受(+10) */
	thinking?: number;
}

/** 测试答案 */
export interface PersonalityAnswer {
	questionId: string;
	answer: string;
}

// ============================================================
// 创建流程状态
// ============================================================

export type CreateStep =
	| 'personality-test'
	| 'profile-setup'
	| 'node-calibration'
	| 'success';

export interface CreateFlowState {
	/** 当前步骤 */
	step: CreateStep;

	/** 步骤索引 (1/5, 2/3, 3/3) */
	stepIndex: number;

	/** Step 1: 心理学测试答案 */
	personalityAnswers: PersonalityAnswer[];

	/** Step 1: 根据测试生成的性格画像 */
	personalityProfile: Partial<CharacterProfile> | null;

	/** Step 2: 人物名称 */
	name: string;

	/** Step 2: 头像 */
	avatar: string;

	/** Step 2: 上传的文件 */
	uploadedFile: File | null;

	/** Step 2: 提取的文本 */
	extractedText: string;

	/** Step 3: 草稿节点 */
	draftNodes: DraftNode[];

	/** Step 3: 性格基座 */
	characterBase: CharacterBase | null;
}

// ============================================================
// 复用现有类型（从localDb导入时引用）
// ============================================================

/** 从pipeline导入的类型 */
export interface DraftNode {
	id: string;
	event_date?: string;
	core_event: string;
	npc_state: Record<string, string>;
	salience_score: number;
	hidden_clues: Array<{ trigger: string; content: string }>;
	memory_source: string;
	opening_mode: string;
}

/** 性格基座 */
export interface CharacterBase {
	name: string;
	style: string;
	logic: string;
	dominant_emotions: string[];
	dominant_attitudes: string[];
	summary: string;
}

/** 人物画像 */
export interface CharacterProfile {
	character_id: string;
	name: string;
	style: string;
	logic: string;
	dominant_emotions: string[];
	dominant_attitudes: string[];
	summary: string;
	global_vibe: string;
}

// ============================================================
// 扩展的 MemoryNode（含character_id）
// ============================================================

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
