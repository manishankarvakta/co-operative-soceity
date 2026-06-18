// This layout intentionally has no sidebar, header, or any chrome.
// Pages inside (print)/ render clean for printing.
export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
