const facturaService = require("../services/facturaService");

jest.mock("../config/db", () => {
const mockExecute = jest.fn();

const mockRequest = {
    input: jest.fn().mockReturnThis(),
    execute: mockExecute,
};

return {
    sql: {
    Int: "Int",
    },
    poolPromise: Promise.resolve({
    request: () => mockRequest,
    }),
    __mockExecute: mockExecute,
};
});

const { __mockExecute } = require("../config/db");

describe("Factura", () => {
beforeEach(() => {
    __mockExecute.mockReset();
});

for (let i = 1; i <= 3; i++) {
    test(
    `obtenerFacturasCliente - intento ${i}: devuelve facturas con detalles`,
    async () => {
        __mockExecute.mockResolvedValueOnce({
        recordsets: [
            [
            {
                id_factura: 1,
                total: 800,
                nro_comprobante: "FC-00001",
            },
            ],
            [
            {
                id_factura: 1,
                cantidad: 1,
                precio_unitario: 800,
                subtotal: 800,
            },
            ],
        ],
        });

        const { facturas, detalles } =
        await facturaService.obtenerFacturasCliente(1);

        expect(Array.isArray(facturas)).toBe(true);
        expect(facturas[0]).toHaveProperty("nro_comprobante");
        expect(Array.isArray(detalles)).toBe(true);
        expect(detalles[0]).toHaveProperty("cantidad");
    }
    );
}

test(
    "obtenerFacturasCliente: devuelve listas vacías si no hay facturas",
    async () => {
    __mockExecute.mockResolvedValueOnce({
        recordsets: [[], []],
    });

    const { facturas, detalles } =
        await facturaService.obtenerFacturasCliente(1);

    expect(facturas).toEqual([]);
    expect(detalles).toEqual([]);
    }
);
});