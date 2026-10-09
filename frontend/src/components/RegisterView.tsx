'use client';

import React, { useState, useEffect } from 'react';
import { Item, CartItem, PaymentMethod, Sale } from '../types';
import { fetchItems, createSale } from '../services/api';
import { KeypadModal } from './KeypadModal';
import { ReceiptModal } from './ReceiptModal';
import {
  Plus,
  Minus,
  Trash2,
  Printer,
  Edit2,
  Sparkles,
  Search,
  CreditCard,
  Banknote,
  Building2,
  RotateCcw,
} from 'lucide-react';

interface RegisterViewProps {
  onSaleCompleted: () => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({ onSaleCompleted }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  // Keypad state
  const [keypadConfig, setKeypadConfig] = useState<{
    open: boolean;
    title: string;
    initialVal: number;
    unit?: string;
    onConfirm: (val: number) => void;
  }>({
    open: false,
    title: '',
    initialVal: 0,
    onConfirm: () => {},
  });

  // Custom Item Modal State
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [customDescription, setCustomDescription] = useState('Custom Print Job');
  const [customPrice, setCustomPrice] = useState<number>(50);
  const [customQty, setCustomQty] = useState<number>(1);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await fetchItems();
      setItems(data);
    } catch (err) {
      console.error('Failed to fetch items:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'all', label: 'All Items' },
    { id: 'printing', label: 'Printing' },
    { id: 'photocopy', label: 'Photocopy' },
    { id: 'lamination', label: 'Lamination' },
    { id: 'binding', label: 'Binding' },
    { id: 'stationery', label: 'Stationery' },
    { id: 'other', label: 'Other / Custom' },
  ];

  const filteredItems = items.filter((item) => {
    const matchesCategory =
      activeCategory === 'all' || item.category.toLowerCase() === activeCategory.toLowerCase();
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.barcode && item.barcode.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const addItemToCart = (item: Item) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex((i) => i.item_id === item.id);
      const unitPrice = Number(item.unit_price);
      if (existingIdx > -1) {
        const next = [...prev];
        const newQty = next[existingIdx].quantity + 1;
        next[existingIdx] = {
          ...next[existingIdx],
          quantity: newQty,
          line_total: newQty * unitPrice,
        };
        return next;
      } else {
        return [
          ...prev,
          {
            item_id: item.id,
            description: item.name,
            quantity: 1,
            unit_price: unitPrice,
            line_total: unitPrice,
          },
        ];
      }
    });
  };

