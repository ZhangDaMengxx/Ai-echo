import { NextRequest, NextResponse } from 'next/server'
import { geminiFlash } from '@/lib/gemini'

// 正则时序切片
function sliceByDate(text: string): string[] {
  const datePattern = /(\d{4}年\d{1,2}月\d{1,2}日|\d{4}-\d{2}-\d{2}|\d{4}\/\d{2}\/\d{2})/g
  
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
  npc_state?: {
    current_emotion?: string
    attitude_towards_user?: string
  }
  salience_score: number
  hidden_clues?: Array<{trigger: string, content: string}>
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
  "npc_state": {"current_emotion": "情绪", "attitude_towards_user": "态度"},
  "salience_score": 数字,
  "hidden_clues": [{"trigger": "触发条件", "content": "线索内容"}]
}
`

  try {
    const result = await geminiFlash.generateContent(prompt)
    const text = result.response.text()
    
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
    
    return NextResponse.json({
      chunks: chunks.length,
      nodes: validResults,
      message: `提取完成，共${validResults.length}个关键节点`
    })
    
  } catch (error) {
    console.error('Pipeline extract error:', error)
    return NextResponse.json(
      { error: '处理失败', details: String(error) },
      { status: 500 }
    )
  }
}
