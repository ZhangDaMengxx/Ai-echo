import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getNodeById, getCluesByNodeId } from '@/lib/memoryStore'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const nodeId = params.id

    if (!nodeId) {
      return NextResponse.json({ error: '缺少节点ID' }, { status: 400 })
    }

    // 尝试 Supabase，失败则 fallback 到 memoryStore
    let node
    let clues

    try {
      const { data: nodeData, error: nodeError } = await supabase
        .from('Memory_Nodes')
        .select('*')
        .eq('node_id', nodeId)
        .single()

      if (nodeError) throw nodeError
      node = nodeData

      const { data: cluesData } = await supabase
        .from('Hidden_Clues')
        .select('*')
        .eq('node_id', nodeId)
        .eq('is_unlocked', false)

      clues = cluesData || []
    } catch {
      node = getNodeById(nodeId)
      clues = getCluesByNodeId(nodeId)
    }

    if (!node) {
      return NextResponse.json({ error: '节点不存在' }, { status: 404 })
    }

    return NextResponse.json({ node, clues })

  } catch (error) {
    console.error('Get node error:', error)
    return NextResponse.json(
      { error: '获取失败', details: String(error) },
      { status: 500 }
    )
  }
}
