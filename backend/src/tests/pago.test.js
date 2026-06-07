const pagoService = require("../services/pagoService");

jest.mock("../config/db", () => {
const mockQuery = jest.fn();

const mockTransaction = {
    begin: jest.fn().mockResolvedValue(),
    commit: jest.fn().mockResolvedValue(),
    rollback: jest.fn().mockResolvedValue(),
};

const mockRequest = {
    input: jest.fn().mockReturnThis(),
    query: mockQuery,
};

return {
    sql: {
    Int: "Int",

    Transaction: jest.fn(() => mockTransaction),

    Request: jest.fn(() => ({
        input: jest.fn().mockReturnThis(),
        query: mockQuery,
    })),
    },

    poolPromise: Promise.resolve({
    request: () => mockRequest,
    }),

    __mockQuery: mockQuery,
};
});

const { __mockQuery } = require("../config/db");

describe("Pago", () => {
beforeEach(() => {
    __mockQuery.mockReset();
});

for (let i = 1; i <= 3; i++) {
    test(`obtenerMetodosPago - intento ${i}: devuelve métodos disponibles`, async () => {
    __mockQuery.mockResolvedValueOnce({
        recordset: [
        { id_metodo_pago: 1, descripcion: "Mercado Pago" },
        { id_metodo_pago: 2, descripcion: "Transferencia bancaria" },
        ],
    });

    const metodos = await pagoService.obtenerMetodosPago();

    expect(Array.isArray(metodos)).toBe(true);
    expect(metodos[0]).toHaveProperty("descripcion");
    });
}

for (let i = 1; i <= 3; i++) {
    test(`registrarPago - intento ${i}: registra pago correctamente`, async () => {
    __mockQuery
// buscar factura
        .mockResolvedValueOnce({
        recordset: [
            {
            id_factura: 1,
            id_pedido: 10,
            },
        ],
        })

// verificar pago existente
        .mockResolvedValueOnce({
        recordset: [],
        })

// insertar pago
        .mockResolvedValueOnce({
        recordset: [
            {
            id_pago: 1,
            },
        ],
        })

        // actualizar pedido
        .mockResolvedValueOnce({
        recordset: [],
        });

    const resultado = await pagoService.registrarPago(1, 1);

    expect(resultado).toHaveProperty("mensaje");
    expect(resultado).toHaveProperty("id_pago", 1);
    });
}

test("registrarPago: lanza error si factura no existe", async () => {
    __mockQuery.mockResolvedValueOnce({
    recordset: [],
    });

    await expect(pagoService.registrarPago(999, 1)).rejects.toThrow(
    "Factura no encontrada",
    );
});

for (let i = 1; i <= 3; i++) {
    test(`obtenerPagoPorFactura - intento ${i}: devuelve pago de la factura`, async () => {
    __mockQuery.mockResolvedValueOnce({
        recordset: [
        {
            id_pago: 1,
            id_factura: 1,
            metodo_pago: "Mercado Pago",
            estado_pago: "Aprobado",
        },
        ],
    });

    const pago = await pagoService.obtenerPagoPorFactura(1);
    expect(pago).toHaveProperty("id_pago");
    });
}
});
