import { useState } from 'react';
import Mascot from './Mascot';
import ChatDialog from './ChatDialog';

export default function Concierge() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label={open ? 'Close assistant' : 'Open assistant'}
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-slate-900 text-white shadow-lg px-4 py-3 hover:bg-slate-700"
      >
        <Mascot />
        <span className="text-sm font-medium hidden sm:inline">Ask about MFA</span>
      </button>
      {open && <ChatDialog onClose={() => setOpen(false)} />}
    </>
  );
}
