"use client";

export default function DeprecatedPurchasesPage() {
  // Legacy client page kept as a stub to avoid duplicate hook execution
  // The real purchases UI is provided by server `src/app/erp/purchases/page.tsx`
  return null;
}


'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Supplier, Product, PurchaseOrder, PurchaseOrderStatus, InventoryItem, Quote, Branch, ProductSchema } from '@/lib/types';
import { PlusCircle, Edit, Trash2, Loader2, CalendarIcon, AlertCircle, MoreHorizontal, BadgeCheck, CreditCard, AlertTriangle, Package, Truck, Filter, Search, Check, ChevronsUpDown, Download, FileText, QrCode, Send } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, setDocumentNonBlocking, addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc, Timestamp, query, runTransaction, writeBatch } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatCurrency } from '@/utils/formatters';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { PurchaseTicket } from '@/components/erp/purchases/PurchaseTicket';
import { QRCodeSVG } from 'qrcode.react';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const associatedCostSchema = z.object({
  concept: z.string().min(1, 'El concepto es requerido'),
  amount: z.coerce.number().min(0.01, 'El monto debe ser positivo'),
  prorate: z.boolean().default(true),
});

const purchaseItemSchema = z.object({
  productId: z.string().min(1, 'Producto es requerido'),
  productName: z.string(),
  quantity: z.coerce.number().min(1, 'La cantidad debe ser mayor a 0'),
  cost: z.coerce.number().min(0.01, 'El costo debe ser mayor a 0'),
  lotNumber: z.string().optional(),
  realCost: z.number().optional(), // Se calculará al guardar
});

const purchaseSchema = z.object({
  receptionId: z.string().optional(),
  supplierId: z.string().min(1, 'Proveedor es requerido'),
  branchId: z.string().min(1, 'Sucursal es requerida'),
  date: z.date({ required_error: 'La fecha es requerida' }),
  status: z.enum(['Pendiente', 'Completada', 'Cancelada']),
  items: z.array(purchaseItemSchema).min(1, 'Debe agregar al menos un producto'),
  associatedCosts: z.array(associatedCostSchema).optional(),
  notes: z.string().optional(),
  quoteId: z.string().optional(),
  paymentMethod: z.enum(['Efectivo', 'Tarjeta', 'Credito']).default('Efectivo'),
});

type PurchaseFormValues = z.infer<typeof purchaseSchema>;
const STATUS_OPTIONS: (PurchaseOrderStatus | 'all')[] = ['all', 'Pendiente', 'Completada', 'Cancelada'];

// Schema para el formulario rápido de producto
const quickProductSchema = ProductSchema.pick({
    name: true,
    sku: true,
    price: true,
    cost: true,
    category: true,
    activeIngredient: true,
});

