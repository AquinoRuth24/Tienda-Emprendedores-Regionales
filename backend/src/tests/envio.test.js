const envioService = require('../services/envioService');

jest.mock('../config/db', () => {
  const mockQuery = jest.fn();
  const mockRequest = {
    input: jest.fn().mockReturnThis(),
    query: mockQuery,
  };
  const mockTransaction = {
    begin: jest.fn().mockResolvedValue(),
    commit: jest.fn().mockResolvedValue(),
    rollback: jest.fn().mockResolvedValue(),
  };
  return {
    sql: {
      Int: 'Int',
      VarChar: 'VarChar',
      Decimal: () => 'Decimal',
      Request: jest.fn().mockImplementation(() => mockRequest),
      Transaction: jest.fn().mockImplementation(() => mockTransaction),
    },
    poolPromise: Promise.resolve({ request: () => mockRequest }),
    __mockQuery: mockQuery,
    __mockRequest: mockRequest,
    __mockTransaction: mockTransaction,
  };
});

const { __mockQuery, __mockTransaction } = require('../config/db');

describe('Envio', () => {

  beforeEach(() => {
    __mockQuery.mockReset();
  });

  // ─── obtenerMetodosEnvio ──────────────────────────────────────────────────

  for (let i = 1; i <= 3; i++) {
    test(`obtenerMetodosEnvio - intento ${i}: devuelve métodos disponibles`, async () => {
      __mockQuery.mockResolvedValueOnce({
        recordset: [
          { id_tipo_envio: 1, descripcion: 'Envío a domicilio', costo_base: 1500 },
          { id_tipo_envio: 2, descripcion: 'Retiro en local',   costo_base: 0    },
        ],
      });
      const metodos = await envioService.obtenerMetodosEnvio();
      expect(Array.isArray(metodos)).toBe(true);
      expect(metodos.length).toBe(2);
    });
  }

  // ─── calcularCostoEnvio ───────────────────────────────────────────────────

  for (let i = 1; i <= 3; i++) {
    test(`calcularCostoEnvio - intento ${i}: devuelve costo del tipo de envío`, async () => {
      __mockQuery.mockResolvedValueOnce({
        recordset: [{ costo_base: 1500 }],
      });
      const costo = await envioService.calcularCostoEnvio(1);
      expect(costo).toBe(1500);
    });
  }

  test('calcularCostoEnvio: lanza error si tipo no existe', async () => {
    __mockQuery.mockResolvedValueOnce({ recordset: [] });
    await expect(envioService.calcularCostoEnvio(999)).rejects.toThrow(
      'Método de envío no disponible'
    );
  });

  // ─── obtenerEnvioPorPedido ────────────────────────────────────────────────

  for (let i = 1; i <= 3; i++) {
    test(`obtenerEnvioPorPedido - intento ${i}: devuelve envío del pedido`, async () => {
      __mockQuery.mockResolvedValueOnce({
        recordset: [{
          id_envio: 1,
          tipo_envio: 'Envío a domicilio',
          estado_envio: 'Pendiente',
          costo_envio: 1500,
          ciudad: 'Corrientes',
          provincia: 'Corrientes',
        }],
      });
      const envio = await envioService.obtenerEnvioPorPedido(1);
      expect(envio).toHaveProperty('id_envio', 1);
      expect(envio).toHaveProperty('tipo_envio', 'Envío a domicilio');
    });
  }

  test('obtenerEnvioPorPedido: devuelve null si no existe', async () => {
    __mockQuery.mockResolvedValueOnce({ recordset: [] });
    const envio = await envioService.obtenerEnvioPorPedido(999);
    expect(envio).toBeNull();
  });

  // ─── actualizarEstadoEnvio ────────────────────────────────────────────────

  for (let i = 1; i <= 3; i++) {
    test(`actualizarEstadoEnvio - intento ${i}: actualiza estado correctamente`, async () => {
      __mockQuery.mockResolvedValueOnce({ rowsAffected: [1] });
      await expect(envioService.actualizarEstadoEnvio(1, 2)).resolves.not.toThrow();
    });
  }

  test('actualizarEstadoEnvio: lanza error si el envío no existe', async () => {
    __mockQuery.mockResolvedValueOnce({ rowsAffected: [0] });
    await expect(envioService.actualizarEstadoEnvio(999, 2)).rejects.toThrow(
      'Envío no encontrado'
    );
  });

  // ─── registrarModalidadRetiro ─────────────────────────────────────────────

  for (let i = 1; i <= 3; i++) {
    test(`registrarModalidadRetiro - intento ${i}: registra retiro correctamente`, async () => {
      __mockQuery
        .mockResolvedValueOnce({ recordset: [{ id_pedido: 1 }] })  // pedido existe
        .mockResolvedValueOnce({ recordset: [] })                   // sin envío previo
        .mockResolvedValueOnce({ recordset: [] });                  // insert OK
      await expect(
        envioService.registrarModalidadRetiro(1, __mockTransaction)
      ).resolves.not.toThrow();
    });
  }

  test('registrarModalidadRetiro: lanza error si pedido no existe', async () => {
    __mockQuery.mockResolvedValueOnce({ recordset: [] });
    await expect(
      envioService.registrarModalidadRetiro(999, __mockTransaction)
    ).rejects.toThrow('Pedido no encontrado');
  });

  test('registrarModalidadRetiro: lanza error si ya tiene envío registrado', async () => {
    __mockQuery
      .mockResolvedValueOnce({ recordset: [{ id_pedido: 1 }] })    // pedido existe
      .mockResolvedValueOnce({ recordset: [{ id_envio: 5 }] });    // ya tiene envío
    await expect(
      envioService.registrarModalidadRetiro(1, __mockTransaction)
    ).rejects.toThrow('Este pedido ya tiene un envío registrado');
  });

  // ─── registrarDireccion ───────────────────────────────────────────────────

  for (let i = 1; i <= 3; i++) {
    test(`registrarDireccion - intento ${i}: registra dirección correctamente`, async () => {
      __mockQuery
        .mockResolvedValueOnce({ recordset: [{ id_provincia: 1, nombre: 'Corrientes' }] }) // provincia existe
        .mockResolvedValueOnce({ recordset: [{ id_ciudad: 2 }] })                          // ciudad existe
        .mockResolvedValueOnce({ recordset: [{ id_direccion: 10 }] });                     // insert dirección
      const id = await envioService.registrarDireccion(
        'San Juan', 1234, 'Casa con rejas', 'Corrientes Capital', 3400, 'Corrientes', __mockTransaction
      );
      expect(id).toBe(10);
    });
  }

  test('registrarDireccion: lanza error si faltan campos obligatorios', async () => {
    await expect(
      envioService.registrarDireccion('', 1234, '', 'Corrientes', 3400, 'Corrientes', __mockTransaction)
    ).rejects.toThrow('Provincia, ciudad, calle y número son obligatorios');
  });

  test('registrarDireccion: lanza error si número de calle es inválido', async () => {
    await expect(
      envioService.registrarDireccion('San Juan', 'abcd', '', 'Corrientes Capital', 3400, 'Corrientes', __mockTransaction)
    ).rejects.toThrow('El número de calle debe ser un valor numérico válido y positivo');
  });

  test('registrarDireccion: lanza error si ciudad es solo números', async () => {
    await expect(
      envioService.registrarDireccion('San Juan', 1234, '', '12345', 3400, 'Corrientes', __mockTransaction)
    ).rejects.toThrow('El nombre de la ciudad no puede ser solo números');
  });

  test('registrarDireccion: lanza error si provincia es solo números', async () => {
    await expect(
      envioService.registrarDireccion('San Juan', 1234, '', 'Corrientes Capital', 3400, '3400', __mockTransaction)
    ).rejects.toThrow('El nombre de la provincia no puede ser solo números');
  });

  // ─── obtenerOCrearProvincia ───────────────────────────────────────────────

  test('obtenerOCrearProvincia: retorna id si provincia ya existe', async () => {
    __mockQuery.mockResolvedValueOnce({
      recordset: [{ id_provincia: 1, nombre: 'Corrientes' }],
    });
    const id = await envioService.obtenerOCrearProvincia('Corrientes', __mockTransaction);
    expect(id).toBe(1);
  });

  test('obtenerOCrearProvincia: crea provincia si no existe', async () => {
    __mockQuery
      .mockResolvedValueOnce({ recordset: [] })                          // no existe
      .mockResolvedValueOnce({ recordset: [{ id_provincia: 5 }] });     // insert
    const id = await envioService.obtenerOCrearProvincia('Chaco', __mockTransaction);
    expect(id).toBe(5);
  });

  // ─── obtenerOCrearCiudad ──────────────────────────────────────────────────

  test('obtenerOCrearCiudad: retorna id si ciudad ya existe', async () => {
    __mockQuery.mockResolvedValueOnce({
      recordset: [{ id_ciudad: 2 }],
    });
    const id = await envioService.obtenerOCrearCiudad('Corrientes Capital', 3400, 1, __mockTransaction);
    expect(id).toBe(2);
  });

  test('obtenerOCrearCiudad: crea ciudad si no existe', async () => {
    __mockQuery
      .mockResolvedValueOnce({ recordset: [] })                     // no existe
      .mockResolvedValueOnce({ recordset: [{ id_ciudad: 8 }] });   // insert
    const id = await envioService.obtenerOCrearCiudad('Resistencia', 3500, 2, __mockTransaction);
    expect(id).toBe(8);
  });

  // ─── asociarEnvio ─────────────────────────────────────────────────────────

  for (let i = 1; i <= 3; i++) {
    test(`asociarEnvio - intento ${i}: asocia envío a domicilio correctamente`, async () => {
      __mockQuery
        .mockResolvedValueOnce({ recordset: [] })                                           // sin envío previo
        .mockResolvedValueOnce({ recordset: [{ costo_base: 1500 }] })                      // calcularCostoEnvio
        .mockResolvedValueOnce({ recordset: [{ id_provincia: 1, nombre: 'Corrientes' }] }) // provincia existe
        .mockResolvedValueOnce({ recordset: [{ id_ciudad: 2 }] })                          // ciudad existe
        .mockResolvedValueOnce({ recordset: [{ id_direccion: 10 }] })                      // insert dirección
        .mockResolvedValueOnce({ recordset: [] });                                          // insert envío

      const resultado = await envioService.asociarEnvio(
        1, 1, 'San Juan', 1234, 'Casa con rejas',
        'Corrientes Capital', 3400, 'Corrientes', __mockTransaction
      );
      expect(resultado.costo).toBe(1500);
      expect(resultado.id_direccion).toBe(10);
    });
  }

  test('asociarEnvio: lanza error si pedido ya tiene envío registrado', async () => {
    __mockQuery.mockResolvedValueOnce({ recordset: [{ id_envio: 5 }] }); // ya existe
    await expect(
      envioService.asociarEnvio(
        1, 1, 'San Juan', 1234, '', 'Corrientes Capital', 3400, 'Corrientes', __mockTransaction
      )
    ).rejects.toThrow('Este pedido ya tiene un envío registrado');
  });

});