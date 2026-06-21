import * as React from 'react'
import { cn } from '../../lib/utils'

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
}

const Select = ({ value, onValueChange, children, className }: SelectProps) => (
  <div className={cn('inline-block', className)} data-value={value} onClick={() => onValueChange?.(value ?? '')}>
    {children}
  </div>
)

const SelectTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => (
    <button ref={ref} className={cn('inline-flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm', className)} {...props} />
  )
)
SelectTrigger.displayName = 'SelectTrigger'

const SelectContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('mt-2 rounded-xl border border-slate-200 bg-white shadow-sm', className)} {...props} />
  )
)
SelectContent.displayName = 'SelectContent'

interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string
}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, value, ...props }, ref) => (
    <div ref={ref} data-value={value} className={cn('cursor-pointer px-3 py-2 text-sm text-slate-700 hover:bg-slate-100', className)} {...props} />
  )
)
SelectItem.displayName = 'SelectItem'

const SelectValue = ({ children }: { children?: React.ReactNode; placeholder?: string }) => (
  <span>{children}</span>
)

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue }
