// ============================================================
// Qwen API 服务
// 描述: 通义千问 API 封装，支持对话和 Function Calling
// ============================================================

// Qwen 模型配置
export const QWEN_API_KEY = process.env.QWEN_API_KEY || process.env.DASHSCOPE_API_KEY;
const QWEN_BASE_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

// 主力模型配置
export const qwenMax = {
	model: 'qwen-max',
	params: {
		temperature: 0.3,
		top_p: 0.8,
		max_tokens: 2048,
	},
};

// 轻量级模型（用于数据清洗）
export const qwenTurbo = {
	model: 'qwen-turbo',
	params: {
		temperature: 0.1,
		max_tokens: 1024,
	},
};

// Function Calling 定义
export const unlockClueFunction = {
	name: 'unlock_clue',
	description: '当用户发言符合触发条件时解锁线索',
	parameters: {
		type: 'object',
		properties: {
			clue_id: {
				type: 'string',
				description: '要解锁的线索ID',
			},
			reason: {
				type: 'string',
				description: '为什么认为条件已触发',
			},
		},
		required: ['clue_id'],
	},
};

// 组装 System Prompt
export function buildSystemPrompt(
	baseArchetype: Record<string, unknown>,
	coreEvent: string,
	memorySource: string,
	npcState: Record<string, unknown>,
	openingMode: string,
	isFirstRound: boolean
): string {
	const parts = [
		'【系统底层指令】',
		'你是一个动态视觉小说引擎。必须严格按照设定的身份和规则输出，禁止透露你是AI。',
		'禁止输出任何meta信息（如"根据提供的资料"等）。',
		'',
		'【Base Archetype - 30%权重】',
		`你的基础性格结构是：${JSON.stringify(baseArchetype)}`,
		'这决定了你的表达风格和情感逻辑。',
		'',
		'【Ground Truth - 60%权重 - 绝对事实】',
		`当前所处的记忆节点事实是：${coreEvent}`,
		`请注意该记忆的来源是：${memorySource}`,
		'你绝不能偏离或篡改这些已发生的事实。',
		'',
		'【Dynamic State - 10%权重】',
		`当前你正处于：${npcState.current_emotion || '未知状态'}`,
		`你对用户的态度是：${npcState.attitude_towards_user || '中性'}`,
		'这会微妙地影响你的语气和用词选择。',
	];

	if (isFirstRound) {
		parts.push(
			'',
			'【开场硬性约束 - 第一回合】',
			`当前开场模式为：${openingMode}`,
			''
		);

		if (openingMode === 'action_driven') {
			parts.push(
				'你必须使用*动作描写*开场，可以完全不说话。',
				'示例：*他静静地坐着，肩膀还带着外场淋雨后的水渍...*'
			);
		} else {
			parts.push(
				'你必须使用「人物台词」开场，情绪直接。',
				'示例：「一把将湿透的外套扔在椅背上"] "气死我了！..."'
			);
		}
	}

	return parts.join('\n');
}

// 调用 Qwen API
export async function callQwen(
	messages: Array<{ role: string; content: string }>,
	options: {
		model?: string;
		temperature?: number;
		top_p?: number;
		max_tokens?: number;
		tools?: unknown[];
	} = {}
) {
	if (!QWEN_API_KEY) {
		throw new Error('QWEN_API_KEY or DASHSCOPE_API_KEY is not set');
	}

	const {
		model = 'qwen-max',
		temperature = 0.3,
		top_p = 0.8,
		max_tokens = 2048,
		tools,
	} = options;

	const body: Record<string, unknown> = {
		model,
		input: {
			messages,
		},
		parameters: {
			temperature,
			top_p,
			max_tokens,
			result_format: 'message',
		},
	};

	if (tools) {
		body.tools = tools;
	}

	const res = await fetch(QWEN_BASE_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${QWEN_API_KEY}`,
		},
		body: JSON.stringify(body),
	});

	if (!res.ok) {
		const error = await res.text();
		throw new Error(`Qwen API error: ${res.status} - ${error}`);
	}

	const data = await res.json();
	return data;
}

// 生成首句（开场白）
export async function generateOpening(
	systemPrompt: string,
	openingMode: string
): Promise<string> {
	const messages = [
		{ role: 'system', content: systemPrompt },
		{
			role: 'user',
			content: `请生成开场白。模式：${openingMode}。请严格遵守系统指令中的格式要求。`,
		},
	];

	const res = await callQwen(messages, {
		model: 'qwen-max',
		temperature: 0.3,
	});

	return res.output?.choices?.[0]?.message?.content || '';
}

// 对话生成（支持 Function Calling）
export async function generateChat(
	messages: Array<{ role: string; content: string }>,
	availableClues: Array<{ clue_id: string; trigger_condition: string }>
): Promise<{
	content: string;
	functionCall?: { name: string; arguments: Record<string, unknown> };
}> {
	const tools = availableClues.length > 0
		? [{ type: 'function', function: unlockClueFunction }]
		: undefined;

	// 在系统提示后追加线索监测指令
	const finalMessages = [...messages];
	if (availableClues.length > 0 && finalMessages[0]?.role === 'system') {
		const cluesText = availableClues
			.map(c => `- ${c.trigger_condition}`)
			.join('\n');
		finalMessages[0].content += `\n\n【线索监测指令】\n你正在监控以下未解锁线索的触发条件：\n${cluesText}\n\n如果用户的发言满足某个触发条件，你必须调用 unlock_clue 函数。不要提前透露线索内容。`;
	}

	const res = await callQwen(finalMessages, {
		model: 'qwen-max',
		temperature: 0.3,
		tools,
	});

	const choice = res.output?.choices?.[0];
	const message = choice?.message;

	if (message?.tool_calls) {
		const toolCall = message.tool_calls[0];
		return {
			content: message.content || '',
			functionCall: {
				name: toolCall.function?.name,
				arguments: JSON.parse(toolCall.function?.arguments || '{}'),
			},
		};
	}

	return {
		content: message?.content || '',
	};
}

// 数据清洗（轻量级模型）
export async function cleanData(rawText: string): Promise<{
	core_event: string;
	npc_state: { current_emotion: string; attitude_towards_user: string };
	salience_score: number;
	hidden_clues: Array<{ trigger: string; content: string }>;
}> {
	const prompt = `从以下日记文本中提取关键信息，以 JSON 格式返回：

文本：
"""
${rawText.slice(0, 2000)}
"""

要求：
1. core_event: 核心事件描述（简洁）
2. npc_state: { current_emotion: "情绪", attitude_towards_user: "态度" }
3. salience_score: 显著性评分 1-10
4. hidden_clues: 可能的隐藏线索数组，每项包含 trigger（触发条件）和 content（线索内容）

只返回 JSON，不要其他内容。`;

	const res = await callQwen(
		[{ role: 'user', content: prompt }],
		{
			model: 'qwen-turbo',
			temperature: 0.1,
			max_tokens: 1024,
		}
	);

	const content = res.output?.choices?.[0]?.message?.content || '{}';

	try {
		return JSON.parse(content);
	} catch {
		return {
			core_event: rawText.slice(0, 100),
			npc_state: { current_emotion: '平静', attitude_towards_user: '中性' },
			salience_score: 5,
			hidden_clues: [],
		};
	}
}
