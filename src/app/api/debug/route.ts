// ============================================================
// Debug API: 检查环境变量配置
// 用于排查 Vercel 部署问题
// ============================================================

import { NextResponse } from 'next/server'

export async function GET() {
  const checks = {
    // Qwen API
    QWEN_API_KEY: {
      exists: !!process.env.QWEN_API_KEY || !!process.env.DASHSCOPE_API_KEY,
      source: process.env.QWEN_API_KEY ? 'QWEN_API_KEY' : 
              process.env.DASHSCOPE_API_KEY ? 'DASHSCOPE_API_KEY' : 'none'
    },
    
    // Supabase (可选)
    SUPABASE_URL: {
      exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      value: process.env.NEXT_PUBLIC_SUPABASE_URL ? '已设置' : '未设置'
    },
    SUPABASE_ANON_KEY: {
      exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '已设置' : '未设置'
    },
    SUPABASE_SERVICE_KEY: {
      exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      value: process.env.SUPABASE_SERVICE_ROLE_KEY ? '已设置' : '未设置'
    },
    
    // 系统信息
    NODE_ENV: process.env.NODE_ENV || 'unknown',
    VERCEL_ENV: process.env.VERCEL_ENV || 'not on vercel',
  }
  
  const allGood = checks.QWEN_API_KEY.exists
  
  return NextResponse.json({
    status: allGood ? 'ok' : 'missing_config',
    checks,
    message: allGood 
      ? '所有必需配置已设置' 
      : '缺少 QWEN_API_KEY 或 DASHSCOPE_API_KEY',
    timestamp: new Date().toISOString()
  })
}
