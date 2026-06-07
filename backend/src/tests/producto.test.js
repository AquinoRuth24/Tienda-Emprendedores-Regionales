const productoService = require("../services/productoService");

jest.mock("../config/db", () => {
const mockQuery = jest.fn();
const mockRequest = { input: jest.fn().mockReturnThis(), query: mockQuery };
return {
    sql: { Int: "Int", NVarChar: "NVarChar" },
    poolPromise: Promise.resolve({ request: () => mockRequest }),
    __mockQuery: mockQuery,
};
});

const { __mockQuery } = require("../config/db");

describe("Producto", () => {
beforeEach(() => {
    __mockQuery.mockReset();
});

// Ejecutar múltiples veces para validar consistencia
for (let i = 1; i <= 3; i++) {
    test(`getProductos - intento ${i}: devuelve lista de productos`, async () => {
    __mockQuery.mockResolvedValueOnce({
        recordset: [
        {
            id_producto: 1,
            nombre: "Mermelada casera",
            precio: 800,
            stock: 20,
        },
        {
            id_producto: 2,
            nombre: "Pulsera de perla",
            precio: 1200,
            stock: 15,
        },
        ],
    });
    const productos = await productoService.getProductos();
    expect(Array.isArray(productos)).toBe(true);
    expect(productos.length).toBe(2);
    expect(productos[0]).toHaveProperty("nombre");
    });
}

for (let i = 1; i <= 3; i++) {
    test(`getProducto - intento ${i}: devuelve un producto por id`, async () => {
    __mockQuery.mockResolvedValueOnce({
        recordset: [
        {
            id_producto: 1,
            nombre: "Mermelada casera",
            precio: 800,
            stock: 20,
        },
        ],
    });
    const producto = await productoService.getProducto(1);
    expect(producto).toHaveProperty("id_producto", 1);
    expect(producto).toHaveProperty("nombre", "Mermelada casera");
    });
}

test("getProducto: lanza error si producto no existe", async () => {
    __mockQuery.mockResolvedValueOnce({ recordset: [] });
    await expect(productoService.getProducto(999)).rejects.toThrow(
    "Producto no encontrado",
    );
});

for (let i = 1; i <= 3; i++) {
    test(`getCategorias - intento ${i}: devuelve categorías`, async () => {
    __mockQuery.mockResolvedValueOnce({
        recordset: [
        { id_categoria: 1, descripcion: "Ropa" },
        { id_categoria: 2, descripcion: "Alimentos" },
        ],
    });
    const categorias = await productoService.getCategorias();
    expect(Array.isArray(categorias)).toBe(true);
    expect(categorias[0]).toHaveProperty("descripcion");
    });
}

for (let i = 1; i <= 3; i++) {
    test(`getProductosPorCategoria - intento ${i}: filtra por categoría`, async () => {
    __mockQuery.mockResolvedValueOnce({
        recordset: [
        { id_producto: 2, nombre: "Mermelada casera", id_categoria: 2 },
        ],
    });
    const productos = await productoService.getProductosPorCategoria(2);
    expect(Array.isArray(productos)).toBe(true);
    expect(productos[0].id_categoria).toBe(2);
    });
}
});
