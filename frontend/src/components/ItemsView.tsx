'use client';

import React, { useState, useEffect } from 'react';
import { Item, ItemCategory } from '../types';
import { fetchItems, createItem, updateItem } from '../services/api';
import { Plus, Edit3, Tag, Check, X, Search } from 'lucide-react';

export const ItemsView: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [isNew, setIsNew] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ItemCategory>('printing');
  const [unit, setUnit] = useState('page');
  const [unitPrice, setUnitPrice] = useState<number>(10);
  const [barcode, setBarcode] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await fetchItems();
      setItems(data);
    } catch (err) {
      console.error('Failed to load items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (item: Item) => {
    setIsNew(false);
    setEditItem(item);
    setName(item.name);
    setCategory(item.category as ItemCategory);
    setUnit(item.unit);
    setUnitPrice(Number(item.unit_price));
    setBarcode(item.barcode || '');
    setIsActive(item.is_active);
  };

  const handleOpenNew = () => {
    setIsNew(true);
    setEditItem(null);
    setName('');
    setCategory('printing');
    setUnit('page');
    setUnitPrice(10);
    setBarcode('');
    setIsActive(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      setSaving(true);
      if (isNew) {
        await createItem({
          name: name.trim(),
          category,
          unit,
          unit_price: unitPrice,
          barcode: barcode.trim() || undefined,
          is_active: isActive,
        });
      } else if (editItem) {
        await updateItem(editItem.id, {
          name: name.trim(),
          category,
          unit,
          unit_price: unitPrice,
          barcode: barcode.trim() || undefined,
          is_active: isActive,
        });
      }
      setEditItem(null);
      setIsNew(false);
      loadItems();
    } catch (err: any) {
      alert(`Failed to save item: ${err.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  const filtered = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.category.toLowerCase().includes(search.toLowerCase()) ||
      (i.barcode && i.barcode.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Price List & Catalog</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage print jobs, photocopying, binding rates, and retail stationery.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            onClick={handleOpenNew}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Service/Item</span>
          </button>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Service Name</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Unit</th>
              <th className="py-3 px-4">Barcode / SKU</th>
              <th className="py-3 px-4 text-right">Price (Rs.)</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  Loading catalog items...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  No items found.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-semibold text-slate-800 text-xs">
                    {item.name}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 capitalize">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-500 font-mono">
                    /{item.unit}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-500 font-mono">
                    {item.barcode || '-'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-xs text-slate-900">
                    Rs. {Number(item.unit_price).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        item.is_active
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {item.is_active ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition"
                      title="Edit Price & Details"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Item Modal */}
      {(isNew || editItem) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-base text-slate-900">
                {isNew ? 'Add New Catalog Item' : 'Edit Service Price'}
              </h3>
              <button
                onClick={() => {
                  setIsNew(false);
                  setEditItem(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Item / Service Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ItemCategory)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="printing">Printing</option>
                    <option value="photocopy">Photocopy</option>
                    <option value="lamination">Lamination</option>
                    <option value="binding">Binding</option>
                    <option value="stationery">Stationery</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="page, sheet, copy..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Unit Price (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Barcode / SKU (Optional)
                  </label>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <label htmlFor="isActiveToggle" className="text-xs font-semibold text-slate-700">
                  Visible on Cash Register Till
                </label>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow transition"
                >
                  {saving ? 'Saving...' : 'Save Service'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsNew(false);
                    setEditItem(null);
                  }}
                  className="px-4 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
