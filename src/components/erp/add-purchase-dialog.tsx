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
              <SelectTrigger id="supplierId" name="supplierId">
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
              <SelectTrigger id="status" name="status"><SelectValue /></SelectTrigger>
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
              <SelectTrigger id="payment" name="payment"><SelectValue /></SelectTrigger>
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
