import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: '缺少userId' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('Memory_Nodes')
      .select('*')
      .eq('user_id', userId)
      .gte('salience_score', 7)
      .order('event_date', { ascending: true })

    if (error) throw error

    return NextResponse.json({ nodes: data || [], count: data?.length || 0 })
    
  } catch (error) {
    console.error('Get nodes error:', error)
    return NextResponse.json(
      { error: '获取失败', details: String(error) },
      { status: 500 }
    )
  }
}
