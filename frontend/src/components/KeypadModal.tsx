'use client';

import React, { useState } from 'react';
import { X, Delete, Check } from 'lucide-react';

interface KeypadModalProps {
  title: string;
  initialValue: number;
  unit?: string;
  onConfirm: (val: number) => void;
  onClose: () => void;
}

export const KeypadModal: React.FC<KeypadModalProps> = ({
  title,
  initialValue,
  unit,
  onConfirm,
  onClose,
}) => {
  const [valStr, setValStr] = useState<string>(
    initialValue > 0 ? initialValue.toString() : ''
  );

  const handleDigit = (digit: string) => {
    if (digit === '.' && valStr.includes('.')) return;
    if (valStr === '0' && digit !== '.') {
      setValStr(digit);
    } else {
      setValStr((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    setValStr((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setValStr('');
  };

  const handlePreset = (amount: number) => {
    setValStr(amount.toString());
  };

  const handleApply = () => {
    const parsed = parseFloat(valStr) || 0;
    onConfirm(parsed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xs w-full p-5 border border-slate-200">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-slate-800 text-base">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Display Screen */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 text-right mb-4 shadow-inner">
          <span className="text-xs text-slate-400 block uppercase font-medium">Input Value</span>
          <div className="text-3xl font-extrabold tracking-wide font-mono flex items-baseline justify-end gap-1">
            <span>{valStr || '0'}</span>
            {unit && <span className="text-xs font-normal text-emerald-400">{unit}</span>}
          </div>
        </div>

        {/* Quick Page count Presets */}
        <div className="grid grid-cols-4 gap-1.5 mb-3">
          {[1, 2, 5, 10, 20, 50, 100, 500].map((preset) => (
            <button
              key={preset}
              onClick={() => handlePreset(preset)}
              className="py-1.5 text-xs font-bold bg-slate-100 text-slate-700 hover:bg-emerald-100 hover:text-emerald-800 rounded-lg transition"
            >
              +{preset}
            </button>
          ))}
        </div>

        {/* Keypad Grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleDigit(digit)}
              className="h-12 bg-slate-50 hover:bg-slate-200 active:bg-slate-300 text-xl font-bold text-slate-800 rounded-xl border border-slate-200 transition shadow-sm"
            >
              {digit}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="h-12 bg-rose-50 hover:bg-rose-100 text-sm font-bold text-rose-600 rounded-xl border border-rose-200 transition"
          >
            C
          </button>
          <button
            onClick={() => handleDigit('0')}
            className="h-12 bg-slate-50 hover:bg-slate-200 text-xl font-bold text-slate-800 rounded-xl border border-slate-200 transition shadow-sm"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 flex items-center justify-center transition"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleApply}
          className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/30 transition text-base"
        >
          <Check className="w-5 h-5" />
          <span>Confirm</span>
        </button>
      </div>
    </div>
  );
};
