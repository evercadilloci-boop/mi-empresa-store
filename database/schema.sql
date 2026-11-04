CREATE TABLE IF NOT EXISTS cliente (
  idCliente INT UNSIGNED NOT NULL AUTO_INCREMENT,
  Dni VARCHAR(9) DEFAULT NULL,
  Nombres VARCHAR(120) NOT NULL,
  Direccion VARCHAR(255) NOT NULL,
  Email VARCHAR(254) NOT NULL,
  Telefono VARCHAR(24) DEFAULT NULL,
  Password VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (idCliente),
  KEY idx_cliente_email (Email)
);

CREATE TABLE IF NOT EXISTS pago (
  idPago INT UNSIGNED NOT NULL AUTO_INCREMENT,
  Monto DECIMAL(10, 2) NOT NULL,
  PRIMARY KEY (idPago)
);

CREATE TABLE IF NOT EXISTS compras (
  idCompras INT UNSIGNED NOT NULL AUTO_INCREMENT,
  idCliente INT UNSIGNED NOT NULL,
  idPago INT UNSIGNED NOT NULL,
  FechaCompras TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Monto DECIMAL(10, 2) NOT NULL,
  Estado VARCHAR(50) NOT NULL DEFAULT 'Pendiente',
  PRIMARY KEY (idCompras),
  KEY idx_compras_cliente (idCliente),
  KEY idx_compras_pago (idPago),
  CONSTRAINT fk_compras_cliente FOREIGN KEY (idCliente) REFERENCES cliente (idCliente),
  CONSTRAINT fk_compras_pago FOREIGN KEY (idPago) REFERENCES pago (idPago)
);

CREATE TABLE IF NOT EXISTS producto (
  idProducto INT UNSIGNED NOT NULL AUTO_INCREMENT,
  Nombres VARCHAR(255) NOT NULL,
  Foto VARCHAR(1024) DEFAULT NULL,
  Descripcion VARCHAR(255) DEFAULT NULL,
  Precio DECIMAL(10, 2) NOT NULL,
  Stock INT UNSIGNED NOT NULL DEFAULT 0,
  Categoria VARCHAR(80) NOT NULL DEFAULT 'Selección',
  PRIMARY KEY (idProducto),
  KEY idx_producto_categoria (Categoria)
);

CREATE TABLE IF NOT EXISTS detalle_compras (
  idDetalle INT UNSIGNED NOT NULL AUTO_INCREMENT,
  idProducto INT UNSIGNED NOT NULL,
  idCompras INT UNSIGNED NOT NULL,
  Cantidad INT UNSIGNED NOT NULL,
  PrecioCompra DECIMAL(10, 2) NOT NULL,
  PRIMARY KEY (idDetalle),
  UNIQUE KEY uq_detalle_producto_compra (idProducto, idCompras),
  KEY idx_detalle_compra (idCompras),
  CONSTRAINT fk_detalle_producto FOREIGN KEY (idProducto) REFERENCES producto (idProducto),
  CONSTRAINT fk_detalle_compra FOREIGN KEY (idCompras) REFERENCES compras (idCompras)
);

INSERT INTO producto (Nombres, Foto, Descripcion, Precio, Stock, Categoria)
SELECT 'Auriculares esenciales',
       'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=82',
       'Sonido envolvente para acompañar tu ritmo.', 89.90, 12, 'Tecnología'
WHERE NOT EXISTS (SELECT 1 FROM producto WHERE Nombres = 'Auriculares esenciales');

INSERT INTO producto (Nombres, Foto, Descripcion, Precio, Stock, Categoria)
SELECT 'Reloj de todos los días',
       'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=82',
       'Diseño limpio, cómodo y listo para salir.', 119.00, 8, 'Accesorios'
WHERE NOT EXISTS (SELECT 1 FROM producto WHERE Nombres = 'Reloj de todos los días');

INSERT INTO producto (Nombres, Foto, Descripcion, Precio, Stock, Categoria)
SELECT 'Parlante compacto',
       'https://images.unsplash.com/photo-1608043152269-423dbba4e797?auto=format&fit=crop&w=900&q=82',
       'Tu música favorita, en cualquier rincón.', 74.50, 10, 'Tecnología'
WHERE NOT EXISTS (SELECT 1 FROM producto WHERE Nombres = 'Parlante compacto');

INSERT INTO producto (Nombres, Foto, Descripcion, Precio, Stock, Categoria)
SELECT 'Botella reutilizable',
       'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=82',
       'Un pequeño hábito para un día más ligero.', 32.00, 18, 'Hogar'
WHERE NOT EXISTS (SELECT 1 FROM producto WHERE Nombres = 'Botella reutilizable');

INSERT INTO producto (Nombres, Foto, Descripcion, Precio, Stock, Categoria)
SELECT 'Lámpara de sobremesa',
       'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=82',
       'Luz cálida para tus momentos tranquilos.', 96.00, 5, 'Hogar'
WHERE NOT EXISTS (SELECT 1 FROM producto WHERE Nombres = 'Lámpara de sobremesa');

INSERT INTO producto (Nombres, Foto, Descripcion, Precio, Stock, Categoria)
SELECT 'Zapatillas urbanas',
       'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=82',
       'Comodidad sencilla para ir un poco más lejos.', 145.00, 7, 'Accesorios'
WHERE NOT EXISTS (SELECT 1 FROM producto WHERE Nombres = 'Zapatillas urbanas');
