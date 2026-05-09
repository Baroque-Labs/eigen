type Props = {
  title: string;
  children: React.ReactNode;
  prominent?: boolean;
};

export function ChartCard({ title, children, prominent = false }: Props) {
  return (
    <div className={`border border-ink p-4 ${prominent ? "bg-paper" : "bg-paper"}`}>
      <div className="flex items-baseline justify-between mb-3">
        <span className="font-serif text-[20px] leading-none">{title}</span>
      </div>
      {children}
    </div>
  );
}
