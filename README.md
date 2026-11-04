# Mi Empresa Store

Tienda web basada en las prácticas 12 y 13: catálogo de productos, filtros, búsqueda, carrito de compras y registro de pedidos. El frontend está hecho con HTML, CSS y JavaScript; la aplicación es instalable como PWA y usa funciones de Vercel para guardar los datos en TiDB Cloud.

## Requisitos

- Node.js 20 o posterior.
- Una base de datos TiDB Cloud con acceso de red desde Vercel.
- Una cuenta de GitHub y un proyecto de Vercel conectado a ese repositorio.

## Preparar TiDB Cloud

1. Crea una base de datos en TiDB Cloud y abre su editor SQL.
2. Usa la base `mi_empresa_store` y ejecuta [`database/schema.sql`](./database/schema.sql). El archivo crea las tablas de clientes, productos, compras, pagos y detalle, y agrega seis productos de ejemplo si todavía no existen.
3. En los datos de conexión de TiDB Cloud, copia el host, el puerto, el usuario y la contraseña. Mantén habilitado TLS.

## Publicar con GitHub y Vercel

GitHub guarda el código y Vercel aloja tanto la aplicación web como sus funciones API. GitHub Pages no ejecuta las funciones API necesarias para TiDB Cloud.

1. Sube este proyecto a un repositorio de GitHub.
2. En Vercel, importa ese repositorio y conserva la configuración de detección automática. No hace falta un framework ni un comando de build.
3. En **Settings → Environment Variables** de Vercel, crea estas variables para Production y, si corresponde, Preview:

   | Variable | Valor |
   | --- | --- |
   | `DB_HOST` | Host de conexión de TiDB Cloud |
   | `DB_PORT` | Puerto de TiDB Cloud (normalmente `4000`) |
   | `DB_USER` | Usuario de la base de datos |
   | `DB_PASSWORD` | Contraseña de la base de datos |
   | `DB_NAME` | `mi_empresa_store` |

4. Vuelve a desplegar después de guardar las variables. Las credenciales se usan solo en las funciones de Vercel; no las pongas en archivos JavaScript del navegador ni las subas a GitHub.
5. Abre la URL HTTPS de Vercel. La tienda funciona en modo de demostración cuando faltan las variables; al conectar la base de datos, el catálogo y los pedidos pasan a TiDB Cloud.

## Ejecutar localmente

```powershell
npm install
Copy-Item .env.example .env.local
```

Completa .env.local con las credenciales de TiDB Cloud y ejecuta:

```powershell
npx vercel dev
```

Abre la dirección local que indique Vercel CLI. Para comprobar la sintaxis de los archivos JavaScript:

```powershell
npm run check
```

## Instalar en el celular y usar sin conexión

- **Android:** abre la URL HTTPS de Vercel en Chrome y selecciona **Instalar aplicación** o **Agregar a pantalla principal**.
- **iPhone/iPad:** abre la URL en Safari, toca **Compartir** y selecciona **Agregar a pantalla de inicio**.
- La interfaz y el último catálogo consultado quedan disponibles sin conexión. Los pedidos se guardan en TiDB Cloud al recuperar la conexión; la tienda de demostración no registra pedidos.

## Publicar una actualización

Al publicar cambios en GitHub, Vercel despliega una nueva versión. Antes del despliegue, actualiza el mismo número de versión en `APP_VERSION` de `app.js`, `CACHE_NAME` de `sw.js` y `version` de `version.json`. Al detectar la nueva versión, la tienda muestra un aviso y recarga después de que la persona elija **Actualizar**.
