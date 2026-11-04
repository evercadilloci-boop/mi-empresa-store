import { getPool, isDatabaseUnavailable, methodNotAllowed, sendJson } from "./_db.js";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    methodNotAllowed(response, ["GET"]);
    return;
  }

  const pool = getPool();
  if (!pool) {
    sendJson(response, 503, { error: "La tienda todavía no está conectada a TiDB Cloud." });
    return;
  }

  try {
    const [rows] = await pool.execute(
      `SELECT idProducto AS id, Nombres AS nombre, Foto AS foto,
              Descripcion AS descripcion, Precio AS precio, Stock AS stock,
              Categoria AS categoria
         FROM producto
        ORDER BY idProducto DESC`,
    );
    sendJson(response, 200, { products: rows.map((row) => ({
      id: Number(row.id),
      nombre: row.nombre,
      foto: row.foto,
      descripcion: row.descripcion,
      precio: Number(row.precio),
      stock: Number(row.stock),
      categoria: row.categoria,
    })) });
  } catch (error) {
    console.error("Error al consultar el catálogo en TiDB Cloud:", error);
    sendJson(response, isDatabaseUnavailable(error) ? 503 : 500, {
      error: isDatabaseUnavailable(error)
        ? "No pudimos conectar con la base de datos. Revisa la configuración de TiDB Cloud."
        : "No se pudo cargar el catálogo. Verifica que la base de datos esté inicializada.",
    });
  }
}
