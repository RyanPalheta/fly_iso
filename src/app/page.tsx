import { redirect } from 'next/navigation'

// Redireciona raiz → /dashboard (middleware cuida de auth)
export default function RootPage() {
  redirect('/dashboard')
}
