const { sql, poolPromise } = require("../config/db");

const carritoController = {
  // AGREGAR O ACTUALIZAR PRODUCTO
  agregarItem: async (req, res) => {
    const { id_cliente, id_producto, cantidad, precio } = req.body;
    try {
      const pool = await poolPromise;

      // 1. Buscamos si el cliente ya tiene un carrito activo (Estado 1)
      let carrito = await pool.request()
        .input("id_cliente", sql.Int, id_cliente)
        .query("SELECT id_carrito FROM Carrito WHERE id_cliente = @id_cliente AND id_estado_carrito = 1");

      let id_carrito;

      if (carrito.recordset.length === 0) {
        // Si no existe, creamos el carrito (Asumiendo que insertaste el Estado 1 en Estado_carrito)
        const nuevo = await pool.request()
          .input("fecha", sql.Date, new Date())
          .input("id_cliente", sql.Int, id_cliente)
          .query(`INSERT INTO Carrito (fecha_creacion, subtotal, id_estado_carrito, id_cliente) 
                  VALUES (@fecha, 0, 1, @id_cliente); 
                  SELECT SCOPE_IDENTITY() AS id`);
        id_carrito = nuevo.recordset[0].id;
      } else {
        id_carrito = carrito.recordset[0].id_carrito;
      }

      // 2. Verificamos si el producto ya está en ese carrito
      const item = await pool.request()
        .input("id_carrito", sql.Int, id_carrito)
        .input("id_p", sql.Int, id_producto)
        .query("SELECT id_item_carrito FROM Item_carrito WHERE id_carrito = @id_carrito AND id_producto = @id_p");

      if (item.recordset.length > 0) {
        // Si ya está, actualizamos cantidad
        await pool.request()
          .input("id_item", sql.Int, item.recordset[0].id_item_carrito)
          .input("cant", sql.Int, cantidad)
          .query("UPDATE Item_carrito SET cantidad = cantidad + @cant WHERE id_item_carrito = @id_item");
      } else {
        // Si no está, lo agregamos
        await pool.request()
          .input("cant", sql.Int, cantidad)
          .input("prec", sql.Decimal(10,2), precio)
          .input("id_p", sql.Int, id_producto)
          .input("id_c", sql.Int, id_carrito)
          .query("INSERT INTO Item_carrito (cantidad, precio, id_producto, id_carrito) VALUES (@cant, @prec, @id_p, @id_c)");
      }

      // 3. Recalculamos el subtotal en la tabla Carrito automáticamente
      await pool.request()
        .input("id_c", sql.Int, id_carrito)
        .query("UPDATE Carrito SET subtotal = (SELECT SUM(cantidad * precio) FROM Item_carrito WHERE id_carrito = @id_c) WHERE id_carrito = @id_c");

      res.json({ mensaje: "Carrito actualizado" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // ELIMINAR ITEM
  eliminarItem: async (req, res) => {
    const { id_item_carrito, id_carrito } = req.body;
    try {
      const pool = await poolPromise;
      await pool.request()
        .input("id", sql.Int, id_item_carrito)
        .query("DELETE FROM Item_carrito WHERE id_item_carrito = @id");

      // Actualizar subtotal después de borrar
      await pool.request()
        .input("id_c", sql.Int, id_carrito)
        .query("UPDATE Carrito SET subtotal = ISNULL((SELECT SUM(cantidad * precio) FROM Item_carrito WHERE id_carrito = @id_c), 0) WHERE id_carrito = @id_c");

      res.json({ mensaje: "Producto eliminado" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  // OBTENER CARRITO
  obtenerCarrito: async (req, res) => {
    const { id_cliente } = req.params;
    try {
      const pool = await poolPromise;
      
      // 1. Buscamos el carrito activo del cliente
      const carrito = await pool.request()
        .input("id_cliente", sql.Int, id_cliente)
        .query("SELECT id_carrito, subtotal FROM Carrito WHERE id_cliente = @id_cliente AND id_estado_carrito = 1");

      if (carrito.recordset.length === 0) {
        return res.json({ id_carrito: null, items: [], subtotal: 0 }); // Carrito vacío
      }

      const id_carrito = carrito.recordset[0].id_carrito;
      const subtotal = carrito.recordset[0].subtotal;

      // 2. Traemos los productos de ese carrito
      const items = await pool.request()
        .input("id_carrito", sql.Int, id_carrito)
        .query(`
          SELECT i.id_item_carrito, i.cantidad, i.precio, p.nombre, p.imagen 
          FROM Item_carrito i
          INNER JOIN Producto p ON i.id_producto = p.id_producto
          WHERE i.id_carrito = @id_carrito
        `);

      res.json({ id_carrito, items: items.recordset, subtotal });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = carritoController;