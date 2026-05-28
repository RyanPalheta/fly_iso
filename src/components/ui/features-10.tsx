import { Card, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

interface FeatureCardProps {
  children: ReactNode
  className?: string
}

export const FeatureCard = ({ children, className }: FeatureCardProps) => (
  <Card className={cn('group relative rounded-none shadow-zinc-950/5', className)}>
    <CardDecorator />
    {children}
  </Card>
)

export const CardDecorator = () => (
  <>
    <span className="border-primary absolute -left-px -top-px block size-2 border-l-2 border-t-2"></span>
    <span className="border-primary absolute -right-px -top-px block size-2 border-r-2 border-t-2"></span>
    <span className="border-primary absolute -bottom-px -left-px block size-2 border-b-2 border-l-2"></span>
    <span className="border-primary absolute -bottom-px -right-px block size-2 border-b-2 border-r-2"></span>
  </>
)

interface CardHeadingProps {
  icon: LucideIcon
  title: string
  description: string
}

export const CardHeading = ({ icon: Icon, title, description }: CardHeadingProps) => (
  <div className="diff10-heading">
    <span className="diff10-eyebrow">
      <Icon className="size-4" />
      {title}
    </span>
    <p className="diff10-desc">{description}</p>
  </div>
)

export { Card, CardHeader }
