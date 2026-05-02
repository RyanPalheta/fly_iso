'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Modulo, ModuloPermissao, Perfil } from '@/types/database'

export function usePermission() {
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPerfil = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from('usuarios')
        .select('perfil_id, perfis(*)')
        .eq('id', user.id)
        .single()

      if (data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const perfilData = (data as any).perfis
        if (perfilData) setPerfil(perfilData as Perfil)
      }
      setLoading(false)
    }
    fetchPerfil()
  }, [])

  const can = (modulo: Modulo, acao: ModuloPermissao): boolean => {
    if (!perfil) return false
    const permissoes = perfil.permissoes as Record<string, string[]>
    return permissoes[modulo]?.includes(acao) ?? false
  }

  const isAdmin = (): boolean => {
    return perfil?.nome === 'Admin'
  }

  const isAdminOrQualidade = (): boolean => {
    return perfil?.nome === 'Admin' || perfil?.nome === 'Qualidade'
  }

  return { can, isAdmin, isAdminOrQualidade, perfil, loading }
}
