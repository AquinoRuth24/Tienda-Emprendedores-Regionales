const { CompraFacade } = require('../facade/CompraFacade');

// Mock de carritoService
jest.mock('../services/carritoService', () => ({
  validarStockProductos: jest.fn(),
  actualizarStock: jest.fn(),
  cambiarEstadoCarrito: jest.fn(),
  crearPedido: jest.fn(),
}));

// Mock de envioService
jest.mock('../services/envioService', () => ({
  calcularCostoEnvio: jest.fn(),
  asociarEnvio: jest.fn(),
  registrarModalidadRetiro: jest.fn(),
}));

// Mock de facturaService
jest.mock('../services/facturaService', () => ({
  crearFactura: jest.fn(),
  cargarDetalles: jest.fn(),
}));

// Mock de pedidoService
jest.mock('../services/pedidoService', () => ({
  obtenerPedidosCliente: jest.fn(),
}));

// Mock de la base de datos
jest.mock('../config/db', () => {
  const mockQuery = jest.fn();
  const mockTransaction = {
    begin: jest.fn().mockResolvedValue(),
    commit: jest.fn().mockResolvedValue(),
    rollback: jest.fn().mockResolvedValue(),
    request: jest.fn().mockReturnValue({
      input: jest.fn().mockReturnThis(),
      query: mockQuery,
    }),
  };
  return {
    sql: {
      Int: 'Int',
      Transaction: jest.fn().mockImplementation(() => mockTransaction),
      Request: jest.fn().mockImplementation(() => ({
        input: jest.fn().mockReturnThis(),
        query: mockQuery,
      })),
    },
    poolPromise: Promise.resolve({}),
    __mockQuery: mockQuery,
    __mockTransaction: mockTransaction,
  };
});

const { __mockQuery, __mockTransaction } = require('../config/db');
const carritoService = require('../services/carritoService');
const envioService   = require('../services/envioService');
const facturaService = require('../services/facturaService');

