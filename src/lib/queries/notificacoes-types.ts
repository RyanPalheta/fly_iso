// Shared notification types — no 'server-only', safe for Client Components

export type NotificacaoRow = {
  id: string
  titulo: string
  mensagem: string | null
  tipo: 'info' | 'alerta' | 'erro' | 'sucesso'
  lida: boolean
  entidade: string | null
  entidade_id: string | null
  created_at: string
}
