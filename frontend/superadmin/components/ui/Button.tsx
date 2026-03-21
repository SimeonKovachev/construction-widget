import { ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md shadow-blue-600/25 " +
    "hover:brightness-110 hover:shadow-lg hover:shadow-blue-600/30 " +
    "active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100 disabled:hover:shadow-md",
  secondary:
    "bg-slate-800 text-white shadow-sm " +
    "hover:bg-slate-900 hover:shadow-md " +
    "active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed",
  danger:
    "bg-red-600 text-white shadow-sm shadow-red-600/20 " +
    "hover:bg-red-700 hover:shadow-md hover:shadow-red-600/25 " +
    "active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed",
  ghost:
    "bg-transparent text-slate-600 " +
    "hover:bg-slate-100 hover:text-slate-900 " +
    "active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5 rounded-lg",
  md: "px-4 py-2.5 text-sm gap-2 rounded-xl",
  lg: "px-6 py-3 text-sm gap-2 rounded-xl",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, children, className = "", disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center font-semibold transition-all duration-150 cursor-pointer select-none ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {loading && (
          <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin flex-shrink-0" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