export default function PurchasesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<PurchaseOrder | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<PurchaseOrderStatus | 'all'>('all');
  const [isSupplierSearchOpen, setIsSupplierSearchOpen] = useState(false);
  const [isProductSearchOpen, setIsProductSearchOpen] = useState(false);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [isNewProductDialogOpen, setIsNewProductDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [viewingTicket, setViewingTicket] = useState<PurchaseOrder | null>(null);
  const [viewingQrCode, setViewingQrCode] = useState<PurchaseOrder | null>(null);

  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();

  // Data fetching
  const purchasesCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'purchases'));
  }, [firestore]);
  const { data: rawPurchases, isLoading: loadingPurchases } = useCollection<PurchaseOrder>(purchasesCollection);
  const suppliersCollection = useMemoFirebase(() => collection(firestore, 'suppliers'), [firestore]);
  const { data: suppliers, isLoading: loadingSuppliers } = useCollection<Supplier>(suppliersCollection);
  const productsCollection = useMemoFirebase(() => collection(firestore, 'products'), [firestore]);
  const { data: products, isLoading: loadingProducts } = useCollection<Product>(productsCollection);
  const quotesCollection = useMemoFirebase(() => collection(firestore, 'quotations'), [firestore]);
  const { data: rawQuotes, isLoading: loadingQuotes } = useCollection<Quote>(quotesCollection);
  const branchesCollection = useMemoFirebase(() => collection(firestore, 'branches'), [firestore]);
  const { data: branches, isLoading: loadingBranches } = useCollection<Branch>(branchesCollection);

  const loading = loadingPurchases || loadingSuppliers || loadingProducts || loadingQuotes || loadingBranches;

  const purchases = useMemo(() => {
    if (!rawPurchases) return [];
    return rawPurchases.map(p => ({...p, date: (p.date as any).toDate()})).sort((a,b) => b.date.getTime() - a.date.getTime());
  }, [rawPurchases]);
  
  const quotes = useMemo(() => {
    if (!rawQuotes) return [];
    return rawQuotes.map(q => ({...q, date: (q.date as any).toDate()}));
  }, [rawQuotes]);

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      supplierId: '',
      branchId: '',
      date: new Date(),
      status: 'Pendiente',
      items: [],
      associatedCosts: [],
      receptionId: '',
      notes: '',
      quoteId: '',
      paymentMethod: 'Efectivo',
    },
  });

  const newProductForm = useForm<z.infer<typeof quickProductSchema>>({
    resolver: zodResolver(quickProductSchema),
    defaultValues: { name: '', sku: `PROD-${Date.now()}`, price: 0, cost: 0, category: '', activeIngredient: '' },
  });

  const { fields: itemFields, append: appendItem, remove: removeItem, replace: replaceItems } = useFieldArray({ control: form.control, name: "items" });
  const { fields: costFields, append: appendCost, remove: removeCost, replace: replaceCosts } = useFieldArray({ control: form.control, name: "associatedCosts" });
  
  const watchItems = useWatch({ control: form.control, name: 'items' });
  const watchCosts = useWatch({ control: form.control, name: 'associatedCosts' });
  const watchQuoteId = useWatch({ control: form.control, name: 'quoteId' });
  const watchSupplierId = useWatch({ control: form.control, name: 'supplierId' });
  const watchPaymentMethod = useWatch({ control: form.control, name: 'paymentMethod' });

  const { subtotalProducts, totalAssociatedCosts, totalProratedCosts, totalOrder } = useMemo(() => {
    const subtotalProducts = watchItems.reduce((acc, item) => acc + (item.cost * item.quantity), 0);
    const totalAssociatedCosts = watchCosts?.reduce((acc, cost) => acc + Number(cost.amount || 0), 0) || 0;
    const totalProratedCosts = watchCosts?.filter(c => c.prorate).reduce((acc, cost) => acc + Number(cost.amount || 0), 0) || 0;
    const totalOrder = subtotalProducts + totalAssociatedCosts;
    return { subtotalProducts, totalAssociatedCosts, totalProratedCosts, totalOrder };
  }, [watchItems, watchCosts]);

  useEffect(() => {
    const supplier = suppliers?.find(s => s.id === watchSupplierId);
    setSelectedSupplier(supplier || null);
    if (supplier && !(supplier as any).hasCredit) {
      form.setValue('paymentMethod', 'Efectivo');
    }
  }, [watchSupplierId, suppliers, form]);

  const creditUsed = selectedSupplier?.creditUsed || 0;
  const creditLimit = selectedSupplier?.creditLimit || 0;
  const availableCredit = creditLimit - creditUsed;
  const creditError = watchPaymentMethod === 'Credito' && totalOrder > availableCredit;
  const creditUsagePercentage = creditLimit > 0 ? (creditUsed / creditLimit) * 100 : 0;

  const usedQuoteIds = useMemo(() => new Set(purchases.map(p => p.quoteId).filter(Boolean)), [purchases]);
  const approvedQuotes = useMemo(() => quotes.filter(q => q.status === 'Aprobada' && !usedQuoteIds.has(q.id)), [quotes, usedQuoteIds]);
  
  useEffect(() => {
    if (watchQuoteId) {
      const selectedQuote = quotes.find(q => q.id === watchQuoteId);
      if (selectedQuote) {
        form.setValue('supplierId', selectedQuote.supplierId);
        if (selectedQuote.campaign) { form.setValue('receptionId', selectedQuote.campaign); }
        const quoteItems = selectedQuote.items.map((item, index) => ({
          productId: item.productId!,
          productName: item.productName,
          quantity: 1,
          cost: item.price,
          lotNumber: `LOTE-${(index + 1).toString().padStart(3, '0')}`,
        }));
        replaceItems(quoteItems);
        toast({ title: 'Cotización Cargada', description: `Se han cargado los datos de la cotización ${selectedQuote.quoteNumber}.` });
      }
    }
  }, [watchQuoteId, quotes, replaceItems, form, toast]);

  const handleValidatePurchase = (purchase: PurchaseOrder) => { router.push(`/inventory-control?orderId=${purchase.id}`); };
  
  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => {
    // Deprecated: moved to `page.tsx`. This file kept for backward compatibility during migration.
    export default function DeprecatedPurchasesPage() {
        return null;
    }
                                    </AlertDialog>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredPurchases.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                    No se encontraron órdenes de compra.
                                </TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                    )}
                </div>
            </CardContent>
        </Card>
    </div>
    <Dialog open={isNewProductDialogOpen} onOpenChange={setIsNewProductDialogOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>Crear Nuevo Producto Rápido</DialogTitle></DialogHeader>
            <Form {...newProductForm}>
                <form onSubmit={newProductForm.handleSubmit(onNewProductSubmit)} className="space-y-4">
                    <FormField control={newProductForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre del Producto</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={newProductForm.control} name="sku" render={({ field }) => (<FormItem><FormLabel>SKU</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <div className="grid grid-cols-2 gap-4">
                        <FormField control={newProductForm.control} name="price" render={({ field }) => (<FormItem><FormLabel>Precio Venta</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={newProductForm.control} name="cost" render={({ field }) => (<FormItem><FormLabel>Costo Compra</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <FormField control={newProductForm.control} name="category" render={({ field }) => (<FormItem><FormLabel>Categoría</FormLabel><FormControl><Input placeholder="Ej: Herbicida" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={newProductForm.control} name="activeIngredient" render={({ field }) => (<FormItem><FormLabel>Ingrediente Activo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <Button type="submit" disabled={newProductForm.formState.isSubmitting}>
                        {newProductForm.formState.isSubmitting ? <Loader2 className="mr-2 animate-spin" /> : null}
                        Crear y Seleccionar
                    </Button>
                </form>
            </Form>
        </DialogContent>
    </Dialog>
     <Dialog open={!!viewingQrCode} onOpenChange={() => setViewingQrCode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Código QR de Orden de Compra</DialogTitle>
          </DialogHeader>
          {viewingQrCode && (
            <div className="flex flex-col items-center justify-center p-6 gap-4">
              <div className="p-4 bg-white rounded-lg border">
                <QRCodeSVG value={viewingQrCode.id!} size={256} />
              </div>
              <p className="font-mono text-sm text-muted-foreground">{viewingQrCode.id}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

