import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const {
      nodeId,
      choice, // 'commit' | 'discard'
      alteredChoices,
      newEnding,
      userId,
    } = await request.json()

    if (!nodeId || !choice) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }

    // 先创建分支记录
    const { data: branch, error: branchError } = await supabaseAdmin
      .from('If_Line_Branches')
      .insert({
        parent_node_id: nodeId,
        altered_choices: alteredChoices,
        new_ending: newEnding,
        is_committed: choice === 'commit',
      })
      .select()
      .single()

    if (branchError) throw branchError

    // 如果是"逆天改命"，更新用户画像
    if (choice === 'commit') {
      // TODO: 调用Gemini重新推演base_archetype
      await supabaseAdmin
        .from('Users')
        .update({ 
          global_vibe: 'altered_after_' + nodeId,
        })
        .eq('id', userId)
    }

    return NextResponse.json({
      success: true,
      choice,
      branchId: branch?.branch_id,
      message: choice === 'commit' 
        ? '你已选择逆天改命，命运轨迹已改变' 
        : '这段回忆已作为平行宇宙存档',
    })
    
  } catch (error) {
    console.error('Choice commit error:', error)
    return NextResponse.json(
      { error: '提交失败', details: String(error) },
      { status: 500 }
    )
  }
}
