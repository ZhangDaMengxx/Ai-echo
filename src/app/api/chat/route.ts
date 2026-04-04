import { NextRequest, NextResponse } from 'next/server'
import { geminiPro, buildSystemPrompt, unlockClueFunction } from '@/lib/gemini'
import { supabaseAdmin } from '@/lib/supabase'
import { Tool } from '@google/generative-ai'

export async function POST(request: NextRequest) {
  try {
    const {
      message,
      conversationHistory,
      availableClues,
      nodeData,
      userProfile,
      isFirstRound,
    } = await request.json()

    // 构建System Prompt
    const systemPrompt = buildSystemPrompt(
      userProfile?.base_archetype || {},
      nodeData?.core_event || '',
      nodeData?.memory_source || 'txt_extraction',
      nodeData?.npc_state || {},
      nodeData?.opening_mode || 'dialogue_driven',
      isFirstRound,
    )

    // 构建对话历史
    const contents = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      ...(conversationHistory || []),
      { role: 'user', parts: [{ text: message }] },
    ]

    // 如果有可用线索，添加监测指令
    let clueInstruction = ''
    if (availableClues?.length > 0) {
      clueInstruction = `
\n【线索监测】
监控以下未解锁线索的触发条件：
${availableClues.map((c: {trigger_condition: string; clue_id: string}) => `- ${c.trigger_condition} (ID: ${c.clue_id})`).join('\n')}
如果用户发言满足条件，调用unlock_clue函数。
`
      contents[0].parts[0].text += clueInstruction
    }

    // 调用Gemini
    const tools: Tool[] | undefined = availableClues?.length > 0 
      ? [{ functionDeclarations: [unlockClueFunction] }] 
      : undefined
    
    const result = await geminiPro.generateContent({
      contents,
      tools,
    })

    const response = result.response
    const text = response.text()
    
    // 检查Function Calling
    const functionCalls = response.functionCalls()
    const unlockedClues: string[] = []
    
    if (functionCalls && functionCalls.length > 0) {
      for (const call of functionCalls) {
        if (call.name === 'unlock_clue') {
          const { clue_id } = call.args as { clue_id: string }
          
          // 更新数据库
          await supabaseAdmin
            .from('Hidden_Clues')
            .update({ is_unlocked: true, unlocked_at: new Date().toISOString() })
            .eq('clue_id', clue_id)
          
          unlockedClues.push(clue_id)
        }
      }
    }

    return NextResponse.json({
      reply: text,
      unlockedClues,
    })
    
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { error: '对话失败', details: String(error) },
      { status: 500 }
    )
  }
}
