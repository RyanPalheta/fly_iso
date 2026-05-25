import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getAuditoria, listRespostas } from '@/lib/queries/auditorias'
import { AuditoriaExec } from '@/components/auditorias/auditoria-exec'

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const a = await getAuditoria(id)
  return { title: a ? `${a.codigo} | Fly ISO` : 'Auditoria | Fly ISO' }
}

export default async function AuditoriaDetailPage({ params }: Props) {
  const { id } = await params
  const [auditoria, respostas] = await Promise.all([getAuditoria(id), listRespostas(id)])
  if (!auditoria) notFound()

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
        <Link href="/auditorias" className="flex items-center gap-1.5 hover:text-blue-700 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Auditorias
        </Link>
        <span>›</span>
        <span className="text-blue-700 font-bold">{auditoria.codigo}</span>
      </nav>

      <AuditoriaExec auditoria={auditoria} respostasIniciais={respostas} />
    </div>
  )
}
