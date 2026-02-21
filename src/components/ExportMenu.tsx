import { useState, useRef, useEffect } from 'react';
import { exportPng, exportPdf, exportJson, exportCsv } from '../utils/exporters';
import type { FamilyTree } from '../types';

interface ExportMenuProps {
  tree: FamilyTree;
  canvasRef: React.RefObject<HTMLDivElement | null>;
}

export function ExportMenu({ tree, canvasRef }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function run(fn: () => Promise<void> | void) {
    setBusy(true);
    setOpen(false);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  }

  const canvas = canvasRef.current;

  const options = [
    {
      label: 'Export PNG',
      action: () => canvas && run(() => exportPng(canvas)),
      disabled: !canvas,
    },
    {
      label: 'Export PDF',
      action: () => canvas && run(() => exportPdf(canvas)),
      disabled: !canvas,
    },
    {
      label: 'Export JSON',
      action: () => run(() => exportJson(tree)),
      disabled: false,
    },
    {
      label: 'Export CSV',
      action: () => run(() => exportCsv(tree)),
      disabled: false,
    },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={busy}
        className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded shadow-sm hover:bg-gray-50 disabled:opacity-60"
      >
        {busy ? 'Exporting…' : 'Export'}
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded shadow-lg z-50">
          {options.map((opt) => (
            <button
              key={opt.label}
              onClick={opt.action}
              disabled={opt.disabled}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
