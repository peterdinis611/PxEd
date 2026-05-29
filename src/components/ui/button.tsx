import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'interactive inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/80 focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-900 disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      variant: {
        default:
          'bg-blue-600 text-white shadow-sm shadow-blue-900/30 hover:bg-blue-500 hover:shadow-blue-800/40',
        destructive:
          'bg-red-600/90 text-white hover:bg-red-500',
        outline:
          'border border-zinc-600/80 bg-zinc-800/50 text-zinc-100 hover:border-zinc-500 hover:bg-zinc-700/80',
        secondary:
          'bg-zinc-700/80 text-zinc-100 hover:bg-zinc-600/90',
        ghost:
          'text-zinc-300 hover:bg-zinc-700/60 hover:text-zinc-100',
        link: 'text-blue-400 underline-offset-4 hover:text-blue-300 hover:underline',
      },
      size: {
        default: 'h-8 px-3 py-1 text-ui-sm',
        sm: 'h-7 rounded px-2 text-ui-xs',
        lg: 'h-9 rounded px-6 text-ui-sm',
        icon: 'h-7 w-7',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
