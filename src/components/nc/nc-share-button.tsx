'use client'

import { useEffect, useRef, useState } from 'react'
import { Share2, Mail, MessageCircle, Link as LinkIcon, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NCShareButtonProps {
  ncCodigo:       string
  ncTitulo:       string
  ncSeveridade?:  string | null
  ncStatus?:      string
  /** URL pública (opcional). Se ausente, usa window.location.href. */
  url?: string
}

export function NCShareButton({
  ncCodigo, ncTitulo, ncSeveridade, ncStatus, url,
}: Readonly<NCShareButtonProps>) {
  const [open, setOpen]     = useState(false)
  const [copied, setCopied] = useState(false)
  const ref                 = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setCopied(false)
      }
    }
    if (open) document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  // URL final — preferência por prop, fallback para window
  const getLink = () => url ?? (typeof window !== 'undefined' ? window.location.href : '')

  // Texto base usado em todos os canais
  const buildShareText = () => {
    const linha1 = `*${ncCodigo}* — ${ncTitulo}`
    const detalhes: string[] = []
    if (ncSeveridade) detalhes.push(`Gravidade: ${ncSeveridade}`)
    if (ncStatus)     detalhes.push(`Status: ${ncStatus.replace('_', ' ')}`)
    const linha2 = detalhes.length > 0 ? detalhes.join(' · ') : ''
    return [linha1, linha2, '', getLink()].filter(Boolean).join('\n')
  }

  // ── Handlers ──
  const handleEmail = () => {
    const subject = encodeURIComponent(`Fly ISO — ${ncCodigo}: ${ncTitulo}`)
    const body    = encodeURIComponent(
      `Você está sendo notificado sobre a não conformidade ${ncCodigo}.\n\n` +
      `${buildShareText()}\n\n` +
      `Acesse o sistema para mais detalhes.`
    )
    window.open(`mailto:?subject=${subject}&body=${body}`, '_self')
    setOpen(false)
  }

  const handleWhatsApp = () => {
    const text = encodeURIComponent(buildShareText())
    // wa.me funciona tanto no WhatsApp Web quanto no app mobile
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer')
    setOpen(false)
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getLink())
      setCopied(true)
      // Mantém aberto por 1.5s para mostrar feedback, depois fecha
      setTimeout(() => { setOpen(false); setCopied(false) }, 1500)
    } catch {
      // Fallback para navegadores muito antigos
      const ta = document.createElement('textarea')
      ta.value = getLink()
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand('copy'); setCopied(true) } catch { /* noop */ }
      document.body.removeChild(ta)
      setTimeout(() => { setOpen(false); setCopied(false) }, 1500)
    }
  }

  // Web Share API nativo (mobile) — disponível?
  const hasNativeShare = typeof navigator !== 'undefined' && 'share' in navigator

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: `${ncCodigo}: ${ncTitulo}`,
        text:  buildShareText(),
        url:   getLink(),
      })
      setOpen(false)
    } catch {
      // usuário cancelou — não faz nada
    }
  }

  return (
    <div className="fixed bottom-8 right-8 z-30" ref={ref}>
      {/* Dropdown menu */}
      {open && (
        <div className="absolute bottom-16 right-0 w-60 bg-white rounded-2xl shadow-xl ring-1 ring-black/10 overflow-hidden mb-1">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-700">Compartilhar {ncCodigo}</p>
            <p className="text-[10px] text-slate-400 mt-0.5 truncate">{ncTitulo}</p>
          </div>

          <div className="py-1">
            <ShareItem
              icon={MessageCircle}
              iconBg="bg-emerald-100"
              iconColor="text-emerald-700"
              label="WhatsApp"
              hint="Mensagem com link"
              onClick={handleWhatsApp}
            />
            <ShareItem
              icon={Mail}
              iconBg="bg-blue-100"
              iconColor="text-blue-700"
              label="E-mail"
              hint="Abre seu cliente de e-mail"
              onClick={handleEmail}
            />
            <ShareItem
              icon={copied ? Check : LinkIcon}
              iconBg={copied ? 'bg-emerald-100' : 'bg-slate-100'}
              iconColor={copied ? 'text-emerald-600' : 'text-slate-600'}
              label={copied ? 'Link copiado!' : 'Copiar link'}
              hint={copied ? 'Cole onde quiser' : 'Para a área de transferência'}
              onClick={handleCopyLink}
            />
            {hasNativeShare && (
              <ShareItem
                icon={Share2}
                iconBg="bg-violet-100"
                iconColor="text-violet-700"
                label="Mais opções"
                hint="Compartilhamento do sistema"
                onClick={handleNativeShare}
              />
            )}
          </div>
        </div>
      )}

      {/* FAB button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95',
          open
            ? 'bg-slate-700 hover:bg-slate-800 text-white rotate-45'
            : 'bg-blue-700 hover:bg-blue-800 text-white'
        )}
        aria-label="Compartilhar NC"
        aria-expanded={open}
      >
        <Share2 className={cn('h-5 w-5 transition-transform', open && '-rotate-45')} />
      </button>
    </div>
  )
}

interface ShareItemProps {
  icon:       React.ElementType
  iconBg:     string
  iconColor:  string
  label:      string
  hint:       string
  onClick:    () => void
}

function ShareItem({ icon: Icon, iconBg, iconColor, label, hint, onClick }: Readonly<ShareItemProps>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
    >
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', iconBg)}>
        <Icon className={cn('h-4 w-4', iconColor)} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-800">{label}</p>
        <p className="text-[10px] text-slate-400 truncate">{hint}</p>
      </div>
    </button>
  )
}
