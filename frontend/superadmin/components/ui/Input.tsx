import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";

const baseClasses =
  "w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 " +
  "placeholder-slate-400 bg-white " +
  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent " +
  "transition-all duration-150 " +
  "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => (
    <input ref={ref} className={`${baseClasses} ${className}`} {...props} />
  )
);
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className = "", ...props }, ref) => (
  <textarea ref={ref} className={`${baseClasses} resize-y ${className}`} {...props} />
));
Textarea.displayName = "Textarea";

export default Input;
