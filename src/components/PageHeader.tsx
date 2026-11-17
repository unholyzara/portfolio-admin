import type { ReactNode } from 'react';

interface Props {
  title: string;
  description?: string;
  children?: ReactNode;
}

export function PageHeader({ title, description, children }: Props) {
  return (
    <header className="page-head">
      <div className="page-head__main">
        <h1 className="page-head__title">{title}</h1>
        {description && <p className="page-head__description">{description}</p>}
      </div>
      {children && <div className="page-head__side">{children}</div>}
    </header>
  );
}
