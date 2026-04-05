import { NextRequest, NextResponse } from 'next/server'
import { callQwen } from '@/lib/qwen'

// 正则时序切片
function sliceByDate(text: string): string[] {
  const datePattern = /(\d{4}年\d{1,2}月\d{1,2}|\d{4}-\d{2}-\d{2}|\d{4}\/\d{2}\/\d{2})/g

  const chunks: string[] = []
  const dates: number[] = []
  let match

  while ((match = datePattern.exec(text)) !== null) {
    dates.push(match.index)
  }

  for (let i = 0; i < dates.length; i++) {
    const start = dates[i]
    const end = i < dates.length - 1 ? dates[i + 1] : text.length
    chunks.push(text.slice(start, end).trim())
  }

  if (chunks.length === 0) {
    return text.split(/\n\s*\n/).filter(p => p.trim().length > 0)
  }

  return chunks
}

// 轻量AI提取
interface ExtractResult {
  event_date?: string
  core_event: string
  character_name?: string
  npc_state?: {
    current_emotion?: string
    attitude_towards_user?: string
  }
  salience_score: number
  hidden_clues?: Array<{ trigger: string; content: string }>
  raw_text: string
  memory_source: string
  opening_mode: string
}

async function extractFromChunk(chunk: string): Promise<ExtractResult | null> {
  const prompt = `
请从以下文本片段中提取关键信息，输出JSON格式：

文本：
"""
${chunk.slice(0, 2000)}
"""

要求：
1. 如果文本中有日期，提取为event_date（格式：YYYY-MM-DD）
2. 提取core_event：核心事件描述（100字以内）
3. 提取npc_state：
   - current_emotion：当前情绪
   - attitude_towards_user：对用户的态度
4. 评估salience_score：情感显著性打分（1-10）
5. 提取hidden_clues：可能的隐藏线索数组（可选）

输出合法JSON：
{
  "event_date": "YYYY-MM-DD或null",
  "core_event": "事件描述",
  "character_name": "文中主要人物的名字，如果无法确定请填null",
  "npc_state": {"current_emotion": "情绪", "attitude_towards_user": "态度"},
  "salience_score": 数字,
  "hidden_clues": [{"trigger": "触发条件", "content": "线索内容"}]
}
`

  try {
    const res = await callQwen(
      [{ role: 'user', content: prompt }],
      { model: 'qwen-turbo', temperature: 0.1, max_tokens: 1024 }
    )
    const text = res.output?.choices?.[0]?.message?.content || ''

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0])
      return {
        ...data,
        raw_text: chunk.slice(0, 500),
        memory_source: 'txt_extraction',
        opening_mode: data.npc_state?.current_emotion?.includes('沉默') ? 'action_driven' : 'dialogue_driven'
      }
    }
  } catch (e) {
    console.error('Extract error:', e)
  }

  return null
}

// 分析人物性格基座（轻量级方案 A）
function analyzeCharacterBase(nodes: ExtractResult[]): {
  name: string
  style: string
  logic: string
  dominant_emotions: string[]
  dominant_attitudes: string[]
  summary: string
} {
  if (nodes.length === 0) {
    return {
      name: 'ELARA',
      style: '待分析',
      logic: '待分析',
      dominant_emotions: [],
      dominant_attitudes: [],
      summary: '暂无足够数据'
    }
  }

  // 统计情绪、态度和名字
  const emotionCount: Record<string, number> = {}
  const attitudeCount: Record<string, number> = {}
  const nameCount: Record<string, number> = {}

  nodes.forEach(node => {
    const name = node.character_name
    if (name && name !== 'null' && name !== '未知' && name !== '我') {
      nameCount[name] = (nameCount[name] || 0) + 1
    }
  })

  nodes.forEach(node => {
    const emotion = node.npc_state?.current_emotion || '未知'
    const attitude = node.npc_state?.attitude_towards_user || '中性'

    emotionCount[emotion] = (emotionCount[emotion] || 0) + 1
    attitudeCount[attitude] = (attitudeCount[attitude] || 0) + 1
  })

  // 获取最常见的情绪和态度
  const sortedEmotions = Object.entries(emotionCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([e]) => e)

  const sortedAttitudes = Object.entries(attitudeCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([a]) => a)

  // 推断表达风格
  let style = '平和自然'
  const allEmotions = sortedEmotions.join('')
  const allAttitudes = sortedAttitudes.join('')

  if (allEmotions.includes('愤怒') || allEmotions.includes('激动') || allEmotions.includes('暴躁')) {
    style = '情绪外放'
  } else if (allEmotions.includes('沉默') || allEmotions.includes('冷淡') || allEmotions.includes('疏离')) {
    style = '克制内敛'
  } else if (allEmotions.includes('温柔') || allEmotions.includes('细腻') || allEmotions.includes('敏感')) {
    style = '细腻敏感'
  }

  // 推断情感逻辑
  let logic = '理性平衡'
  if (allEmotions.includes('纠结') || allEmotions.includes('矛盾') || allEmotions.includes('挣扎')) {
    logic = '内耗型'
  } else if (allEmotions.includes('开心') || allEmotions.includes('热情') || allEmotions.includes('主动')) {
    logic = '外放型'
  } else if (allAttitudes.includes('理性') || allAttitudes.includes('冷静') || allAttitudes.includes('克制')) {
    logic = '理性压抑型'
  } else if (allAttitudes.includes('依赖') || allAttitudes.includes('温柔') || allAttitudes.includes('顺从')) {
    logic = '情感依赖型'
  }

  // 推断名字
  const sortedNames = Object.entries(nameCount)
    .sort((a, b) => b[1] - a[1])
    .map(([n]) => n)
  const name = sortedNames[0] || 'ELARA'

  // 生成总结
  const summary = `主要情绪特征：${sortedEmotions.join('、')}；` +
    `对用户态度：${sortedAttitudes.join('、')}；` +
    `整体呈现${style}的表达方式，情感逻辑偏向${logic}。`

  return {
    name,
    style,
    logic,
    dominant_emotions: sortedEmotions,
    dominant_attitudes: sortedAttitudes,
    summary
  }
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text || text.length < 10) {
      return NextResponse.json({ error: '文本太短' }, { status: 400 })
    }

    const chunks = sliceByDate(text)
    const extractPromises = chunks.slice(0, 10).map(chunk => extractFromChunk(chunk))
    const results = await Promise.all(extractPromises)
    const validResults = results.filter((r): r is ExtractResult => r !== null && r.salience_score >= 5)
    validResults.sort((a, b) => b.salience_score - a.salience_score)

    // 分析人物性格基座
    const characterBase = analyzeCharacterBase(validResults)

    return NextResponse.json({
      chunks: chunks.length,
      nodes: validResults,
      character_base: characterBase,
      message: `提取完成，共${validResults.length}个关键节点，已分析人物性格基座`
    })

  } catch (error) {
    console.error('Pipeline extract error:', error)
    return NextResponse.json(
      { error: '处理失败', details: String(error) },
      { status: 500 }
    )
  }
}
