export default function ExternalLinkButton({ href, name }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center w-7 h-7 rounded-[var(--radius-sm)] text-[var(--text-secondary)] bg-[rgba(142,142,147,0.08)] border border-[var(--border-subtle)] no-underline shrink-0 transition-all duration-[180ms] ease-out hover:!bg-[rgba(142,142,147,0.22)] hover:!border-[var(--text-secondary)] hover:!text-[var(--text-primary)] active:scale-[0.92] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--text-primary)]"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      aria-label={`Open official status page for ${name}`}
      title={`Open official status page for ${name}`}
    >
      <svg
        className="w-[13px] h-[13px]"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 9v3.5a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 2 12.5v-7A1.5 1.5 0 0 1 3.5 4H7" />
        <path d="M10 2h4v4" />
        <path d="M7 9L14 2" />
      </svg>
    </a>
  );
}

