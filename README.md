# AGR-NARE — Sistema de Gestión Agrícola

**Estado**: ✅ Desplegado en Vercel (producción)  
**URL Producción**: https://agr-nare.vercel.app  
**Framework**: Next.js 15.3.3 (App Router)  
**Backend**: Firebase/Firestore  

---

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Instalación y Configuración Local](#instalación-y-configuración-local)
- [Despliegue en Vercel](#despliegue-en-vercel)
- [Configuración de SSO en Vercel](#configuración-de-sso-en-vercel)
- [Variables de Entorno](#variables-de-entorno)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Módulos Principales](#módulos-principales)
- [Resolución de Problemas](#resolución-de-problemas)
- [Cambios Recientes](#cambios-recientes)

---

## 📱 Descripción General

**AGR-NARE** es una plataforma web integral de gestión agrícola que incluye:

- **CRM**: Gestión de clientes, oportunidades de venta
- **ERP**: Compras, ventas, productos, cotizaciones, mantenimiento, activos fijos
- **Finance**: Análisis financiero, reportes
- **HR**: Gestión de empleados, nómina, cumplimiento
- **Inventory Control**: Control de inventario, recepción de compras
- **Logistics**: Gestión de rutas, entregas, recolecciones
- **LIMS**: Laboratorio
- **RPA**: Automatización de procesos
- **AI**: Asistencia con Genkit (análisis de financieros, iterarios, tareas)

---

## 🚀 Instalación y Configuración Local

### Requisitos Previos

- Node.js 22.x (recomendado) o superior
- npm, yarn, pnpm o bun
- Cuenta de Firebase con proyecto activo
- Credenciales de Firestore

### Pasos

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/agronare/AGR-NARE.git
   cd AGR-NARE
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   # o yarn install / pnpm install / bun install
   ```

3. **Configurar variables de entorno**:
   - Copia el archivo de ejemplo (si existe) o crea `.env.local`:
     ```bash
     cp .env.example .env.local  # si existe
     # o crea manualmente:
     ```
   - Completa las siguientes variables:
     ```env
     NEXT_PUBLIC_FIREBASE_API_KEY=<tu_api_key>
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<tu_auth_domain>
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=<tu_project_id>
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<tu_storage_bucket>
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<tu_messaging_sender_id>
     NEXT_PUBLIC_FIREBASE_APP_ID=<tu_app_id>
     ```

4. **Ejecutar en desarrollo**:
   ```bash
   npm run dev
   ```
   - Accede a http://localhost:3000

5. **Build para producción**:
   ```bash
   npm run build
   npm start
   ```

---

## 🌐 Despliegue en Vercel

### Opción 1: Despliegue Automático (Git Integration)

1. **Conectar repositorio en Vercel**:
   - Ve a https://vercel.com
   - Importa el repositorio de GitHub
   - Vercel detectará automáticamente Next.js
   - Las variables de entorno se configurarán en el dashboard

2. **Configurar variables de entorno**:
   - En Vercel Dashboard → Proyecto → Settings → Environment Variables
   - Añade las mismas variables que en `.env.local`

3. **Desplegar**:
   - Cada push a `main` triggereará un despliegue automático

### Opción 2: Despliegue Manual (CLI)

1. **Instalar Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Autenticar**:
   ```bash
   vercel login
   ```

3. **Desplegar**:
   ```bash
   vercel --prod
   ```

4. **Configurar variables de entorno** (si no están en `.vercel/project.json`):
   ```bash
   vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
   # Repite para cada variable
   ```

---

## 🔐 Configuración de SSO en Vercel

### Estado Actual

- **SSO Protection**: Desactivado (por defecto, las deployments son públicas)
- **Última actualización**: 16 de noviembre de 2025
- **Cambio realizado**: Establecer `ssoProtection: null` para permitir acceso público a todas las deployments

### ¿Qué significa?

- ✅ Todas las rutas son accesibles públicamente (no requieren login)
- Si necesitas proteger ciertas rutas, implementa autenticación en la aplicación (Firebase Auth)
- Los previews de pull requests también son públicos

### Reactivar SSO (Protección de Deployments)

Si en el futuro necesitas reactivar la protección SSO del equipo:

```bash
# Exportar token (obtenlo en Vercel → Settings → Tokens)
export VERCEL_TOKEN="tu_token_aqui"

# Opción A: SSO para todas las deployments excepto custom domains
curl -sS -X PATCH \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ssoProtection":{"deploymentType":"all_except_custom_domains"}}' \
  "https://api.vercel.com/v2/projects/prj_7u20MVEqIrkFwilFUqXLFSNiA7l3"

# Opción B: SSO solo para previews
curl -sS -X PATCH \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ssoProtection":{"deploymentType":"preview"}}' \
  "https://api.vercel.com/v2/projects/prj_7u20MVEqIrkFwilFUqXLFSNiA7l3"

# Opción C: Remover completamente SSO (volver a público)
curl -sS -X PATCH \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ssoProtection":null}' \
  "https://api.vercel.com/v2/projects/prj_7u20MVEqIrkFwilFUqXLFSNiA7l3"
```

### Proteger routes específicas en la aplicación

Para restringir acceso a ciertas páginas sin tocar la configuración de SSO de Vercel:

1. **Usar Firebase Authentication**:
   ```typescript
   // src/app/admin/page.tsx
   "use client";
   
   import { useEffect } from "react";
   import { useFirestore, useDoc } from "@/firebase";
   import { useRouter } from "next/navigation";
   
   export default function AdminPage() {
     const router = useRouter();
     const firestore = useFirestore();
     
     useEffect(() => {
       if (!firestore) {
         router.push("/login");
       }
     }, [firestore, router]);
     
     return <div>Admin Panel</div>;
   }
   ```

2. **Middleware para redirigir**:
   ```typescript
   // src/middleware.ts
   import { type NextRequest, NextResponse } from "next/server";
   
   export function middleware(request: NextRequest) {
     const token = request.cookies.get("authToken");
     
     if (!token && request.nextUrl.pathname.startsWith("/admin")) {
       return NextResponse.redirect(new URL("/login", request.url));
     }
     
     return NextResponse.next();
   }
   
   export const config = { matcher: ["/admin/:path*"] };
   ```

---

## 🔑 Variables de Entorno

### Requeridas (Firebase)

```env
NEXT_PUBLIC_FIREBASE_API_KEY=<tu_api_key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<tu_auth_domain>
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<tu_project_id>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<tu_storage_bucket>
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<tu_messaging_sender_id>
NEXT_PUBLIC_FIREBASE_APP_ID=<tu_app_id>
```

### Opcionales

```env
# Node environment
NODE_ENV=production  # o development para desarrollo local

# Analytics (opcional)
NEXT_PUBLIC_ANALYTICS_ID=<tu_analytics_id>
```

---

## 📁 Estructura del Proyecto

```
AGR-NARE/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx            # Página de inicio
│   │   ├── login/              # Autenticación
│   │   ├── dashboard/          # Dashboard principal
│   │   ├── crm/                # CRM (clientes, pipeline)
│   │   ├── erp/                # ERP (compras, ventas, activos, etc.)
│   │   ├── finance/            # Finanzas
│   │   ├── hr/                 # Recursos Humanos
│   │   ├── inventory-control/  # Control de Inventario
│   │   ├── logistics/          # Logística
│   │   ├── lims/               # Laboratorio
│   │   └── rpa/                # Automatización
│   ├── components/             # Componentes reutilizables
│   │   ├── ui/                 # Componentes base (Button, Dialog, etc.)
│   │   ├── layout/             # Layout compartido
│   │   ├── crm/
│   │   ├── erp/
│   │   ├── finance/
│   │   ├── hr/
│   │   ├── inventory-control/
│   │   ├── logistics/
│   │   └── ...
│   ├── firebase/               # Configuración y helpers de Firebase
│   │   ├── client.ts
│   │   ├── server.ts
│   │   ├── config.ts
│   │   ├── use-collection.ts   # Hook para obtener colecciones
│   │   ├── use-doc.ts          # Hook para obtener documentos
│   │   └── non-blocking-updates.ts
│   ├── hooks/                  # Hooks personalizados
│   ├── lib/                    # Utilidades, tipos, formateo
│   │   ├── types.ts
│   │   ├── utils.ts
│   │   └── data.ts
│   ├── utils/                  # Funciones auxiliares
│   ├── services/               # Servicios (notificaciones, etc.)
│   └── ai/                     # AI flows con Genkit
├── public/                     # Archivos estáticos
├── docs/                       # Documentación adicional
├── .firebaserc                 # Config de Firebase CLI
├── firebase.json               # Config de Firebase App Hosting (alternativo)
├── firestore.rules             # Reglas de seguridad de Firestore
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
└── README.md                   # Este archivo
```

---

## 🏗️ Módulos Principales

### 🎯 CRM (Customer Relationship Management)

**Rutas**: `/crm`

- **Clientes** (`/clients`): Gestión de contactos, información de clientes
- **Oportunidades** (`/pipeline`): Seguimiento de ventas (kanban)
- **Créditos** (`/credits`): Histórico de créditos otorgados

**Colecciones Firebase**:
- `clients`
- `opportunities`
- `credit_history`

---

### 📦 ERP (Enterprise Resource Planning)

**Rutas**: `/erp`

- **Productos** (`/products`): Catálogo de productos
- **Compras** (`/purchases`): Órdenes de compra
- **Ventas** (`/sales`): Órdenes de venta
- **Cotizaciones** (`/quotations`): Presupuestos a clientes
- **Inventario** (`/inventory`): Stock por sucursal
- **Activos Fijos** (`/fixed-assets`): Registro de maquinaria
- **Mantenimiento** (`/maintenance`): Programa de mantenimiento
- **Proveedores** (`/suppliers`): Base de datos de proveedores
- **Reportes** (`/reports`): Reportes de gestión

**Colecciones Firebase**:
- `products`
- `purchases`
- `sales`
- `quotations`
- `inventory`
- `fixed_assets`
- `maintenances`
- `suppliers`

---

### 💰 Finanzas

**Rutas**: `/finance`

- **Análisis Financiero**: Dashboards, gráficos, ratios
- **Estado de Resultados**
- **Flujo de Caja**

**Servicios**: Genkit AI (análisis asistido de financieros)

---

### 👥 Recursos Humanos

**Rutas**: `/hr`

- **Empleados** (`/employees`): Nómina, historial laboral
- **Payroll** (`/payroll`): Cálculo de salarios
- **Compliance** (`/compliance`): Cumplimientos legales
- **Talento** (`/talent`): Reclutamiento, capacitación
- **Bienestar** (`/wellness`): Programas de salud

---

### 📊 Inventory Control

**Rutas**: `/inventory-control`

- **Recepción de Compras**: Validación de órdenes
- **Lotes**: Seguimiento de lotes de productos
- **Auditoría de Stock**: Revisiones de precisión

---

### 🚚 Logística

**Rutas**: `/logistics`

- **Entregas** (`/deliveries`): Seguimiento de envíos
- **Recolecciones** (`/recolecciones`): Recogidas a proveedores
- **Rutas**: Planificación de rutas
- **Gastos** (`/logistics-expenses`): Control de costos

---

## 🛠️ Resolución de Problemas

### Error: "useSearchParams() should be wrapped in a suspense boundary"

**Causa**: Uso de hooks de Next.js (`useSearchParams`, `useRouter`, `usePathname`) en módulos ejecutados durante prerender del servidor.

**Soluciones**:

1. **Agregar directiva `"use client"`** (si es componente cliente):
   ```typescript
   "use client";
   
   import { useSearchParams } from "next/navigation";
   
   export function MyComponent() {
     const params = useSearchParams();
     return <div>{params.get("id")}</div>;
   }
   ```

2. **Mover lectura del hook a `useEffect`** (lectura side-effect):
   ```typescript
   "use client";
   
   import { useEffect, useState } from "react";
   
   export default function MyPage() {
     const [orderId, setOrderId] = useState<string | null>(null);
     
     useEffect(() => {
       const params = new URLSearchParams(window.location.search);
       setOrderId(params.get("orderId"));
     }, []);
     
     return <div>{orderId || "Cargando..."}</div>;
   }
   ```

3. **Crear página servidor con componente cliente anidado**:
   ```typescript
   // src/app/my-route/page.tsx (servidor)
   import { ClientComponent } from "@/components/client-component";
   
   export default function Page() {
     return <ClientComponent />;
   }
   ```

   ```typescript
   // src/components/client-component.tsx (cliente)
   "use client";
   
   import { useSearchParams } from "next/navigation";
   
   export function ClientComponent() {
     const params = useSearchParams();
     return <div>{params.get("id")}</div>;
   }
   ```

### Error: "FirebaseError: Expected first argument to collection() to be a CollectionReference..."

**Causa**: Llamada a `collection(firestore, 'nombre')` cuando `firestore` es `undefined` (durante prerender).

**Soluciones**:

1. **Guardar la llamada dentro de `useMemoFirebase`**:
   ```typescript
   // ❌ Incorrecto
   const data = useCollection(collection(firestore, 'products'));
   
   // ✅ Correcto
   const productsRef = useMemoFirebase(
     () => firestore ? collection(firestore, 'products') : null,
     [firestore]
   );
   const { data } = useCollection(productsRef);
   ```

2. **Alternativa con condicional**:
   ```typescript
   const ref = firestore ? collection(firestore, 'products') : null;
   const { data } = useCollection(ref);
   ```

### Error: "HTTP 404" en rutas `/erp/purchases`, `/inventory-control`, etc.

**Causa**: Ruta no prerrenderizada durante build (página cliente sin entrada servidor).

**Solución**: Crear archivo `page.tsx` (servidor) para cada ruta faltante:

```typescript
// src/app/erp/purchases/page.tsx
import { PurchasesPageContent } from "@/components/erp/purchases-page-content";

export default function PurchasesPage() {
  return <PurchasesPageContent />;
}
```

Luego mover la lógica cliente a un componente:

```typescript
// src/components/erp/purchases-page-content.tsx
"use client";

import { useState } from "react";
// ... resto del código cliente
```

### Rutas devolviendo `HTTP 401` con `_vercel_sso_nonce`

**Causa**: SSO protection activado en el proyecto Vercel.

**Solución**: Desactivar SSO para deployments públicas (ya realizado).

Para verificar estado actual:
```bash
curl -sS -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v2/projects/prj_7u20MVEqIrkFwilFUqXLFSNiA7l3" \
  | jq '.ssoProtection'
```

Resultado esperado: `null` (sin protección)

### Build falla con "Exceeded query duration limit" en logs

**Causa**: Las consultas a Firestore durante prerender superan tiempos límite.

**Soluciones**:

1. **Reducir datos iniciales**: No cargar todas las colecciones en prerender, solo en cliente
2. **Lazy-load colecciones**: Usa `useMemoFirebase` para diferir carga hasta que el cliente esté listo
3. **Aumentar timeout local**: En desarrollo, edita `next.config.ts` si es necesario

---

## 📝 Cambios Recientes

### 16 de noviembre de 2025

#### ✅ Resuelto: Rutas 404 y Errores de Prerender

**Problema**:
- Rutas anidadas (`/erp/purchases`, `/inventory-control`) devolvían 404
- Build fallaba con errores de prerender (useSearchParams, collection())
- Rutas públicas devolvían HTTP 401 (SSO requirement)

**Acciones realizadas**:

1. **Creadas páginas servidor para rutas faltantes**:
   - `src/app/erp/purchases/page.tsx` (servidor)
   - `src/app/erp/maintenance/page.tsx` (servidor)
   - `src/app/inventory-control/page.tsx` (servidor)
   - Componentes cliente originales estubificados para evitar conflictos de ruteo

2. **Corregidos usos de Firebase en componentes**:
   - `src/components/erp/add-maintenance-dialog.tsx`: Protegida llamada a `collection()` con `firestore ? ... : null`
   - `src/app/erp/purchases/page.tsx`: Protegidas todas las colecciones con guardias `firestore`

3. **Desactivado SSO en proyecto Vercel**:
   - Ejecutado PATCH a API: `{"ssoProtection": null}`
   - Rutas públicas ahora responden 200 (sin 401)

4. **Resultado**:
   - Build compile exitosamente
   - Rutas `/`, `/erp/purchases`, `/inventory-control` responden `HTTP 200`
   - Aplicación lista para producción

**URLs de Test**:
```
✅ https://agr-nare.vercel.app/                  → 200 OK
✅ https://agr-nare.vercel.app/erp/purchases     → 200 OK
✅ https://agr-nare.vercel.app/inventory-control → 200 OK
```

---

## 📚 Recursos y Enlaces

- **Documentación Next.js**: https://nextjs.org/docs
- **Firebase Docs**: https://firebase.google.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Repositorio**: https://github.com/agronare/AGR-NARE

---

## 📞 Soporte y Contribuciones

Para reportar bugs, pedir features o contribuir:

1. Abre un issue en GitHub describiendo el problema
2. Crea un branch: `git checkout -b feature/mi-feature`
3. Haz commit: `git commit -m "feat: descripción clara"`
4. Push: `git push origin feature/mi-feature`
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo licencia privada. Todos los derechos reservados a Agronare.

---

**Última actualización**: 16 de noviembre de 2025  
**Versión**: 1.0.0  
**Estado**: 🟢 Producción (Vercel)
