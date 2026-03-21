import { ButtonHTMLAttributes, forwardRef } from "react";

type IconButtonVariant = "ghost" | "danger-ghost" | "success-ghost" | "warning-ghost";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  size?: "sm" | "md";
}

const variantClasses: Record<IconButtonVariant, string> = {
  ghost:
    "text-slate-400 hover:bg-slate-100 hover:text-slate-600",
  "danger-ghost":
    "text-slate-400 hover:bg-red-50 hover:text-red-500",
  "success-ghost":
    "text-slate-400 hover:bg-green-50 hover:text-green-600",
  "warning-ghost":
    "text-slate-400 hover:bg-yellow-50 hover:text-yellow-600",
};

const sizeClasses = {
  sm: "p-1.5",
  md: "p-2",
};

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ variant = "ghost", size = "md", className = "", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`rounded-lg transition-all duration-150 cursor-pointer active:scale-90 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      />
    );
  }
);

IconButton.displayName = "IconButton";
export default IconButton;
