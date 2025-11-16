'use client'
import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Truck,
  MapPin,
  FileText,
  X,
  Plus,
  Loader2,
  Wand2,
  FileDown
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLogistics, type Vehicle } from '../context';
import { Skeleton } from '@/components/ui/skeleton';
import { generateItinerary, type ItineraryOutput } from '@/ai/flows/generate-itinerary';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { QRCodeSVG } from 'qrcode.react';
import { Textarea } from '@/components/ui/textarea';

export default function PlannerPage() {
  const { vehicles, isLoading } = useLogistics();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | undefined>(undefined);
  const [stops, setStops] = useState<string[]>([]);
  const [newStop, setNewStop] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [itinerary, setItinerary] = useState<ItineraryOutput | null>(null);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleAddStop = () => {
    if (newStop.trim()) {
      setStops([...stops, newStop.trim()]);
      setNewStop('');
    }
  };

  const handleRemoveStop = (indexToRemove: number) => {
    setStops(stops.filter((_, index) => index !== indexToRemove));
  };
  
  const handleGenerateDraft = async () => {
    if (!selectedVehicleId || stops.length === 0) return;
    
    setIsGenerating(true);
    setItinerary(null);
    try {
        const selectedVehicle = vehicles?.find(v => v.id === selectedVehicleId);
        if (!selectedVehicle) {
            toast({ title: "Error", description: "Vehículo no encontrado.", variant: "destructive" });
            return;
        }

        const result = await generateItinerary({
            vehicle: `${selectedVehicle.name} (${selectedVehicle.plate})`,
            stops: stops
        });
        
        setItinerary(result);
        toast({ title: "Borrador generado", description: "Revisa y ajusta los detalles del itinerario a continuación." });

    } catch (error) {
        console.error("Error generating itinerary: ", error);
        toast({ title: "Error", description: "No se pudo generar el itinerario.", variant: "destructive" });
    } finally {
        setIsGenerating(false);
    }
  };
  
  const generatePDF = () => {
    if (!itinerary || !selectedVehicleId) return;
    
    const selectedVehicle = vehicles?.find(v => v.id === selectedVehicleId);
    if (!selectedVehicle) return;

    const doc = new jsPDF();
    
    const qrCodeElement = document.getElementById('qr-code-itinerary');
    if (!qrCodeElement) {
        toast({ title: "Error", description: "No se pudo generar el código QR.", variant: "destructive" });
        return;
    }

    const svgString = new XMLSerializer().serializeToString(qrCodeElement);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
        canvas.width = 256;
        canvas.height = 256;
        ctx?.drawImage(img, 0, 0, 256, 256);
        const qrCodeDataUrl = canvas.toDataURL("image/png");

        doc.setFontSize(18);
        doc.text("Itinerario de Ruta", 105, 22, { align: 'center' });

        doc.setFontSize(11);
        doc.text(`Vehículo: ${selectedVehicle.name} (${selectedVehicle.plate})`, 14, 40);
        doc.text(`Operador: (Asignado)`, 14, 46);
        
        doc.addImage(qrCodeDataUrl, 'PNG', 150, 35, 40, 40);

        doc.setFontSize(12);
        doc.text("Resumen del Viaje", 14, 65);
        doc.setFontSize(10);
        doc.text(`Distancia Total: ${itinerary.totalDistance}`, 14, 72);
        doc.text(`Tiempo Estimado: ${itinerary.totalTime}`, 14, 78);

        autoTable(doc, {
            startY: 85,
            head: [['#', 'Parada', 'Indicaciones/Notas']],
            body: itinerary.optimizedStops.map((stop, index) => [index + 1, stop.location, stop.note]),
            headStyles: { fillColor: [34, 139, 34] }, // Verde oscuro
        });
        doc.save(`itinerario_${selectedVehicle.plate}_${Date.now()}.pdf`);
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgString);
  };
  
  const handleItineraryChange = (field: keyof ItineraryOutput, value: any) => {
    if (itinerary) {
      setItinerary({ ...itinerary, [field]: value });
    }
  };

  const handleStopNoteChange = (index: number, note: string) => {
    if (itinerary) {
      const newStops = [...itinerary.optimizedStops];
      newStops[index].note = note;
      setItinerary({ ...itinerary, optimizedStops: newStops });
    }
  };


  const canGenerate = selectedVehicleId && stops.length > 0;

  return (
    <>
      <div style={{ display: 'none' }}>
        {isClient && <QRCodeSVG id="qr-code-itinerary" value={`https://www.google.com/maps/dir/${stops.join('/')}`} />}
      </div>
      <div className="flex flex-col gap-6">
        <div className="flex items-start gap-4">
          <div className="bg-primary/10 text-primary p-3 rounded-lg">
            <MapPin className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground/90">
              Planificador de Rutas
            </h1>
            <p className="text-muted-foreground">
              Organiza itinerarios, calcula distancias y genera hojas de ruta.
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">1. Seleccionar vehículo</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select onValueChange={setSelectedVehicleId} value={selectedVehicleId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Elige un vehículo de tu flota..." />
                    </SelectTrigger>
                    <SelectContent>
                        {vehicles?.map(vehicle => (
                            <SelectItem key={vehicle.id} value={vehicle.id}>
                                {vehicle.name} ({vehicle.plate})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">2. Definir paradas del itinerario</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Input 
                  placeholder="Ej: Rancho El Sol, Km 12 Carretera a Zamora" 
                  value={newStop}
                  onChange={(e) => setNewStop(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddStop()}
                />
                <Button onClick={handleAddStop}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar
                </Button>
              </div>
              {stops.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                      No hay paradas registradas aún.
                  </p>
              ) : (
                  <div className='space-y-2 rounded-md border p-2'>
                      {stops.map((stop, index) => (
                          <div key={index} className="flex items-center justify-between gap-2 p-2 rounded-md hover:bg-muted">
                              <div className='flex items-center gap-3'>
                                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">{index + 1}</span>
                                  <p className='text-sm'>{stop}</p>
                              </div>
                              <Button variant="ghost" size="icon" className='h-8 w-8' onClick={() => handleRemoveStop(index)}>
                                  <X className="h-4 w-4 text-destructive" />
                              </Button>
                          </div>
                      ))}
                  </div>
              )}
            </CardContent>
             <CardFooter>
                 <Button onClick={handleGenerateDraft} variant="secondary" disabled={!canGenerate || isGenerating}>
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                    {isGenerating ? 'Generando...' : 'Generar Borrador con IA'}
                </Button>
            </CardFooter>
          </Card>

          {itinerary && (
            <Card className="animate-in fade-in-0">
                <CardHeader>
                <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">3. Revisar y ajustar itinerario</CardTitle>
                </div>
                <CardDescription>
                    Modifica los datos generados por la IA antes de crear el PDF final.
                </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium">Distancia Total</label>
                            <Input value={itinerary.totalDistance} onChange={(e) => handleItineraryChange('totalDistance', e.target.value)} />
                        </div>
                         <div>
                            <label className="text-sm font-medium">Tiempo Estimado</label>
                            <Input value={itinerary.totalTime} onChange={(e) => handleItineraryChange('totalTime', e.target.value)} />
                        </div>
                    </div>
                     <div className='space-y-4'>
                        <label className="text-sm font-medium">Paradas Optimizadas</label>
                        {itinerary.optimizedStops.map((stop, index) => (
                             <div key={index} className="flex items-start gap-3 p-3 border rounded-md">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-bold mt-1.5">{index + 1}</span>
                                <div className='flex-1 space-y-2'>
                                    <p className='font-semibold'>{stop.location}</p>
                                    <Textarea 
                                        placeholder='Indicaciones/Notas...'
                                        value={stop.note}
                                        onChange={(e) => handleStopNoteChange(index, e.target.value)}
                                        className='text-sm'
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={generatePDF}>
                        <FileDown className="mr-2 h-4 w-4" />
                        Generar PDF del Itinerario
                    </Button>
                </CardFooter>
            </Card>
          )}

        </div>
      </div>
    </>
  );
}