describe('CompraFacade - finalizarCompra', () => {

  let facade;

  beforeEach(() => {
    facade = new CompraFacade();
    __mockQuery.mockReset();
    jest.clearAllMocks();
    // Restaurar commit y rollback limpios
    __mockTransaction.commit.mockResolvedValue();
    __mockTransaction.rollback.mockResolvedValue();
  });

  // ─── Flujo normal: retiro en local ───────────────────────────────────────

  for (let i = 1; i <= 3; i++) {
    test(`finalizarCompra retiro - intento ${i}: compra realizada con éxito`, async () => {
      __mockQuery.mockResolvedValueOnce({
        recordset: [{ id_carrito: 1, total_carrito: 2500, id_estado_carrito: 1 }],
      });

      const items = [{ id_producto: 1, cantidad: 2, stock: 10, precio: 800 }];
      carritoService.validarStockProductos.mockResolvedValueOnce(items);
      carritoService.actualizarStock.mockResolvedValueOnce();
      carritoService.cambiarEstadoCarrito.mockResolvedValueOnce();
      carritoService.crearPedido.mockResolvedValueOnce(10);
      envioService.registrarModalidadRetiro.mockResolvedValueOnce();
      facturaService.crearFactura.mockResolvedValueOnce(5);
      facturaService.cargarDetalles.mockResolvedValueOnce();

      const resultado = await facade.finalizarCompra(1, 1, { tipo: 'retiro' });

      expect(resultado.mensaje).toBe('Compra realizada con éxito');
      expect(resultado.id_pedido).toBe(10);
      expect(resultado.id_factura).toBe(5);
      expect(resultado.totalFinal).toBe(2500);
      expect(__mockTransaction.commit).toHaveBeenCalled();
      expect(__mockTransaction.rollback).not.toHaveBeenCalled();
    });
  }

  // ─── Flujo normal: envío a domicilio ─────────────────────────────────────

  for (let i = 1; i <= 3; i++) {
    test(`finalizarCompra domicilio - intento ${i}: compra y envío realizados con éxito`, async () => {
      __mockQuery.mockResolvedValueOnce({
        recordset: [{ id_carrito: 2, total_carrito: 1200, id_estado_carrito: 1 }],
      });

      const items = [{ id_producto: 2, cantidad: 1, stock: 15, precio: 1200 }];
      carritoService.validarStockProductos.mockResolvedValueOnce(items);
      carritoService.actualizarStock.mockResolvedValueOnce();
      carritoService.cambiarEstadoCarrito.mockResolvedValueOnce();
      carritoService.crearPedido.mockResolvedValueOnce(11);
      envioService.calcularCostoEnvio.mockResolvedValueOnce(1500);
      envioService.asociarEnvio.mockResolvedValueOnce();
      facturaService.crearFactura.mockResolvedValueOnce(6);
      facturaService.cargarDetalles.mockResolvedValueOnce();

      const datosEnvio = {
        tipo: 'domicilio',
        id_tipo_envio: 1,
        calle: 'San Juan',
        numero: 1234,
        descripcion: 'Casa con rejas',
        ciudad: 'Corrientes',
        codigo_postal: 3400,
        provincia: 'Corrientes',
      };

      const resultado = await facade.finalizarCompra(2, 1, datosEnvio);

      expect(resultado.mensaje).toBe('Compra realizada con éxito');
      expect(resultado.totalFinal).toBe(2700); // 1200 + 1500
      expect(envioService.asociarEnvio).toHaveBeenCalled();
      expect(__mockTransaction.commit).toHaveBeenCalled();
    });
  }

  // ─── Rollback: carrito ya procesado ──────────────────────────────────────

  test('finalizarCompra: rollback si carrito ya fue procesado', async () => {
    __mockQuery.mockResolvedValueOnce({ recordset: [] }); // carrito no activo

    await expect(
      facade.finalizarCompra(99, 1, { tipo: 'retiro' })
    ).rejects.toThrow('Este carrito ya fue procesado o no existe');

    expect(__mockTransaction.rollback).toHaveBeenCalled();
    expect(__mockTransaction.commit).not.toHaveBeenCalled();
  });

  // ─── Rollback: stock insuficiente ────────────────────────────────────────

  test('finalizarCompra: rollback si stock insuficiente', async () => {
    __mockQuery.mockResolvedValueOnce({
      recordset: [{ id_carrito: 1, total_carrito: 2500, id_estado_carrito: 1 }],
    });

    carritoService.validarStockProductos.mockRejectedValueOnce(
      new Error('Stock insuficiente para el producto ID 1')
    );

    await expect(
      facade.finalizarCompra(1, 1, { tipo: 'retiro' })
    ).rejects.toThrow('Stock insuficiente para el producto ID 1');

    expect(__mockTransaction.rollback).toHaveBeenCalled();
    expect(__mockTransaction.commit).not.toHaveBeenCalled();
  });

  // ─── Rollback: carrito vacío ──────────────────────────────────────────────

  test('finalizarCompra: rollback si carrito está vacío', async () => {
    __mockQuery.mockResolvedValueOnce({
      recordset: [{ id_carrito: 1, total_carrito: 0, id_estado_carrito: 1 }],
    });

    carritoService.validarStockProductos.mockRejectedValueOnce(
      new Error('El carrito está vacío')
    );

    await expect(
      facade.finalizarCompra(1, 1, { tipo: 'retiro' })
    ).rejects.toThrow('El carrito está vacío');

    expect(__mockTransaction.rollback).toHaveBeenCalled();
  });

  // ─── Rollback: fallo al crear factura ────────────────────────────────────

  test('finalizarCompra: rollback si falla la generación de factura', async () => {
    __mockQuery.mockResolvedValueOnce({
      recordset: [{ id_carrito: 1, total_carrito: 800, id_estado_carrito: 1 }],
    });

    const items = [{ id_producto: 1, cantidad: 1, stock: 5, precio: 800 }];
    carritoService.validarStockProductos.mockResolvedValueOnce(items);
    carritoService.actualizarStock.mockResolvedValueOnce();
    carritoService.cambiarEstadoCarrito.mockResolvedValueOnce();
    carritoService.crearPedido.mockResolvedValueOnce(12);
    envioService.registrarModalidadRetiro.mockResolvedValueOnce();
    facturaService.crearFactura.mockRejectedValueOnce(
      new Error('Error interno al generar la factura')
    );

    await expect(
      facade.finalizarCompra(1, 1, { tipo: 'retiro' })
    ).rejects.toThrow('Error interno al generar la factura');

    expect(__mockTransaction.rollback).toHaveBeenCalled();
    expect(__mockTransaction.commit).not.toHaveBeenCalled();
  });

  // ─── Rollback: stock agotado entre sesiones (race condition) ─────────────

  test('finalizarCompra: rollback si stock se agota entre sesiones', async () => {
    __mockQuery.mockResolvedValueOnce({
      recordset: [{ id_carrito: 1, total_carrito: 1200, id_estado_carrito: 1 }],
    });

    carritoService.validarStockProductos.mockResolvedValueOnce([
      { id_producto: 3, cantidad: 2, stock: 2, precio: 600 },
    ]);
    carritoService.actualizarStock.mockRejectedValueOnce(
      new Error('Stock insuficiente para el producto ID 3. Otro cliente lo compró al mismo tiempo.')
    );

    await expect(
      facade.finalizarCompra(1, 1, { tipo: 'retiro' })
    ).rejects.toThrow('Otro cliente lo compró al mismo tiempo');

    expect(__mockTransaction.rollback).toHaveBeenCalled();
  });

});