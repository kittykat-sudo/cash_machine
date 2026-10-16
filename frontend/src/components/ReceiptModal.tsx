'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Sale } from '../types';
import { Printer, X, CheckCircle, Sliders } from 'lucide-react';

interface ReceiptModalProps {
  sale: Sale | null;
  onClose: () => void;
}

type RollSize = '80mm' | '58mm';

/** Extra paper fed after the footer so the auto-cutter does not cut through text. */
const CUT_FEED_MM = 3;
const PX_TO_MM = 25.4 / 96;

interface BodyProps {
  sale: Sale;
  formattedDate: string;
  rollSize: RollSize;
  /** true = pure black, compact layout for the thermal print-out */
  print?: boolean;
}

const ReceiptBody: React.FC<BodyProps> = ({ sale, formattedDate, rollSize, print }) => {
  const muted = print ? 'text-black' : 'text-slate-500';
  const soft = print ? 'text-black' : 'text-slate-600';
  const rule = print ? 'border-black' : 'border-slate-400';
  const rowPad = print ? 'py-px' : 'py-1';
  const is58 = rollSize === '58mm';

  return (
    <>
      {/* Header */}
      <div className={`text-center pb-1 border-b border-dashed ${rule}`}>
        <h2 className="text-[1.2em] font-extrabold tracking-wider uppercase leading-tight">
          CHATHURA PRINTERS
        </h2>
        <p className={`text-[0.9em] leading-tight ${soft}`}>No. 6A, Sri Hemananda Mw, Joolgaha, Galle</p>
        <p className={`text-[0.9em] leading-tight ${soft}`}>Tel: 077 8683088 / 072 0129297</p>
        <div className={`text-[0.8em] uppercase tracking-widest font-bold ${muted}`}>
          *** CASH RECEIPT ***
        </div>
      </div>

      {/* Meta */}
      <div className={`py-1 border-b border-dashed ${rule} text-[0.9em] leading-tight space-y-0.5`}>
        <div className="flex justify-between">
          <span className={muted}>Bill No:</span>
          <span className="font-bold">{sale.bill_number}</span>
        </div>
        <div className="flex justify-between">
          <span className={muted}>Date:</span>
          <span>{formattedDate}</span>
        </div>
        <div className="flex justify-between">
          <span className={muted}>Payment:</span>
          <span className="uppercase font-semibold">{sale.payment_method}</span>
        </div>
      </div>

      {/* Line items */}
      <div className={`py-1 border-b border-dashed ${rule}`}>
        {is58 ? (
          <div className="space-y-1">
            {sale.items.map((item, idx) => (
              <div key={idx} className="text-[0.9em] leading-tight">
                <div className="font-bold text-[1.15em] break-words">{item.description}</div>
                <div className="flex justify-between text-[0.8em]">
                  <span>
                    {Number(item.quantity)} x {Number(item.unit_price).toFixed(2)}
                  </span>
                  <span className="font-bold">{Number(item.line_total).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <table className="w-full text-left table-fixed">
            <thead>
              <tr className={`border-b text-[0.8em] uppercase ${print ? 'border-black' : 'border-slate-200'} ${muted}`}>
                <th className="pb-0.5 w-[42%] text-left">Item</th>
                <th className="pb-0.5 w-[12%] text-center">Qty</th>
                <th className="pb-0.5 w-[23%] text-right">Price</th>
                <th className="pb-0.5 w-[23%] text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, idx) => (
                <tr key={idx} className="align-top text-[0.9em] leading-tight">
                  <td className={`${rowPad} pr-1 font-bold text-[1.15em] break-words`}>{item.description}</td>
                  <td className={`${rowPad} text-center whitespace-nowrap`}>{Number(item.quantity)}</td>
                  <td className={`${rowPad} text-right whitespace-nowrap`}>{Number(item.unit_price).toFixed(2)}</td>
                  <td className={`${rowPad} text-right font-semibold whitespace-nowrap`}>
                    {Number(item.line_total).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Totals */}
      <div className={`py-1 border-b border-dashed ${rule} text-[0.9em] leading-tight space-y-0.5`}>
        <div className={`flex justify-between ${soft}`}>
          <span>Subtotal:</span>
          <span className="whitespace-nowrap">Rs. {Number(sale.subtotal).toFixed(2)}</span>
        </div>
        {Number(sale.discount) > 0 && (
          <div className={`flex justify-between ${print ? '' : 'text-emerald-600'}`}>
            <span>Discount:</span>
            <span className="whitespace-nowrap">- Rs. {Number(sale.discount).toFixed(2)}</span>
          </div>
        )}
        {Number(sale.tax_amount) > 0 && (
          <div className={`flex justify-between ${soft}`}>
            <span>Tax:</span>
            <span className="whitespace-nowrap">Rs. {Number(sale.tax_amount).toFixed(2)}</span>
          </div>
        )}
        <div className={`flex justify-between items-baseline text-[1.6em] font-black pt-0.5 border-t ${print ? 'border-black' : 'border-slate-300'}`}>
          <span className="text-[0.7em]">NET TOTAL:</span>
          <span className="whitespace-nowrap">Rs. {Number(sale.total).toFixed(2)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className={`text-center pt-1 text-[0.8em] leading-tight ${muted}`}>
        <p className="font-semibold">Thank you for your business!</p>
        <p>Please retain receipt for exchanges within 7 days.</p>
      </div>
    </>
  );
};

interface PageSetting {
  width: number;
  /** 'auto' = fit height to the bill; otherwise fixed height in mm */
  height: 'auto' | number;
}

const DEFAULT_PAGE: PageSetting = { width: 80, height: 'auto' };
const PAGE_PRESETS: { label: string; value: PageSetting }[] = [
  { label: '80 × Auto', value: { width: 80, height: 'auto' } },
  { label: '80 × 60', value: { width: 80, height: 60 } },
  { label: '80 × 100', value: { width: 80, height: 100 } },
  { label: '57 × Auto', value: { width: 57, height: 'auto' } },
  { label: '57 × 90', value: { width: 57, height: 90 } },
];
const STORAGE_KEY = 'chathura_pos_page';

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, onClose }) => {
  const [page, setPage] = useState<PageSetting>(DEFAULT_PAGE);
  const [showCustom, setShowCustom] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved && typeof saved.width === 'number' && (saved.height === 'auto' || typeof saved.height === 'number')) {
        setPage(saved);
      }
    } catch {
      /* ignore corrupt value */
    }
  }, []);

  const updatePage = (next: PageSetting) => {
    setPage(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  if (!sale) return null;

  const formattedDate = new Date(sale.created_at).toLocaleString('en-LK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const pageMm = Math.min(Math.max(page.width, 40), 120);
  const compact = pageMm < 65;
  const rollSize: RollSize = compact ? '58mm' : '80mm';
  // Thermal heads can't print the full paper width, so keep the text centered with a small margin.
  const widthMm = pageMm - 6;
  const isFixed = page.height !== 'auto';
  const rotateRisk = isFixed && (page.height as number) <= pageMm;

  const handlePrint = () => {
    const el = printRef.current;
    // Measure the real receipt height (the print copy is laid out off-screen at its true mm width).
    const measuredMm = el
      ? Math.ceil(el.getBoundingClientRect().height * PX_TO_MM) + CUT_FEED_MM
      : 100;
    // Auto: page must stay taller than wide, otherwise Chrome/driver rotates it 90°.
    // Fixed: use the chosen height, but never shorter than the bill (would spill to a 2nd sheet).
    const heightMm = isFixed
      ? Math.max(page.height as number, measuredMm)
      : Math.max(measuredMm, pageMm + 2);

    const style = document.createElement('style');
    style.id = 'dynamic-page-size';
    style.textContent = `@page { size: ${pageMm}mm ${heightMm}mm; margin: 0; }`;
    document.head.appendChild(style);

    const cleanup = () => {
      style.remove();
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
  };

  const printCopy =
    typeof document !== 'undefined'
      ? createPortal(
          <div id="print-root" style={{ width: `${pageMm}mm` }}>
            <div
              id="printable-receipt"
              ref={printRef}
              style={{
                width: `${widthMm}mm`,
                margin: '0 auto',
                padding: '0.5mm 0',
                boxSizing: 'border-box',
                fontFamily: "var(--font-poppins), 'Poppins', Arial, sans-serif",
                fontSize: compact ? '14px' : '17px',
                lineHeight: 1.1,
                color: '#000',
                background: '#fff',
              }}
            >
              <ReceiptBody sale={sale} formattedDate={formattedDate} rollSize={rollSize} print />
            </div>
          </div>,
          document.body
        )
      : null;

  const isActive = (v: PageSetting) => v.width === page.width && v.height === page.height;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
          {/* Modal Top Bar */}
          <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-base">Sale Completed</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Page size picker (saved in localStorage) */}
          <div className="px-6 py-2 bg-slate-100 border-b border-slate-200 text-xs space-y-2">
            <div className="flex items-center gap-1.5 text-slate-600 font-medium">
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              <span>Page size (mm) — width × height</span>
            </div>
            <div className="flex flex-wrap gap-1.5 font-semibold text-[11px]">
              {PAGE_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => {
                    setShowCustom(false);
                    updatePage(p.value);
                  }}
                  className={`px-2.5 py-1 rounded-md transition ${
                    !showCustom && isActive(p.value)
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
              <button
                onClick={() => setShowCustom(true)}
                className={`px-2.5 py-1 rounded-md transition ${
                  showCustom
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Custom…
              </button>
            </div>
            {showCustom && (
              <div className="flex items-center gap-2 text-slate-700">
                <input
                  type="number"
                  min={40}
                  max={120}
                  value={page.width}
                  onChange={(e) => updatePage({ ...page, width: Number(e.target.value) || 80 })}
                  className="w-16 px-2 py-1 rounded border border-slate-300 bg-white select-text"
                />
                <span>×</span>
                <input
                  type="number"
                  min={30}
                  max={600}
                  placeholder="auto"
                  value={page.height === 'auto' ? '' : page.height}
                  onChange={(e) =>
                    updatePage({
                      ...page,
                      height: e.target.value === '' ? 'auto' : Number(e.target.value),
                    })
                  }
                  className="w-16 px-2 py-1 rounded border border-slate-300 bg-white select-text"
                />
                <span className="text-slate-500">mm (empty height = auto)</span>
              </div>
            )}
            {rotateRisk && (
              <p className="text-[11px] text-amber-700">
                Height is not taller than width: some drivers print this rotated 90°. Use a height above {pageMm} mm if that happens.
              </p>
            )}
          </div>

          {/* On-screen preview only (the print copy is rendered separately) */}
          <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
            <div
              className={`bg-white rounded-xl border border-slate-200 shadow-sm text-slate-800 mx-auto leading-snug ${
                compact ? 'p-4 max-w-[240px] text-[13px]' : 'p-5 max-w-[320px] text-[15px]'
              }`}
              style={{ fontFamily: "var(--font-poppins), 'Poppins', Arial, sans-serif" }}
            >
              <ReceiptBody sale={sale} formattedDate={formattedDate} rollSize={rollSize} />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="p-4 bg-white border-t border-slate-200 flex gap-3">
            <button
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow transition"
            >
              <Printer className="w-5 h-5" />
              <span>Print Receipt</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
      {printCopy}
    </>
  );
};
