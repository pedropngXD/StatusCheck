const logos = import.meta.glob('./*.{png,svg}', { eager: true, import: 'default' });

export function getLogoUrl(filename) {
  if (!filename) return null;
  if (filename.startsWith('http://') || filename.startsWith('https://')) {
    return filename;
  }
  return logos[`./${filename}`] || null;
}
