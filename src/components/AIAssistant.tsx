import React, { useState } from 'react'
import { Sparkles, Wand2, RefreshCw, AlertCircle, Lock, LayoutGrid, PlusSquare, ChevronDown, Check, X } from 'lucide-react'
import { useWorkflowStore } from '../store/workflowStore'

interface AIAssistantProps {
  isOpen: boolean
  onClose: () => void
  onOpenPaywall: () => void
}

const PROVIDERS = {
  gemini: {
    name: 'Google Gemini',
    models: [
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Fast)', recommended: true },
      { id: 'gemini-2.0-flash-thinking-exp-01-21', name: 'Gemini 2.0 Thinking (Reasoning)' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Large Context)' }
    ]
  },
  openai: {
    name: 'OpenAI',
    models: [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Fast)', recommended: true },
      { id: 'gpt-4o', name: 'GPT-4o (Capable)' },
      { id: 'o3-mini', name: 'o3-mini (Reasoning Fast)' },
      { id: 'o1', name: 'o1 (Reasoning Smart)' }
    ]
  },
  anthropic: {
    name: 'Anthropic Claude',
    models: [
      { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet (Expert)', recommended: true },
      { id: 'claude-3-5-haiku-latest', name: 'Claude 3.5 Haiku (Fast)' },
      { id: 'claude-3-opus-latest', name: 'Claude 3 Opus (Original Expert)' }
    ]
  },
  deepseek: {
    name: 'DeepSeek',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek V3 (Fast)', recommended: true },
      { id: 'deepseek-reasoner', name: 'DeepSeek R1 (Reasoning)' }
    ]
  }
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose, onOpenPaywall }) => {
  const {
    isPro,
    isProBypassed,
    isGeneratingAI,
    aiError,
    activeAiProvider,
    activeAiModel,
    setAiModel,
    generateWorkflowWithAI
  } = useWorkflowStore()

  const [prompt, setPrompt] = useState('')
  const [mode, setMode] = useState<'replace' | 'append'>('replace')
  const [showModelDropdown, setShowModelDropdown] = useState(false)

  if (!isOpen) return null

  const activeProviderInfo = PROVIDERS[activeAiProvider]

  const suggestions = [
    { label: 'Build & Deploy Pipeline', text: 'Create a manual trigger, run terminal command "npm run build" and "npm run deploy", then create a javascript code block to send success notification' },
    { label: 'Jira to Git Branch', text: 'Create a manual trigger, fetch Jira issue details, check out a new git branch named after the issue key, and build local package' },
    { label: 'GitHub PR Check', text: 'Trigger, run testing script via terminal in current folder, create a GitHub comment on PR with result, and merge if checks pass' }
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim() || isGeneratingAI) return
    generateWorkflowWithAI(prompt, mode)
  }

  const selectModel = (providerKey: keyof typeof PROVIDERS, modelId: string) => {
    setAiModel(providerKey, modelId)
    setShowModelDropdown(false)
  }

  return (
    <div className="absolute top-4 right-4 w-[360px] glass-panel border border-border shadow-2xl rounded-2xl p-4 z-30 flex flex-col space-y-4 animate-in fade-in slide-in-from-top-4 duration-200 select-none">
      {/* Locked Paywall State Overlay */}
      {!isPro && (
        <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm z-40 rounded-2xl flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500 mb-3 animate-pulse">
            <Lock className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-sm text-foreground">DevFlow Pro Required</h4>
          <p className="text-[11px] text-zinc-500 mt-1 mb-4 leading-relaxed">
            AI workflow generation is a premium feature. Unlock lifetime access for ₹100.
          </p>
          <div className="flex gap-2 w-full">
            <button
              onClick={onOpenPaywall}
              className="flex-1 py-2 px-3 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-white font-semibold text-xs rounded-lg shadow-glow cursor-pointer transition-all active:scale-[0.98]"
            >
              Unlock Pro
            </button>
            <button
              onClick={onClose}
              className="px-3 py-2 border border-border hover:border-zinc-500 text-zinc-400 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-300">AI Assistant</h4>
          {(isPro || isProBypassed) && (
            <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
              Pro
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-zinc-500 hover:text-foreground transition-colors p-1 rounded-lg hover:bg-zinc-800 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Model Selector dropdown trigger */}
      <div className="relative">
        <label className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider block mb-1">Model & Provider</label>
        <button
          type="button"
          onClick={() => setShowModelDropdown(!showModelDropdown)}
          className="w-full flex items-center justify-between bg-zinc-900/60 border border-border hover:border-zinc-700 text-zinc-300 hover:text-white px-3 py-2 rounded-xl text-xs transition-colors text-left cursor-pointer"
        >
          <div className="flex flex-col">
            <span className="font-medium text-[11px] text-zinc-300 leading-tight">
              {PROVIDERS[activeAiProvider].name}
            </span>
            <span className="text-[10px] text-zinc-500 font-mono mt-0.5">
              {activeProviderInfo.models.find(m => m.id === activeAiModel)?.name || activeAiModel}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-zinc-500" />
        </button>

        {showModelDropdown && (
          <>
            <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowModelDropdown(false)} />
            <div className="absolute left-0 right-0 mt-1 max-h-[220px] overflow-y-auto bg-zinc-950 border border-border rounded-xl shadow-2xl z-50 p-1 text-xs scrollbar-thin animate-in fade-in duration-100">
              {(Object.keys(PROVIDERS) as Array<keyof typeof PROVIDERS>).map((providerKey) => {
                const prov = PROVIDERS[providerKey]
                return (
                  <div key={providerKey} className="mb-2 last:mb-0">
                    <div className="px-2 py-1 text-[9px] font-bold text-zinc-500 uppercase tracking-wider bg-zinc-900/30 rounded">
                      {prov.name}
                    </div>
                    <div className="space-y-0.5 mt-1">
                      {prov.models.map((model) => {
                        const isSelected = activeAiProvider === providerKey && activeAiModel === model.id
                        return (
                          <button
                            key={model.id}
                            type="button"
                            onClick={() => selectModel(providerKey, model.id)}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                              isSelected ? 'bg-primary/10 text-primary font-medium' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                            }`}
                          >
                            <span className="font-mono text-[10px] truncate pr-4">
                              {model.name}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0 text-primary" />}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Main input form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider block mb-1">Describe your workflow</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isGeneratingAI}
            rows={3}
            placeholder="e.g., Run tests, commit branch, and trigger jira comments..."
            className="w-full bg-zinc-900/60 border border-border focus:border-primary text-foreground placeholder-zinc-500 rounded-xl px-3 py-2 text-xs focus:outline-none transition-colors resize-none leading-relaxed"
          />
        </div>

        {/* Append / Replace settings */}
        <div>
          <label className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider block mb-1">Layout Mode</label>
          <div className="grid grid-cols-2 gap-2 bg-zinc-900/40 p-1 border border-border rounded-xl">
            <button
              type="button"
              onClick={() => setMode('replace')}
              disabled={isGeneratingAI}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                mode === 'replace' ? 'bg-primary text-white shadow-glow' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <LayoutGrid className="w-3 h-3" />
              <span>Replace Canvas</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('append')}
              disabled={isGeneratingAI}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                mode === 'append' ? 'bg-primary text-white shadow-glow' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <PlusSquare className="w-3 h-3" />
              <span>Append Nodes</span>
            </button>
          </div>
        </div>

        {/* Error notification */}
        {aiError && (
          <div className="flex items-start gap-2 bg-red-500/5 border border-red-500/20 text-red-400 text-[10px] p-2.5 rounded-xl animate-fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
            <span className="leading-relaxed">{aiError}</span>
          </div>
        )}

        {/* Submit action */}
        <button
          type="submit"
          disabled={!prompt.trim() || isGeneratingAI}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-glow cursor-pointer transition-all active:scale-[0.98]"
        >
          {isGeneratingAI ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Generating Pipeline...</span>
            </>
          ) : (
            <>
              <Wand2 className="w-3.5 h-3.5" />
              <span>Generate Workflow</span>
            </>
          )}
        </button>
      </form>

      {/* Suggestion Quick Pills */}
      {!isGeneratingAI && (
        <div className="space-y-1.5 pt-2 border-t border-border/40">
          <span className="text-[9px] text-zinc-500 uppercase font-semibold tracking-wider block">Suggested Templates</span>
          <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1 scrollbar-thin">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPrompt(s.text)}
                className="w-full text-left bg-zinc-900/30 hover:bg-zinc-900/80 border border-border/40 hover:border-zinc-700 px-2.5 py-1.5 rounded-lg text-[10px] text-zinc-400 hover:text-zinc-300 transition-colors truncate block cursor-pointer"
                title={s.text}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
export default AIAssistant
