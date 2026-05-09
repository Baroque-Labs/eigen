// The repeating uppercase tracked label used as a section eyebrow and
// throughout the demo. Wraps the recurring class string so an agent can
// edit "the label style" in one place.

type Tone = "ink" | "paper";

type Props = {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
};

const TONE = {
  ink: "text-ink/60",
  paper: "text-paper/60",
};

export function MonoLabel({ children, tone = "ink", className = "" }: Props) {
  return (
    <span
      className={`font-mono text-[11px] uppercase tracking-[0.18em] ${TONE[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
