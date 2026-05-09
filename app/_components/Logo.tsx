import Link from "next/link";

type LogoProps = {
  size?: "sm" | "md";
  href?: string;
  className?: string;
};

const SIZES = {
  sm: { mark: "text-3xl", word: "text-2xl" },
  md: { mark: "text-3xl", word: "text-2xl" },
};

export function Logo({ size = "md", href, className = "" }: LogoProps) {
  const s = SIZES[size];
  const inner = (
    <>
      <span className={`font-serif ${s.mark} leading-none`}>λ</span>
      <span className={`font-serif ${s.word} leading-none tracking-tight`}>
        Eigen
      </span>
    </>
  );
  const classes = `flex items-baseline gap-3 ${className}`;
  if (href) {
    return (
      <Link href={href} className={classes}>
        {inner}
      </Link>
    );
  }
  return <div className={classes}>{inner}</div>;
}
