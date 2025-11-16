"use client"

import React, { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DocumentData, collection, doc } from 'firebase/firestore'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { jsPDF } from 'jspdf'

import { useToast } from '@/hooks/use-toast'
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase'

import { formatCurrency } from '@/utils/formatters'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// Tipos locales
type Supplier = {
  id: string
  name: string
  ruc?: string
  email?: string
  phone?: string
}

type Purchase = {
  id: string
  date: string
  supplierId?: string
  total: number
  status?: string
}

const STATUS_OPTIONS = [
  { label: 'Borrador', value: 'draft' },
  { label: 'Recibido', value: 'received' },
  { label: 'Anulado', value: 'canceled' },
]

const purchaseFormSchema = z.object({
  supplierId: z.string().optional(),
  date: z.string().optional(),
  notes: z.string().optional(),
})

type PurchaseFormValues = z.infer<typeof purchaseFormSchema>

export default function PurchasesClientPage() {
  const router = useRouter()
  const { toast } = useToast()

  const firestore = useFirestore()
  const suppliersCollection = useMemoFirebase(() => (firestore ? collection(firestore, 'suppliers') : null), [firestore])
  const purchasesCollection = useMemoFirebase(() => (firestore ? collection(firestore, 'purchases') : null), [firestore])

  const { data: suppliers } = useCollection<Supplier>(suppliersCollection)
  const { data: purchases } = useCollection<Purchase>(purchasesCollection)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)

  const form = useForm<PurchaseFormValues>({
    defaultValues: { supplierId: undefined, date: undefined },
  })

  // Cálculo de totales
  const totalAmount = useMemo(() => {
    if (!purchases) return 0
    return purchases.reduce((acc: number, p: Purchase) => acc + (typeof p.total === 'number' ? p.total : 0), 0)
  }, [purchases])

  const createPurchase = useCallback(async (values: PurchaseFormValues) => {
    if (!firestore || !purchasesCollection) {
      toast({ title: 'Sin conexión con Firestore', description: 'No se puede crear la compra en este momento.', variant: 'destructive' })
      return
    }

    try {
      const newId = doc(purchasesCollection).id
      const payload: Partial<Purchase> = {
        id: newId,
        date: values.date || new Date().toISOString(),
        supplierId: values.supplierId,
        total: 0,
        status: 'draft',
      }

      await setDocumentNonBlocking(firestore, doc(firestore, `purchases/${newId}`), payload as DocumentData, { merge: true })

      toast({ title: 'Compra creada', description: 'La compra se ha creado correctamente.' })
      router.refresh()
      setIsDialogOpen(false)
    } catch (err) {
      console.error(err)
      toast({ title: 'Error', description: 'No se pudo crear la compra.', variant: 'destructive' })
    }
  }, [firestore, purchasesCollection, router, toast])

  const deletePurchase = useCallback(async (purchaseId: string) => {
    if (!firestore) return
    try {
      await deleteDocumentNonBlocking(firestore, doc(firestore, `purchases/${purchaseId}`))
      toast({ title: 'Compra eliminada' })
      router.refresh()
    } catch (err) {
      console.error(err)
      toast({ title: 'Error', description: 'No se pudo eliminar la compra.', variant: 'destructive' })
    }
  }, [firestore, router, toast])

  const exportToPdf = useCallback((p: Purchase) => {
    const docPdf = new jsPDF()
    docPdf.text(`Compra: ${p.id}`, 10, 10)
    docPdf.text(`Fecha: ${p.date}`, 10, 20)
    docPdf.text(`Total: ${formatCurrency(p.total)}`, 10, 30)
    docPdf.save(`compra-${p.id}.pdf`)
  }, [])

  return (
    <div>
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Compras</h1>
        <div className="flex gap-2">
          <Button onClick={() => setIsDialogOpen(true)}>Nueva compra</Button>
          <Button onClick={() => {
            // Ejemplo simple: generar reporte PDF de totales
            const docPdf = new jsPDF()
            docPdf.text(`Total de compras: ${formatCurrency(totalAmount)}`, 10, 10)
            docPdf.save('reporte-compras.pdf')
          }}>Exportar totales</Button>
        </div>
      </header>

      <section>
        <div className="mb-2">Total: {formatCurrency(totalAmount)}</div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(purchases || []).map(p => (
              <TableRow key={p.id}>
                <TableCell>{p.id}</TableCell>
                <TableCell>{p.date}</TableCell>
                <TableCell>{suppliers?.find(s => s.id === p.supplierId)?.name || ''}</TableCell>
                <TableCell>{formatCurrency(p.total)}</TableCell>
                <TableCell>{p.status || ''}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => { setSelectedPurchase(p); exportToPdf(p) }}>PDF</Button>
                    <Button variant="destructive" onClick={() => deletePurchase(p.id)}>Eliminar</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <div className="p-4 w-[680px]">
          <h2 className="text-lg font-medium mb-4">Crear compra</h2>
          <form onSubmit={form.handleSubmit(createPurchase)} className="space-y-3">
            <div>
              <label htmlFor="supplierId" className="block text-sm font-medium mb-1">Proveedor</label>
              <select id="supplierId" {...form.register('supplierId')} className="w-full" autoComplete="off">
                <option value="">-- Seleccione --</option>
                {suppliers?.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="purchase-date" className="block text-sm font-medium mb-1">Fecha</label>
              <Input id="purchase-date" type="date" {...form.register('date')} autoComplete="off" />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">Crear</Button>
            </div>
          </form>
        </div>
      </Dialog>
    </div>
  )
}

