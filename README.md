# Mi Empresa Store

Tienda web con catálogo, búsqueda, filtros, carrito y registro de pedidos. Incluye una interfaz PWA y funciones API de Vercel.

## Requisitos

- Node.js 20 o posterior.
- TiDB Cloud para persistir catálogo y pedidos.

## Base de datos

Ejecuta `database/schema.sql` en una base de TiDB Cloud. Configura en Vercel `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y `DB_NAME`. No publiques las credenciales.

## Desarrollo y pruebas

```powershell
npm install
npm test
npm run check
```
