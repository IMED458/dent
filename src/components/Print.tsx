import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Printer } from 'lucide-react';
import { Button, Modal } from './ui';

export function printNow() {
  document.body.classList.add('printing');
  const done = () => {
    document.body.classList.remove('printing');
    window.removeEventListener('afterprint', done);
  };
  window.addEventListener('afterprint', done);
  setTimeout(() => {
    window.print();
    setTimeout(done, 500);
  }, 50);
}

/** ეკრანზე აჩვენებს A4 ფურცელს და ბეჭდავს მხოლოდ მას */
export function PrintPreview({ open, onClose, title, children, extraActions }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; extraActions?: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.title;
    document.title = title;
    return () => {
      document.title = prev;
    };
  }, [open, title]);
  if (!open) return null;
  const root = document.getElementById('print-root');
  return (
    <>
      <Modal
        open
        onClose={onClose}
        title={title}
        size="xl"
        footer={
          <>
            {extraActions}
            <Button onClick={onClose}>დახურვა</Button>
            <Button variant="primary" icon={<Printer className="w-4 h-4" />} onClick={printNow}>
              ბეჭდვა / PDF
            </Button>
          </>
        }
      >
        <div className="bg-slate-200 -m-5 p-4 sm:p-6 overflow-x-auto">{children}</div>
      </Modal>
      {root && createPortal(children, root)}
    </>
  );
}
