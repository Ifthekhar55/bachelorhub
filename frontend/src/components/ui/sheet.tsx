import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '../../lib/utils'

interface AsChildProps {
  asChild?: boolean
  children: React.ReactNode
}

const Sheet = ({ children }: { children: React.ReactNode }) => <div>{children}</div>

const SheetTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & AsChildProps>(
  ({ asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp ref={ref} {...props}>
        {children}
      </Comp>
    )
  }
)
SheetTrigger.displayName = 'SheetTrigger'

interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: 'left' | 'right' | 'top' | 'bottom'
}

const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ className, side, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('fixed inset-0 z-50 overflow-auto bg-white p-4', className)}
      data-side={side}
      {...props}
    />
  )
)
SheetContent.displayName = 'SheetContent'

const SheetHeader = ({ children }: { children: React.ReactNode }) => <div className="mb-4">{children}</div>
const SheetTitle = ({ children }: { children: React.ReactNode }) => <h2 className="text-xl font-semibold">{children}</h2>

export { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger }
