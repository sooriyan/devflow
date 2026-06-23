import React, { useState } from 'react'
import { X, Sparkles, ShieldCheck, CreditCard, Ticket, Lock, Loader2 } from 'lucide-react'
import { useWorkflowStore } from '../store/workflowStore'

interface ProPaywallModalProps {
  isOpen: boolean
  onClose: () => void
}

export const ProPaywallModal: React.FC<ProPaywallModalProps> = ({ isOpen, onClose }) => {
  const completeMockSubscription = useWorkflowStore((state) => state.completeMockSubscription)
  const activateProWithKey = useWorkflowStore((state) => state.activateProWithKey)

  const [promoKey, setPromoKey] = useState('')
  const [isPaying, setIsPaying] = useState(false)
  const [isActivating, setIsActivating] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  if (!isOpen) return null

  const handleMockPay = async () => {
    setIsPaying(true)
    setErrorMsg('')
    setStatusMsg('Initiating secure mock payment...')

    // Simulate payment steps
    setTimeout(() => {
      setStatusMsg('Processing transaction (₹100)...')
      setTimeout(async () => {
        try {
          await completeMockSubscription()
          setStatusMsg('Subscription activated successfully!')
          setTimeout(() => {
            onClose()
            setIsPaying(false)
            setStatusMsg('')
          }, 1000)
        } catch {
          setErrorMsg('Failed to complete subscription.')
          setIsPaying(false)
        }
      }, 1000)
    }, 1000)
  }

  const handlePromoActivate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!promoKey.trim()) return

    setIsActivating(true)
    setErrorMsg('')
    setStatusMsg('Verifying activation key...')

    try {
      const res = await activateProWithKey(promoKey.trim())
      if (res.success) {
        setStatusMsg('Pro features activated!')
        setTimeout(() => {
          onClose()
          setIsActivating(false)
          setStatusMsg('')
          setPromoKey('')
        }, 1000)
      } else {
        setErrorMsg(res.error || 'Invalid code.')
        setIsActivating(false)
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Error activating code.')
      setIsActivating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in">
      <div className="glass-panel border border-yellow-500/30 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative">
        {/* Glow effect */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-yellow-500" />
            <span className="font-bold text-xs uppercase tracking-wider text-zinc-400">Unlock Pro Feature</span>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-foreground transition-colors p-1 rounded-lg hover:bg-zinc-800"
            disabled={isPaying || isActivating}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-tr from-yellow-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-glow animate-pulse">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-foreground tracking-tight">AI Flow Assistant</h3>
            <p className="text-xs text-zinc-400 leading-relaxed px-4">
              Unlock DevFlow Pro to generate comprehensive, optimized node workflows in seconds from a single prompt.
            </p>
          </div>

          {/* Features check list */}
          <div className="bg-zinc-900/50 border border-border/40 rounded-xl p-4 text-left space-y-2.5 max-w-sm mx-auto">
            <div className="flex items-start gap-2.5 text-xs text-zinc-300">
              <ShieldCheck className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
              <span>Prompt to workflow generation</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-zinc-300">
              <ShieldCheck className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
              <span>Google Gemini, OpenAI, Claude, DeepSeek support</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-zinc-300">
              <ShieldCheck className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
              <span>Smart coordinate auto-positioning</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-zinc-300">
              <ShieldCheck className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
              <span>Background automated Cron Job scheduling</span>
            </div>
          </div>

          {/* Billing details */}
          <div className="py-2">
            <div className="text-zinc-500 text-xs uppercase tracking-wider font-semibold">Lifetime License</div>
            <div className="text-3xl font-black text-white mt-1">
              ₹100 <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">one-time</span>
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">No recurring fees. Local license stored securely.</div>
          </div>

          {/* Status and Error messages */}
          {statusMsg && (
            <div className="flex items-center justify-center gap-2 text-xs text-yellow-400 bg-yellow-500/5 border border-yellow-500/20 py-2 rounded-lg animate-fade-in">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{statusMsg}</span>
            </div>
          )}
          {errorMsg && (
            <div className="text-xs text-red-400 bg-red-500/5 border border-red-500/20 py-2 rounded-lg animate-fade-in">
              {errorMsg}
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-4 pt-2">
            <button
              onClick={handleMockPay}
              disabled={isPaying || isActivating}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-glow cursor-pointer transition-all active:scale-[0.98]"
            >
              {isPaying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              <span>Buy Pro for ₹100 (One-Time)</span>
            </button>

            <div className="flex items-center justify-between text-zinc-600 text-xs px-2 select-none">
              <div className="h-[1px] bg-border/40 flex-1" />
              <span className="px-3 uppercase font-semibold text-[10px]">Or Activate with Code</span>
              <div className="h-[1px] bg-border/40 flex-1" />
            </div>

            {/* Promo Code activation */}
            <form onSubmit={handlePromoActivate} className="flex gap-2">
              <div className="relative flex-1">
                <Ticket className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Promo or Bypass Key"
                  value={promoKey}
                  onChange={(e) => setPromoKey(e.target.value)}
                  disabled={isPaying || isActivating}
                  className="w-full bg-background/50 border border-border/80 rounded-xl pl-9 pr-3 py-2.5 text-xs focus:outline-none focus:border-yellow-500 transition-colors text-foreground font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={isPaying || isActivating || !promoKey.trim()}
                className="px-4 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 text-xs font-semibold rounded-xl border border-border transition-colors cursor-pointer"
              >
                Activate
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
export default ProPaywallModal
