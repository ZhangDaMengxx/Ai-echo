import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getNodes } from '@/lib/memoryStore'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: '缺少userId' }, { status: 400 })
    }

    // 尝试 Supabase，失败则 fallback 到 memoryStore
    let data
    try {
      const result = await supabase
        .from('Memory_Nodes')
        .select('*')
        .eq('user_id', userId)
        .gte('salience_score', 7)
        .order('event_date', { ascending: true })

      if (result.error) throw result.error
      data = result.data || []
    } catch {
      data = getNodes(userId, 7)
    }

    return NextResponse.json({ nodes: data, count: data.length })

  } catch (error) {
    console.error('Get nodes error:', error)
    return NextResponse.json(
      { error: '获取失败', details: String(error) },
      { status: 500 }
    )
  }
}
