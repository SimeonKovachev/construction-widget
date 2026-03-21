import { SelectHTMLAttributes, forwardRef } from "react";

const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className = "", ...props }, ref) => (
    <select
      ref={ref}
      className={`w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    />
  )
);

Select.displayName = "Select";
export default Select;
