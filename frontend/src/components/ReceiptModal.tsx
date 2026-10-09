'use client';

import React from 'react';
import { Sale } from '../types';
import { Printer, X, CheckCircle } from 'lucide-react';

interface ReceiptModalProps {
  sale: Sale | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, onClose }) => {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(sale.created_at).toLocaleString('en-LK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white no-print">
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

        {/* Receipt Preview (Container for window.print) */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
          <div
            id="printable-receipt"
            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-slate-800 mx-auto max-w-[320px] font-mono text-xs leading-relaxed"
          >
            {/* Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-400">
              <h2 className="text-base font-extrabold tracking-wider uppercase">
                CHATHURA PRINTERS
              </h2>
              <p className="text-[11px] text-slate-600">Main Street, Colombo</p>
              <p className="text-[11px] text-slate-600">Tel: 071-2345678</p>
              <div className="mt-2 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                *** CASH RECEIPT ***
              </div>
            </div>

            {/* Meta */}
            <div className="py-2 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Bill No:</span>
                <span className="font-bold">{sale.bill_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span>{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment:</span>
                <span className="uppercase font-semibold">{sale.payment_method}</span>
              </div>
            </div>

            {/* Line Items */}
            <div className="py-3 border-b border-dashed border-slate-400">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] uppercase text-slate-500">
                    <th className="pb-1">Item</th>
                    <th className="pb-1 text-center">Qty</th>
                    <th className="pb-1 text-right">Price</th>
                    <th className="pb-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sale.items.map((item, idx) => (
                    <tr key={idx} className="py-1">
                      <td className="py-1 pr-1 font-sans text-[11px] font-medium leading-tight">
                        {item.description}
                      </td>
                      <td className="py-1 text-center">{Number(item.quantity)}</td>
                      <td className="py-1 text-right">{Number(item.unit_price).toFixed(2)}</td>
                      <td className="py-1 text-right font-semibold">
                        {Number(item.line_total).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="py-3 border-b border-dashed border-slate-400 space-y-1 text-right">
              <div className="flex justify-between text-slate-600 text-[11px]">
                <span>Subtotal:</span>
                <span>Rs. {Number(sale.subtotal).toFixed(2)}</span>
              </div>
              {Number(sale.discount) > 0 && (
                <div className="flex justify-between text-emerald-600 text-[11px]">
                  <span>Discount:</span>
                  <span>- Rs. {Number(sale.discount).toFixed(2)}</span>
                </div>
              )}
              {Number(sale.tax_amount) > 0 && (
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>Tax:</span>
                  <span>Rs. {Number(sale.tax_amount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black pt-1 border-t border-slate-300 text-slate-900">
                <span>NET TOTAL:</span>
                <span>Rs. {Number(sale.total).toFixed(2)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-3 text-[10px] text-slate-500 space-y-1">
              <p className="font-semibold">Thank you for your business!</p>
              <p>Please retain receipt for exchanges within 7 days.</p>
              <p className="tracking-widest">--- • ---</p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex gap-3 no-print">
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
  );
};
