import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 创建 mock 客户端（当环境变量缺失时）
const createMockClient = () => {
  return {
    from: () => ({
      select: () => ({ data: null, error: null }),
      insert: () => ({ data: null, error: null }),
      update: () => ({ data: null, error: null }),
      delete: () => ({ data: null, error: null }),
      eq: () => ({ data: null, error: null }),
      single: () => ({ data: null, error: null }),
    }),
    channel: () => ({
      on: () => ({ subscribe: () => ({}) }),
    }),
    removeChannel: () => {},
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any
}

// 客户端（只在有环境变量时创建）
export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : createMockClient()

// 服务端使用的admin客户端
export const supabaseAdmin = supabaseUrl && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : createMockClient()

// 数据库类型定义
export interface User {
  id: string
  base_archetype: {
    style: string
    logic: string
  }
  global_vibe: string
  created_at: string
}

export interface MemoryNode {
  node_id: string
  user_id: string
  event_date: string
  salience_score: number
  core_event: string
  npc_state: {
    current_emotion: string
    attitude_towards_user: string
  }
  memory_source: 'txt_extraction' | 'user_supplement'
  opening_mode: 'action_driven' | 'dialogue_driven'
  embedding?: number[]
  created_at: string
}

export interface HiddenClue {
  clue_id: string
  node_id: string
  trigger_condition: string
  clue_content: string
  is_unlocked: boolean
  unlocked_at?: string
}

export interface IfLineBranch {
  branch_id: string
  parent_node_id: string
  altered_choices: string
  new_ending: string
  is_committed: boolean
  created_at: string
}
