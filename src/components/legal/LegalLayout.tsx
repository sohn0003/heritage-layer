import { ReactNode } from 'react';

interface Props {
  title: string;
  updated?: string;
  children: ReactNode;
}

const LegalLayout = ({ title, updated = '2026-05-16', children }: Props) => (
  <div className="min-h-screen bg-background pt-24 pb-20">
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
      <header className="mb-10 border-b pb-6">
        <h1 className="font-display text-4xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">최종 업데이트: {updated}</p>
      </header>
      <article className="prose prose-neutral max-w-none text-foreground [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_p]:my-3 [&_p]:leading-relaxed [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:my-1 [&_a]:text-primary [&_a]:underline">
        {children}
      </article>
    </div>
  </div>
);

export default LegalLayout;
