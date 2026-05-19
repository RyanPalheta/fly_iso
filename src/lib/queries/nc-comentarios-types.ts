// Tipos compartilhados — sem 'server-only', seguros para client components.

export type ComentarioRow = {
  id:         string
  nc_id:      string
  texto:      string
  editado:    boolean
  created_at: string
  updated_at: string
  usuario:    {
    id:         string
    nome:       string
    email:      string
    avatar_url: string | null
  } | null
}
