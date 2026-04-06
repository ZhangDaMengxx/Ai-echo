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
${chunk.slice(0, 1500)}
"""

要求：
1. 如果文本中有日期，提取为event_date（格式：YYYY-MM-DD）
2. 提取core_event：核心事件描述（50字以内）
3. 提取npc_state：
   - current_emotion：当前情绪（简短，如：平静、开心、难过）
   - attitude_towards_user：对用户的态度（如：友好、疏远、依赖）
4. 评估salience_score：情感显著性打分（1-10）
5. 提取character_name：文中主要人物的名字（如无法确定填null）

重要：必须输出完整、合法的JSON，不要截断。

输出格式：
{
  "event_date": "YYYY-MM-DD或null",
  "core_event": "事件描述",
  "character_name": "名字或null",
  "npc_state": {"current_emotion": "情绪", "attitude_towards_user": "态度"},
  "salience_score": 5,
  "hidden_clues": []
}
`

  try {
    const res = await callQwen(
      [{ role: 'user', content: prompt }],
      { model: 'qwen-turbo', temperature: 0.1, max_tokens: 2048 }
    )
    
    // 处理不同可能的响应格式
    let text = ''
    if (typeof res === 'string') {
      text = res
    } else if (res.output?.choices?.[0]?.message?.content) {
      text = res.output.choices[0].message.content
    } else if (res.output?.text) {
      text = res.output.text
    } else if (res.choices?.[0]?.message?.content) {
      text = res.choices[0].message.content
    } else {
      console.error('Unexpected Qwen response format:', JSON.stringify(res).slice(0, 200))
      return null
    }

    // 尝试提取完整 JSON
    const jsonStr = extractCompleteJson(text)
    if (!jsonStr) {
      console.log('No complete JSON found in response:', text.slice(0, 200))
      return null
    }

    // 尝试解析
    try {
      const data = JSON.parse(jsonStr)
      
      // 验证必要字段
      if (!data.core_event || typeof data.core_event !== 'string') {
        console.log('Extract: Missing or invalid core_event')
        return null
      }
      
      return {
        event_date: data.event_date === 'null' ? null : (data.event_date || null),
        core_event: data.core_event.slice(0, 200), // 限制长度
        character_name: data.character_name === 'null' ? null : (data.character_name || null),
        npc_state: {
          current_emotion: data.npc_state?.current_emotion || '平静',
          attitude_towards_user: data.npc_state?.attitude_towards_user || '中性'
        },
        salience_score: typeof data.salience_score === 'number' ? data.salience_score : 5,
        hidden_clues: Array.isArray(data.hidden_clues) ? data.hidden_clues : [],
        raw_text: chunk.slice(0, 500),
        memory_source: 'txt_extraction',
        opening_mode: data.npc_state?.current_emotion?.includes('沉默') ? 'action_driven' : 'dialogue_driven'
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Raw text:', text.slice(0, 300))
      console.error('Extracted JSON:', jsonStr.slice(0, 300))
      return null
    }
  } catch (e) {
    console.error('Extract error:', e)
  }

  return null
}

// 提取完整 JSON 对象的辅助函数
function extractCompleteJson(text: string): string | null {
  // 方法1：尝试匹配完整的 JSON 对象（平衡括号）
  const jsonRegex = /\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/g
  const matches = text.match(jsonRegex)
  
  if (matches) {
    // 找最长的匹配（最可能完整的）
    const sorted = matches.sort((a, b) => b.length - a.length)
    for (const match of sorted) {
      try {
        JSON.parse(match) // 验证是否可解析
        return match
      } catch {
        continue
      }
    }
  }
  
  // 方法2：尝试修复截断的 JSON
  const startIdx = text.indexOf('{')
  const endIdx = text.lastIndexOf('}')
  
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const candidate = text.slice(startIdx, endIdx + 1)
    try {
      JSON.parse(candidate)
      return candidate
    } catch {
      // 尝试修复常见截断问题
      const fixed = tryFixTruncatedJson(candidate)
      if (fixed) return fixed
    }
  }
  
  return null
}

// 尝试修复截断的 JSON
function tryFixTruncatedJson(jsonStr: string): string | null {
  let fixed = jsonStr
  
  // 补齐缺失的右括号
  const openBraces = (fixed.match(/\{/g) || []).length
  const closeBraces = (fixed.match(/\}/g) || []).length
  const openBrackets = (fixed.match(/\[/g) || []).length
  const closeBrackets = (fixed.match(/\]/g) || []).length
  
  // 添加缺失的闭合括号
  for (let i = 0; i < openBraces - closeBraces; i++) {
    fixed += '}'
  }
  for (let i = 0; i < openBrackets - closeBrackets; i++) {
    fixed += ']'
  }
  
  // 处理未闭合的字符串
  const quoteCount = (fixed.match(/"/g) || []).length
  if (quoteCount % 2 !== 0) {
    // 找到最后一个双引号，检查后面是否有逗号或右括号
    const lastQuote = fixed.lastIndexOf('"')
    const afterQuote = fixed.slice(lastQuote + 1).trim()
    if (!afterQuote.startsWith(',') && !afterQuote.startsWith('}') && !afterQuote.startsWith(']')) {
      fixed += '"' // 补齐字符串
    }
  }
  
  try {
    JSON.parse(fixed)
    return fixed
  } catch {
    return null
  }
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

    console.log(`[Pipeline] Processing text, length: ${text.length}, chunks: ${Math.ceil(text.length / 1000)}`)

    const chunks = sliceByDate(text)
    console.log(`[Pipeline] Sliced into ${chunks.length} chunks`)

    const extractPromises = chunks.slice(0, 10).map((chunk, i) => {
      console.log(`[Pipeline] Processing chunk ${i + 1}/${Math.min(chunks.length, 10)}, length: ${chunk.length}`)
      return extractFromChunk(chunk)
    })
    
    const results = await Promise.all(extractPromises)
    const validResults = results.filter((r): r is ExtractResult => r !== null && r.salience_score >= 5)
    validResults.sort((a, b) => b.salience_score - a.salience_score)

    console.log(`[Pipeline] Extracted ${results.length} results, ${validResults.length} valid`)

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
