import * as React from "react"

import { cn } from "@/lib/utils"

export interface SwitchProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    return (
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          className="sr-only peer"
          ref={ref}
          {...props}
        />
        <div className={cn(
          "w-11 h-6 bg-zinc-200 rounded-full peer peer-checked:bg-indigo-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 transition-colors",
          className
        )} />
        <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5 shadow" />
      </label>
    )
  }
)
Switch.displayName = "Switch"

export { Switch }
