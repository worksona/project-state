type Props = {
  kicker?: string;
  title: string;
  description: string;
  meta?: React.ReactNode;
};

export default function PageHeader({ kicker, title, description, meta }: Props) {
  return (
    <header className="border-b border-[var(--border)] pb-6">
      {kicker && (
        <p className="text-xs uppercase tracking-widest text-[var(--accent)] font-semibold">
          {kicker}
        </p>
      )}
      <h1 className="mt-1 text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
        {title}
      </h1>
      <p className="mt-3 max-w-3xl text-base text-slate-600 leading-relaxed">
        {description}
      </p>
      {meta && (
        <div className="mt-4 text-xs text-[var(--muted)]">{meta}</div>
      )}
    </header>
  );
}
