import * as React from 'react'
import { cn } from '../../lib/utils'

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('relative inline-flex flex-shrink-0 h-10 w-10 overflow-hidden rounded-full bg-slate-100', className)} {...props} />
))
Avatar.displayName = 'Avatar'

const AvatarFallback = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'absolute inset-0 flex h-full w-full items-center justify-center text-sm text-slate-600',
        className
      )}
      {...props}
    />
  )
)
AvatarFallback.displayName = 'AvatarFallback'

const AvatarImage = React.forwardRef<HTMLImageElement, React.ImgHTMLAttributes<HTMLImageElement>>(
  ({ className, ...props }, ref) => (
    <img
      ref={ref}
      className={cn('relative z-10 block h-full w-full object-cover', className)}
      {...props}
    />
  )
)
AvatarImage.displayName = 'AvatarImage'

export { Avatar, AvatarFallback, AvatarImage }
