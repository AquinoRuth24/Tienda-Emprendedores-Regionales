# Pruebas de Stored Procedures — PowerShell

> Requisitos: tener el backend corriendo en `http://localhost:3001`

---

## 1. Login (obtener token)
## cambiar a un usuario y contraseña que este en la DB
```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$bodyLogin = [System.Text.Encoding]::UTF8.GetBytes('{"email":"ruth@gmail.com","contrase' + [char]0x00F1 + 'a":"12345678"}')
$response = Invoke-WebRequest -Uri "http://localhost:3001/api/cliente/login" -Method POST -ContentType "application/json" -Body $bodyLogin -UseBasicParsing
$token = ($response.Content | ConvertFrom-Json).token
echo $token
```

---

## 2. Probar `sp_ObtenerFacturasCliente`

Devuelve todas las facturas con sus items del cliente con id = 2.

```powershell
$headers = @{ Authorization = "Bearer $token" }
Invoke-WebRequest -Uri "http://localhost:3001/api/factura/2" -Method GET -Headers $headers -UseBasicParsing | Select-Object -ExpandProperty Content
```

**Resultado esperado:** array JSON con facturas y sus items.

---

## 3. Probar `sp_CambiarEstadoCarrito`

Este SP se ejecuta dentro de `POST /api/carrito/finalizar-con-envio`.  
Primero verificar que el carrito tenga items:

```powershell
Invoke-WebRequest -Uri "http://localhost:3001/api/carrito/2" -Method GET -Headers $headers -UseBasicParsing | Select-Object -ExpandProperty Content
```

Anotá el `id_carrito` que devuelve y usalo en el comando de abajo.  
Si el carrito está vacío, agregá un producto desde la app antes de continuar.

```powershell
$headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }
$body = '{"id_carrito": 12, "datosEnvio": {"tipo": "retiro"}}'
Invoke-WebRequest -Uri "http://localhost:3001/api/carrito/finalizar-con-envio" -Method POST -Headers $headers -Body $body -UseBasicParsing | Select-Object -ExpandProperty Content
```

> ⚠️ Reemplazá `12` por el `id_carrito` activo que obtuviste en el paso anterior.

**Resultado esperado:**
```json
{ "mensaje": "Compra realizada con éxito", "id_pedido": ..., "id_factura": ... }
```

---

## Notas

- El token dura **8 horas**. Si expira, repetir el paso 1.
- El campo para la contraseña en el body es `contraseña` (con ñ), por eso se usa el encoding especial.
- `sp_CambiarEstadoCarrito` cambia el estado del carrito a "Finalizado" y se ejecuta dentro de una transacción junto con la creación del pedido y la factura.
