// Consistent, bold page header: small eyebrow, big display title, optional actions on the right.
const PageHeader = ({ eyebrow, title, subtitle, children }) => (
  <header className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
    <div className="min-w-0">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="mt-1 font-display text-4xl font-extrabold leading-none tracking-[-0.035em] text-ink sm:text-6xl">
        {title}
      </h1>
      {subtitle && <p className="mt-3 max-w-2xl text-base text-ink-mute">{subtitle}</p>}
    </div>
    {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
  </header>
);

export default PageHeader;
