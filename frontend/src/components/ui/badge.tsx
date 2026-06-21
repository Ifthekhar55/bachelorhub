import * as React from 'react'
import { cn } from '../../lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline' | 'secondary'
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(({ className, variant, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
      variant === 'outline' && 'border border-slate-200 bg-white text-slate-700',
      variant === 'secondary' && 'bg-slate-100 text-slate-700',
      !variant && 'bg-slate-100 text-slate-700',
      className
    )}
    {...props}
  />
))
Badge.displayName = 'Badge'

export { Badge }
