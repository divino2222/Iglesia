type Props = {
  children: React.ReactNode;
};

export default function PageContainer({ children }: Props) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-stone-50 shadow-[0_0_30px_rgba(0,0,0,0.06)]">
      {children}
    </div>
  );
}