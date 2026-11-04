import { getPool, isDatabaseUnavailable, methodNotAllowed, sendJson } from "./_db.js";

function validateOrder(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return "El pedido enviado no es válido.";
  const customer = body.customer;
  if (!customer || typeof customer !== "object" || Array.isArray(customer)) return "Completa tus datos de contacto.";

  const name = typeof customer.name === "string" ? customer.name.trim() : "";
  const email = typeof customer.email === "string" ? customer.email.trim() : "";
  const phone = typeof customer.phone === "string" ? customer.phone.trim() : "";
  const address = typeof customer.address === "string" ? customer.address.trim() : "";
  if (name.length < 2 || name.length > 120) return "Escribe un nombre de entre 2 y 120 caracteres.";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Escribe un correo electrónico válido.";
  if (phone.length > 24) return "El teléfono no debe superar los 24 caracteres.";
  if (address.length < 5 || address.length > 255) return "Escribe una dirección de entrega de entre 5 y 255 caracteres.";

  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 50) return "El carrito debe contener entre 1 y 50 productos.";
  const seen = new Set();
  for (const item of body.items) {
    if (!item || !Number.isSafeInteger(item.id) || item.id < 1) return "Hay un producto no válido en el carrito.";
    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) return "La cantidad de un producto no es válida.";
    if (seen.has(item.id)) return "El carrito contiene productos duplicados.";
    seen.add(item.id);
  }
  return null;
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    methodNotAllowed(response, ["POST"]);
    return;
  }

  if (Number(request.headers["content-length"] || 0) > 20000) {
    sendJson(response, 413, { error: "El pedido supera el tamaño permitido." });
    return;
  }
  const validationError = validateOrder(request.body);
  if (validationError) {
    sendJson(response, 400, { error: validationError });
    return;
  }

  const pool = getPool();
  if (!pool) {
    sendJson(response, 503, { error: "La tienda todavía no está conectada a TiDB Cloud." });
    return;
  }

  const connection = await pool.getConnection().catch((error) => {
    console.error("No se pudo abrir una conexión con TiDB Cloud:", error);
    return null;
  });
  if (!connection) {
    sendJson(response, 503, { error: "No pudimos conectar con la tienda. Inténtalo de nuevo más tarde." });
    return;
  }

  try {
    const { customer, items } = request.body;
    const ids = items.map((item) => item.id);
    const placeholders = ids.map(() => "?").join(", ");

    await connection.beginTransaction();
    const [products] = await connection.execute(
      `SELECT idProducto, Nombres, Precio, Stock
         FROM producto
        WHERE idProducto IN (${placeholders})
        FOR UPDATE`,
      ids,
    );
    if (products.length !== items.length) {
      await connection.rollback();
      sendJson(response, 409, { error: "Uno de los productos ya no está disponible. Actualizamos el catálogo para ti." });
      return;
    }

    const productsById = new Map(products.map((product) => [Number(product.idProducto), product]));
    let totalInCents = 0;
    for (const item of items) {
      const product = productsById.get(item.id);
      if (!product || Number(product.Stock) < item.quantity) {
        await connection.rollback();
        sendJson(response, 409, { error: `"${product?.Nombres || "Un producto"}" ya no tiene unidades suficientes. Actualizamos el catálogo para ti.` });
        return;
      }
      totalInCents += Math.round(Number(product.Precio) * 100) * item.quantity;
    }

    const total = (totalInCents / 100).toFixed(2);
    const [customerResult] = await connection.execute(
      "INSERT INTO cliente (Dni, Nombres, Direccion, Email, Telefono) VALUES (NULL, ?, ?, ?, ?)",
      [customer.name.trim(), customer.address.trim(), customer.email.trim(), customer.phone.trim() || null],
    );
    const [paymentResult] = await connection.execute(
      "INSERT INTO pago (Monto) VALUES (?)",
      [total],
    );
    const [orderResult] = await connection.execute(
      `INSERT INTO compras (idCliente, idPago, FechaCompras, Monto, Estado)
       VALUES (?, ?, CURRENT_TIMESTAMP, ?, 'Pendiente')`,
      [customerResult.insertId, paymentResult.insertId, total],
    );

    for (const item of items) {
      const product = productsById.get(item.id);
      const price = (Math.round(Number(product.Precio) * 100) / 100).toFixed(2);
      await connection.execute(
        "INSERT INTO detalle_compras (idProducto, idCompras, Cantidad, PrecioCompra) VALUES (?, ?, ?, ?)",
        [item.id, orderResult.insertId, item.quantity, price],
      );
      await connection.execute(
        "UPDATE producto SET Stock = Stock - ? WHERE idProducto = ?",
        [item.quantity, item.id],
      );
    }

    await connection.commit();
    sendJson(response, 201, { orderId: Number(orderResult.insertId), total: Number(total), status: "Pendiente" });
  } catch (error) {
    await connection.rollback();
    console.error("Error al registrar un pedido en TiDB Cloud:", error);
    sendJson(response, isDatabaseUnavailable(error) ? 503 : 500, {
      error: isDatabaseUnavailable(error)
        ? "No pudimos guardar tu pedido. Inténtalo nuevamente en unos minutos."
        : "No pudimos registrar el pedido. Verifica que la base de datos esté inicializada e inténtalo de nuevo.",
    });
  } finally {
    connection.release();
  }
}
