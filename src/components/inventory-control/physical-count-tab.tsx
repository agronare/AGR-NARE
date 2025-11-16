'use client';
import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RotateCcw, FileDown, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

type InventoryCountItem = {
  id: string;
  productName: string;
  lot: string;
  systemStock: number;
  physicalCount: number | null;
};

const initialInventoryItems: InventoryCountItem[] = [
    { id: '1', productName: 'ACARITOUCH 12X1LT', lot: 'LOTE-001', systemStock: 1, physicalCount: null },
    { id: '2', productName: 'ADHE COVER 12X1LT.', lot: 'LOTE-1760507447189', systemStock: 1, physicalCount: null },
    { id: '3', productName: 'FUSION 12X1LT.', lot: 'LOTE-1760507403942', systemStock: 237, physicalCount: null },
    { id: '4', productName: 'ASPERSORA HIBRIDO ELECTRO-MANUAL', lot: 'LOTE-1759961117511-57', systemStock: 2, physicalCount: null },
    { id: '5', productName: 'FUSION 12X1LT.', lot: 'LOTE-1760507668964', systemStock: 720, physicalCount: null },
];

export function PhysicalCountTab() {
  const [items, setItems] = useState<InventoryCountItem[]>(initialInventoryItems);

  const handleCountChange = useCallback((id: string, count: number) => {
    setItems(currentItems =>
      currentItems.map(item =>
        item.id === id ? { ...item, physicalCount: isNaN(count) ? null : count } : item
      )
    );
  }, []);

  const calculateVariance = (system: number, physical: number | null) => {
    if (physical === null) {
      return null;
    }
    return physical - system;
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className='flex items-center gap-4'>
            <RotateCcw className='h-6 w-6 text-muted-foreground' />
            <div>
              <h2 className="text-lg font-semibold">Conteo Físico Completo</h2>
              <p className="text-sm text-muted-foreground">
                Realiza el inventario de fin de mes para una sucursal.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sucursal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las sucursales</SelectItem>
                <SelectItem value="matriz">Matriz</SelectItem>
                <SelectItem value="norte">Sucursal Norte</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <FileDown className="mr-2 h-4 w-4" />
              Descargar PDF
            </Button>
            <Button>
              <Save className="mr-2 h-4 w-4" />
              Guardar Conteo
            </Button>
          </div>
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-2/5">Producto</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead className='text-center'>Stock (Sistema)</TableHead>
                <TableHead className='text-center w-36'>Conteo Físico</TableHead>
                <TableHead className='text-center'>Varianza</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => {
                const variance = calculateVariance(item.systemStock, item.physicalCount);
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell className="text-muted-foreground">{item.lot}</TableCell>
                    <TableCell className="text-center font-medium">{item.systemStock}</TableCell>
                    <TableCell className="text-center">
                      <Input
                        type="number"
                        className="w-28 mx-auto text-center"
                        value={item.physicalCount === null ? '' : item.physicalCount}
                        onChange={e => handleCountChange(item.id, parseInt(e.target.value))}
                      />
                    </TableCell>
                    <TableCell className={cn(
                        "text-center font-bold",
                        variance === null ? "" : variance > 0 ? "text-green-600" : variance < 0 ? "text-red-600" : "text-muted-foreground"
                    )}>
                      {variance === null ? '-' : variance > 0 ? `+${variance}` : variance}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