  const updateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }
    setCart((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        quantity: newQty,
        line_total: newQty * next[index].unit_price,
      };
      return next;
    });
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, idx) => idx !== index));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setTaxAmount(0);
  };

  const openKeypadForQty = (index: number) => {
    const item = cart[index];
    setKeypadConfig({
      open: true,
      title: `Quantity for: ${item.description}`,
      initialVal: item.quantity,
      unit: 'pcs',
      onConfirm: (val) => {
        if (val > 0) updateQuantity(index, val);
        setKeypadConfig((k) => ({ ...k, open: false }));
      },
    });
  };

  const openKeypadForDiscount = () => {
    setKeypadConfig({
      open: true,
      title: 'Enter Discount Amount',
      initialVal: discount,
      unit: 'Rs.',
      onConfirm: (val) => {
        setDiscount(val);
        setKeypadConfig((k) => ({ ...k, open: false }));
      },
    });
  };

  const addCustomItem = () => {
    if (!customDescription.trim() || customPrice <= 0) return;
    setCart((prev) => [
      ...prev,
      {
        item_id: null,
        description: customDescription.trim(),
        quantity: customQty,
        unit_price: customPrice,
        line_total: customQty * customPrice,
      },
    ]);
    setCustomModalOpen(false);
    setCustomDescription('Custom Print Job');
    setCustomPrice(50);
    setCustomQty(1);
  };

  const subtotal = cart.reduce((acc, curr) => acc + curr.line_total, 0);
  const netTotal = Math.max(0, subtotal - discount + taxAmount);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    try {
      setSubmitting(true);
      const created = await createSale({
        items: cart,
        discount,
        tax_amount: taxAmount,
        payment_method: paymentMethod,
      });

      setCompletedSale(created);
      clearCart();
      onSaleCompleted();
    } catch (err: any) {
      alert(`Error completing sale: ${err.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-65px)] overflow-hidden">
      {/* LEFT: Item Selection & Categories (Counter Speed Grid) */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden border-r border-slate-200">
        {/* Search & Custom Item Bar */}
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search print services or enter barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
            />
          </div>

          <button
            onClick={() => setCustomModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-sm transition whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" />
            <span>+ Custom Line</span>
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none shrink-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide uppercase transition whitespace-nowrap shrink-0 shadow-sm ${
                activeCategory === cat.id
                  ? 'bg-slate-900 text-white ring-2 ring-emerald-500'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Large Items Grid */}
        <div className="flex-1 overflow-y-auto pr-1 mt-2">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-slate-400 font-medium">
              Loading catalog items...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <p>No items found in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => addItemToCart(item)}
                  className="group relative flex flex-col justify-between p-3.5 bg-white hover:bg-emerald-50 active:bg-emerald-100 rounded-2xl border-2 border-slate-200 hover:border-emerald-500 transition-all text-left shadow-sm min-h-[95px]"
                >
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm leading-snug line-clamp-2">
                      {item.name}
                    </h4>
                    <span className="inline-block mt-0.5 text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                      /{item.unit}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-slate-100">
                    <span className="text-xs text-slate-400 font-medium">LKR</span>
                    <span className="text-base font-extrabold text-emerald-700 group-hover:text-emerald-800 font-mono">
                      Rs. {Number(item.unit_price).toFixed(2)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Running Bill Panel (Receipt Tape) */}
      <div className="w-full lg:w-[420px] bg-white flex flex-col h-full shadow-lg border-l border-slate-200">
        {/* Running Bill Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-base">Current Bill</h2>
            <p className="text-xs text-slate-500">{cart.length} item(s) on receipt</p>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 rounded-lg hover:bg-rose-50 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Receipt Line Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-slate-100">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <Printer className="w-8 h-8 text-slate-300" />
              </div>
              <p className="font-semibold text-sm">Receipt is Empty</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[220px]">
                Tap any product button on the left to start ringing up the sale.
              </p>
            </div>
          ) : (
            cart.map((line, idx) => (
              <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-slate-800 truncate">
                    {line.description}
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    Rs. {line.unit_price.toFixed(2)} each
                  </div>
                </div>

                {/* Quantity Controls & Quick Keypad */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => updateQuantity(idx, line.quantity - 1)}
                    className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-white rounded-lg transition"
                  >
                    <Minus className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => openKeypadForQty(idx)}
                    className="px-2 text-xs font-bold text-slate-800 hover:bg-white hover:text-emerald-700 rounded-md transition font-mono"
                    title="Tap to type custom quantity"
                  >
                    {line.quantity}
                  </button>

                  <button
                    onClick={() => updateQuantity(idx, line.quantity + 1)}
                    className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-white rounded-lg transition"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Line Total */}
                <div className="text-right min-w-[75px]">
                  <div className="font-bold text-sm text-slate-900 font-mono">
                    Rs. {line.line_total.toFixed(2)}
                  </div>
                  <button
                    onClick={() => removeFromCart(idx)}
                    className="text-[10px] text-rose-500 hover:text-rose-700 flex items-center gap-0.5 justify-end w-full"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                    <span>remove</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bill Summary & Payment Method */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
          {/* Subtotal & Adjustments */}
          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-800 font-mono">
                Rs. {subtotal.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={openKeypadForDiscount}
                className="flex items-center gap-1 text-emerald-700 font-medium hover:underline"
              >
                <Edit2 className="w-3 h-3" />
                <span>Discount:</span>
              </button>
              <span className="font-semibold text-emerald-700 font-mono">
                - Rs. {discount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1.5">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['cash', 'card', 'bank'] as PaymentMethod[]).map((m) => {
                const Icon = m === 'cash' ? Banknote : m === 'card' ? CreditCard : Building2;
                const isSelected = paymentMethod === m;
                return (
                  <button
                    key={m}
                    onClick={() => setPaymentMethod(m)}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold capitalize transition border ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{m}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Large Total & Print Button */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-bold block uppercase">Net Total</span>
              <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                Rs. {netTotal.toFixed(2)}
              </span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || submitting}
              className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-extrabold text-base shadow-lg transition-all ${
                cart.length === 0 || submitting
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white shadow-emerald-600/30'
              }`}
            >
              <Printer className="w-5 h-5" />
              <span>{submitting ? 'Recording...' : 'Print & Complete'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Keypad Modal */}
      {keypadConfig.open && (
        <KeypadModal
          title={keypadConfig.title}
          initialValue={keypadConfig.initialVal}
          unit={keypadConfig.unit}
          onConfirm={keypadConfig.onConfirm}
          onClose={() => setKeypadConfig((k) => ({ ...k, open: false }))}
        />
      )}

      {/* Custom Item Quick Entry Modal */}
      {customModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Add Custom Print / Service</span>
            </h3>

            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. Thesis Hardcover Binding"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Unit Price (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={customQty}
                    onChange={(e) => setCustomQty(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="text-right text-xs text-slate-500">
                Total: <span className="font-bold text-slate-800 font-mono">Rs. {(customPrice * customQty).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={addCustomItem}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow transition"
              >
                Add to Receipt
              </button>
              <button
                onClick={() => setCustomModalOpen(false)}
                className="px-4 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-100 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bill Receipt Preview Modal */}
      {completedSale && (
        <ReceiptModal sale={completedSale} onClose={() => setCompletedSale(null)} />
      )}
    </div>
  );
};
