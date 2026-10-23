import type { ReactNode } from "react";

interface PaneHeaderProps {
  id: string;
  index: string;
  title: string;
  meta: string;
  children?: ReactNode;
}

export function PaneHeader({ id, index, title, meta, children }: PaneHeaderProps) {
  return (
    <header className="pane-head">
      <span className="pane-head__index" aria-hidden="true">
        {index}
      </span>
      <h2 className="pane-head__title" id={id}>
        {title}
      </h2>
      <span className="pane-head__meta">{meta}</span>
      {children}
    </header>
  );
}
