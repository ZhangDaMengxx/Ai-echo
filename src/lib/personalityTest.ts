// ============================================================
// Personality Test: 心理学测试配置
// 描述: 5题性格测试，生成初始人物画像
// ============================================================

import type { PersonalityQuestion, PersonalityScores, CharacterProfile } from '@/types/character';

/**
 * 5个心理学问题
 */
export const personalityQuestions: PersonalityQuestion[] = [
	{
		id: 'stress-response',
		text: '当遇到压力时，TA通常会...',
		options: [
			{
				value: 'A',
				label: '独自消化情绪，需要时间冷静',
				scores: { extraversion: -8, independence: 5, directness: -3 }
			},
			{
				value: 'B',
				label: '向信任的人倾诉，寻求情感支持',
				scores: { extraversion: 5, independence: -5, sensing: 5 }
			},
			{
				value: 'C',
				label: '转移注意力，通过其他活动缓解',
				scores: { extraversion: 3, independence: 3, thinking: -3 }
			},
			{
				value: 'D',
				label: '直接面对问题，寻找解决方案',
				scores: { extraversion: 2, independence: 8, directness: 8, thinking: 5 }
			}
		]
	},
	{
		id: 'social-preference',
		text: '在社交场合中，TA倾向于...',
		options: [
			{
				value: 'A',
				label: '保持观察，先了解周围环境',
				scores: { extraversion: -8, sensing: 3, thinking: 5 }
			},
			{
				value: 'B',
				label: '主动与陌生人交流，扩大社交圈',
				scores: { extraversion: 10, independence: 3, sensing: 5 }
			},
			{
				value: 'C',
				label: '只与熟悉的小圈子深入交流',
				scores: { extraversion: -3, independence: -5, sensing: 8 }
			},
			{
				value: 'D',
				label: '看心情而定，没有固定模式',
				scores: { extraversion: 0, independence: 0, sensing: 0, thinking: -3 }
			}
		]
	},
	{
		id: 'decision-making',
		text: '做决定时，TA更依赖...',
		options: [
			{
				value: 'A',
				label: '逻辑分析和客观事实',
				scores: { thinking: 10, sensing: -5, independence: 5 }
			},
			{
				value: 'B',
				label: '直觉感受和内心声音',
				scores: { thinking: -8, sensing: 8, independence: 3 }
			},
			{
				value: 'C',
				label: '参考他人的建议和意见',
				scores: { thinking: -3, independence: -8, extraversion: 3 }
			},
			{
				value: 'D',
				label: '过往经验和相似情况',
				scores: { thinking: 3, sensing: 5, independence: 3 }
			}
		]
	},
	{
		id: 'conflict-handling',
		text: '面对冲突时，TA通常会...',
		options: [
			{
				value: 'A',
				label: '选择退让，避免矛盾升级',
				scores: { directness: -10, extraversion: -3, independence: -5 }
			},
			{
				value: 'B',
				label: '直面问题，积极沟通解决',
				scores: { directness: 10, extraversion: 5, thinking: 5 }
			},
			{
				value: 'C',
				label: '寻求第三方调解帮助',
				scores: { directness: 0, independence: -3, extraversion: 5 }
			},
			{
				value: 'D',
				label: '暂时回避，等冷静后再谈',
				scores: { directness: -5, independence: 5, thinking: 3 }
			}
		]
	},
	{
		id: 'relationship-value',
		text: '在亲密关系中，TA最看重的是...',
		options: [
			{
				value: 'A',
				label: '深度的精神共鸣和理解',
				scores: { sensing: 8, independence: -3, thinking: -5 }
			},
			{
				value: 'B',
				label: '共同的兴趣和活动',
				scores: { extraversion: 5, sensing: 3, independence: 3 }
			},
			{
				value: 'C',
				label: '彼此的陪伴和支持',
				scores: { independence: -8, sensing: 5, extraversion: 3 }
			},
			{
				value: 'D',
				label: '各自的独立空间和自由',
				scores: { independence: 10, extraversion: -3, thinking: 3 }
			}
		]
	}
];

/**
 * 根据答案计算性格维度得分
 */
