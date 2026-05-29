import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'
import { cn } from '@/lib/utils'

const sliderVariants = {
  default: {
    track: 'h-1',
    thumb: 'h-4 w-4',
  },
  lg: {
    track: 'h-2',
    thumb: 'h-5 w-5',
  },
} as const

export type SliderSize = keyof typeof sliderVariants

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
    size?: SliderSize
  }
>(({ className, size = 'default', ...props }, ref) => {
  const v = sliderVariants[size]
  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        'relative flex w-full touch-none select-none items-center',
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        className={cn(
          'relative w-full grow overflow-hidden rounded-full bg-zinc-700/80',
          v.track,
        )}
      >
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-150" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className={cn(
          'interactive block rounded-full border-2 border-zinc-900 bg-zinc-100 shadow-md shadow-black/30 transition-shadow hover:shadow-blue-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/80 focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-900',
          v.thumb,
        )}
      />
    </SliderPrimitive.Root>
  )
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
