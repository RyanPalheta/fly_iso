/**
 * Fly ISO — Tipos do banco Supabase (public schema)
 * Gerado manualmente a partir de supabase/migrations/001_initial_schema.sql
 * Para regenerar via CLI: supabase login && npx supabase gen types typescript --project-id djcnzobjjmzevxstopuj --schema public
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// ── Enums lógicos (armazenados como VARCHAR) ──
export type DocumentoTipo = 'Manual' | 'Procedimento' | 'Instrucao' | 'Formulario' | 'Politica' | 'Registro'
/** ISO 9001 — Fluxo de status do documento:
 *  rascunho → em_revisao → aprovado → vigente → obsoleto */
export type DocumentoStatus = 'rascunho' | 'em_revisao' | 'aprovado' | 'vigente' | 'obsoleto'
export type VersaoStatus = 'pendente' | 'em_revisao' | 'aprovado' | 'rejeitado'
export type NCSeveridade = 'menor' | 'maior' | 'critica'
export type NCOrigem = 'auditoria_interna' | 'auditoria_externa' | 'cliente' | 'processo' | 'indicador'
export type NCStatus = 'registrada' | 'em_analise' | 'em_acao' | 'verificacao' | 'encerrada'
/** Tipo de ação para NC (definido no registro inicial — req. auditor) */
export type NCTipoAcao = 'corretiva' | 'preventiva'
export type CapaTipo = 'corretiva' | 'preventiva'
export type CapaStatus = 'aberta' | 'em_investigacao' | 'plano_definido' | 'em_execucao' | 'verificacao' | 'encerrada' | 'reaberta'
/** Status real persistido + 'atrasada' (calculado em runtime quando prazo vencido) */
export type AcaoStatus = 'pendente' | 'em_andamento' | 'concluida' | 'cancelada'
export type AcaoStatusEfetivo = AcaoStatus | 'atrasada'
export type PerfilNome = 'Admin' | 'Qualidade' | 'Lider' | 'Usuario' | 'Auditor'

// ── Matriz de permissões (perfis.permissoes JSONB) ──
export type Modulo =
  | 'documentos' | 'treinamentos' | 'nc' | 'capa' | 'indicadores'
  | 'registros' | 'reunioes' | 'usuarios' | 'importacao'

export type ModuloPermissao =
  | 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'close'
  | 'verify' | 'execute' | 'accept' | 'export' | 'view_self'

