import React, { useState, useEffect } from 'react'
import { X, Eye, EyeOff, Save, KeyRound } from 'lucide-react'

interface CredentialsSettingsProps {
  isOpen: boolean
  onClose: () => void
}

export const CredentialsSettings: React.FC<CredentialsSettingsProps> = ({ isOpen, onClose }) => {
  const [githubToken, setGithubToken] = useState('')
  const [jiraHost, setJiraHost] = useState('')
  const [jiraEmail, setJiraEmail] = useState('')
  const [jiraToken, setJiraToken] = useState('')
  
  // AI Keys
  const [geminiApiKey, setGeminiApiKey] = useState('')
  const [openaiApiKey, setOpenaiApiKey] = useState('')
  const [anthropicApiKey, setAnthropicApiKey] = useState('')
  const [deepseekApiKey, setDeepseekApiKey] = useState('')

  const [showGithub, setShowGithub] = useState(false)
  const [showJira, setShowJira] = useState(false)
  const [showGemini, setShowGemini] = useState(false)
  const [showOpenai, setShowOpenai] = useState(false)
  const [showAnthropic, setShowAnthropic] = useState(false)
  const [showDeepseek, setShowDeepseek] = useState(false)

  const [statusMsg, setStatusMsg] = useState('')

  useEffect(() => {
    if (isOpen) {
      window.electronAPI.getCredentials().then((creds) => {
        if (creds) {
          setGithubToken(creds.githubToken || '')
          setJiraHost(creds.jiraHost || '')
          setJiraEmail(creds.jiraEmail || '')
          setJiraToken(creds.jiraToken || '')
          setGeminiApiKey(creds.geminiApiKey || '')
          setOpenaiApiKey(creds.openaiApiKey || '')
          setAnthropicApiKey(creds.anthropicApiKey || '')
          setDeepseekApiKey(creds.deepseekApiKey || '')
        }
        setStatusMsg('')
      })
    }
  }, [isOpen])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatusMsg('Saving...')
    try {
      const currentCreds = await window.electronAPI.getCredentials()
      const result = await window.electronAPI.saveCredentials({
        ...currentCreds,
        githubToken: githubToken.trim(),
        jiraHost: jiraHost.trim(),
        jiraEmail: jiraEmail.trim(),
        jiraToken: jiraToken.trim(),
        geminiApiKey: geminiApiKey.trim(),
        openaiApiKey: openaiApiKey.trim(),
        anthropicApiKey: anthropicApiKey.trim(),
        deepseekApiKey: deepseekApiKey.trim(),
      })
      if (result.success) {
        setStatusMsg('Credentials saved securely!')
        setTimeout(() => {
          onClose()
        }, 1000)
      } else {
        setStatusMsg('Failed to save credentials.')
      }
    } catch (err) {
      console.error(err)
      setStatusMsg('Error saving credentials.')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="glass-panel border border-border w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">Credentials Manager</h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-foreground transition-colors p-1 rounded-lg hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <p className="text-xs text-zinc-400">
            These variables are securely encrypted on your local disk using your operating system's native credentials manager.
          </p>

          <div className="max-h-[55vh] overflow-y-auto pr-2 space-y-4 scrollbar-thin">
            {/* --- Section 1: Developer Integrations --- */}
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-primary mb-3">Integrations</h4>
              <div className="space-y-4">
                {/* GitHub Token */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">GitHub Personal Access Token</label>
                  <div className="relative">
                    <input
                      type={showGithub ? 'text' : 'password'}
                      value={githubToken}
                      onChange={(e) => setGithubToken(e.target.value)}
                      placeholder="ghp_..."
                      className="w-full bg-background border border-border rounded-lg pl-3 pr-10 py-2 text-sm focus:outline-none focus:border-primary transition-colors text-foreground font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGithub(!showGithub)}
                      className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                    >
                      {showGithub ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Jira Settings */}
                <div className="space-y-3 pt-2">
                  <h5 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Jira Cloud Settings</h5>
                  
                  {/* Host */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-500">Jira Host Domain</label>
                    <input
                      type="text"
                      value={jiraHost}
                      onChange={(e) => setJiraHost(e.target.value)}
                      placeholder="your-domain.atlassian.net"
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors text-foreground"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-500">Atlassian Email</label>
                    <input
                      type="email"
                      value={jiraEmail}
                      onChange={(e) => setJiraEmail(e.target.value)}
                      placeholder="developer@company.com"
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors text-foreground"
                    />
                  </div>

                  {/* API Token */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-500">Jira API Token</label>
                    <div className="relative">
                      <input
                        type={showJira ? 'text' : 'password'}
                        value={jiraToken}
                        onChange={(e) => setJiraToken(e.target.value)}
                        placeholder="ATATT3xFf..."
                        className="w-full bg-background border border-border rounded-lg pl-3 pr-10 py-2 text-sm focus:outline-none focus:border-primary transition-colors text-foreground font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowJira(!showJira)}
                        className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                      >
                        {showJira ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-[1px] bg-border my-4" />

            {/* --- Section 2: AI Provider Keys --- */}
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-accent-purple mb-3">AI Providers (Pro Features)</h4>
              <div className="space-y-4">
                {/* Gemini API Key */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Gemini API Key</label>
                  <div className="relative">
                    <input
                      type={showGemini ? 'text' : 'password'}
                      value={geminiApiKey}
                      onChange={(e) => setGeminiApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full bg-background border border-border rounded-lg pl-3 pr-10 py-2 text-sm focus:outline-none focus:border-primary transition-colors text-foreground font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGemini(!showGemini)}
                      className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                    >
                      {showGemini ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* OpenAI API Key */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">OpenAI API Key</label>
                  <div className="relative">
                    <input
                      type={showOpenai ? 'text' : 'password'}
                      value={openaiApiKey}
                      onChange={(e) => setOpenaiApiKey(e.target.value)}
                      placeholder="sk-proj-..."
                      className="w-full bg-background border border-border rounded-lg pl-3 pr-10 py-2 text-sm focus:outline-none focus:border-primary transition-colors text-foreground font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOpenai(!showOpenai)}
                      className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                    >
                      {showOpenai ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Anthropic API Key */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Anthropic Claude API Key</label>
                  <div className="relative">
                    <input
                      type={showAnthropic ? 'text' : 'password'}
                      value={anthropicApiKey}
                      onChange={(e) => setAnthropicApiKey(e.target.value)}
                      placeholder="sk-ant-..."
                      className="w-full bg-background border border-border rounded-lg pl-3 pr-10 py-2 text-sm focus:outline-none focus:border-primary transition-colors text-foreground font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAnthropic(!showAnthropic)}
                      className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                    >
                      {showAnthropic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* DeepSeek API Key */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">DeepSeek API Key</label>
                  <div className="relative">
                    <input
                      type={showDeepseek ? 'text' : 'password'}
                      value={deepseekApiKey}
                      onChange={(e) => setDeepseekApiKey(e.target.value)}
                      placeholder="ds-..."
                      className="w-full bg-background border border-border rounded-lg pl-3 pr-10 py-2 text-sm focus:outline-none focus:border-primary transition-colors text-foreground font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDeepseek(!showDeepseek)}
                      className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                    >
                      {showDeepseek ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer & Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-border mt-6">
            <span className="text-xs text-primary font-medium">{statusMsg}</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-border hover:border-zinc-500 hover:text-foreground text-zinc-400 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-glow transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save credentials</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
