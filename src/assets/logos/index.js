/**
 * Dynamic logo resolver for all brand icons in the logos directory.
 */
const logos = import.meta.glob('./*.png', { eager: true, import: 'default' });

export function getLogoUrl(filename) {
  if (!filename) return null;
  return logos[`./${filename}`] || null;
}
