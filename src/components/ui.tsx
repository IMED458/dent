import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { cls } from '../lib/utils';

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';

export function Button({
  variant = 'secondary',
  size = 'md',
  loading,
  icon,
  className,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BtnVariant;
  size?: 'sm' | 'md';
  loading?: boolean;
  icon?: React.ReactNode;
}) {
  const v: Record<BtnVariant, string> = {
    primary: 'bg-teal-600 text-white hover:bg-teal-700 border-teal-600',
    secondary: 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 border-transparent',
    danger: 'bg-white text-red-600 hover:bg-red-50 border-red-200',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600',
  };
  return (
    <button
      type="button"
      {...rest}
      disabled={rest.disabled || loading}
      className={cls(
        'inline-flex items-center justify-center gap-1.5 rounded-lg border font-medium transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap',
        size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-2 text-sm',
        v[variant],
        className,
      )}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}

export function Field({
  label,
  required,
  hint,
  error,
  className,
  children,
}: {
  label?: React.ReactNode;
  required?: boolean;
  hint?: React.ReactNode;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cls('block', className)}>
      {label && (
        <span className="block text-xs font-semibold text-slate-600 mb-1">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </span>
      )}
      {children}
      {error ? (
        <span className="block text-xs text-red-600 mt-1">{error}</span>
      ) : hint ? (
        <span className="block text-xs text-slate-400 mt-1">{hint}</span>
      ) : null}
    </label>
  );
}

export const inputCls =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 disabled:bg-slate-50 disabled:text-slate-500';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...p }, ref) => <input ref={ref} {...p} className={cls(inputCls, className)} />,
);

export function Select({ className, children, ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...p} className={cls(inputCls, 'pr-8', className)}>
      {children}
    </select>
  );
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...p }, ref) => <textarea ref={ref} rows={3} {...p} className={cls(inputCls, 'resize-y leading-relaxed', className)} />,
);

export function Card({ title, actions, className, children, bodyClass }: { title?: React.ReactNode; actions?: React.ReactNode; className?: string; bodyClass?: string; children: React.ReactNode }) {
  return (
    <section className={cls('bg-white rounded-xl border border-slate-200 shadow-sm', className)}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          <div className="flex items-center gap-2 flex-wrap justify-end">{actions}</div>
        </header>
      )}
      <div className={cls('p-4', bodyClass)}>{children}</div>
    </section>
  );
}

export function Badge({ color = 'slate', children, className }: { color?: 'slate' | 'teal' | 'amber' | 'red' | 'blue' | 'green' | 'violet'; children: React.ReactNode; className?: string }) {
  const c = {
    slate: 'bg-slate-100 text-slate-700',
    teal: 'bg-teal-50 text-teal-700 ring-teal-200',
    amber: 'bg-amber-50 text-amber-800 ring-amber-200',
    red: 'bg-red-50 text-red-700 ring-red-200',
    blue: 'bg-sky-50 text-sky-700 ring-sky-200',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    violet: 'bg-violet-50 text-violet-700 ring-violet-200',
  }[color];
  return <span className={cls('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-transparent', c, className)}>{children}</span>;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  const w = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl', xl: 'max-w-6xl', full: 'max-w-[1400px]' }[size];
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/50 p-2 sm:p-6 overflow-y-auto no-print" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={cls('w-full bg-white rounded-xl shadow-2xl flex flex-col max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-3rem)]', w)}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 shrink-0">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100" aria-label="დახურვა">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-slate-200 flex justify-end gap-2 flex-wrap shrink-0 bg-slate-50 rounded-b-xl">{footer}</div>}
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, text, action }: { icon?: React.ReactNode; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="text-center py-10 px-4">
      {icon && <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">{icon}</div>}
      <p className="font-medium text-slate-700">{title}</p>
      {text && <p className="text-sm text-slate-500 mt-1">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: React.ReactNode; icon?: React.ReactNode; count?: number }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-slate-200 no-print">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cls(
            'flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition',
            value === t.id ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-800',
          )}
        >
          {t.icon}
          {t.label}
          {t.count ? <span className="ml-0.5 rounded-full bg-slate-100 px-1.5 text-[11px] text-slate-600">{t.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

// ---------- Toasts & confirm ----------

type Toast = { id: number; kind: 'ok' | 'err' | 'info'; text: string };
type ConfirmReq = { title: string; text?: string; danger?: boolean; okLabel?: string; input?: string; resolve: (v: string | boolean | null) => void };

const UiCtx = createContext<{
  toast: (text: string, kind?: Toast['kind']) => void;
  confirm: (o: { title: string; text?: string; danger?: boolean; okLabel?: string }) => Promise<boolean>;
  prompt: (o: { title: string; text?: string; okLabel?: string }) => Promise<string | null>;
}>(null as any);

export const useUi = () => useContext(UiCtx);

export function UiProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [req, setReq] = useState<ConfirmReq | null>(null);
  const [val, setVal] = useState('');
  const seq = useRef(0);

  const toast = useCallback((text: string, kind: Toast['kind'] = 'ok') => {
    const id = ++seq.current;
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === 'err' ? 6000 : 3000);
  }, []);

  const confirm = useCallback(
    (o: { title: string; text?: string; danger?: boolean; okLabel?: string }) =>
      new Promise<boolean>((resolve) => setReq({ ...o, resolve: (v) => resolve(Boolean(v)) })),
    [],
  );
  const prompt = useCallback(
    (o: { title: string; text?: string; okLabel?: string }) =>
      new Promise<string | null>((resolve) => {
        setVal('');
        setReq({ ...o, input: '', resolve: (v) => resolve(typeof v === 'string' ? v : null) });
      }),
    [],
  );

  const close = (v: string | boolean | null) => {
    req?.resolve(v);
    setReq(null);
  };

  return (
    <UiCtx.Provider value={{ toast, confirm, prompt }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[70] space-y-2 no-print">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cls(
              'rounded-lg px-4 py-2.5 text-sm shadow-lg max-w-sm',
              t.kind === 'ok' && 'bg-emerald-600 text-white',
              t.kind === 'err' && 'bg-red-600 text-white',
              t.kind === 'info' && 'bg-slate-800 text-white',
            )}
          >
            {t.text}
          </div>
        ))}
      </div>
      {req && (
        <Modal
          open
          size="sm"
          title={req.title}
          onClose={() => close(req.input !== undefined ? null : false)}
          footer={
            <>
              <Button onClick={() => close(req.input !== undefined ? null : false)}>გაუქმება</Button>
              <Button
                variant={req.danger ? 'danger' : 'primary'}
                disabled={req.input !== undefined && !val.trim()}
                onClick={() => close(req.input !== undefined ? val.trim() : true)}
              >
                {req.okLabel || 'დადასტურება'}
              </Button>
            </>
          }
        >
          {req.text && <p className="text-sm text-slate-600 whitespace-pre-line">{req.text}</p>}
          {req.input !== undefined && <Textarea autoFocus className="mt-3" value={val} onChange={(e) => setVal(e.target.value)} />}
        </Modal>
      )}
    </UiCtx.Provider>
  );
}
