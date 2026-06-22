export default function MicrofinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-7xl mx-auto w-full p-4 md:p-6 lg:p-8">
      {children}
    </div>
  );
}
