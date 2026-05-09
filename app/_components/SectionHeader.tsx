import { MonoLabel } from "./MonoLabel";

type Props = {
  label: string;
  title: React.ReactNode;
  tone?: "ink" | "paper";
  titleSize?: "default" | "lg";
  titleMaxCh?: number;
};

export function SectionHeader({
  label,
  title,
  tone = "ink",
  titleSize = "default",
  titleMaxCh,
}: Props) {
  const sizeClass =
    titleSize === "lg"
      ? "text-[48px] md:text-[96px] leading-[0.95]"
      : "text-[44px] md:text-[80px] leading-[0.98]";
  const maxStyle =
    titleMaxCh !== undefined ? { maxWidth: `${titleMaxCh}ch` } : undefined;
  return (
    <>
      <MonoLabel tone={tone} className="mb-10 block">
        {label}
      </MonoLabel>
      <h2 className={`font-display ${sizeClass}`} style={maxStyle}>
        {title}
      </h2>
    </>
  );
}
