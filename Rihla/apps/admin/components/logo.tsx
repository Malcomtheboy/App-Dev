// The Rihla mark in its light or dark variant, following the system theme
// (the dark one keeps the "Rihla" wordmark readable on a dark background).
export function Logo({ className }: { className?: string }) {
  return (
    <picture>
      <source srcSet="/rihla-logo-dark.png" media="(prefers-color-scheme: dark)" />
      <img src="/rihla-logo.png" alt="Rihla" className={className} />
    </picture>
  );
}
