import * as React from "react"
import { Slot } from "@radix-ui/react-slot"

import { cn } from "@/lib/utils"

// Mast button variant classes - primary is default (no class needed)
const variantClasses = {
  primary: '',
  secondary: 'cc-secondary',
  ghost: 'cc-ghost',
} as const

// Mast button color classes - brand is default (no class needed)
const colorClasses = {
  brand: '',
  black: 'cc-black',
  blue: 'cc-blue',
  white: 'cc-white',
} as const

// Mast button size classes - md is default (no class needed)
const sizeClasses = {
  sm: 'cc-sm',
  md: '',
  lg: 'cc-lg',
} as const

export type ButtonVariant = keyof typeof variantClasses
export type ButtonColor = keyof typeof colorClasses
export type ButtonSize = keyof typeof sizeClasses

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  variant?: ButtonVariant
  colorScheme?: ButtonColor
  size?: ButtonSize
  asChild?: boolean
  icon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant = 'primary',
    colorScheme = 'brand',
    size = 'md',
    asChild = false,
    icon,
    children,
    ...props
  }, ref) => {
    const Comp = asChild ? Slot : "button"

    const buttonClassName = cn(
      'button',
      variantClasses[variant],
      colorClasses[colorScheme],
      sizeClasses[size],
      className
    )

    // If asChild, render as Slot for composition
    if (asChild) {
      return (
        <Comp
          className={buttonClassName}
          ref={ref}
          {...props}
        >
          {children}
        </Comp>
      )
    }

    return (
      <Comp
        className={buttonClassName}
        ref={ref}
        {...props}
      >
        <span className="btn-text">{children}</span>
        {icon && (
          <span className="btn-icon">
            <span className="icon">{icon}</span>
          </span>
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, variantClasses, colorClasses, sizeClasses }
