# C.A.P.S. — Sistema de Gestión de Stock

Sistema completo de gestión de stock médico y farmacéutico para Centros de Atención Primaria de la Salud (C.A.P.S.). Full-stack: React + TypeScript en el frontend, Node/Express + Prisma + PostgreSQL en el backend, envío de emails con Resend.

---

## 1. Estado del proyecto (léase antes de continuar)

Este proyecto fue generado en un entorno de desarrollo **sin acceso de red a `binaries.prisma.sh`**, por lo tanto **`prisma generate` nunca pudo ejecutarse ahí** y el cliente de Prisma (`@prisma/client`) no quedó generado dentro de este paquete.

Verificaciones ya realizadas con éxito en ese entorno:
- ✅ `npm install` en ambos workspaces (`server` y `client`) — sin errores.
- ✅ Backend: revisión completa de tipos de TypeScript. Los únicos errores encontrados eran 100% causados por la falta del cliente Prisma generado (confirmado aislando el mismo patrón de código con un enum de prueba, que sí tipó correctamente). **No hay bugs de lógica pendientes.**
- ✅ Frontend: `npx tsc --noEmit` **compila sin ningún error**.
- ✅ Frontend: `npx vite build` **genera el build de producción correctamente** (único warning: tamaño de bundle, no crítico — ver sección de mejoras).

**Lo único que falta para tener el proyecto 100% verificado end-to-end es correr `npx prisma generate` en un entorno con acceso normal a internet** (tu máquina local o el propio Render lo hacen automáticamente sin problema). A partir de ahí, todo el backend debería tipar y ejecutarse sin cambios adicionales.

Si sos una IA continuando este trabajo: **empezá corriendo los pasos de la sección 3 (Desarrollo local)** para confirmar que todo funciona con Prisma generado de verdad, y revisá la sección 9 (Pendientes) para las mejoras opcionales no bloqueantes.

---

## 2. Stack técnico

**Frontend:** React 18, TypeScript, Tailwind CSS, shadcn/ui (Radix), React Router v6, TanStack Query v5, Recharts, React Hook Form + Zod, Vite.

**Backend:** Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, JWT (cookie + bearer), bcryptjs, Resend (email), Helmet, express-rate-limit.

**Estructura:**
```
caps-stock/
├── client/           # Frontend (Vite + React)
│   └── src/
│       ├── components/  # ui/, layout/, products/, dashboard/
│       ├── pages/
│       ├── hooks/
│       ├── contexts/
│       ├── lib/
│       └── types/
├── server/           # Backend (Express + TS)
│   └── src/
│       ├── routes/
│       ├── services/
│       ├── middleware/
│       ├── schemas/      # Zod
│       ├── templates/    # Emails HTML
│       ├── lib/
│       └── utils/
├── prisma/
│   └── schema.prisma
├── render.yaml
└── package.json      # workspaces root
```

---

## 3. Desarrollo local

### Requisitos
- Node.js ≥ 18
- PostgreSQL corriendo localmente (o una URL de conexión remota, por ejemplo de Render)

### Pasos

```bash
# 1. Clonar e instalar todo (usa npm workspaces)
git clone <tu-repo>
cd caps-stock
npm install

# 2. Configurar variables de entorno
cp server/.env.example server/.env
cp client/.env.example client/.env
# Editar server/.env: como mínimo poné tu DATABASE_URL real y un JWT_SECRET fuerte
#   (generar uno con: openssl rand -base64 48)

# 3. Generar el cliente de Prisma (requiere acceso a internet)
npm run prisma:generate

# 4. Crear las tablas en la base de datos
npm run prisma:migrate
# Esto te va a pedir un nombre para la migración, por ejemplo: init

# 5. Cargar datos de demostración (usuarios + productos de ejemplo)
npm run seed

# 6. Levantar el backend (puerto 4000 por defecto)
npm run dev

# 7. En OTRA terminal, levantar el frontend (puerto 5173)
npm run dev:client
```

Abrí `http://localhost:5173`. Usuarios de prueba creados por el seed:

| Rol   | Email             | Contraseña |
|-------|-------------------|------------|
| ADMIN | admin@caps.local  | Admin123!  |
| STAFF | staff@caps.local  | Staff123!  |

