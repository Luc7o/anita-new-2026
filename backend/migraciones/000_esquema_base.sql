-- Esquema base completo. Pensada para una base de datos NUEVA: con esta sola
-- migración (más las incrementales 001+ que siguen, que ahora se saltan solas
-- si ya está todo aplicado) alcanza para tener el sistema funcionando, sin
-- necesitar db.create_all() en ningún momento.
--
-- Usa CREATE TABLE IF NOT EXISTS a propósito: en una base existente que ya
-- tenga estas tablas (creadas antes con create_all()), no hace nada.

CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL UNIQUE,
    slug VARCHAR(80) NOT NULL UNIQUE,
    descripcion VARCHAR(300),
    icono VARCHAR(100) DEFAULT 'bag',
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL, 
    apellido VARCHAR(80) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    direccion VARCHAR(200),
    distrito VARCHAR(100),
    provincia VARCHAR(100),
    departamento VARCHAR(100),
    referencia VARCHAR(200),
    activo BOOLEAN DEFAULT TRUE,
    es_admin BOOLEAN DEFAULT FALSE,
    rol VARCHAR(20) NOT NULL DEFAULT 'cliente',
    fecha_registro DATETIME,
    INDEX idx_usuarios_email (email)
);

CREATE TABLE IF NOT EXISTS productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL,
    precio_oferta DECIMAL(10, 2),
    stock INT DEFAULT 0,
    sku VARCHAR(60) UNIQUE,
    tallas VARCHAR(200),
    colores VARCHAR(300),
    categoria_id INT NOT NULL,
    imagen_url VARCHAR(400) DEFAULT '',
    destacado BOOLEAN DEFAULT FALSE,
    es_nuevo BOOLEAN DEFAULT TRUE,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME,
    fecha_actualizacion DATETIME,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

CREATE TABLE IF NOT EXISTS carrito (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    talla VARCHAR(20),
    color VARCHAR(50),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_pedido VARCHAR(30) NOT NULL UNIQUE,
    idempotency_key VARCHAR(64) UNIQUE,
    usuario_id INT NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente',
    estado_pago VARCHAR(20) DEFAULT 'pendiente',
    comprobante_url VARCHAR(400),
    metodo_pago VARCHAR(20) NOT NULL,
    tipo_entrega VARCHAR(20) DEFAULT 'delivery',
    subtotal DECIMAL(10, 2) NOT NULL,
    costo_envio DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    envio_nombre VARCHAR(160),
    envio_telefono VARCHAR(20),
    envio_direccion VARCHAR(200),
    envio_distrito VARCHAR(100),
    envio_provincia VARCHAR(100),
    envio_dpto VARCHAR(100),
    envio_referencia VARCHAR(200),
    empresa_envio VARCHAR(100),
    numero_seguimiento VARCHAR(100),
    tarjeta_titular VARCHAR(160),
    tarjeta_ultimos4 VARCHAR(4),
    nota TEXT,
    fecha_creacion DATETIME,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS detalles_pedido (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    precio_unit DECIMAL(10, 2) NOT NULL,
    talla VARCHAR(20),
    color VARCHAR(50),
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);