export function calculatePersonalityScores(
	answers: { questionId: string; answer: string }[]
): Required<PersonalityScores> {
	const scores: Required<PersonalityScores> = {
		extraversion: 0,
		sensing: 0,
		independence: 0,
		directness: 0,
		thinking: 0
	};

	for (const answer of answers) {
		const question = personalityQuestions.find(q => q.id === answer.questionId);
		if (!question) continue;

		const option = question.options.find(o => o.value === answer.answer);
		if (!option) continue;

		// 累加得分
		if (option.scores.extraversion) scores.extraversion += option.scores.extraversion;
		if (option.scores.sensing) scores.sensing += option.scores.sensing;
		if (option.scores.independence) scores.independence += option.scores.independence;
		if (option.scores.directness) scores.directness += option.scores.directness;
		if (option.scores.thinking) scores.thinking += option.scores.thinking;
	}

	return scores;
}

/**
 * 根据得分生成人物画像
 */
export function generateCharacterProfile(
	name: string,
	scores: Required<PersonalityScores>
): Partial<CharacterProfile> {
	// 确定表达风格
	let style: string;
	if (scores.extraversion > 5) {
		style = scores.thinking > 0 ? '外向直接' : '外向热情';
	} else if (scores.extraversion < -5) {
		style = scores.sensing > 0 ? '内敛细腻' : '内敛含蓄';
	} else {
		style = scores.thinking > 0 ? '理性克制' : '温和平衡';
	}

	// 确定情感逻辑
	let logic: string;
	if (scores.thinking > 5) {
		logic = scores.directness > 0 ? '逻辑优先，直面问题' : '逻辑优先，迂回处理';
	} else if (scores.thinking < -5) {
		logic = scores.sensing > 0 ? '感性主导，重视感受' : '感性主导，直觉判断';
	} else {
		logic = scores.independence > 0 ? '独立思考，理性感性并重' : '综合考虑，重视他人意见';
	}

	// 确定主导情绪
	const emotions: string[] = [];
	if (scores.extraversion < -3) emotions.push('平静');
	if (scores.extraversion > 3) emotions.push('活跃');
	if (scores.sensing > 3) emotions.push('敏感');
	if (scores.sensing < -3) emotions.push('理性');
	if (scores.thinking < -3) emotions.push('温暖');
	if (scores.independence > 3) emotions.push('独立');
	if (scores.independence < -3) emotions.push('依赖');
	if (scores.directness > 3) emotions.push('直接');
	if (scores.directness < -3) emotions.push('委婉');

	if (emotions.length === 0) {
		emotions.push('平静', '中性');
	}

	// 确定核心态度
	const attitudes: string[] = [];
	if (scores.thinking > 5) attitudes.push('理性');
	if (scores.thinking < -5) attitudes.push('感性');
	if (scores.extraversion > 5) attitudes.push('主动');
	if (scores.extraversion < -5) attitudes.push('被动');
	if (scores.independence > 5) attitudes.push('独立');
	if (scores.independence < -5) attitudes.push('依赖');

	if (attitudes.length === 0) {
		attitudes.push('中性');
	}

	// 生成总结描述
	const summaryParts: string[] = [];

	// 社交倾向
	if (scores.extraversion > 5) {
		summaryParts.push('在社交场合中表现活跃，喜欢与人交流');
	} else if (scores.extraversion < -5) {
		summaryParts.push('倾向于独处和观察，在熟悉的圈子中更加自在');
	} else {
		summaryParts.push('社交风格灵活，能根据场合调整自己');
	}

	// 决策方式
	if (scores.thinking > 5) {
		summaryParts.push('。做决定时注重逻辑和事实');
	} else if (scores.thinking < -5) {
		summaryParts.push('。做决定时重视感受和直觉');
	} else {
		summaryParts.push('。做决定时理性感性并重');
	}

	// 独立性
	if (scores.independence > 5) {
		summaryParts.push('，重视个人独立空间');
	} else if (scores.independence < -5) {
		summaryParts.push('，重视与他人的连接');
	}

	// 冲突处理
	if (scores.directness > 5) {
		summaryParts.push('。面对冲突时倾向于直接沟通解决');
	} else if (scores.directness < -5) {
		summaryParts.push('。面对冲突时倾向于回避或退让');
	} else {
		summaryParts.push('。面对冲突时会根据情况选择处理方式');
	}

	const summary = summaryParts.join('') + '。';

	return {
		name,
		style,
		logic,
		dominant_emotions: emotions.slice(0, 3), // 最多3个
		dominant_attitudes: attitudes.slice(0, 2), // 最多2个
		summary,
		global_vibe: scores.sensing > 0 ? 'emotional' : 'rational'
	};
}

/**
 * 根据测试答案直接生成完整画像
 */
export function generateProfileFromAnswers(
	name: string,
	answers: { questionId: string; answer: string }[]
): Partial<CharacterProfile> {
	const scores = calculatePersonalityScores(answers);
	return generateCharacterProfile(name, scores);
}
