const clienteService = require("../services/clienteService");

jest.mock("../config/db", () => {
const mockQuery = jest.fn();
const mockRequest = { input: jest.fn().mockReturnThis(), query: mockQuery };
return {
    sql: { Int: "Int", NVarChar: "NVarChar", Date: "Date" },
    poolPromise: Promise.resolve({ request: () => mockRequest }),
    __mockQuery: mockQuery,
};
});

const { __mockQuery } = require("../config/db");

beforeAll(() => {
process.env.JWT_SECRET = "test_secret";
});

describe("Cliente", () => {
beforeEach(() => __mockQuery.mockReset());

for (let i = 1; i <= 3; i++) {
    test(`buscarPorEmail - intento ${i}: encuentra cliente existente`, async () => {
__mockQuery.mockResolvedValueOnce({
recordset: [
    {
    id_cliente: 1,
    email: "test@mail.com",
    contraseña: "hash123",
    id_estado: 1
    }
]
});
    const cliente = await clienteService.buscarPorEmail("test@mail.com");
    expect(cliente).toHaveProperty("email", "test@mail.com");
    });
}

test("buscarPorEmail: lanza error si no existe", async () => {
    __mockQuery.mockResolvedValueOnce({ recordset: [] });
    await expect(
    clienteService.buscarPorEmail("noexiste@mail.com"),
    ).rejects.toThrow();
});

for (let i = 1; i <= 3; i++) {
    test(`guardarCliente - intento ${i}: registra cliente correctamente`, async () => {
    __mockQuery.mockResolvedValueOnce({ recordset: [] });
    await expect(
        clienteService.guardarCliente(
        "Pérez Juan",
        "juan@mail.com",
        "hashpass",
        "12345678",
        "1990-01-01",
        "3794000000",
        new Date(),
        1,
        ),
    ).resolves.not.toThrow();
    });
}

test("generarToken: devuelve un string JWT", () => {
    const cliente = {
    id_cliente: 1,
    email: "test@mail.com",
    apellidoNombre: "Test",
    };
    const token = clienteService.generarToken(cliente);
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3); // formato JWT: header.payload.firma
});

for (let i = 1; i <= 3; i++) {
    test(`validarDatosRegistro - intento ${i}: pasa sin duplicados`, async () => {
      __mockQuery.mockResolvedValueOnce({ recordset: [] }); // email no existe
      __mockQuery.mockResolvedValueOnce({ recordset: [] }); // DNI no existe
    await expect(
        clienteService.validarDatosRegistro("nuevo@mail.com", "99999999"),
    ).resolves.not.toThrow();
    });
}

test("validarDatosRegistro: lanza error si email duplicado", async () => {
    __mockQuery.mockResolvedValueOnce({
      recordset: [{ id_cliente: 1 }], // email ya existe
    });
    await expect(
    clienteService.validarDatosRegistro("existente@mail.com", "11111111"),
    ).rejects.toThrow();
});
});
