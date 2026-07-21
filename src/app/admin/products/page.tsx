'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { ShoppingBag, Plus, Search, Trash2, Edit3, Image as ImageIcon, Check, X, Filter, Package, ChevronDown, DollarSign, Tag, Download, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageUpload } from '@/components/builder/ImageUpload';
import { ViewToggler } from '@/components/admin/ViewToggler';
import * as XLSX from 'xlsx';

export default function ProductsPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [prodRes, catRes] = await Promise.all([
                fetch('/api/products'),
                fetch('/api/categories')
            ]);
            const [prods, cats] = await Promise.all([prodRes.json(), catRes.json()]);
            setProducts(prods);
            setCategories(cats);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (product: any) => {
        const isNew = !product._id;
        try {
            const res = await fetch(isNew ? '/api/products' : `/api/products/${product._id}`, {
                method: isNew ? 'POST' : 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(product)
            });
            if (res.ok) {
                fetchData();
                setEditingProduct(null);
                setIsCreating(false);
            }
        } catch (err) {
            console.error('Error saving:', err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Seguro que deseas eliminar este producto?')) return;
        try {
            const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
            if (res.ok) fetchData();
        } catch (err) {
            console.error('Error deleting:', err);
        }
    };

    const handleExport = () => {
        const exportData = products.map(p => ({
            Nombre: p.name,
            Descripción: p.description,
            Precio: p.price,
            Moneda: p.currency,
            Disponible: p.available ? 'SI' : 'NO',
            Categorías: p.categoryIds?.map((id: string) => categories.find(c => c._id === id)?.name).join(', ') || ''
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Productos");
        XLSX.writeFile(wb, "catalogo_productos.xlsx");
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);

            for (const row of (data as any[])) {
                const product = {
                    name: row.Nombre,
                    description: row.Descripción,
                    price: Number(row.Precio),
                    currency: row.Moneda || '$',
                    available: row.Disponible === 'SI',
                    categoryIds: [] // Manual assignment or lookup could be added here
                };

                await fetch('/api/products', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(product)
                });
            }
            fetchData();
            alert('Importación completada');
        };
        reader.readAsBinaryString(file);
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'ALL' || p.categoryIds?.includes(selectedCategory);
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-[#050505] font-sans">
            <AdminHeader
                title="Catálogo de Productos"
                subtitle="Gestión de menú y precios"
                icon={<ShoppingBag className="w-5 h-5" />}
                actions={
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleExport}
                            className="bg-white/5 hover:bg-white/10 text-white text-[9px] font-black uppercase px-4 py-2.5 rounded border border-white/10 flex items-center gap-2 transition-all active:scale-95 tracking-wider"
                        >
                            <Download className="w-3.5 h-3.5" /> Exportar
                        </button>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-white/5 hover:bg-white/10 text-white text-[9px] font-black uppercase px-4 py-2.5 rounded border border-white/10 flex items-center gap-2 transition-all active:scale-95 tracking-wider"
                        >
                            <Upload className="w-3.5 h-3.5" /> Importar
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".xlsx,.xls" />
                        <div className="w-px h-8 bg-white/10 mx-1" />
                        <button
                            onClick={() => setIsCreating(true)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase px-6 py-2.5 rounded flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-500/20 tracking-wider"
                        >
                            <Plus className="w-4 h-4" /> Nuevo Producto
                        </button>
                    </div>
                }
            />

            <div className="flex-1 overflow-hidden flex flex-col">
                {/* Filters Bar */}
                <div className="px-10 py-6 border-b border-white/5 bg-black/20 flex flex-wrap items-center gap-6">
                    <div className="relative group/search flex-1 min-w-[300px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 group-focus-within/search:text-emerald-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="BUSCAR PRODUCTOS..."
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded py-3 pl-12 pr-6 text-[10px] font-black uppercase tracking-widest outline-none focus:border-emerald-500/50 transition-all text-neutral-300 placeholder:text-neutral-700 focus:bg-emerald-500/5"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative group/filter">
                            <div className="flex items-center gap-2 bg-[#0a0a0a] border border-white/10 rounded px-2 relative focus-within:border-emerald-500/50 transition-colors h-[42px]">
                                <Tag className="w-3.5 h-3.5 text-neutral-600 ml-2" />
                                <select
                                    className="bg-transparent border-none rounded px-2 text-[10px] font-black uppercase tracking-widest text-neutral-400 outline-none appearance-none cursor-pointer pr-8 hover:text-white transition-colors h-full w-full"
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                >
                                    <option value="ALL" className="bg-[#111]">Todas las Categorías</option>
                                    {categories.map(cat => (
                                        <option key={cat._id} value={cat._id} className="bg-[#111]">{cat.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="w-3 h-3 text-neutral-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        </div>
                        <div className="w-px h-8 bg-white/10 mx-2" />
                        <ViewToggler viewMode={viewMode} setViewMode={setViewMode} />
                    </div>
                </div>

                {/* Content Layout */}
                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredProducts.map((p) => (
                                <motion.div
                                    layout
                                    key={p._id}
                                    className="bg-[#0a0a0a] border border-white/5 rounded overflow-hidden group hover:border-emerald-500/30 transition-all shadow-xl flex flex-col"
                                >
                                    <div className="aspect-video relative overflow-hidden bg-black">
                                        {p.photo ? (
                                            <img src={p.photo} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={p.name} />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-neutral-700 bg-neutral-900/40">
                                                <Package className="w-10 h-10 mb-2 opacity-20" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-90" />

                                        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                                            <button onClick={() => setEditingProduct(p)} className="p-2 bg-black/80 backdrop-blur-md rounded text-white hover:bg-emerald-500 border border-white/10 transition-all hover:scale-105">
                                                <Edit3 className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={() => handleDelete(p._id)} className="p-2 bg-black/80 backdrop-blur-md rounded text-red-500 hover:bg-red-500 hover:text-white border border-white/10 transition-all hover:scale-105">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        <div className="absolute bottom-4 left-5 right-5">
                                            <div className="flex flex-wrap gap-1 mb-2">
                                                {p.categoryIds?.map((catId: string) => {
                                                    const cat = categories.find(c => c._id === catId);
                                                    return cat ? (
                                                        <span key={catId} className="px-2 py-0.5 bg-neutral-800/80 border border-white/10 rounded-sm text-[7px] font-black text-white uppercase tracking-widest backdrop-blur-sm">
                                                            {cat.name}
                                                        </span>
                                                    ) : null;
                                                })}
                                            </div>
                                            <h3 className="text-sm font-black text-white uppercase italic tracking-tighter truncate drop-shadow-md">{p.name}</h3>
                                        </div>
                                    </div>

                                    <div className="p-5 flex-1 flex flex-col justify-between">
                                        <p className="text-[10px] text-neutral-500 font-medium line-clamp-2 uppercase italic mb-4 leading-relaxed">
                                            {p.description || 'Sin descripción disponible para este producto.'}
                                        </p>

                                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-bold text-neutral-600 uppercase tracking-widest">Precio</span>
                                                <span className="text-xl font-black text-emerald-500 tracking-tighter flex items-center">
                                                    <span className="text-sm mr-0.5 opacity-50">{p.currency}</span>{p.price}
                                                </span>
                                            </div>
                                            <div className={`px-2 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-wider ${p.available ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                                {p.available ? 'En Stock' : 'Agotado'}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-[#0a0a0a] border border-white/5 rounded shadow-2xl">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/[0.02] text-[9px] font-black uppercase tracking-[0.2em] text-neutral-500">
                                        <th className="p-6 pl-8 w-24">Item</th>
                                        <th className="p-6">Producto</th>
                                        <th className="p-6">Categoría</th>
                                        <th className="p-6">Precio</th>
                                        <th className="p-6">Estado</th>
                                        <th className="p-6 pr-8 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="text-xs font-medium text-neutral-300">
                                    {filteredProducts.map((p) => (
                                        <tr key={p._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                            <td className="p-5 pl-8">
                                                <div className="w-12 h-12 rounded bg-black overflow-hidden border border-white/10 shadow-lg relative group-hover:border-white/20 transition-all">
                                                    {p.photo ? <img src={p.photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package className="w-4 h-4 text-neutral-700" /></div>}
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-black text-white uppercase italic tracking-tight text-sm">{p.name}</span>
                                                    <span className="text-[9px] text-neutral-600 font-bold uppercase tracking-wide truncate max-w-[200px]">{p.description}</span>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex gap-2">
                                                    {p.categoryIds?.map((catId: string) => {
                                                        const cat = categories.find(c => c._id === catId);
                                                        return cat ? <span key={catId} className="px-2 py-0.5 bg-white/5 text-neutral-400 text-[9px] font-black rounded-sm uppercase tracking-wider">{cat.name}</span> : null;
                                                    })}
                                                </div>
                                            </td>
                                            <td className="p-5 font-black text-emerald-500">{p.currency}{p.price}</td>
                                            <td className="p-5">
                                                <span className={`px-2.5 py-1 rounded-sm text-[8px] font-black uppercase tracking-widest ${p.available ? 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/10' : 'text-red-500 bg-red-500/10 border border-red-500/10'}`}>
                                                    {p.available ? 'Disponible' : 'Sin Stock'}
                                                </span>
                                            </td>
                                            <td className="p-5 pr-8 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => setEditingProduct(p)} className="p-2.5 hover:bg-white/10 rounded text-neutral-400 hover:text-white transition-all">
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(p._id)} className="p-2.5 hover:bg-red-500/10 rounded text-neutral-400 hover:text-red-500 transition-all">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {filteredProducts.length === 0 && !loading && (
                        <div className="flex flex-col items-center justify-center py-32 text-neutral-700 border border-white/5 rounded bg-white/[0.01]">
                            <Package className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em]">No hay productos</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit / Create Modal */}
            <AnimatePresence>
                {(editingProduct || isCreating) && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="bg-[#0f0f0f] border border-white/10 rounded-md w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

                            <div className="p-8 pb-4 flex justify-between items-center bg-[#0a0a0a] border-b border-white/5">
                                <div>
                                    <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">
                                        {isCreating ? 'Crear Producto' : 'Editar Producto'}
                                    </h2>
                                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1">Gestión de inventario</p>
                                </div>
                                <button onClick={() => { setEditingProduct(null); setIsCreating(false); }} className="p-2.5 hover:bg-white/5 rounded text-neutral-500 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-[#0f0f0f]">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    {/* Left: Info */}
                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1 flex items-center gap-2">Nombre Comercial <span className="text-red-500">*</span></label>
                                            <input
                                                className="w-full bg-[#0a0a0a] border border-white/10 rounded px-5 py-4 text-white font-black italic outline-none focus:border-emerald-500/50 transition-all shadow-inner uppercase text-sm placeholder:text-neutral-800 focus:bg-emerald-500/5"
                                                defaultValue={editingProduct?.name || ''}
                                                id="p-name"
                                                placeholder="EJ: HAMBURGUESA DOBLE"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">Moneda</label>
                                                <input
                                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded px-4 py-4 text-center text-white font-black italic outline-none focus:border-emerald-500/50 transition-all shadow-inner text-sm"
                                                    defaultValue={editingProduct?.currency || '$'}
                                                    id="p-currency"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">Precio</label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        className="w-full bg-[#0a0a0a] border border-white/10 rounded px-4 py-4 pl-10 text-emerald-500 font-black italic outline-none focus:border-emerald-500/50 transition-all shadow-inner text-sm"
                                                        defaultValue={editingProduct?.price || 0}
                                                        id="p-price"
                                                    />
                                                    <DollarSign className="w-3.5 h-3.5 text-neutral-600 absolute left-4 top-1/2 -translate-y-1/2" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">Categoría</label>
                                            <div className="relative group/select">
                                                <select
                                                    id="p-cat"
                                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded px-5 py-4 text-white font-black italic outline-none focus:border-emerald-500/50 appearance-none text-xs cursor-pointer focus:bg-emerald-500/5 transition-all"
                                                    defaultValue={editingProduct?.categoryIds?.[0] || ''}
                                                >
                                                    <option value="" className="bg-[#111]">SIN CATEGORÍA</option>
                                                    {categories.map(cat => (
                                                        <option key={cat._id} value={cat._id} className="bg-[#111]">{cat.name}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="w-4 h-4 text-neutral-600 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within/select:text-emerald-500 transition-colors" />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">Descripción</label>
                                            <textarea
                                                className="w-full bg-[#0a0a0a] border border-white/10 rounded px-5 py-4 text-white font-medium italic outline-none focus:border-emerald-500/50 transition-all shadow-inner h-32 resize-none uppercase text-xs placeholder:text-neutral-800 custom-scrollbar focus:bg-emerald-500/5"
                                                defaultValue={editingProduct?.description || ''}
                                                id="p-desc"
                                                placeholder="INGREDIENTES, DETALLES..."
                                            />
                                        </div>
                                    </div>

                                    {/* Right: Media */}
                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">Imagen del Producto</label>
                                            <div className="aspect-square bg-[#0a0a0a] border border-white/10 rounded overflow-hidden flex flex-col items-center justify-center group relative hover:border-emerald-500/30 transition-all shadow-inner">
                                                <ImageUpload
                                                    compact
                                                    onUploadSuccess={(url) => {
                                                        const img = document.getElementById('p-preview') as HTMLImageElement;
                                                        if (img) img.src = url;
                                                        (document.getElementById('p-photo') as HTMLInputElement).value = url;
                                                    }}
                                                />
                                                <img
                                                    id="p-preview"
                                                    src={editingProduct?.photo || undefined}
                                                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${editingProduct?.photo ? 'opacity-100' : 'opacity-0'}`}
                                                />
                                                <input type="hidden" id="p-photo" defaultValue={editingProduct?.photo || ''} />
                                            </div>
                                            <p className="text-[8px] text-neutral-600 font-medium uppercase tracking-wide text-center">Se recomienda imagen cuadrada (1:1)</p>
                                        </div>

                                        <div className="flex items-center gap-4 p-5 bg-[#0a0a0a] rounded border border-white/10 hover:border-emerald-500/30 transition-all cursor-pointer group" onClick={() => (document.getElementById('p-available') as HTMLElement).click()}>
                                            <div className="relative flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id="p-available"
                                                    className="peer sr-only"
                                                    defaultChecked={editingProduct ? editingProduct.available : true}
                                                />
                                                <div className="w-11 h-6 bg-neutral-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                            </div>

                                            <div>
                                                <label className="text-white font-black italic uppercase text-xs cursor-pointer group-hover:text-emerald-500 transition-colors">Producto Disponible</label>
                                                <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest">Mostrar en menú público</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-white/5 bg-[#0a0a0a] flex justify-end gap-3">
                                <button
                                    onClick={() => { setEditingProduct(null); setIsCreating(false); }}
                                    className="px-6 py-3 rounded text-neutral-500 font-black uppercase tracking-widest text-[10px] hover:bg-white/5 hover:text-white transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => {
                                        const name = (document.getElementById('p-name') as HTMLInputElement).value;
                                        if (!name) { alert('El nombre es requerido'); return; }

                                        const p = {
                                            _id: editingProduct?._id,
                                            name,
                                            price: Number((document.getElementById('p-price') as HTMLInputElement).value),
                                            currency: (document.getElementById('p-currency') as HTMLInputElement).value,
                                            description: (document.getElementById('p-desc') as HTMLTextAreaElement).value,
                                            photo: (document.getElementById('p-photo') as HTMLInputElement).value,
                                            categoryIds: [(document.getElementById('p-cat') as HTMLSelectElement).value],
                                            available: (document.getElementById('p-available') as HTMLInputElement).checked
                                        };
                                        handleSave(p);
                                    }}
                                    className="px-8 py-3 rounded bg-emerald-600 text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                                >
                                    <Check className="w-4 h-4" /> Guardar
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
