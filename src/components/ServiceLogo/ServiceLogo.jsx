import { getLogoUrl } from '../../assets/logos';

export default function ServiceLogo({ provider, className = 'w-9 h-9' }) {
  const logoSrc = getLogoUrl(provider.logo);

  return (
    <div
      className={`${className} p-1.5 rounded-[var(--radius-sm)] bg-white flex items-center justify-center shrink-0 shadow-[var(--logo-wrapper-shadow)] border border-[var(--logo-wrapper-border)] overflow-hidden`}
    >
      {logoSrc ? (
        <img
          src={logoSrc}
          alt={`${provider.name} logo`}
          className="w-full h-full object-contain block"
          loading="lazy"
        />
      ) : (
        <span className="text-[0.75rem] font-bold text-[#1d1d1f] uppercase">{provider.name.charAt(0)}</span>
      )}
    </div>
  );
}

