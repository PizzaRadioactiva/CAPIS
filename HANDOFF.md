# HANDOFF — Instrucciones para continuar este proyecto

Este archivo es específicamente para la próxima IA (o desarrollador) que reciba este proyecto. Leé esto antes que el README.

## Qué es esto

Sistema completo de gestión de stock (C.A.P.S.). Backend Express+Prisma+PostgreSQL, frontend React+Vite+Tailwind+shadcn. Todo el código de producto está escrito y fue verificado de tipos/build en la medida en que el sandbox de generación lo permitió (ver abajo).

## Por qué no está "100% probado en runtime"

El entorno donde se escribió este código no tenía acceso de red a `binaries.prisma.sh` (dominio bloqueado por firewall del sandbox). Esto significa:

- `npx prisma generate` falla con `403 Forbidden` al intentar descargar el query engine.
- Sin el cliente generado, `@prisma/client` no exporta `PrismaClient`, `Role`, `Unit`, `MovementType`, etc.
- Esto en cascada hace que `tsc` en `server/` reporte errores de tipo en cualquier archivo que use esos símbolos.

**Verifiqué explícitamente que esto es la única causa**, no bugs reales:
1. Filtré todos los errores de `tsc` y confirmé que el 100% menciona `@prisma/client`, `Prisma.*`, `Role`, `Unit`, `MovementType` o `PrismaClientKnownRequestError`.
2. Reproduje el mismo patrón de código (Zod `z.nativeEnum()` + `.optional()` + inferencia de tipos) con un enum TypeScript nativo de prueba en vez del enum de Prisma no generado, y compiló perfecto — confirma que el problema es 100% la ausencia del cliente generado, no un error de sintaxis o de lógica.

El **frontend en cambio sí se pudo verificar completamente**: `npx tsc --noEmit` sin errores, y `npx vite build` genera el bundle de producción sin problemas.

## Primer paso obligatorio

Corré esto en un entorno con acceso normal a internet (tu máquina, CI, o directamente el build de Render):

```bash
cd caps-stock
npm install
npm run prisma:generate
```

Después corré, dentro de `server/`:

```bash
cd server
npx tsc --noEmit -p tsconfig.json
```

**Esperado: 0 errores.** Si aparece algún error real (no relacionado a Prisma), es nuevo y hay que arreglarlo — pero según el análisis hecho, no debería haber ninguno.

Luego seguí con el flujo normal: `prisma:migrate` (necesita una base Postgres real corriendo, local o remota) → `seed` → `npm run dev` (server) + `npm run dev:client` (client) → probar login con `admin@caps.local` / `Admin123!`.

## Mapa rápido del código

### Backend (`server/src/`)
- `app.ts` / `index.ts` — bootstrap de Express
- `lib/` — prisma client singleton, env config, JWT/bcrypt helpers, ApiError
- `middleware/auth.ts` — `requireAuth`, `requireRole`
- `middleware/errorHandler.ts` — manejo centralizado de errores (nota: usa un type-guard manual `isPrismaKnownRequestError` en vez de `instanceof Prisma.PrismaClientKnownRequestError` para evitar un import directo problemático; **una vez generado el cliente, podés simplificarlo volviendo a `instanceof` si preferís**, aunque el type-guard actual funciona igual de bien)
- `routes/*.routes.ts` — un archivo por recurso (auth, products, categories, stock-movements, dashboard, reports, settings, users)
- `services/product.service.ts` — toda la lógica transaccional de stock (create, update, delete, stockIn, stockOut, adjustStock). **Este es el archivo más importante del backend.**
- `services/email.service.ts` + `templates/email.ts` — integración con Resend
- `schemas/product.schema.ts` — validación Zod de productos
- `utils/stockStatus.ts` — lógica de cálculo de estado (`IN_STOCK`/`LOW_STOCK`/etc.)
- `seed.ts` — datos demo

### Frontend (`client/src/`)
- `App.tsx` — rutas (React Router) + providers (QueryClient, Auth, Toaster)
- `contexts/AuthContext.tsx` — sesión de usuario
- `hooks/useProducts.ts` — todos los hooks de TanStack Query para productos/categorías
- `hooks/use-toast.ts` — sistema de notificaciones (patrón shadcn)
- `components/ui/` — primitivos shadcn (Button, Dialog, Select, Table, etc.) — no deberían necesitar cambios
- `components/layout/` — Sidebar, Topbar, AppLayout, ProtectedRoute
- `components/products/` — ProductForm (RHF+Zod), StockInDialog, StockOutDialog, ConfirmDeleteDialog
- `components/dashboard/` — KpiCard, Charts.tsx (Recharts)
- `pages/` — una página por ruta; `StockPage.tsx` es la más compleja (tabla con búsqueda/filtros/paginación)

## Pendientes opcionales (no bloqueantes, ver README sección 9)

En orden de impacto:
1. Code-splitting del bundle (actualmente ~1MB, funciona pero no es óptimo)
2. Exportación real de PDF/CSV en Reportes (hoy solo envía por email)
3. Tests automatizados (no hay ninguno todavía)
4. UI de gestión de categorías (el backend ya soporta CRUD completo, falta la pantalla)
5. Refresh token / manejo de expiración de sesión más suave

## Detalles no obvios que vale la pena saber

- El filtro `LOW_STOCK` en `product.service.ts::listProducts` no puede resolverse con un `WHERE` de Prisma porque compara dos columnas (`quantity <= minimumStock`). Por eso ese caso especial trae todos los productos que matchean el resto de filtros y pagina en JS. Si la tabla de productos crece mucho (miles de filas), esto podría no escalar — considerá una columna calculada o una vista SQL si eso pasa.
- El JWT se guarda tanto en cookie `httpOnly` como en `localStorage` (enviado como `Authorization: Bearer`). Esto es intencional para evitar problemas de cookies de terceros si el front y el back terminan en dominios distintos de Render.
- Los `productId` de los productos demo usan IDs determinísticos (`demo-${slug}`) en vez de `cuid()` random, para que el seed sea idempotente (correrlo dos veces no duplica productos).