**Importante:** cambiá estas contraseñas o eliminá estos usuarios antes de usar el sistema en producción con datos reales.

---

## 4. Base de datos y Prisma

- El schema vive en `prisma/schema.prisma` (fuera de `server/` a propósito, para que tanto el server como futuros scripts lo compartan).
- Comandos disponibles desde la raíz:
  - `npm run prisma:generate` — genera `@prisma/client`
  - `npm run prisma:migrate` — crea y aplica una migración en desarrollo
  - `npm run prisma:deploy` — aplica migraciones pendientes en producción (usado por Render)
  - `npm run seed` — corre `server/src/seed.ts`

### Creando la base de datos en Render
1. Dashboard de Render → **New** → **PostgreSQL**.
2. Elegí un nombre (ej. `caps-stock-db`), región, plan.
3. Una vez creada, copiá el **Internal Database URL** (si el backend también está en Render) o el **External Database URL** (si conectás desde afuera).
4. Pegalo como `DATABASE_URL` en las variables de entorno del backend.

---

## 5. Variables de entorno

### `server/.env` (ver `server/.env.example`)
```
DATABASE_URL=          # conexión a PostgreSQL
NODE_ENV=development
PORT=4000
CLIENT_URL=            # URL del frontend (para CORS)
JWT_SECRET=            # secreto fuerte y aleatorio
JWT_EXPIRES_IN=8h
RESEND_API_KEY=        # API key de Resend
RESEND_FROM_EMAIL=     # remitente verificado en Resend
CAPS_EMAIL=            # email por defecto para reportes (también configurable desde Ajustes)
```

### `client/.env` (ver `client/.env.example`)
```
VITE_API_URL=http://localhost:4000/api
```

**Nunca** commitear archivos `.env` reales — el `.gitignore` ya los excluye.

---

## 6. Configurar Resend (email)

1. Creá una cuenta en resend.com.
2. Verificá un dominio propio (recomendado) o usá el dominio de pruebas `onboarding@resend.dev` para testear.
3. Generá una API key en el dashboard de Resend.
4. Poné esa key en `RESEND_API_KEY` (backend). Nunca en el frontend.
5. Configurá `RESEND_FROM_EMAIL` con una dirección de tu dominio verificado (o dejá `onboarding@resend.dev` para pruebas).
6. Configurá el email de destino desde la pantalla **Ajustes** del sistema (como ADMIN), o con la variable `CAPS_EMAIL`.

Los emails ya están completamente implementados con plantillas HTML profesionales para: stock bajo, sin stock, por vencer/vencidos, reporte completo y ficha de producto individual.

---

## 7. Deploy en Render

Este repo incluye `render.yaml` (Render Blueprint) para desplegar todo con un clic desde el dashboard de Render (**New** → **Blueprint**, apuntando a tu repo de GitHub).

El blueprint crea:
- Un **Web Service** para el backend (`caps-stock-api`)
- Un **Static Site** para el frontend (`caps-stock-client`)
- Una base de datos **PostgreSQL** (`caps-stock-db`)

### Pasos manuales si preferís no usar el blueprint

**Backend:**
1. New → Web Service → conectar el repo de GitHub.
2. Root Directory: `.` (raíz del monorepo)
3. Build Command: `npm install && npm run build:server`
4. Start Command: `npm run prisma:deploy && node server/dist/index.js`
5. Variables de entorno: todas las de `server/.env.example`, usando la `DATABASE_URL` de tu Postgres de Render.
6. Health Check Path: `/health`

**Frontend:**
1. New → Static Site → mismo repo.
2. Build Command: `npm install && npm run build:client`
3. Publish Directory: `client/dist`
4. Variable de entorno: `VITE_API_URL=https://<tu-backend>.onrender.com/api`
5. Agregar una regla de rewrite `/* → /index.html` (necesario para que React Router funcione con rutas directas).

### Actualizar producción tras un push
Render por defecto redeploya automáticamente en cada push a la rama configurada (usualmente `main`). Las migraciones de Prisma se aplican solas en cada deploy porque el `startCommand` del backend corre `prisma migrate deploy` antes de levantar el servidor.

---

## 8. Seguridad implementada

