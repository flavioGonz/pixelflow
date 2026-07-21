'use client';

import * as React from 'react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';
import ShoppingBag from 'lucide-react/dist/esm/icons/shopping-bag';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Search from 'lucide-react/dist/esm/icons/search';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Edit3 from 'lucide-react/dist/esm/icons/edit-3';
import Package from 'lucide-react/dist/esm/icons/package';
import Tag from 'lucide-react/dist/esm/icons/tag';
import Download from 'lucide-react/dist/esm/icons/download';
import Upload from 'lucide-react/dist/esm/icons/upload';
import MoreHorizontal from 'lucide-react/dist/esm/icons/more-horizontal';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { ViewToggler } from '@/components/admin/ViewToggler';
import { ImageUpload } from '@/components/builder/ImageUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

interface Product {
    _id?: string;
    name: string;
    description?: string;
    price: number;
    currency: string;
    photo?: string;
    available: boolean;
    categoryIds?: string[];
}

export default function ProductsPage() {
    const [products, setProducts] = React.useState<any[]>([]);
    const [categories, setCategories] = React.useState<any[]>([]);
    const [search, setSearch] = React.useState('');
    const [filterCat, setFilterCat] = React.useState('ALL');
    const [viewMode, setViewMode] = React.useState<'grid' | 'table'>('table');
    const [editing, setEditing] = React.useState<Product | null>(null);
    const [creating, setCreating] = React.useState(false);
    const [toDelete, setToDelete] = React.useState<any>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [pr, cr] = await Promise.all([fetch('/api/products'), fetch('/api/categories')]);
            const [pj, cj] = await Promise.all([pr.json(), cr.json()]);
            setProducts(pj);
            setCategories(cj);
        } catch (e) { console.error(e); }
    };

    const handleSave = async (p: Product) => {
        const isNew = !p._id;
        try {
            const res = await fetch(isNew ? '/api/products' : '/api/products/' + p._id, {
                method: isNew ? 'POST' : 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(p),
            });
            if (res.ok) {
                toast.success(isNew ? 'Producto creado' : 'Producto actualizado', { description: p.name });
                fetchData();
                setEditing(null);
                setCreating(false);
            } else {
                toast.error('No se pudo guardar');
            }
        } catch (e) { toast.error('Error de red'); }
    };

    const handleDelete = async () => {
        if (!toDelete) return;
        try {
            const res = await fetch('/api/products/' + toDelete._id, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Producto eliminado', { description: toDelete.name });
                fetchData();
            }
        } finally { setToDelete(null); }
    };

    const handleExport = () => {
        const data = products.map((p) => ({
            Nombre: p.name,
            Descripcion: p.description,
            Precio: p.price,
            Moneda: p.currency,
            Disponible: p.available ? 'SI' : 'NO',
            Categorias: (p.categoryIds || []).map((id: string) => categories.find((c) => c._id === id)?.name).filter(Boolean).join(', '),
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Productos');
        XLSX.writeFile(wb, 'catalogo_productos.xlsx');
        toast.success('Catalogo exportado');
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (evt) => {
            const wb = XLSX.read(evt.target?.result, { type: 'binary' });
            const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]) as any[];
            for (const row of rows) {
                await fetch('/api/products', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: row.Nombre,
                        description: row.Descripcion || row['Descripción'],
                        price: Number(row.Precio),
                        currency: row.Moneda || '$',
                        available: row.Disponible === 'SI',
                        categoryIds: [],
                    }),
                });
            }
            fetchData();
            toast.success('Importacion completada', { description: rows.length + ' productos' });
        };
        reader.readAsBinaryString(file);
    };

    const filtered = products.filter((p) => {
        const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase())
            || p.description?.toLowerCase().includes(search.toLowerCase());
        const matchCat = filterCat === 'ALL' || p.categoryIds?.includes(filterCat);
        return matchSearch && matchCat;
    });

    const target = editing || (creating ? { name: '', price: 0, currency: '$', available: true, categoryIds: [] } : null);

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-background text-foreground">
            <AdminHeader
                title="Catálogo de productos"
                subtitle="Gestión de menú y precios"
                icon={<ShoppingBag size={20} strokeWidth={1.75} />}
                actions={
                    <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={handleExport}>
                            <Download className="size-3.5" /> Exportar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                            <Upload className="size-3.5" /> Importar
                        </Button>
                        <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".xlsx,.xls" />
                        <Button size="sm" onClick={() => setCreating(true)}>
                            <Plus className="size-4" /> Nuevo producto
                        </Button>
                    </div>
                }
            />

            <div className="flex-1 overflow-hidden flex flex-col">
                <div className="px-6 py-3 border-b bg-card/30 flex items-center justify-between gap-4 flex-wrap">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar producto…"
                            className="h-9 pl-8"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <Select value={filterCat} onValueChange={(v) => setFilterCat(v || 'ALL')}>
                            <SelectTrigger className="h-9 w-[200px]">
                                <Tag className="size-3.5 text-muted-foreground" />
                                <SelectValue placeholder="Categoria" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Todas las categorias</SelectItem>
                                {categories.map((c) => (
                                    <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <ViewToggler viewMode={viewMode} setViewMode={setViewMode} />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {filtered.length === 0 ? (
                        <div className="grid place-items-center py-24 rounded-lg border border-dashed text-muted-foreground">
                            <div className="text-center">
                                <Package className="size-8 mx-auto mb-3 opacity-50" />
                                <p className="text-[13px] font-medium mb-3">
                                    {search || filterCat !== 'ALL' ? 'Sin coincidencias' : 'Aún no tenés productos'}
                                </p>
                                {!search && filterCat === 'ALL' && (
                                    <Button size="sm" variant="outline" onClick={() => setCreating(true)}>
                                        <Plus className="size-3.5" /> Crear primer producto
                                    </Button>
                                )}
                            </div>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            <AnimatePresence>
                                {filtered.map((p) => (
                                    <motion.div
                                        key={p._id}
                                        layout
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                    >
                                        <Card className="overflow-hidden group hover:border-primary/40 transition-colors py-0 gap-0">
                                            <div className="aspect-video bg-muted relative overflow-hidden">
                                                {p.photo ? (
                                                    <img src={p.photo} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                ) : (
                                                    <div className="w-full h-full grid place-items-center text-muted-foreground/40">
                                                        <Package className="size-10" />
                                                    </div>
                                                )}
                                                <div className="absolute top-2 right-2">
                                                    <Badge
                                                        variant={p.available ? 'default' : 'secondary'}
                                                        className={p.available ? '' : 'bg-muted text-muted-foreground'}
                                                    >
                                                        {p.available ? 'Disponible' : 'Agotado'}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <CardContent className="p-4 space-y-2">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="font-heading text-[14px] font-semibold tracking-tight truncate">
                                                            {p.name}
                                                        </h3>
                                                        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1">
                                                            {p.description || 'Sin descripcion'}
                                                        </p>
                                                    </div>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger className="size-7 grid place-items-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground shrink-0">
                                                            <MoreHorizontal className="size-3.5" />
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => setEditing(p)}>
                                                                <Edit3 className="size-3.5 mr-2" /> Editar
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => setToDelete(p)}
                                                                className="text-destructive focus:text-destructive"
                                                            >
                                                                <Trash2 className="size-3.5 mr-2" /> Eliminar
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>

                                                <div className="flex items-center justify-between pt-2 border-t">
                                                    <span className="font-mono text-[16px] font-bold text-primary tabular-nums">
                                                        {p.currency}{p.price}
                                                    </span>
                                                    <div className="flex gap-1">
                                                        {p.categoryIds?.slice(0, 2).map((id: string) => {
                                                            const c = categories.find((x) => x._id === id);
                                                            return c ? <Badge key={id} variant="outline" className="text-[10px]">{c.name}</Badge> : null;
                                                        })}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="rounded-lg border bg-card overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-16">Foto</TableHead>
                                        <TableHead>Producto</TableHead>
                                        <TableHead>Categoria</TableHead>
                                        <TableHead className="text-right">Precio</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.map((p) => (
                                        <TableRow key={p._id} className="group">
                                            <TableCell>
                                                <div className="size-10 rounded-md overflow-hidden bg-muted border">
                                                    {p.photo
                                                        ? <img src={p.photo} className="w-full h-full object-cover" />
                                                        : <div className="w-full h-full grid place-items-center text-muted-foreground"><Package className="size-4" /></div>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium truncate">{p.name}</div>
                                                <div className="text-[11px] text-muted-foreground truncate max-w-[280px]">
                                                    {p.description}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1 flex-wrap">
                                                    {p.categoryIds?.map((id: string) => {
                                                        const c = categories.find((x) => x._id === id);
                                                        return c ? <Badge key={id} variant="outline" className="text-[10px]">{c.name}</Badge> : null;
                                                    })}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-semibold tabular-nums">
                                                {p.currency}{p.price}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={p.available ? 'default' : 'secondary'} className="text-[10px]">
                                                    {p.available ? 'Disponible' : 'Agotado'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1 opacity-70 group-hover:opacity-100">
                                                    <Button size="sm" variant="ghost" className="size-8" onClick={() => setEditing(p)}>
                                                        <Edit3 className="size-3.5" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => setToDelete(p)}
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit / Create Dialog */}
            <Dialog open={!!target} onOpenChange={(o) => { if (!o) { setEditing(null); setCreating(false); } }}>
                <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
                    {target && (
                        <ProductForm
                            initial={target}
                            categories={categories}
                            onCancel={() => { setEditing(null); setCreating(false); }}
                            onSave={handleSave}
                            isNew={creating}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará <b>{toDelete?.name}</b> del catálogo.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Toaster />
        </div>
    );
}

interface ProductFormProps {
    initial: Product;
    categories: any[];
    isNew: boolean;
    onSave: (p: Product) => void;
    onCancel: () => void;
}

function ProductForm({ initial, categories, isNew, onSave, onCancel }: ProductFormProps) {
    const [name, setName] = React.useState(initial.name || '');
    const [description, setDescription] = React.useState(initial.description || '');
    const [price, setPrice] = React.useState(String(initial.price ?? 0));
    const [currency, setCurrency] = React.useState(initial.currency || '$');
    const [photo, setPhoto] = React.useState(initial.photo || '');
    const [available, setAvailable] = React.useState(initial.available ?? true);
    const [categoryId, setCategoryId] = React.useState(initial.categoryIds?.[0] || '');

    const submit = () => {
        if (!name.trim()) { toast.error('El nombre es requerido'); return; }
        onSave({
            ...initial,
            name,
            description,
            price: Number(price) || 0,
            currency,
            photo,
            available,
            categoryIds: categoryId ? [categoryId] : [],
        });
    };

    return (
        <>
            <DialogHeader>
                <DialogTitle className="font-heading flex items-center gap-2">
                    <span className="size-8 rounded-md grid place-items-center bg-primary/10 text-primary">
                        <Package className="size-4" />
                    </span>
                    {isNew ? 'Nuevo producto' : 'Editar producto'}
                </DialogTitle>
                <DialogDescription>Datos del producto y disponibilidad en el menú.</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-2">
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="p-name">Nombre <span className="text-destructive">*</span></Label>
                        <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Hamburguesa doble" />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="p-currency">Moneda</Label>
                            <Input id="p-currency" value={currency} onChange={(e) => setCurrency(e.target.value)} className="text-center" />
                        </div>
                        <div className="col-span-2 space-y-1.5">
                            <Label htmlFor="p-price">Precio</Label>
                            <Input id="p-price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Categoría</Label>
                        <Select value={categoryId || 'NONE'} onValueChange={(v) => setCategoryId((v === 'NONE' || !v) ? '' : v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Sin categoria" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="NONE">Sin categoria</SelectItem>
                                {categories.map((c) => (
                                    <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="p-desc">Descripcion</Label>
                        <Textarea id="p-desc" value={description} onChange={(e) => setDescription(e.target.value)} className="h-24 resize-none" placeholder="Ingredientes, detalles..." />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <Label>Imagen</Label>
                        <div className="aspect-square rounded-md border bg-muted overflow-hidden grid place-items-center relative">
                            {photo
                                ? <img src={photo} className="w-full h-full object-cover" />
                                : <div className="text-muted-foreground"><Package className="size-10 opacity-30" /></div>}
                        </div>
                        <ImageUpload compact label="Subir imagen" onUploadSuccess={(url) => setPhoto(url)} />
                    </div>

                    <div className="flex items-center justify-between rounded-md border bg-card px-3 py-2.5">
                        <div>
                            <Label htmlFor="p-avail" className="text-[12px] font-medium cursor-pointer">Disponible</Label>
                            <p className="text-[11px] text-muted-foreground">Mostrar en menú público</p>
                        </div>
                        <Switch id="p-avail" checked={available} onCheckedChange={setAvailable} />
                    </div>
                </div>
            </div>

            <DialogFooter>
                <Button variant="outline" onClick={onCancel}>Cancelar</Button>
                <Button onClick={submit}>{isNew ? 'Crear producto' : 'Guardar cambios'}</Button>
            </DialogFooter>
        </>
    );
}
