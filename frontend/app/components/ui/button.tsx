import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Button component - Simplified Mast design system button
 *
 * Simplified to 2 primary colorSchemes (brand, black) matching Mast for Webflow.
 * White variant available for dark backgrounds.
 * Size is controlled globally via CSS variables (--component-button-*).
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-[0.4em] whitespace-nowrap py-[var(--component-button-padding-y)] px-[var(--component-button-padding-x)] text-[var(--component-button-font-size)] leading-[var(--component-button-line-height)] font-[var(--component-button-font-weight)] rounded-[var(--component-button-radius)] transition-[background-color,border-color] duration-300 ease-[cubic-bezier(0.165,0.84,0.44,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "border border-transparent",
        secondary: "border bg-transparent",
        ghost: "bg-transparent border-transparent",
      },
      colorScheme: {
        brand: "",
        black: "",
        white: "",
      },
    },
    compoundVariants: [
      // Primary + colorScheme combinations
      { variant: "primary", colorScheme: "brand", className: "bg-brand text-white hover:bg-brand-dark" },
      { variant: "primary", colorScheme: "black", className: "bg-black text-white hover:bg-dark-gray" },
      { variant: "primary", colorScheme: "white", className: "bg-white text-black hover:bg-gray-100" },
      // Secondary + colorScheme combinations
      { variant: "secondary", colorScheme: "brand", className: "border-brand text-brand hover:bg-brand/10" },
      { variant: "secondary", colorScheme: "black", className: "border-black text-black hover:bg-black/10" },
      { variant: "secondary", colorScheme: "white", className: "border-white text-white hover:bg-white/10" },
      // Ghost + colorScheme combinations
      { variant: "ghost", colorScheme: "brand", className: "text-brand hover:bg-brand/10" },
      { variant: "ghost", colorScheme: "black", className: "text-black hover:bg-black/10" },
      { variant: "ghost", colorScheme: "white", className: "text-white hover:bg-white/10" },
    ],
    defaultVariants: {
      variant: "primary",
      colorScheme: "brand",
    },
  }
)

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, colorScheme, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, colorScheme, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
