import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "",
        secondary: "border-2 bg-transparent",
        ghost: "bg-transparent",
        // Default shadcn variants kept for compatibility
        default: "bg-black text-white hover:bg-gray-800",
        destructive: "bg-red-500 text-white hover:bg-red-600",
        outline: "border-2 border-black text-black hover:bg-black hover:text-white",
        link: "text-black underline-offset-4 hover:underline",
      },
      colorScheme: {
        black: "",
        brand: "",
        blue: "",
        white: "",
      },
      size: {
        sm: "py-2 px-4 text-sm",
        md: "py-3 px-6 text-base",
        lg: "py-4 px-8 text-lg",
        icon: "h-10 w-10",
      },
      rounded: {
        full: "rounded-full",
        md: "rounded-md",
        lg: "rounded-lg",
        none: "rounded-none",
      },
    },
    compoundVariants: [
      // Primary + colorScheme combinations
      { variant: "primary", colorScheme: "black", className: "bg-black text-white hover:bg-gray-800" },
      { variant: "primary", colorScheme: "brand", className: "bg-brand text-white hover:bg-orange-600" },
      { variant: "primary", colorScheme: "blue", className: "bg-blue text-white hover:bg-blue-700" },
      { variant: "primary", colorScheme: "white", className: "bg-white text-black hover:bg-gray-100" },
      // Secondary + colorScheme combinations
      { variant: "secondary", colorScheme: "black", className: "border-black text-black hover:bg-black hover:text-white" },
      { variant: "secondary", colorScheme: "brand", className: "border-brand text-brand hover:bg-brand hover:text-white" },
      { variant: "secondary", colorScheme: "blue", className: "border-blue text-blue hover:bg-blue hover:text-white" },
      { variant: "secondary", colorScheme: "white", className: "border-white text-white hover:bg-white hover:text-black" },
      // Ghost + colorScheme combinations
      { variant: "ghost", colorScheme: "black", className: "text-black hover:bg-black/10" },
      { variant: "ghost", colorScheme: "brand", className: "text-brand hover:bg-brand/10" },
      { variant: "ghost", colorScheme: "blue", className: "text-blue hover:bg-blue/10" },
      { variant: "ghost", colorScheme: "white", className: "text-white hover:bg-white/10" },
    ],
    defaultVariants: {
      variant: "primary",
      colorScheme: "black",
      size: "md",
      rounded: "full",
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