export interface Database {
  public: {
    Tables: {
      unidades: {
        Row: { id: string; nome: string; codigo: string | null; ativa: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; nome: string; codigo?: string | null; ativa?: boolean }
        Update: Partial<Database['public']['Tables']['unidades']['Insert']>
      }
      areas: {
        Row: { id: string; nome: string; unidade_id: string | null; created_at: string }
        Insert: { id?: string; nome: string; unidade_id?: string | null }
        Update: Partial<Database['public']['Tables']['areas']['Insert']>
      }
      perfis: {
        Row: { id: string; nome: PerfilNome; descricao: string | null; permissoes: Json; created_at: string }
        Insert: { id?: string; nome: PerfilNome; descricao?: string | null; permissoes?: Json }
        Update: Partial<Database['public']['Tables']['perfis']['Insert']>
      }
      usuarios: {
        Row: { id: string; nome: string; email: string; perfil_id: string | null; ativo: boolean; avatar_url: string | null; created_at: string; updated_at: string }
        Insert: { id: string; nome: string; email: string; perfil_id?: string | null; ativo?: boolean; avatar_url?: string | null }
        Update: Partial<Database['public']['Tables']['usuarios']['Insert']>
      }
      usuario_unidades: {
        Row: { usuario_id: string; unidade_id: string }
        Insert: { usuario_id: string; unidade_id: string }
        Update: Partial<Database['public']['Tables']['usuario_unidades']['Insert']>
      }
      documentos: {
        Row: {
          id: string; codigo: string; titulo: string; tipo: DocumentoTipo | null; descricao: string | null
          area_id: string | null; responsavel_id: string | null; status: DocumentoStatus
          revisao_atual: number; tags: string[] | null; created_at: string; updated_at: string
        }
        Insert: {
          id?: string; codigo: string; titulo: string; tipo?: DocumentoTipo | null; descricao?: string | null
          area_id?: string | null; responsavel_id?: string | null; status?: DocumentoStatus
          revisao_atual?: number; tags?: string[] | null
        }
        Update: Partial<Database['public']['Tables']['documentos']['Insert']>
      }
      versoes: {
        Row: {
          id: string; documento_id: string | null; numero_revisao: number; arquivo_url: string | null
          arquivo_nome: string | null; descricao_alteracao: string | null; criado_por: string | null
          aprovado_por: string | null; aprovado_em: string | null; status: VersaoStatus
          comentarios: string | null; created_at: string
        }
        Insert: {
          id?: string; documento_id?: string | null; numero_revisao: number; arquivo_url?: string | null
          arquivo_nome?: string | null; descricao_alteracao?: string | null; criado_por?: string | null
          aprovado_por?: string | null; aprovado_em?: string | null; status?: VersaoStatus
          comentarios?: string | null
        }
        Update: Partial<Database['public']['Tables']['versoes']['Insert']>
      }
      distribuicao: {
        Row: { id: string; versao_id: string | null; usuario_id: string | null; lido: boolean; lido_em: string | null; created_at: string }
        Insert: { id?: string; versao_id?: string | null; usuario_id?: string | null; lido?: boolean; lido_em?: string | null }
        Update: Partial<Database['public']['Tables']['distribuicao']['Insert']>
      }
      nao_conformidades: {
        Row: {
          id: string; codigo: string; titulo: string; descricao: string
          area_id: string | null; documento_id: string | null; indicador_id: string | null
          detectado_por: string | null; responsavel_id: string | null
          severidade: NCSeveridade | null; origem: NCOrigem | null; status: NCStatus
          evidencia_urls: Json; requisito_violado: string | null
          tipo_acao: NCTipoAcao; acao_imediata: string | null
          created_at: string; updated_at: string; encerrada_em: string | null
        }
        Insert: {
          id?: string; codigo: string; titulo: string; descricao: string
          area_id?: string | null; documento_id?: string | null; indicador_id?: string | null
          detectado_por?: string | null; responsavel_id?: string | null
          severidade?: NCSeveridade | null; origem?: NCOrigem | null; status?: NCStatus
          evidencia_urls?: Json; requisito_violado?: string | null
          tipo_acao?: NCTipoAcao; acao_imediata?: string | null
          encerrada_em?: string | null
        }
        Update: Partial<Database['public']['Tables']['nao_conformidades']['Insert']>
      }
      capas: {
        Row: {
          id: string; codigo: string; nc_id: string | null; tipo: CapaTipo; descricao: string | null
          responsavel_id: string | null; causa_raiz_metodo: string | null; causa_raiz_dados: Json
          status: CapaStatus; prazo_geral: string | null
          created_at: string; updated_at: string; encerrada_em: string | null
        }
        Insert: {
          id?: string; codigo: string; nc_id?: string | null; tipo: CapaTipo; descricao?: string | null
          responsavel_id?: string | null; causa_raiz_metodo?: string | null; causa_raiz_dados?: Json
          status?: CapaStatus; prazo_geral?: string | null; encerrada_em?: string | null
        }
        Update: Partial<Database['public']['Tables']['capas']['Insert']>
      }
      acoes: {
        Row: {
          id: string; capa_id: string | null; descricao: string; responsavel_id: string | null
          prazo: string | null; status: AcaoStatus; evidencia_urls: Json
          concluida_em: string | null; created_at: string; updated_at: string
        }
        Insert: {
          id?: string; capa_id?: string | null; descricao: string; responsavel_id?: string | null
          prazo?: string | null; status?: AcaoStatus; evidencia_urls?: Json; concluida_em?: string | null
        }
        Update: Partial<Database['public']['Tables']['acoes']['Insert']>
      }
      indicadores: {
        Row: {
          id: string; codigo: string | null; nome: string; descricao: string | null
          formula: string | null; unidade_medida: string | null; meta: number | null
          frequencia: string | null; area_id: string | null; responsavel_id: string | null
          gerar_nc_abaixo_meta: boolean; ativo: boolean
          created_at: string; updated_at: string
        }
        Insert: {
          id?: string; codigo?: string | null; nome: string; descricao?: string | null
          formula?: string | null; unidade_medida?: string | null; meta?: number | null
          frequencia?: string | null; area_id?: string | null; responsavel_id?: string | null
          gerar_nc_abaixo_meta?: boolean; ativo?: boolean
        }
        Update: Partial<Database['public']['Tables']['indicadores']['Insert']>
      }
      reunioes: {
        Row: { id: string; titulo: string; data: string; status: string; ata: string | null; participantes: string[]; created_by: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; titulo: string; data: string; status?: string; ata?: string | null; participantes?: string[]; created_by?: string | null }
        Update: Partial<Database['public']['Tables']['reunioes']['Insert']>
      }
      registros: {
        Row: {
          id: string; titulo: string; tipo: string | null; politica_id: string | null
          documento_id: string | null; area_id: string | null; responsavel_id: string | null
          arquivo_url: string | null; status: string
          data_criacao: string; data_arquivamento: string | null; data_descarte: string | null
          created_at: string; updated_at: string
        }
        Insert: {
          id?: string; titulo: string; tipo?: string | null; politica_id?: string | null
          documento_id?: string | null; area_id?: string | null; responsavel_id?: string | null
          arquivo_url?: string | null; status?: string
          data_criacao?: string; data_arquivamento?: string | null; data_descarte?: string | null
        }
        Update: Partial<Database['public']['Tables']['registros']['Insert']>
      }
      audit_log: {
        Row: {
          id: string; usuario_id: string | null; acao: string; entidade: string
          entidade_id: string | null; dados_anteriores: Json | null; dados_novos: Json | null
          ip_address: string | null; user_agent: string | null; created_at: string
        }
        Insert: {
          id?: string; usuario_id?: string | null; acao: string; entidade: string
          entidade_id?: string | null; dados_anteriores?: Json | null; dados_novos?: Json | null
          ip_address?: string | null; user_agent?: string | null
        }
        Update: Partial<Database['public']['Tables']['audit_log']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: {
      is_admin_or_qualidade: { Args: Record<string, never>; Returns: boolean }
      minha_unidades: { Args: Record<string, never>; Returns: string[] }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

export type Unidade = Tables<'unidades'>
export type Area = Tables<'areas'>
export type Perfil = Tables<'perfis'>
export type Usuario = Tables<'usuarios'>
export type Documento = Tables<'documentos'>
export type Versao = Tables<'versoes'>
export type NaoConformidade = Tables<'nao_conformidades'>
export type Capa = Tables<'capas'>
export type Acao = Tables<'acoes'>
export type Indicador = Tables<'indicadores'>
