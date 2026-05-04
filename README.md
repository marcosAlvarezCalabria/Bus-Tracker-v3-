# Ireland Bus Tracking

Proyecto experimental para seguir buses de Galway con:

- `apps/api`: backend Express + TypeScript
- `apps/web`: frontend React + Vite + Tailwind 4
- `packages/shared`: schemas y tipos compartidos

## Estado actual

El proyecto queda pausado en este punto.

Lo que sí está hecho:

- frontend con mapa en la home
- selección de líneas de Galway
- render de buses por ruta
- geolocalización del usuario
- base de endpoint `/stops` en backend
- despliegue de API y web con GitHub Actions

## Limitación principal

La limitación real ahora mismo no es la UI, sino la frecuencia y calidad de los datos de vehículos.

El mapa funciona, pero el feed no actualiza las posiciones con la frecuencia necesaria para que esto tenga sentido como tracker en tiempo real. En pruebas, los buses pueden mantener exactamente la misma posición durante muchos segundos, así que visualmente no se comporta como un rastreador útil.

Mientras el origen de datos no entregue posiciones bastante más frecuentes y fiables, el proyecto no aporta suficiente valor para seguir iterándolo.

## Qué se deja hecho

- estructura monorepo funcional
- API en TypeScript
- frontend desplegable en Cloudflare Pages
- workflow de deploy desde GitHub Actions
- integración de `VITE_API_URL` para build de producción

## Desarrollo local

1. Copiar `apps/api/.env.example` a `apps/api/.env`
2. Instalar dependencias con `npm install`
3. Levantar la API:

```bash
npm run dev --workspace @bus-tracker/api
```

4. Levantar la web:

```bash
npm run dev --workspace @bus-tracker/web
```

## Deploy

Los pushes a `main` disparan el workflow de GitHub Actions.

El flujo actual:

1. instala dependencias
2. ejecuta tests de API
3. build de API
4. deploy de API al VPS por SSH
5. build de web
6. deploy de web a Cloudflare Pages

Secrets necesarios en GitHub Actions:

- `VPS_HOST`
- `VPS_USER`
- `VPS_SSH_KEY`
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## Nota final

El repositorio se queda en GitHub como referencia del trabajo hecho hasta ahora. Si en el futuro aparece una fuente de posiciones de buses con actualizaciones realmente frecuentes, se podría retomar desde esta base.
