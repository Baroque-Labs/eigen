type Variant = "primary" | "secondary";

type Props = {
  href: string;
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
};

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-ink text-paper px-6 py-4 text-[15px] font-medium tracking-tight rounded-[4px] hover:bg-ink/90 transition-colors",
  secondary:
    "border border-ink text-ink px-6 py-4 text-[15px] font-medium tracking-tight rounded-[4px] hover:bg-ink hover:text-paper transition-colors",
};

export function CTAButton({
  href,
  variant = "primary",
  children,
  className = "",
}: Props) {
  return (
    <a
      href={href}
      className={`block md:inline-block text-center md:text-left ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </a>
  );
}
