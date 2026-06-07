const pedidoService = require("../services/pedidoService");

jest.mock("../config/db", () => {
const mockQuery = jest.fn();
const mockRequest = { input: jest.fn().mockReturnThis(), query: mockQuery };
return {
    sql: { Int: "Int" },
    poolPromise: Promise.resolve({ request: () => mockRequest }),
    __mockQuery: mockQuery,
};
});

const { __mockQuery } = require("../config/db");

describe("Pedido", () => {
beforeEach(() => __mockQuery.mockReset());

for (let i = 1; i <= 3; i++) {
    test(`obtenerPedidosCliente - intento ${i}: devuelve lista de pedidos`, async () => {
    __mockQuery.mockResolvedValueOnce({
        recordset: [
        { id_pedido: 1, fecha_pedido: "2026-06-01", id_estado_pedido: 1 },
        { id_pedido: 2, fecha_pedido: "2026-06-05", id_estado_pedido: 1 },
        ],
    });
    const pedidos = await pedidoService.obtenerPedidosCliente(1);
    expect(Array.isArray(pedidos)).toBe(true);
    expect(pedidos.length).toBe(2);
    });
}

test("obtenerPedidosCliente: devuelve lista vacía si no hay pedidos", async () => {
    __mockQuery.mockResolvedValueOnce({ recordset: [] });
    const pedidos = await pedidoService.obtenerPedidosCliente(1);
    expect(pedidos).toEqual([]);
});

for (let i = 1; i <= 3; i++) {
    test(`obtenerPedidoPorId - intento ${i}: devuelve detalle del pedido`, async () => {
    __mockQuery.mockResolvedValueOnce({
        recordset: [{ id_pedido: 1, fecha_pedido: "2026-06-01" }],
    });
    const pedido = await pedidoService.obtenerPedidoPorId(1, 1);
    expect(pedido).toHaveProperty("id_pedido", 1);
    });
}

test("obtenerPedidoPorId: lanza error si no existe", async () => {
    __mockQuery.mockResolvedValueOnce({ recordset: [] });
    await expect(pedidoService.obtenerPedidoPorId(999, 1)).rejects.toThrow();
});
});
