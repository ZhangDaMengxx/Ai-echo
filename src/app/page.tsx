'use client'

import { useState } from 'react'
import { Upload, Sparkles, AlertCircle } from 'lucide-react'
import { apiFetch } from '@/lib/api'

export default function Home() {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  interface ExtractResult {
    chunks: number
    nodes: Array<{
      event_date?: string
      salience_score: number
      core_event: string
      npc_state?: {current_emotion?: string; attitude_towards_user?: string}
      opening_mode?: string
    }>
    message: string
    mode?: string
  }
  const [result, setResult] = useState<ExtractResult | null>(null)
  const [error, setError] = useState('')

  const handleExtract = async () => {
    if (!text.trim()) return
    
    setLoading(true)
    setError('')
    try {
      const data = await apiFetch('/api/pipeline/extract', {
        method: 'POST',
        body: JSON.stringify({ text }),
      })
      setResult(data)
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : '请求失败'
      setError(errorMsg)
      console.error(e)
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            回音轨迹
          </h1>
          <p className="text-slate-300 text-lg">
            Echo Tracks · 动态人生档案馆
          </p>
        </div>

        {/* Mock Mode Notice */}
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-200/80">
            <p className="font-medium text-yellow-200 mb-1">演示模式</p>
            <p>当前使用模拟AI数据，无需配置API Key即可体验功能。</p>
            <p className="mt-1">如需真实AI分析，请在后端配置 GEMINI_API_KEY。</p>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <Upload className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-semibold">上传记忆文本</h2>
          </div>
          
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="粘贴你的日记、回忆或故事...

示例：
2025年1月15日
今天和他在实验室熬了一整夜。外场突然下起暴雨，我们的无人机测试被迫中断。他一言不发地坐在角落里，肩膀还滴着水...
"
            className="w-full h-64 bg-slate-800/50 rounded-xl p-4 text-slate-200 placeholder-slate-500 border border-white/10 focus:border-cyan-400/50 focus:outline-none resize-none"
          />
          
          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
              错误: {error}
            </div>
          )}
          
          <button
            onClick={handleExtract}
            disabled={loading || !text.trim()}
            className="mt-6 w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-cyan-400 hover:to-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <span className="animate-pulse">提取关键节点中...</span>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                提取关键节点
              </>
            )}
          </button>
        </div>

        {/* Results */}
        {result?.nodes && (
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-cyan-400">
                发现 {result.nodes.length} 个关键记忆节点
              </h3>
              {result.mode === 'mock' && (
                <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-full">
                  模拟数据
                </span>
              )}
            </div>
            {result.nodes.map((node, i) => (
              <div 
                key={i}
                className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10 hover:border-cyan-400/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-slate-400">{node.event_date || '未知日期'}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    node.salience_score >= 8 ? 'bg-red-500/20 text-red-300' :
                    node.salience_score >= 6 ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-blue-500/20 text-blue-300'
                  }`}>
                    显著性 {node.salience_score}/10
                  </span>
                </div>
                <p className="text-slate-200 mb-3">{node.core_event}</p>
                <div className="flex gap-4 text-sm text-slate-500">
                  <span>情绪: {node.npc_state?.current_emotion || '未知'}</span>
                  <span>态度: {node.npc_state?.attitude_towards_user || '未知'}</span>
                  <span>开场: {node.opening_mode === 'action_driven' ? '动作驱动' : '语言驱动'}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 text-center text-slate-500 text-sm">
          <p>Powered by Next.js + Vercel + Supabase + Gemini</p>
        </div>
      </div>
    </main>
  )
}
