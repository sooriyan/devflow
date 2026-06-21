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

  const [showGithub, setShowGithub] = useState(false)
  const [showJira, setShowJira] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')

  useEffect(() => {
    if (isOpen) {
      // Load current credentials from secure storage
      window.electronAPI.getCredentials().then((creds) => {
        if (creds) {
          setGithubToken(creds.githubToken || '')
          setJiraHost(creds.jiraHost || '')
          setJiraEmail(creds.jiraEmail || '')
          setJiraToken(creds.jiraToken || '')
        }
      })
      setStatusMsg('')
    }
  }, [isOpen])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatusMsg('Saving...')
    try {
      const result = await window.electronAPI.saveCredentials({
        githubToken: githubToken.trim(),
        jiraHost: jiraHost.trim(),
        jiraEmail: jiraEmail.trim(),
        jiraToken: jiraToken.trim()
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
                className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {showGithub ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="h-[1px] bg-border my-4" />

          {/* Jira Configuration */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Jira Cloud Settings</h4>
            
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
                  className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showJira ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
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
