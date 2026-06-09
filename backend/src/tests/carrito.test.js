const carritoService = require('../services/carritoService');

jest.mock('../config/db', () => {
const mockQuery = jest.fn();
const mockRequest = { input: jest.fn().mockReturnThis(), query: mockQuery };
return {
    sql: {
    Int: 'Int',
    Decimal: () => 'Decimal',
    NVarChar: 'NVarChar',
    Date: 'Date', Transaction: jest.fn().mockImplementation(() => ({
        begin: jest.fn().mockResolvedValue(),
        commit: jest.fn().mockResolvedValue(),
        rollback: jest.fn().mockResolvedValue(),
        request: jest.fn().mockReturnValue({
        input: jest.fn().mockReturnThis(),
        query: mockQuery,
        }),
    })),
    },
    poolPromise: Promise.resolve({ request: () => mockRequest }),
    __mockQuery: mockQuery,
};
});

const { __mockQuery } = require('../config/db');

describe('Carrito', () => {

beforeEach(() => __mockQuery.mockReset());

for (let i = 1; i <= 3; i++) {
    test(`verificarStock - intento ${i}: devuelve stock disponible`, async () => {
    __mockQuery.mockResolvedValueOnce({
        recordset: [{ stock: 20 }]
    });
    const stock = await carritoService.verificarStock(1);
    expect(stock).toBe(20);
    });
}

test('verificarStock: devuelve 0 si producto no existe', async () => {
    __mockQuery.mockResolvedValueOnce({ recordset: [] });
    const stock = await carritoService.verificarStock(999);
    expect(stock).toBe(0);
});

for (let i = 1; i <= 3; i++) {
    test(`obtenerCarritoActivo - intento ${i}: devuelve carrito activo`, async () => {
    __mockQuery.mockResolvedValueOnce({
        recordset: [{ id_carrito: 5, subtotal: 800 }]
    });
    const carrito = await carritoService.obtenerCarritoActivo(1);
    expect(carrito).toHaveProperty('id_carrito', 5);
    });
}

test('obtenerCarritoActivo: devuelve null si no hay carrito', async () => {
    __mockQuery.mockResolvedValueOnce({ recordset: [] });
    const carrito = await carritoService.obtenerCarritoActivo(1);
    expect(carrito).toBeNull();
});

for (let i = 1; i <= 3; i++) {
    test(`obtenerItemsCarrito - intento ${i}: devuelve items del carrito`, async () => {
    __mockQuery.mockResolvedValueOnce({
        recordset: [
        { id_item_carrito: 1, nombre: 'Mermelada casera', cantidad: 2, precio: 800 },
        ]
    });
    const items = await carritoService.obtenerItemsCarrito(5);
    expect(Array.isArray(items)).toBe(true);
    expect(items[0]).toHaveProperty('nombre', 'Mermelada casera');
    });
}

for (let i = 1; i <= 3; i++) {
    test(`agregarProducto - intento ${i}: agrega producto al carrito existente`, async () => {
    __mockQuery.mockResolvedValueOnce({ recordset: [{ id_carrito: 5 }] });
    __mockQuery.mockResolvedValueOnce({ recordset: [] });
    __mockQuery.mockResolvedValueOnce({ recordset: [] });
    __mockQuery.mockResolvedValueOnce({ recordset: [] });

    const resultado = await carritoService.agregarProducto(1, 1, 2, 800);
    expect(resultado.mensaje).toBe('producto agregado con éxito');
    });
}

test('agregarProducto: crea carrito nuevo si no existe', async () => {
    __mockQuery.mockResolvedValueOnce({ recordset: [] });
    __mockQuery.mockResolvedValueOnce({ recordset: [{ id: 10 }] });
    __mockQuery.mockResolvedValueOnce({ recordset: [] });
    __mockQuery.mockResolvedValueOnce({ recordset: [] });
    __mockQuery.mockResolvedValueOnce({ recordset: [] });

    const resultado = await carritoService.agregarProducto(1, 2, 1, 1200);
    expect(resultado.mensaje).toBe('producto agregado con éxito');
});

for (let i = 1; i <= 3; i++) {
    test(`eliminarItem - intento ${i}: elimina item correctamente`, async () => {
    __mockQuery.mockResolvedValueOnce({ recordset: [] });
    __mockQuery.mockResolvedValueOnce({ recordset: [] });
    const resultado = await carritoService.eliminarItem(1, 5);
    expect(resultado.mensaje).toBe('Producto eliminado');
    });
}

for (let i = 1; i <= 3; i++) {
    test(`actualizarCantidad - intento ${i}: actualiza cantidad correctamente`, async () => {
    __mockQuery.mockResolvedValueOnce({ recordset: [{ stock: 20 }] });
    __mockQuery.mockResolvedValueOnce({ recordset: [] });
    __mockQuery.mockResolvedValueOnce({ recordset: [] });

    const resultado = await carritoService.actualizarCantidad(1, 3, 5);
    expect(resultado.mensaje).toBe('Cantidad actualizada correctamente');
    });
}

});