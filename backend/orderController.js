function crearControladorPedido(pool) {
    return async (req, res) => {
        const { modalidad_entrega, direccion_entrega, metodo_pago, productos } = req.body || {};
        const modalidadesPermitidas = ['domicilio', 'recogida'];
        const metodosPagoPermitidos = ['transferencia', 'efectivo'];
        const direccion = typeof direccion_entrega === 'string' ? direccion_entrega.trim() : '';

        if (!modalidadesPermitidas.includes(modalidad_entrega)) {
            return res.status(400).json({ error: 'Selecciona una modalidad de entrega válida.' });
        }
        if (modalidad_entrega === 'domicilio' && (!direccion || direccion.length > 200)) {
            return res.status(400).json({ error: 'Ingresa una dirección válida de máximo 200 caracteres.' });
        }
        if (!metodosPagoPermitidos.includes(metodo_pago)) {
            return res.status(400).json({ error: 'Selecciona un método de pago válido.' });
        }
        if (!Array.isArray(productos) || productos.length === 0 || productos.length > 50) {
            return res.status(400).json({ error: 'El pedido debe incluir entre 1 y 50 productos.' });
        }

        const cantidadesPorProducto = new Map();
        for (const producto of productos) {
            const idProducto = Number(producto?.id_producto);
            const cantidad = Number(producto?.cantidad);
            if (!Number.isSafeInteger(idProducto) || idProducto < 1 ||
                !Number.isSafeInteger(cantidad) || cantidad < 1 || cantidad > 999) {
                return res.status(400).json({ error: 'Hay un producto o cantidad inválida en el pedido.' });
            }

            const cantidadAcumulada = (cantidadesPorProducto.get(idProducto) || 0) + cantidad;
            if (cantidadAcumulada > 999) {
                return res.status(400).json({ error: 'La cantidad total de un producto no puede superar 999.' });
            }
            cantidadesPorProducto.set(idProducto, cantidadAcumulada);
        }

        let conexion;
        try {
            conexion = await pool.getConnection();
            await conexion.beginTransaction();

            const idsProducto = [...cantidadesPorProducto.keys()];
            const [filasProducto] = await conexion.query(
                `SELECT id_producto, nombre, precio, stock, activo
                 FROM productos
                 WHERE id_producto IN (${idsProducto.map(() => '?').join(', ')})
                   AND activo = TRUE
                 ORDER BY id_producto
                 FOR UPDATE`,
                idsProducto
            );
            const productosPorId = new Map(
                filasProducto.map((producto) => [Number(producto.id_producto), producto])
            );

            const productosPedido = [];
            let totalEnCentavos = 0;
            for (const [idProducto, cantidad] of cantidadesPorProducto) {
                const producto = productosPorId.get(idProducto);
                if (!producto) {
                    await conexion.rollback();
                    return res.status(409).json({ error: 'Uno de los productos ya no está disponible.' });
                }
                if (Number(producto.stock) < cantidad) {
                    await conexion.rollback();
                    return res.status(409).json({
                        error: `Stock insuficiente para ${producto.nombre}. Disponibles: ${Number(producto.stock)}.`
                    });
                }

                const precio = Number(producto.precio);
                if (!Number.isFinite(precio) || precio < 0) {
                    throw new Error(`El precio de ${producto.nombre} no es válido.`);
                }
                const precioEnCentavos = Math.round(precio * 100);
                totalEnCentavos += precioEnCentavos * cantidad;
                productosPedido.push({
                    id_producto: idProducto,
                    nombre: producto.nombre,
                    cantidad,
                    precio_unitario: precioEnCentavos / 100
                });
            }

            const total = totalEnCentavos / 100;
            for (const producto of productosPedido) {
                const [resultadoStock] = await conexion.query(
                    `UPDATE productos
                     SET stock = stock - ?
                     WHERE id_producto = ? AND stock >= ? AND activo = TRUE`,
                    [producto.cantidad, producto.id_producto, producto.cantidad]
                );
                if (resultadoStock.affectedRows !== 1) {
                    throw Object.assign(new Error('El inventario cambió mientras se procesaba el pedido.'), {
                        status: 409
                    });
                }
            }

            const direccionPedido = modalidad_entrega === 'domicilio' ? direccion : 'Recogida en tienda';
            const productoPrincipal = productosPedido[0];
            const [resultadoPedido] = await conexion.query(
                `INSERT INTO pedidos
                    (id_usuario, id_producto, cantidad, precio_unitario, total, metodo_pago, direccion_entrega, estado)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente')`,
                [
                    req.usuario.id_usuario,
                    productoPrincipal.id_producto,
                    productoPrincipal.cantidad,
                    productoPrincipal.precio_unitario,
                    total,
                    metodo_pago,
                    direccionPedido
                ]
            );
            const idPedido = resultadoPedido.insertId;

            for (const producto of productosPedido) {
                await conexion.query(
                    `INSERT INTO detalle_pedido
                        (id_pedido, id_producto, cantidad, precio_unitario, subtotal)
                     VALUES (?, ?, ?, ?, ?)`,
                    [
                        idPedido,
                        producto.id_producto,
                        producto.cantidad,
                        producto.precio_unitario,
                        (producto.precio_unitario * producto.cantidad)
                    ]
                );
            }

            await conexion.commit();
            return res.status(201).json({
                mensaje: 'Pedido registrado exitosamente.',
                pedido: { id_pedido: idPedido, total }
            });
        } catch (error) {
            if (conexion) {
                try {
                    await conexion.rollback();
                } catch (rollbackError) {
                    console.error('Error al revertir el pedido:', rollbackError);
                }
            }
            console.error('Error al registrar el pedido:', error);
            return res.status(error.status || 500).json({
                error: error.status ? error.message : 'No se pudo registrar el pedido.'
            });
        } finally {
            if (conexion) conexion.release();
        }
    };
}

module.exports = { crearControladorPedido };
