import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-[0.4em] whitespace-nowrap font-normal transition-[background-color,border-color] duration-300 ease-[cubic-bezier(0.165,0.84,0.44,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "border border-transparent",
        secondary: "border bg-transparent",
        ghost: "bg-transparent border-transparent",
        // Default shadcn variants kept for compatibility
        default: "bg-foreground text-background hover:opacity-90",
        destructive: "bg-red-500 text-white hover:bg-red-600",
        outline: "border border-foreground text-foreground hover:bg-foreground hover:text-background",
        link: "text-foreground underline-offset-4 hover:underline",
      },
      colorScheme: {
        brand: "",
        black: "",
        blue: "",
        white: "",
      },
      size: {
        sm: "py-[0.5em] px-[0.75em] text-sm",
        md: "py-[0.7em] px-[1em] text-base leading-[1.3em]",
        lg: "py-[0.8em] px-[1.2em] text-lg",
        icon: "h-10 w-10",
      },
      rounded: {
        md: "rounded-[0.5rem]",
        lg: "rounded-lg",
        full: "rounded-full",
        none: "rounded-none",
      },
    },
    compoundVariants: [
      // Primary + colorScheme combinations
      { variant: "primary", colorScheme: "brand", className: "bg-brand text-white hover:bg-brand-dark" },
      { variant: "primary", colorScheme: "black", className: "bg-black text-white hover:bg-dark-gray" },
      { variant: "primary", colorScheme: "blue", className: "bg-blue text-white hover:bg-blue-600" },
      { variant: "primary", colorScheme: "white", className: "bg-white text-black hover:bg-gray-100" },
      // Secondary + colorScheme combinations
      { variant: "secondary", colorScheme: "brand", className: "border-brand text-brand hover:bg-brand/10" },
      { variant: "secondary", colorScheme: "black", className: "border-black text-black hover:bg-black/10" },
      { variant: "secondary", colorScheme: "blue", className: "border-blue text-blue hover:bg-blue/10" },
      { variant: "secondary", colorScheme: "white", className: "border-white text-white hover:bg-white/10" },
      // Ghost + colorScheme combinations
      { variant: "ghost", colorScheme: "brand", className: "text-brand hover:bg-brand/10" },
      { variant: "ghost", colorScheme: "black", className: "text-black hover:bg-black/10" },
      { variant: "ghost", colorScheme: "blue", className: "text-blue hover:bg-blue/10" },
      { variant: "ghost", colorScheme: "white", className: "text-white hover:bg-white/10" },
    ],
    defaultVariants: {
      variant: "primary",
      colorScheme: "brand",
      size: "md",
      rounded: "md",
    },
  }
)

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, colorScheme, size, rounded, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, colorScheme, size, rounded, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
