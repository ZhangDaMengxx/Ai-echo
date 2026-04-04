import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { nodes, userId } = await request.json()
    
    if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
      return NextResponse.json({ error: '没有节点数据' }, { status: 400 })
    }

    const nodeRecords = nodes.map((node: {
      event_date?: string
      salience_score?: number
      core_event: string
      npc_state?: Record<string, unknown>
      memory_source?: string
      opening_mode?: string
    }) => ({
      user_id: userId,
      event_date: node.event_date || new Date().toISOString().split('T')[0],
      salience_score: node.salience_score || 5,
      core_event: node.core_event,
      npc_state: node.npc_state || {},
      memory_source: node.memory_source || 'txt_extraction',
      opening_mode: node.opening_mode || 'dialogue_driven',
    }))

    const { data: insertedNodes, error: nodeError } = await supabaseAdmin
      .from('Memory_Nodes')
      .insert(nodeRecords)
      .select('node_id')

    if (nodeError) throw nodeError

    interface ClueRecord {
      node_id: string
      trigger_condition: string
      clue_content: string
      is_unlocked: boolean
    }
    
    const clueRecords: ClueRecord[] = []
    nodes.forEach((node: {hidden_clues?: Array<{trigger: string; content: string}>}, index: number) => {
      const nodeId = insertedNodes?.[index]?.node_id
      if (nodeId && node.hidden_clues?.length) {
        node.hidden_clues.forEach((clue: {trigger: string; content: string}) => {
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
      await supabaseAdmin.from('Hidden_Clues').insert(clueRecords)
    }

    return NextResponse.json({
      success: true,
      nodeCount: insertedNodes?.length || 0,
      clueCount: clueRecords.length,
      nodeIds: insertedNodes?.map((n: {node_id: string}) => n.node_id) || [],
    })
    
  } catch (error) {
    console.error('Pipeline commit error:', error)
    return NextResponse.json(
      { error: '提交失败', details: String(error) },
      { status: 500 }
    )
  }
}
