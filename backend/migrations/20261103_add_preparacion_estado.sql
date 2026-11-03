ALTER TABLE pedidos
MODIFY estado ENUM('pendiente', 'en preparacion', 'entregado', 'cancelado')
NOT NULL DEFAULT 'pendiente';
