interface LogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  showText?: boolean;
}

const sizeClasses = {
  xs: "text-lg",
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-3xl",
  xl: "text-4xl",
};

const iconSizes = {
  xs: "w-6 h-6",
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12",
  xl: "w-16 h-16",
};

export function Logo({ size = "md", className = "", showText = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${iconSizes[size]} bg-gradient-to-br from-[#FF6A00] to-[#FF8534] rounded-xl flex items-center justify-center`}>
        <span className="text-white font-bold text-sm">S</span>
      </div>
      {showText && (
        <span className={`${sizeClasses[size]} font-bold text-gray-900`}>SiAnter</span>
      )}
    </div>
  );
}
