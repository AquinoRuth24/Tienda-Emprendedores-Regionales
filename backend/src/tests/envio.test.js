const envioService = require('../services/envioService');

jest.mock('../config/db', () => {
const mockQuery = jest.fn();
const mockRequest = { input: jest.fn().mockReturnThis(), query: mockQuery };
return {
    sql: {
    Int: 'Int', NVarChar: 'NVarChar', Decimal: 'Decimal',
    Transaction: jest.fn().mockImplementation(() => ({
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

describe('Envío', () => {

beforeEach(() => __mockQuery.mockReset());

for (let i = 1; i <= 3; i++) {
    test(`obtenerMetodosEnvio - intento ${i}: devuelve métodos disponibles`, async () => {
    __mockQuery.mockResolvedValueOnce({
        recordset: [
        { id_tipo_envio: 1, descripcion: 'Envío a domicilio', costo_base: 1500 },
        { id_tipo_envio: 2, descripcion: 'Retiro en local', costo_base: 0 },
        ]
    });
    const metodos = await envioService.obtenerMetodosEnvio();
    expect(Array.isArray(metodos)).toBe(true);
    expect(metodos[0]).toHaveProperty('costo_base');
    });
}

for (let i = 1; i <= 3; i++) {
    test(`calcularCostoEnvio - intento ${i}: devuelve costo del tipo de envío`, async () => {
    __mockQuery.mockResolvedValueOnce({
        recordset: [{ costo_base: 1500 }]
    });
    const costo = await envioService.calcularCostoEnvio(1);
    expect(typeof costo).toBe('number');
    expect(costo).toBe(1500);
    });
}

test('calcularCostoEnvio: lanza error si tipo no existe', async () => {
    __mockQuery.mockResolvedValueOnce({ recordset: [] });
    await expect(envioService.calcularCostoEnvio(999)).rejects.toThrow('Método de envío no disponible');
});

for (let i = 1; i <= 3; i++) {
    test(`obtenerEnvioPorPedido - intento ${i}: devuelve envío del pedido`, async () => {
    __mockQuery.mockResolvedValueOnce({
        recordset: [{ id_envio: 1, costo_envio: 1500, id_estado_envio: 1 }]
    });
    const envio = await envioService.obtenerEnvioPorPedido(1);
    expect(envio).toHaveProperty('id_envio');
    expect(envio).toHaveProperty('costo_envio', 1500);
    });
}

test('obtenerEnvioPorPedido: devuelve null si no existe', async () => {
    __mockQuery.mockResolvedValueOnce({ recordset: [] });
    const envio = await envioService.obtenerEnvioPorPedido(999);
    expect(envio).toBeNull();
});

for (let i = 1; i <= 3; i++) {
    test(`actualizarEstadoEnvio - intento ${i}: actualiza estado correctamente`, async () => {
        __mockQuery.mockResolvedValueOnce({
            rowsAffected: [1]
        });

        await expect(
            envioService.actualizarEstadoEnvio(1, 2)
        ).resolves.not.toThrow();
    });
}
test("actualizarEstadoEnvio: lanza error si el envío no existe", async () => {
    __mockQuery.mockResolvedValueOnce({
        rowsAffected: [0]
    });

    await expect(
        envioService.actualizarEstadoEnvio(999, 2)
    ).rejects.toThrow("Envío no encontrado");
});

});