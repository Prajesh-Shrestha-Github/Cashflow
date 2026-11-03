// Bold page header: big display title, optional one-line note, actions on the right.
const PageHeader = ({ title, subtitle, children }) => (
  <header className="mb-6 flex flex-wrap items-center justify-between gap-4 sm:mb-8">
    <div className="min-w-0">
      <h1 className="font-display text-4xl font-extrabold leading-none tracking-[-0.035em] text-ink sm:text-6xl">
        {title}
      </h1>
      {subtitle && <p className="mt-3 max-w-2xl text-base text-ink-mute">{subtitle}</p>}
    </div>
    {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
  </header>
);

export default PageHeader;
