'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Trash2, Plus, Loader2, Pencil, X, Check } from 'lucide-react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<{id: number, name: string, stock: number}[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCat, setNewCat] = useState('');
  const [newStock, setNewStock] = useState<number>(0);
  const [isAdding, setIsAdding] = useState(false);
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editStock, setEditStock] = useState<number>(0);

  const supabase = createClient();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    const { data } = await supabase.from('winner_categories').select('*').order('name');
    if (data) setCategories(data);
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.trim()) return;
    setIsAdding(true);

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCat.trim(), stock: newStock })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add category');
      
      setCategories([...categories, data.category].sort((a,b) => a.name.localeCompare(b.name)));
      setNewCat('');
      setNewStock(0);
    } catch (err: any) {
      alert(err.message);
    }
    setIsAdding(false);
  };

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) return;
    
    try {
      const res = await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: editName.trim(), stock: editStock })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update category');
      
      setCategories(categories.map(c => c.id === id ? data.category : c).sort((a,b) => a.name.localeCompare(b.name)));
      setEditingId(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category? Past logs with this category name will keep the name as exact text.')) return;

    try {
      const res = await fetch('/api/categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete category');
      
      setCategories(categories.filter(c => c.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="animate-spin text-gray-400" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Manage Categories</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-6 bg-gray-50 border-b border-gray-100">
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kategori Hadiah</label>
              <input
                type="text"
                placeholder="e.g. Doorprize Utama"
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gold-500 outline-none"
              />
            </div>
            <div className="w-full sm:w-32">
              <label className="block text-sm font-medium text-gray-700 mb-1">Stok / Sisa</label>
              <input
                type="number"
                min="0"
                value={newStock}
                onChange={(e) => setNewStock(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gold-500 outline-none font-bold"
              />
            </div>
            <button
              type="submit"
              disabled={isAdding || !newCat.trim()}
              className="bg-gold-500 text-gray-900 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gold-400 disabled:opacity-50 transition-colors w-full sm:w-auto h-[50px] sm:h-auto"
            >
              {isAdding ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
              Tambah
            </button>
          </form>
        </div>

        <div className="divide-y divide-gray-100 p-6">
          {categories.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No categories configured yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {categories.map((cat) => (
                <div key={cat.id} className="flex flex-col p-4 rounded-xl border border-gray-100 bg-gray-50 hover:border-gray-200 transition-colors">
                  {editingId === cat.id ? (
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gold-500 outline-none"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600">Stok:</span>
                        <input
                          type="number"
                          min="0"
                          value={editStock}
                          onChange={(e) => setEditStock(parseInt(e.target.value) || 0)}
                          className="w-20 px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gold-500 outline-none"
                        />
                        <div className="flex-1"></div>
                        <button
                          onClick={() => handleUpdate(cat.id)}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                          title="Save Changes"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors"
                          title="Cancel"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-gray-800 break-words">{cat.name}</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setEditingId(cat.id);
                              setEditName(cat.name);
                              setEditStock(cat.stock);
                            }}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Category"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(cat.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Category"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-gray-600 bg-white px-3 py-1.5 rounded-lg border border-gray-100 w-fit">
                        Stok: <span className="text-gold-600 font-bold ml-1">{cat.stock}</span>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
