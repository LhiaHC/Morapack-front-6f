// src/components/ui/Dialog.tsx
import * as React from 'react';

function cx(...v:(string|false|null|undefined)[]){ return v.filter(Boolean).join(' ') }

export type DialogProps = {
  open: boolean;
  onOpenChange: (v:boolean)=>void;
  children?: React.ReactNode;
};

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onOpenChange(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onOpenChange]);

  if (!open) return null;

  return (
    <>
      <div aria-hidden onClick={() => onOpenChange(false)} className="fixed inset-0 z-[60] bg-black/40" />
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4">
        <div
          role="dialog"
          aria-modal="true"
          className={cx(
            'w-[min(96vw,48rem)] max-w-[48rem] max-h-[min(90vh,720px)]',
            'bg-white text-neutral-900 rounded-2xl shadow-2xl ring-1 ring-black/5',
            'grid grid-rows-[auto,1fr,auto] overflow-visible' // 👈 importante
          )}
          onClick={(e)=>e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </>
  );
}

export const DialogHeader = ({children}:{children:React.ReactNode}) => (
  <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-3">
    <h2 className="text-2xl font-bold">{children}</h2>
  </div>
);

export const DialogBody = ({children}:{children:React.ReactNode}) => (
  <div className="px-5 sm:px-6 pb-4 overflow-auto min-h-0">{children}</div>
);

// 👇 Footer responsivo, sin recortes
export const DialogFooter = ({children}:{children:React.ReactNode}) => (
  <div className="px-5 sm:px-6 py-3 sm:py-4 border-t bg-white relative z-10">
    <div className="grid gap-3 sm:flex sm:gap-3 sm:items-center">
      {/* grid -> una columna (apila); sm:flex -> fila */}
      {children}
    </div>
  </div>
);
