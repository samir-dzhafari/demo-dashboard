import type { ButtonHTMLAttributes } from 'react'
import { cn } from './cn'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'sm' | 'md'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const VARIANTS: Record<Variant, string> = {
  primary: 'border-transparent bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50',
  ghost: 'border-transparent bg-transparent text-slate-600 hover:bg-slate-100',
}

const SIZES: Record<Size, string> = {
  sm: 'h-7 px-2.5 text-xs',
  md: 'h-8 px-3 text-[13px]',
}

export const Button = ({ variant = 'secondary', size = 'md', className, type = 'button', ...rest }: ButtonProps) => (
  <button
    type={type}
    className={cn(
      'inline-flex items-center justify-center gap-1.5 rounded-lg border font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-50',
      VARIANTS[variant],
      SIZES[size],
      className,
    )}
    {...rest}
  />
)
