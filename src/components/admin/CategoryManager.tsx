'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Tag from 'lucide-react/dist/esm/icons/tag';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Edit3 from 'lucide-react/dist/esm/icons/edit-3';
import LayoutGrid from 'lucide-react/dist/esm/icons/layout-grid';
import Check from 'lucide-react/dist/esm/icons/check';
import X from 'lucide-react/dist/esm/icons/x';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ImageUpload } from '@/components/builder/ImageUpload';
import { toast } from 'sonner';

interface Category {
    _id?: string;
    name: string;
    photo?: string;
    description?: string;
    order?: number;
}

interface CategoryManagerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    categories: Category[];
    onChange: () => void;
    productsCountByCategory?: Record<string, number>;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ open, onOpenChange, categories, onChange, productsCountByCategory = {} }) => {
    const [editing, setEditing] = React.useState<Category | null>(null);
    const [creating, setCreating] = React.useState(false);
    const [toDelete, setToDelete] = React.useState<Category | null>(null);

    const target = editing || (creating ? { name: '', description: '', photo: '' } : null);

    const save = async (cat: Category) => {
        if (!cat.name.trim()) { toast.error('El nombre es requerido'); return; }
        const isNew = !cat._id;
        try {
            const res = await fetch(isNew ? '/api/categories' : '/api/categories/' + cat._id, {
                method: isNew ? 'POST' : 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cat),
            });
            if (res.ok) {
                toast.success(isNew ? 'Categoria creada' : 'Categoria actualizada', { description: cat.name });
                onChange();
                setEditing(null);
                setCreating(false);
            } else {
                toast.error('No se pudo guardar');
            }
        } catch { toast.error('Error de red'); }
    };

    const del = async () => {
        if (!toDelete?._id) return;
        const inUse = (productsCountByCategory[toDelete._id!] || 0) > 0;
        try {
            const res = await fetch('/api/categories/' + toDelete._id, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Categoria eliminada', { description: inUse ? 'Los productos quedaron sin categoria' : toDelete.name });
                onChange();
            }
        } finally { setToDelete(null); }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[720px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
                    <DialogHeader className="px-5 py-4 border-b bg-card/50">
                        <DialogTitle className="font-heading flex items-center gap-2">
                            <span className="size-8 rounded-md grid place-items-center bg-primary/10 text-primary">
                                <LayoutGrid className="size-4" />
                            </span>
                            Categorias del catalogo
                        </DialogTitle>
                        <DialogDescription>
                            Organiza tus productos en categorias. Cada una puede tener una foto que aparece como banner en el menu.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                                <Tag className="size-3.5" />
                                <span><b className="text-foreground font-mono">{categories.length}</b> categorias registradas</span>
                            </div>
                            <Button size="sm" onClick={() => setCreating(true)}>
                                <Plus className="size-4" /> Nueva categoria
                            </Button>
                        </div>

                        {categories.length === 0 ? (
                            <div className="text-center py-16 px-6 rounded-lg border border-dashed">
                                <LayoutGrid className="size-8 mx-auto mb-3 opacity-50 text-muted-foreground" />
                                <p className="text-[13px] font-medium mb-1">Aun no creaste categorias</p>
                                <p className="text-[11px] text-muted-foreground mb-4">Sin categorias, los productos aparecen sueltos.</p>
                                <Button size="sm" variant="outline" onClick={() => setCreating(true)}>
                                    <Plus className="size-3.5" /> Crear primera
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <AnimatePresence>
                                    {categories.map((c) => {
                                        const count = productsCountByCategory[c._id!] || 0;
                                        return (
                                            <motion.div
                                                key={c._id}
                                                layout
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -6 }}
                                                className="group flex items-center gap-3 rounded-lg border bg-card p-3 hover:border-primary/40 transition-colors"
                                            >
                                                <div className="size-12 rounded-md overflow-hidden bg-muted border shrink-0">
                                                    {c.photo
                                                        ? <img src={c.photo} className="w-full h-full object-cover" />
                                                        : <div className="w-full h-full grid place-items-center text-muted-foreground/50"><Tag className="size-4" /></div>}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="font-medium text-[13px] truncate">{c.name}</div>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                                                            {count} {count === 1 ? 'producto' : 'productos'}
                                                        </Badge>
                                                        {c.description && (
                                                            <span className="text-[10px] text-muted-foreground truncate">{c.description}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                    <Button size="sm" variant="ghost" className="size-8" onClick={() => setEditing(c)}>
                                                        <Edit3 className="size-3.5" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => setToDelete(c)}
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="px-5 py-3 border-t bg-card/30">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Editor sub-dialog */}
            <Dialog open={!!target} onOpenChange={(o) => { if (!o) { setEditing(null); setCreating(false); } }}>
                <DialogContent className="sm:max-w-[520px]">
                    {target && (
                        <CategoryForm
                            initial={target}
                            isNew={creating}
                            onCancel={() => { setEditing(null); setCreating(false); }}
                            onSave={save}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar categoria?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se eliminara <b>{toDelete?.name}</b>. Los productos con esta categoria quedaran sin categorizar (no se borran).
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={del} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

interface CategoryFormProps {
    initial: Category;
    isNew: boolean;
    onSave: (c: Category) => void;
    onCancel: () => void;
}

const CategoryForm: React.FC<CategoryFormProps> = ({ initial, isNew, onSave, onCancel }) => {
    const [name, setName] = React.useState(initial.name || '');
    const [description, setDescription] = React.useState(initial.description || '');
    const [photo, setPhoto] = React.useState(initial.photo || '');

    return (
        <>
            <DialogHeader>
                <DialogTitle className="font-heading flex items-center gap-2">
                    <span className="size-8 rounded-md grid place-items-center bg-primary/10 text-primary">
                        <Tag className="size-4" />
                    </span>
                    {isNew ? 'Nueva categoria' : 'Editar categoria'}
                </DialogTitle>
                <DialogDescription>
                    La foto aparece como banner cuando el widget muestra los productos de esta categoria.
                </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-4 py-2">
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="c-name">Nombre <span className="text-destructive">*</span></Label>
                        <Input id="c-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Gastronomia" />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="c-desc">Descripcion corta</Label>
                        <Textarea id="c-desc" value={description} onChange={(e) => setDescription(e.target.value)} className="h-20 resize-none" placeholder="Opcional. Aparece bajo el titulo de la categoria." />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-[11px]">Foto</Label>
                    <div className="aspect-square rounded-md border bg-muted overflow-hidden grid place-items-center relative">
                        {photo
                            ? <img src={photo} className="w-full h-full object-cover" />
                            : <div className="flex flex-col items-center text-muted-foreground/50"><Tag className="size-8 mb-1" /><span className="text-[10px] uppercase tracking-wide">Sin foto</span></div>}
                    </div>
                    <ImageUpload compact label={photo ? 'Cambiar' : 'Subir'} onUploadSuccess={(url) => setPhoto(url)} />
                    {photo && (
                        <Button size="sm" variant="ghost" className="w-full h-7 text-[11px] text-muted-foreground" onClick={() => setPhoto('')}>
                            Quitar
                        </Button>
                    )}
                </div>
            </div>

            <DialogFooter>
                <Button variant="outline" onClick={onCancel}>Cancelar</Button>
                <Button onClick={() => onSave({ ...initial, name, description, photo })}>
                    <Check className="size-4" /> {isNew ? 'Crear' : 'Guardar'}
                </Button>
            </DialogFooter>
        </>
    );
};
