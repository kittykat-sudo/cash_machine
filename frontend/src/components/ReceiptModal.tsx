'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Sale } from '../types';
import { Printer, X, CheckCircle, Sliders, Type, MessageSquare } from 'lucide-react';
import { WhatsAppActionModal } from './WhatsAppActionModal';

interface ReceiptModalProps {
  sale: Sale | null;
  onClose: () => void;
}

type RollSize = '80mm' | '58mm';
export type ReceiptFontMode = 'dual' | 'poppins' | 'mono';

const FONT_A_POPPINS = "var(--font-poppins), 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
const FONT_B_MONO = "'Consolas', 'Courier New', 'Courier', 'Lucida Console', Monaco, monospace";

const FONT_PRESETS: { id: ReceiptFontMode; label: string; desc: string }[] = [
  {
    id: 'dual',
    label: 'Poppins + Font B (Dual)',
    desc: 'Font A (Poppins bold for Store Name & Totals) + Font B (Thermal Mono for items & prices)',
  },
  {
    id: 'poppins',
    label: 'All Poppins',
    desc: 'Clean modern sans-serif typography across receipt',
  },
  {
    id: 'mono',
    label: 'Classic Thermal (Mono)',
    desc: 'Standard cash-register monospace layout',
  },
];

/** Extra paper fed after the footer so the auto-cutter does not cut through text. */
const CUT_FEED_MM = 3;
const PX_TO_MM = 25.4 / 96;

interface BodyProps {
  sale: Sale;
  formattedDate: string;
  rollSize: RollSize;
  fontMode: ReceiptFontMode;
  /** true = pure black, compact layout for the thermal print-out */
  print?: boolean;
}

