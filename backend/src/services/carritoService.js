const { sql, poolPromise } = require("../config/db");

const carritoService = {
  //validar el stock de un producto antes de agregarlo al carrito
  async validarStock(id_producto, cantidad) {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("id_producto", sql.Int, id_producto)
      .query(`
        SELECT stock
        FROM Producto
        WHERE id_producto = @id_producto
      `);
    const stock = result.recordset[0]?.stock ?? 0;
    return stock >= cantidad;
  },

  //obtener el carrito activo de un cliente
  async obtenerCarritoActivo(id_cliente) {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("id_cliente", sql.Int, id_cliente)
      .query(`
        SELECT id_carrito, subtotal
        FROM Carrito
        WHERE id_cliente = @id_cliente
        AND id_estado_carrito = 1
      `);
    return result.recordset[0] ?? null;
  },

  //obtener un producto por su id
  async getProducto(id_producto) {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("id_producto", sql.Int, id_producto)
      .query(`
        SELECT *
        FROM Producto
        WHERE id_producto = @id_producto
      `);

    //si el producto no existe lanza error
    if (!result.recordset[0]) {
      throw new Error("Producto no encontrado");
    }
    return result.recordset[0];
  },

  //obtener los items de un carrito
  async obtenerItemsCarrito(id_carrito) {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("id_carrito", sql.Int, id_carrito)
      .query(`
        SELECT 
          i.id_item_carrito,
          i.cantidad,
          i.precio,
          p.nombre,
          p.imagen,
          p.stock
        FROM Item_carrito i
        INNER JOIN Producto p
          ON i.id_producto = p.id_producto
        WHERE i.id_carrito = @id_carrito
      `);
    return result.recordset;
  },

  //recalcular subtotal del carrito
  async recalcularSubtotal(id_carrito) {
    const pool = await poolPromise;
    await pool
      .request()
      .input("id_c", sql.Int, id_carrito)
      .query(`
        UPDATE Carrito
        SET subtotal = ISNULL(
          (
            SELECT SUM(cantidad * precio)
            FROM Item_carrito
            WHERE id_carrito = @id_c
          ),
          0
        )
        WHERE id_carrito = @id_c
      `);
  },

  //agregar o actualizar producto en el carrito
  async agregarProducto(id_cliente, id_producto, cantidad, precio) {
    //validar stock
    const hayStock = await carritoService.validarStock(
      id_producto,
      cantidad,
    );

    if (!hayStock) {
      throw new Error("Stock insuficiente");
    }

    const pool = await poolPromise;
    //buscar carrito activo
    let carrito = await carritoService.obtenerCarritoActivo(id_cliente);
    let id_carrito;

    //crear carrito si no existe
    if (!carrito) {
      const nuevo = await pool
        .request()
        .input("fecha", sql.Date, new Date())
        .input("id_cliente", sql.Int, id_cliente)
        .query(`
          INSERT INTO Carrito
          (
            fecha_creacion,
            subtotal,
            id_estado_carrito,
            id_cliente
          )
          VALUES
          (
            @fecha,
            0,
            1,
            @id_cliente
          );

          SELECT SCOPE_IDENTITY() AS id
        `);
      id_carrito = nuevo.recordset[0].id;
    } else {
      id_carrito = carrito.id_carrito;
    }

    //verificar si el producto ya existe en el carrito
    const item = await pool
      .request()
      .input("id_carrito", sql.Int, id_carrito)
      .input("id_p", sql.Int, id_producto)
      .query(`
        SELECT id_item_carrito
        FROM Item_carrito
        WHERE id_carrito = @id_carrito
        AND id_producto = @id_p
      `);
    //si el item existe suma cantidad
    if (item.recordset.length > 0) {
      await pool
        .request()
        .input(
          "id_item",
          sql.Int,
          item.recordset[0].id_item_carrito,
        )
        .input("cant", sql.Int, cantidad)
        .query(`
          UPDATE Item_carrito
          SET cantidad = cantidad + @cant
          WHERE id_item_carrito = @id_item
        `);
    } else {
      //si no existe inserta nuevo item
      await pool
        .request()
        .input("cant", sql.Int, cantidad)
        .input("prec", sql.Decimal(10, 2), precio)
        .input("id_p", sql.Int, id_producto)
        .input("id_c", sql.Int, id_carrito)
        .query(`
          INSERT INTO Item_carrito
          (
            cantidad,
            precio,
            id_producto,
            id_carrito
          )
          VALUES
          (
            @cant,
            @prec,
            @id_p,
            @id_c
          )
        `);
    }
    //recalcular subtotal del carrito
    await carritoService.recalcularSubtotal(id_carrito);

    return {
      mensaje: "Producto agregado con éxito",
    };
  },

  //obtener subtotal del carrito
  async calcularSubtotal(id_carrito) {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("id_c", sql.Int, id_carrito)
      .query(`
        SELECT subtotal
        FROM Carrito
        WHERE id_carrito = @id_c
      `);
    return result.recordset[0]?.subtotal ?? 0;
  },

  //validar stock de todos los productos antes de finalizar compra
  async validarStockProductos(id_carrito, transaction) {
    const req = new sql.Request(transaction);
    const result = await req
      .input("id_c", sql.Int, id_carrito)
      .query(`
        SELECT 
          i.id_producto,
          i.cantidad,
          p.stock,
          p.precio
        FROM Item_carrito i
        INNER JOIN Producto p
          ON i.id_producto = p.id_producto
        WHERE i.id_carrito = @id_c
      `);
    const items = result.recordset;
    //validar carrito vacío
    if (items.length === 0) {
      throw new Error("El carrito está vacío");
    }
    //validar stock y precio de cada producto
    for (const item of items) {
      if (item.stock < item.cantidad) {
        throw new Error(
          `Stock insuficiente para el producto ID ${item.id_producto}`,
        );
      }
      if (item.precio === null || item.precio === undefined) {
        throw new Error(
          `El producto ID ${item.id_producto} no tiene precio válido`,
        );
      }
    }
    return items;
  },

  //actualizar stock de productos después de finalizar compra
  async actualizarStock(items, transaction) {
    for (const item of items) {
      const req = new sql.Request(transaction);
      await req
        .input("id_p", sql.Int, item.id_producto)
        .input("cant", sql.Int, item.cantidad)
        .query(`
          UPDATE Producto
          SET stock = stock - @cant
          WHERE id_producto = @id_p
        `);
    }
  },

  //eliminar un item del carrito
  async eliminarItem(id_item_carrito, id_carrito) {
    const pool = await poolPromise;

    //eliminar item
    await pool
      .request()
      .input("id", sql.Int, id_item_carrito)
      .query(`
        DELETE FROM Item_carrito
        WHERE id_item_carrito = @id
      `);
    //recalcular subtotal
    await carritoService.recalcularSubtotal(id_carrito);

    return {
      mensaje: "Producto eliminado",
    };
  },

  //actualizar cantidad de un producto del carrito
  async actualizarCantidad(
    id_item_carrito,
    nueva_cantidad,
    id_carrito,
  ) {
    const pool = await poolPromise;
    //si la cantidad es menor o igual a 0 elimina el item
    if (nueva_cantidad <= 0) {
      await pool
        .request()
        .input("id", sql.Int, id_item_carrito)
        .query(`
          DELETE FROM Item_carrito
          WHERE id_item_carrito = @id
        `);
    } else {
      //actualizar cantidad del item
      await pool
        .request()
        .input("id", sql.Int, id_item_carrito)
        .input("cant", sql.Int, nueva_cantidad)
        .query(`
          UPDATE Item_carrito
          SET cantidad = @cant
          WHERE id_item_carrito = @id
        `);
    }

    //recalcular subtotal del carrito
    await carritoService.recalcularSubtotal(id_carrito);

    return {
      mensaje: "Cantidad actualizada correctamente",
    };
  },

  //cambiar estado del carrito
  async cambiarEstadoCarrito(id_carrito, transaction) {
    const req = new sql.Request(transaction);
    await req
      .input("id_c", sql.Int, id_carrito)
      .query(`
        UPDATE Carrito
        SET id_estado_carrito = 2
        WHERE id_carrito = @id_c
      `);
  },

  //crear pedido
  async crearPedido(id_cliente, id_carrito, transaction) {
    const req = new sql.Request(transaction);
    const result = await req
      .input("id_cliente", sql.Int, id_cliente)
      .input("id_carrito", sql.Int, id_carrito)
      .query(`
        INSERT INTO Pedido
        (
          fecha_pedido,
          estado_pedido,
          id_cliente,
          id_carrito
        )
        VALUES
        (
          GETDATE(),
          'pendiente',
          @id_cliente,
          @id_carrito
        );

        SELECT SCOPE_IDENTITY() AS id_pedido
      `);

    return result.recordset[0].id_pedido;
  },
};

module.exports = carritoService;