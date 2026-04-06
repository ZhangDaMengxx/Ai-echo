import { NextRequest, NextResponse } from 'next/server'
import { callQwen, buildSystemPrompt, unlockClueFunction } from '@/lib/qwen'
import { supabaseAdmin } from '@/lib/supabase'
import { unlockClue as unlockClueInMemory } from '@/lib/memoryStore'
import { broadcastClueUnlock } from '@/lib/realtime'
import type { HiddenClue } from '@/lib/supabase'

// 人物画像接口
interface UserProfile {
	base_archetype: {
		style?: string
		logic?: string
		dominant_emotions?: string[]
		summary?: string
		[key: string]: unknown
	}
}

// 检查是否有 Supabase 配置
const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL

// 内存中存储解锁的线索（仅用于无 Supabase 时）
const unlockedCluesInMemory = new Set<string>()

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

    // 构建System Prompt，使用传入的人物画像
    const profile = userProfile as UserProfile | undefined
    const systemPrompt = buildSystemPrompt(
      profile?.base_archetype || {},
      nodeData?.core_event || '',
      nodeData?.memory_source || 'txt_extraction',
      nodeData?.npc_state || {},
      nodeData?.opening_mode || 'dialogue_driven',
      isFirstRound,
    )

    // 构建对话历史（Qwen 格式）
    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []).map((m: { role: string; content: string }) => ({
        role: m.role === 'model' ? 'assistant' : m.role,
        content: m.content,
      })),
      { role: 'user', content: message },
    ]

    // 如果有可用线索，添加监测指令
    if (availableClues?.length > 0) {
      const cluesText = availableClues
        .map((c: { trigger_condition: string; clue_id: string }) => `- ${c.trigger_condition} (ID: ${c.clue_id})`)
        .join('\n')
      messages[0].content += `\n\n【线索监测】\n监控以下未解锁线索的触发条件：\n${cluesText}\n如果用户发言满足条件，调用unlock_clue函数。`
    }

    // 调用 Qwen
    const tools = availableClues?.length > 0
      ? [{ type: 'function', function: unlockClueFunction }]
      : undefined

    const res = await callQwen(messages, {
      model: 'qwen-max',
      temperature: 0.3,
      tools,
    })

    const choice = res.output?.choices?.[0]
    const responseMessage = choice?.message
    const text = responseMessage?.content || ''

    // 检查 Function Calling
    const unlockedClues: string[] = []

    if (responseMessage?.tool_calls) {
      for (const toolCall of responseMessage.tool_calls) {
        if (toolCall.function?.name === 'unlock_clue') {
          const args = JSON.parse(toolCall.function.arguments || '{}')
          const clue_id = args.clue_id as string

          if (clue_id && !unlockedCluesInMemory.has(clue_id)) {
            unlockedCluesInMemory.add(clue_id)
            
            if (hasSupabase) {
              try {
                const { data } = await supabaseAdmin
                  .from('Hidden_Clues')
                  .update({ is_unlocked: true, unlocked_at: new Date().toISOString() })
                  .eq('clue_id', clue_id)
                  .select()
                  .single()

                // 广播解锁事件
                if (data) {
                  await broadcastClueUnlock(data as HiddenClue)
                }
              } catch {
                unlockClueInMemory(clue_id)
              }
            } else {
              // 无 Supabase 时使用内存存储
              unlockClueInMemory(clue_id)
              console.log('[Chat] Unlocked clue in memory:', clue_id)
            }
            unlockedClues.push(clue_id)
          }
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