const ReceiptBody: React.FC<BodyProps> = ({ sale, formattedDate, rollSize, fontMode, print }) => {
  const muted = print ? 'text-black' : 'text-slate-500';
  const soft = print ? 'text-black' : 'text-slate-600';
  const rule = print ? 'border-black' : 'border-slate-400';
  const rowPad = print ? 'py-px' : 'py-1';
  const is58 = rollSize === '58mm';

  // Font A = Display & Highlights (Poppins); Font B = High-density thermal items & numbers (Monospace)
  const fontA = fontMode === 'mono' ? FONT_B_MONO : FONT_A_POPPINS;
  const fontB = fontMode === 'poppins' ? FONT_A_POPPINS : FONT_B_MONO;

  return (
    <>
      {/* Header */}
      <div className={`text-center pb-1 border-b border-dashed ${rule}`}>
        <h2
          className="text-[1.25em] font-black tracking-wider uppercase leading-tight"
          style={{ fontFamily: fontA }}
        >
          CHATHURA PRINTERS
        </h2>
        <p className={`text-[0.88em] leading-tight ${soft}`} style={{ fontFamily: fontB }}>
          No. 6A, Sri Hemananda Mw, Joolgaha, Galle
        </p>
        <p className={`text-[0.88em] leading-tight ${soft}`} style={{ fontFamily: fontB }}>
          WhatsApp: 072 0129297 | Tel: 077 8683088
        </p>
        <div
          className={`text-[0.82em] uppercase tracking-widest font-extrabold mt-0.5 ${muted}`}
          style={{ fontFamily: fontA }}
        >
          *** CASH RECEIPT ***
        </div>
      </div>

      {/* Meta */}
      <div
        className={`py-1 border-b border-dashed ${rule} text-[0.88em] leading-tight space-y-0.5`}
        style={{ fontFamily: fontB }}
      >
        <div className="flex justify-between items-baseline">
          <span className={muted}>Bill No:</span>
          <span className="font-bold text-[1.05em]" style={{ fontFamily: fontA }}>
            {sale.bill_number}
          </span>
        </div>
        {sale.customer_name && (
          <div className="flex justify-between items-baseline">
            <span className={muted}>Customer:</span>
            <span className="font-bold uppercase tracking-wide" style={{ fontFamily: fontA }}>
              {sale.customer_name}
            </span>
          </div>
        )}
        {sale.customer_phone && (
          <div className="flex justify-between items-baseline">
            <span className={muted}>WhatsApp:</span>
            <span className="font-semibold" style={{ fontFamily: fontB }}>
              {sale.customer_phone}
            </span>
          </div>
        )}
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
                <div
                  className="font-bold text-[1.12em] break-words"
                  style={{ fontFamily: fontA }}
                >
                  {item.description}
                </div>
                <div
                  className="flex justify-between text-[0.85em]"
                  style={{ fontFamily: fontB, fontVariantNumeric: 'tabular-nums' }}
                >
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
              <tr
                className={`border-b text-[0.82em] uppercase ${print ? 'border-black' : 'border-slate-200'} ${muted}`}
                style={{ fontFamily: fontB }}
              >
                <th className="pb-0.5 w-[42%] text-left font-bold">Item</th>
                <th className="pb-0.5 w-[12%] text-center font-bold">Qty</th>
                <th className="pb-0.5 w-[23%] text-right font-bold">Price</th>
                <th className="pb-0.5 w-[23%] text-right font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, idx) => (
                <tr key={idx} className="align-top text-[0.9em] leading-tight">
                  <td
                    className={`${rowPad} pr-1 font-bold text-[1.08em] break-words`}
                    style={{ fontFamily: fontA }}
                  >
                    {item.description}
                  </td>
                  <td
                    className={`${rowPad} text-center whitespace-nowrap`}
                    style={{ fontFamily: fontB, fontVariantNumeric: 'tabular-nums' }}
                  >
                    {Number(item.quantity)}
                  </td>
                  <td
                    className={`${rowPad} text-right whitespace-nowrap`}
                    style={{ fontFamily: fontB, fontVariantNumeric: 'tabular-nums' }}
                  >
                    {Number(item.unit_price).toFixed(2)}
                  </td>
                  <td
                    className={`${rowPad} text-right font-bold whitespace-nowrap`}
                    style={{ fontFamily: fontB, fontVariantNumeric: 'tabular-nums' }}
                  >
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
        <div className={`flex justify-between ${soft}`} style={{ fontFamily: fontB }}>
          <span>Subtotal:</span>
          <span className="whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
            Rs. {Number(sale.subtotal).toFixed(2)}
          </span>
        </div>
        {Number(sale.discount) > 0 && (
          <div
            className={`flex justify-between ${print ? '' : 'text-emerald-600'}`}
            style={{ fontFamily: fontB }}
          >
            <span>Discount:</span>
            <span className="whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
              - Rs. {Number(sale.discount).toFixed(2)}
            </span>
          </div>
        )}
        {Number(sale.tax_amount) > 0 && (
          <div className={`flex justify-between ${soft}`} style={{ fontFamily: fontB }}>
            <span>Tax:</span>
            <span className="whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
              Rs. {Number(sale.tax_amount).toFixed(2)}
            </span>
          </div>
        )}
        <div
          className={`flex justify-between items-baseline text-[1.55em] font-black pt-0.5 border-t ${
            print ? 'border-black' : 'border-slate-300'
          }`}
          style={{ fontFamily: fontA }}
        >
          <span className="text-[0.68em] tracking-wide">NET TOTAL:</span>
          <span className="whitespace-nowrap font-black">
            Rs. {Number(sale.total).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className={`text-center pt-1.5 text-[0.82em] leading-tight space-y-0.5 ${muted}`}>
        <p className="font-bold" style={{ fontFamily: fontA }}>
          Thank you for your business!
        </p>
        <p style={{ fontFamily: fontB }}>Please retain receipt for exchanges within 7 days.</p>
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
  { label: '80 × 90', value: { width: 80, height: 90 } },
  { label: '80 × 100', value: { width: 80, height: 100 } },
  { label: '80 × 60', value: { width: 80, height: 60 } },
  { label: '57 × Auto', value: { width: 57, height: 'auto' } },
  { label: '57 × 90', value: { width: 57, height: 90 } },
];
const STORAGE_KEY = 'chathura_pos_page';
const FONT_STORAGE_KEY = 'chathura_pos_receipt_font';

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, onClose }) => {
  const [page, setPage] = useState<PageSetting>(DEFAULT_PAGE);
  const [fontMode, setFontMode] = useState<ReceiptFontMode>('dual');
  const [showCustom, setShowCustom] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved && typeof saved.width === 'number' && (saved.height === 'auto' || typeof saved.height === 'number')) {
        setPage(saved);
      }
      const savedFont = localStorage.getItem(FONT_STORAGE_KEY) as ReceiptFontMode;
      if (savedFont && ['dual', 'poppins', 'mono'].includes(savedFont)) {
        setFontMode(savedFont);
      }
    } catch {
      /* ignore corrupt value */
    }
  }, []);

  const updatePage = (next: PageSetting) => {
    setPage(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const updateFontMode = (mode: ReceiptFontMode) => {
    setFontMode(mode);
    localStorage.setItem(FONT_STORAGE_KEY, mode);
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
                fontFamily: fontMode === 'mono' ? FONT_B_MONO : FONT_A_POPPINS,
                fontSize: compact ? '13px' : '16px',
                lineHeight: 1.15,
                color: '#000',
                background: '#fff',
              }}
            >
              <ReceiptBody
                sale={sale}
                formattedDate={formattedDate}
                rollSize={rollSize}
                fontMode={fontMode}
                print
              />
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

          {/* Page size and Font pickers (saved in localStorage) */}
          <div className="px-6 py-2.5 bg-slate-100 border-b border-slate-200 text-xs space-y-2.5">
            {/* Page Size Row */}
            <div>
              <div className="flex items-center gap-1.5 text-slate-600 font-semibold mb-1">
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
                <div className="flex items-center gap-2 text-slate-700 mt-1.5">
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
            </div>

            {/* Font Hierarchy Picker (Font A & Font B) */}
            <div className="pt-2 border-t border-slate-200/80">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 text-slate-600 font-semibold text-[11px]">
                  <Type className="w-3.5 h-3.5 text-slate-500" />
                  <span>Receipt Font (Font A & Font B):</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  {fontMode === 'dual'
                    ? 'Poppins (Totals) + Mono (Items)'
                    : fontMode === 'poppins'
                    ? 'All Poppins'
                    : 'Classic Mono'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 font-semibold text-[11px]">
                {FONT_PRESETS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => updateFontMode(f.id)}
                    className={`px-2.5 py-1 rounded-md transition ${
                      fontMode === f.id
                        ? 'bg-slate-900 text-white shadow-sm ring-1 ring-slate-900'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {rotateRisk && (
              <p className="text-[11px] text-amber-700">
                Height is not taller than width: some drivers print this rotated 90°. Use a height above {pageMm} mm if that happens.
              </p>
            )}

            <div className="text-[10px] text-slate-500 bg-amber-50 border border-amber-200/60 rounded-lg p-2 leading-tight">
              <span className="font-bold text-amber-900">Print Dialog Tip:</span> In the Chrome print window, uncheck <b className="text-slate-800">Headers and footers</b> and set Margins to <b className="text-slate-800">None</b> for clean 80mm bills.
            </div>
          </div>

          {/* On-screen preview only (the print copy is rendered separately) */}
          <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
            <div
              className={`bg-white rounded-xl border border-slate-200 shadow-sm text-slate-800 mx-auto leading-snug ${
                compact ? 'p-4 max-w-[240px] text-[13px]' : 'p-5 max-w-[320px] text-[15px]'
              }`}
              style={{
                fontFamily: fontMode === 'mono' ? FONT_B_MONO : FONT_A_POPPINS,
              }}
            >
              <ReceiptBody
                sale={sale}
                formattedDate={formattedDate}
                rollSize={rollSize}
                fontMode={fontMode}
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap gap-2.5">
            <button
              onClick={handlePrint}
              className="flex-1 min-w-[130px] flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl shadow transition"
            >
              <Printer className="w-5 h-5" />
              <span>Print Receipt</span>
            </button>

            <button
              onClick={() => setShowWhatsApp(true)}
              className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition"
              title="Send bill directly via WhatsApp"
            >
              {/* WhatsApp icon */}
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.529 1.831.815 2.791.815 3.182 0 5.768-2.586 5.768-5.767.001-3.18-2.585-5.766-5.768-5.766zm9.965 5.766c0 5.519-4.481 10-10 10-1.748 0-3.385-.45-4.819-1.238l-7.177 1.88 1.916-6.996c-.859-1.488-1.353-3.216-1.353-5.056 0-5.519 4.481-10 10-10 5.519 0 10 4.481 10 10z" />
              </svg>
              <span>WhatsApp Bill</span>
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

      {/* WhatsApp Modal */}
      {showWhatsApp && (
        <WhatsAppActionModal
          isOpen={showWhatsApp}
          onClose={() => setShowWhatsApp(false)}
          sale={sale}
          initialMode="bill"
        />
      )}
    </>
  );
};
