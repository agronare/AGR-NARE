"use client"

import React, { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { PlusCircle, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/utils/formatters'

export type SupplierOption = { id: string; name: string }

export type PurchaseItemInput = {
  id: string
  name: string
  qty: number
  unitPrice: number
}

export type NewPurchaseInput = {
  quotationId?: string | null
  supplierId: string
  supplierName: string
  branch?: string | null
  date: Date
  status: 'Pendiente' | 'Completada' | 'Cancelada'
  paymentMethod: 'Efectivo' | 'Tarjeta' | 'Credito'
  notes?: string | null
  campaign?: string | null
  items: PurchaseItemInput[]
}

type AddPurchaseDialogProps = {
  suppliers: SupplierOption[]
  onCreate: (data: NewPurchaseInput) => Promise<void> | void
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddPurchaseDialog({ suppliers, onCreate, open, onOpenChange }: AddPurchaseDialogProps) {
  const [supplierId, setSupplierId] = useState('')
  const supplierName = useMemo(() => suppliers.find((s) => s.id === supplierId)?.name || '', [supplierId, suppliers])

  const [date, setDate] = useState<Date>(new Date())
  const [status, setStatus] = useState<'Pendiente' | 'Completada' | 'Cancelada'>('Pendiente')
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Tarjeta' | 'Credito'>('Efectivo')
  const [branch, setBranch] = useState('')
  const [notes, setNotes] = useState('')
  const [campaign, setCampaign] = useState('')
  const [quotationId, setQuotationId] = useState<string | null>(null)

  const [items, setItems] = useState<PurchaseItemInput[]>([])

  const total = useMemo(() => items.reduce((acc, it) => acc + it.qty * it.unitPrice, 0), [items])

  const addItem = () => setItems((prev) => [...prev, { id: crypto.randomUUID(), name: '', qty: 1, unitPrice: 0 }])
  const updateItem = (id: string, patch: Partial<PurchaseItemInput>) => setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  const removeItem = (id: string) => setItems((prev) => prev.filter((it) => it.id !== id))

  const resetForm = () => {
    setSupplierId('')
    setDate(new Date())
    setStatus('Pendiente')
    setPaymentMethod('Efectivo')
    setBranch('')
    setNotes('')
    setCampaign('')
    setQuotationId(null)
    setItems([])
  }

  const handleCreate = async () => {
    if (!supplierId || items.length === 0) return
    await onCreate({
      quotationId,
      supplierId,
      supplierName,
      branch: branch || null,
      date,
      status,
      paymentMethod,
      notes: notes || null,
      campaign: campaign || null,
      items,
    })
    resetForm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Orden de Compra</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="quotationId">Cargar desde Cotización (Opcional)</Label>
            <Input id="quotationId" name="quotationId" placeholder="Pega el ID o deja en blanco…" autoComplete="off" value={quotationId ?? ''} onChange={(e) => setQuotationId(e.target.value || null)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplierId">Proveedor</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger id="supplierId" name="supplierId" autoComplete="off">
                <SelectValue placeholder="Seleccionar…" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="branch">Sucursal de Destino</Label>
            <Input id="branch" name="branch" placeholder="Seleccionar o escribir…" autoComplete="off" value={branch} onChange={(e) => setBranch(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Fecha</Label>
            <Input id="date" name="date" type="date" autoComplete="off" value={format(date, 'yyyy-MM-dd')} onChange={(e) => setDate(new Date(e.target.value))} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Estado</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger id="status" name="status" autoComplete="off"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Pendiente">Pendiente</SelectItem>
                <SelectItem value="Completada">Completada</SelectItem>
                <SelectItem value="Cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment">Método de Pago</Label>
            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as typeof paymentMethod)}>
              <SelectTrigger id="payment" name="payment" autoComplete="off"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Efectivo">Efectivo</SelectItem>
                <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                <SelectItem value="Credito">Crédito</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-1">
            <Label htmlFor="campaign">Campaña Agrícola (ID Recepción)</Label>
            <Input id="campaign" name="campaign" placeholder="Ej: Primavera 2024" autoComplete="off" value={campaign} onChange={(e) => setCampaign(e.target.value)} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea id="notes" name="notes" autoComplete="off" placeholder="Cualquier información adicional…" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <div className="space-y-3 border-t pt-4">
          <div className="flex items-center justify-between">
            <p className="font-medium">Productos</p>
            <Button variant="secondary" onClick={addItem} className="gap-2" type="button"><PlusCircle className="h-4 w-4" />Agregar Producto</Button>
          </div>
          <div className="space-y-2">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin productos aún.</p>
            ) : (
              items.map((it) => (
                <div key={it.id} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_auto] gap-3 items-center">
                  <Input placeholder="Nombre o SKU" autoComplete="off" value={it.name} onChange={(e) => updateItem(it.id, { name: e.target.value })} />
                  <Input type="number" min={1} step={1} placeholder="Cantidad" autoComplete="off" value={it.qty} onChange={(e) => updateItem(it.id, { qty: Math.max(1, Number(e.target.value || 1)) })} />
                  <Input type="number" min={0} step="0.01" placeholder="Precio unitario" autoComplete="off" value={it.unitPrice} onChange={(e) => updateItem(it.id, { unitPrice: Math.max(0, Number(e.target.value || 0)) })} />
                  <Button type="button" variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => removeItem(it.id)} aria-label="Eliminar producto"><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))
            )}
          </div>
          <div className="flex justify-end text-sm font-medium">Total: {formatCurrency(total)}</div>
        </div>

        <DialogFooter className="mt-2">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="button" onClick={handleCreate} disabled={!supplierId || items.length === 0}>Crear Orden de Compra</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AddPurchaseDialog
'use client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Plus, Trash2 } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { useEffect, useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Supplier } from '@/app/erp/suppliers/page';
// Local Product type (page module does not export Product)
type Product = {
  id?: string;
  sku: string;
  name: string;
};
// Local Quotation type (module does not export Quotation)
type Quotation = {
  id: string;
  quotationNumber: string;
};

type AddPurchaseDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddPurchase: (data: any) => void;
};

const productSchema = z.object({
    productId: z.string().min(1, "Selecciona un producto."),
    quantity: z.coerce.number().min(1, "La cantidad debe ser mayor a 0."),
    cost: z.coerce.number().min(0, "El costo debe ser positivo."),
});

const extraCostSchema = z.object({
    description: z.string().min(1, "La descripción es requerida."),
    amount: z.coerce.number().min(0, "El monto debe ser positivo."),
});


const purchaseSchema = z.object({
  supplierId: z.string().min(1, "Selecciona un proveedor."),
  approvedQuotationId: z.string().optional(),
  agriculturalCampaign: z.string().optional(),
  paymentMethod: z.string().min(1, "Selecciona un método de pago."),
  products: z.array(productSchema).min(1, "Debes agregar al menos un producto."),
  extraCosts: z.array(extraCostSchema).optional(),
});

export function AddPurchaseDialog({
  isOpen,
  onOpenChange,
  onAddPurchase,
}: AddPurchaseDialogProps) {
  const firestore = useFirestore();
  const suppliersCollection = useMemoFirebase(() => collection(firestore, 'suppliers'), [firestore]);
  const { data: suppliers } = useCollection<Supplier>(suppliersCollection);

  const productsCollection = useMemoFirebase(() => collection(firestore, 'products'), [firestore]);
  const { data: products } = useCollection<Product>(productsCollection);

  const quotationsCollection = useMemoFirebase(() => collection(firestore, 'quotations'), [firestore]);
  const { data: quotations } = useCollection<Quotation>(quotationsCollection);

  const form = useForm<z.infer<typeof purchaseSchema>>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      supplierId: '',
      paymentMethod: 'efectivo',
      products: [],
      extraCosts: [],
    },
  });

  const { fields: productFields, append: appendProduct, remove: removeProduct } = useFieldArray({
    control: form.control,
    name: "products",
  });

  const { fields: costFields, append: appendCost, remove: removeCost } = useFieldArray({
    control: form.control,
    name: "extraCosts",
  });

  const [subtotal, setSubtotal] = useState(0);
  const [iva, setIva] = useState(0);
  const [total, setTotal] = useState(0);

  const watchedProducts = form.watch('products');
  const watchedExtraCosts = form.watch('extraCosts');

  useEffect(() => {
    const productsTotal = watchedProducts?.reduce((acc, p) => acc + ((p.quantity || 0) * (p.cost || 0)), 0) || 0;
    const extraCostsTotal = watchedExtraCosts?.reduce((acc, c) => acc + (c.amount || 0), 0) || 0;
    
    const currentSubtotal = productsTotal + extraCostsTotal;
    const currentIva = currentSubtotal * 0.16;
    const currentTotal = currentSubtotal + currentIva;

    setSubtotal(currentSubtotal);
    setIva(currentIva);
    setTotal(currentTotal);

  }, [watchedProducts, watchedExtraCosts]);


  const onSubmit = (data: z.infer<typeof purchaseSchema>) => {
    const supplierName = suppliers?.find(s => s.id === data.supplierId)?.companyName || 'N/A';
    onAddPurchase({...data, supplierName});
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nueva Compra</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-[70vh] pr-6">
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="supplierId"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Proveedor</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {suppliers?.map(s => <SelectItem key={s.id} value={s.id}>{s.companyName}</SelectItem>)}
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="approvedQuotationId"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Cotización Aprobada</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {quotations?.map(q => <SelectItem key={q.id} value={q.id}>{q.quotationNumber}</SelectItem>)}
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="agriculturalCampaign"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Campaña Agrícola</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ej: Primavera 2025" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="paymentMethod"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Método de Pago</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="efectivo">Efectivo</SelectItem>
                                    <SelectItem value="tarjeta">Tarjeta</SelectItem>
                                    <SelectItem value="transferencia">Transferencia</SelectItem>
                                    <SelectItem value="credito">Crédito</SelectItem>
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <FormLabel>Productos</FormLabel>
                        {productFields.map((field, index) => (
                             <div key={field.id} className="flex items-start gap-2">
                                <FormField control={form.control} name={`products.${index}.productId`} render={({ field: selectField }) => (
                                    <FormItem className='flex-1'>
                                        <Select onValueChange={selectField.onChange} defaultValue={selectField.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Producto..." /></SelectTrigger></FormControl>
                                            <SelectContent>{products?.map(p => <SelectItem key={p.sku} value={p.sku}>{p.name}</SelectItem>)}</SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name={`products.${index}.quantity`} render={({ field: inputField }) => (
                                    <FormItem><FormControl><Input type="number" placeholder="Cant." {...inputField} className="w-20" /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name={`products.${index}.cost`} render={({ field: inputField }) => (
                                    <FormItem><FormControl><Input type="number" placeholder="Costo U." {...inputField} className="w-24" /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeProduct(index)}><Trash2 className="text-destructive h-4 w-4" /></Button>
                            </div>
                        ))}
                         <Button type="button" variant="link" size="sm" className="p-0 h-auto" onClick={() => appendProduct({ productId: '', quantity: 1, cost: 0 })}>
                            <Plus className="mr-2 h-4 w-4" /> Agregar Producto
                        </Button>
                        {form.formState.errors.products && <p className="text-sm font-medium text-destructive">{typeof form.formState.errors.products === 'object' && 'message' in form.formState.errors.products ? form.formState.errors.products.message : ''}</p>}
                    </div>

                    <div className="space-y-2">
                        <FormLabel>Costos Adicionales</FormLabel>
                        {costFields.map((field, index) => (
                             <div key={field.id} className="flex items-start gap-2">
                                <FormField control={form.control} name={`extraCosts.${index}.description`} render={({ field: inputField }) => (
                                    <FormItem className='flex-1'><FormControl><Input placeholder="Descripción (Ej: Flete)" {...inputField} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name={`extraCosts.${index}.amount`} render={({ field: inputField }) => (
                                    <FormItem><FormControl><Input type="number" placeholder="Monto" {...inputField} className="w-28" /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeCost(index)}><Trash2 className="text-destructive h-4 w-4" /></Button>
                            </div>
                        ))}
                         <Button type="button" variant="link" size="sm" className="p-0 h-auto" onClick={() => appendCost({ description: '', amount: 0 })}>
                            <Plus className="mr-2 h-4 w-4" /> Agregar Costo Extra
                        </Button>
                    </div>

                    <div className='flex flex-col items-end gap-1 text-sm pt-4'>
                        <p>Subtotal: <span className="font-semibold w-24 inline-block text-right">MXN {subtotal.toFixed(2)}</span></p>
                        <p>IVA (16%): <span className="font-semibold w-24 inline-block text-right">MXN {iva.toFixed(2)}</span></p>
                        <p>Descuento: <span className="font-semibold w-24 inline-block text-right">MXN 0.00</span></p>
                        <p className="text-base font-bold text-primary">Total: <span className="font-bold w-24 inline-block text-right">MXN {total.toFixed(2)}</span></p>
                    </div>

                </div>
            </ScrollArea>
            <DialogFooter className="pt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">Guardar Compra</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