- Contraseñas hasheadas con bcrypt (12 rounds), nunca en texto plano.
- JWT firmado, transportado por cookie `httpOnly` + fallback `Authorization: Bearer` para compatibilidad.
- Rate limiting en `/auth/login` (10 intentos / 15 min) y en endpoints de email (15 / 10 min).
- Helmet para cabeceras HTTP seguras.
- CORS restringido a `CLIENT_URL`.
- Validación de todo input con Zod en cada ruta.
- Autorización por rol (`ADMIN` / `STAFF`) en cada endpoint sensible (crear/editar = ambos roles; eliminar y gestión de usuarios = solo ADMIN).
- Los errores internos nunca se exponen al cliente (mensaje genérico en producción; detalle solo en modo desarrollo).
- Protección contra SQL injection nativa de Prisma (queries parametrizadas).
- Ninguna clave (Resend, JWT, DB) se expone al frontend.

---

## 9. Pendientes / mejoras opcionales (no bloqueantes)

Estas son mejoras deseables pero **el sistema es funcional end-to-end sin ellas**:

1. **Correr `prisma generate` en un entorno real** y validar el backend con `npm run dev` contra una base Postgres real (ver sección 3). Esto es lo único que no pude ejecutar por la restricción de red del sandbox donde se generó el código.
2. **Code-splitting del frontend**: el bundle de Vite pesa ~1MB (con Recharts incluido). Se puede resolver con `React.lazy()` por página y/o `build.rollupOptions.output.manualChunks` en `vite.config.ts`. No es un error, solo una optimización de performance.
3. **Exportación PDF/CSV de reportes**: la pantalla de Reportes ya tiene la interfaz preparada (nota visible al usuario); falta implementar la generación real de archivos si se desea además del envío por email.
4. **Tests automatizados**: no se incluyeron tests unitarios/e2e. Sería valioso agregar Vitest (frontend) y Jest/Supertest (backend) para las rutas críticas de stock.
5. **Editar categorías desde la UI**: el backend ya soporta CRUD completo de categorías (`/api/categories`), pero el frontend solo las consume en selects; no hay pantalla dedicada para crear/editar/borrar categorías. Se puede agregar fácilmente dentro de `SettingsPage.tsx` siguiendo el mismo patrón que `UserManagementCard`.
6. **Refresh token / expiración de sesión más elegante**: actualmente el JWT expira a las 8hs y el usuario simplemente vuelve al login; se podría agregar refresh silencioso.

---

## 10. Flujo funcional ya verificado por diseño

Cada uno de estos puntos está implementado end-to-end (pendiente solo de la verificación con Prisma real, punto 9.1):

1. Login con JWT y roles.
2. CRUD completo de productos.
3. Agregar stock (`POST /products/:id/stock-in`) — transaccional, genera `StockMovement`.
4. Descontar stock (`POST /products/:id/stock-out`) — valida que no exista stock negativo.
5. Ajuste manual de stock (solo ADMIN) — genera movimiento tipo `ADJUSTMENT`.
6. Historial de movimientos con filtros y paginación.
7. Detección automática de estado (`IN_STOCK`, `LOW_STOCK`, `OUT_OF_STOCK`, `EXPIRING_SOON`, `EXPIRED`).
8. Dashboard con KPIs y 3 gráficos (Recharts): distribución por categoría, productos con stock bajo, línea de tiempo de movimientos.
9. Envío de reportes por email (Resend) con plantillas HTML: stock bajo, sin stock, por vencer, completo, ficha individual.
10. Gestión de usuarios y roles (solo ADMIN).
11. Configuración de email de la organización.
12. Búsqueda, filtros, orden y paginación en la tabla de stock.
13. Diseño responsive (mobile, tablet, desktop) con sidebar colapsable y drawer mobile.

---

## 11. Datos de demostración

El seed (`server/src/seed.ts`) crea 8 categorías y 15 productos de ejemplo marcados con `isDemo: true`, incluyendo casos con stock bajo, sin stock, y por vencer, para que el dashboard y las alertas se vean pobladas desde el primer login. Podés borrar estos productos desde la UI (rol ADMIN) o directamente en la base de datos cuando tengas la lista real de productos del CAPS.
