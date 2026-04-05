import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { insertNodes } from '@/lib/memoryStore'
import { generateEmbeddings } from '@/lib/embedding'

export async function POST(request: NextRequest) {
  try {
    const { nodes, userId } = await request.json()

    if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
      return NextResponse.json({ error: '没有节点数据' }, { status: 400 })
    }

    // 生成 embedding（如果尚未生成）
    const coreEvents = nodes.map((n: { core_event: string }) => n.core_event)
    const embeddings = await generateEmbeddings(coreEvents)

    const nodeRecords = nodes.map((node: {
      event_date?: string
      salience_score?: number
      core_event: string
      npc_state?: Record<string, unknown>
      memory_source?: string
      opening_mode?: string
    }, index: number) => ({
      user_id: userId,
      event_date: node.event_date || new Date().toISOString().split('T')[0],
      salience_score: node.salience_score || 5,
      core_event: node.core_event,
      npc_state: node.npc_state || {},
      memory_source: node.memory_source || 'txt_extraction',
      opening_mode: node.opening_mode || 'dialogue_driven',
      embedding: embeddings[index] || null,
    }))

    // 尝试 Supabase，失败则 fallback 到 memoryStore
    let insertedNodes: { node_id: string }[] | null = null
    let useMemory = false

    try {
      const { data, error: nodeError } = await supabaseAdmin
        .from('Memory_Nodes')
        .insert(nodeRecords)
        .select('node_id')

      if (nodeError) throw nodeError
      insertedNodes = data
    } catch {
      useMemory = true
      const memoryIds = insertNodes(nodeRecords, [])
      insertedNodes = memoryIds.map((id) => ({ node_id: id }))
    }

    interface ClueRecord {
      node_id: string
      trigger_condition: string
      clue_content: string
      is_unlocked: boolean
    }

    const clueRecords: ClueRecord[] = []
    nodes.forEach((node: { hidden_clues?: Array<{ trigger: string; content: string }> }, index: number) => {
      const nodeId = insertedNodes?.[index]?.node_id
      if (nodeId && node.hidden_clues?.length) {
        node.hidden_clues.forEach((clue: { trigger: string; content: string }) => {
          clueRecords.push({
            node_id: nodeId,
            trigger_condition: clue.trigger,
            clue_content: clue.content,
            is_unlocked: false,
          })
        })
      }
    })

    if (clueRecords.length > 0) {
      if (!useMemory) {
        try {
          await supabaseAdmin.from('Hidden_Clues').insert(clueRecords)
        } catch {
          // 忽略线索写入失败
        }
      } else {
        const { insertNodes: memInsert } = await import('@/lib/memoryStore')
        memInsert([], clueRecords as unknown as Array<Record<string, unknown>>)
      }
    }

    return NextResponse.json({
      success: true,
      nodeCount: insertedNodes?.length || 0,
      clueCount: clueRecords.length,
      nodeIds: insertedNodes?.map((n: { node_id: string }) => n.node_id) || [],
    })

  } catch (error) {
    console.error('Pipeline commit error:', error)
    return NextResponse.json(
      { error: '提交失败', details: String(error) },
      { status: 500 }
    )
  }
}
