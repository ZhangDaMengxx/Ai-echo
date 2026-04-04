import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// 主力模型配置
export const geminiPro = genAI.getGenerativeModel({
  model: 'gemini-1.5-pro',
  generationConfig: {
    temperature: 0.3,
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 2048,
  },
})

// 轻量级模型（用于数据清洗）
export const geminiFlash = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  generationConfig: {
    temperature: 0.1,
    maxOutputTokens: 1024,
  },
})

// Function Calling定义
import { FunctionDeclaration, SchemaType } from '@google/generative-ai'

export const unlockClueFunction: FunctionDeclaration = {
  name: 'unlock_clue',
  description: '当用户发言符合触发条件时解锁线索',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      clue_id: {
        type: SchemaType.STRING,
        description: '要解锁的线索ID'
      },
      reason: {
        type: SchemaType.STRING,
        description: '为什么认为条件已触发'
      }
    },
    required: ['clue_id']
  }
}

// 组装System Prompt
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
  ]

  if (isFirstRound) {
    parts.push(
      '',
      '【开场硬性约束 - 第一回合】',
      `当前开场模式为：${openingMode}`,
      ''
    )
    
    if (openingMode === 'action_driven') {
      parts.push(
        '你必须使用*动作描写*开场，可以完全不说话。',
        '示例：*他静静地坐着，肩膀还带着外场淋雨后的水渍...*'
      )
    } else {
      parts.push(
        '你必须使用「人物台词」开场，情绪直接。',
        '示例：「一把将湿透的外套扔在椅背上"] "气死我了！..."'
      )
    }
  }

  return parts.join('\n')
}
