import { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

export class ResponseHelper {
  /**
   * Respuesta de éxito con datos
   * @param c Hono context
   * @param data Datos a retornar
   * @param status Código HTTP de éxito (default: 200)
   */
  static success<T>(c: Context, data: T, status: ContentfulStatusCode = 200) {
    return c.json({ data }, status)
  }

  /**
   * Respuesta de creación exitosa (201)
   * @param c Hono context
   * @param data Datos creados
   */
  static created<T>(c: Context, data: T) {
    return c.json({ data }, 201)
  }

  /**
   * Respuesta de eliminación exitosa
   * @param c Hono context
   */
  static deleted(c: Context) {
    return c.json({ data: { ok: true } }, 200)
  }

  /**
   * Respuesta de recurso no encontrado (404)
   * @param c Hono context
   * @param message Mensaje de error
   */
  static notFound(c: Context, message: string) {
    return c.json({ error: message }, 404)
  }

  /**
   * Respuesta de solicitud inválida (400)
   * @param c Hono context
   * @param message Mensaje de error
   */
  static badRequest(c: Context, message: string) {
    return c.json({ error: message }, 400)
  }

  /**
   * Respuesta de no autorizado (401)
   * @param c Hono context
   * @param message Mensaje de error
   */
  static unauthorized(c: Context, message: string) {
    return c.json({ error: message }, 401)
  }

  /**
   * Respuesta de error interno del servidor (500)
   * @param c Hono context
   * @param message Mensaje de error
   */
  static serverError(c: Context, message: string) {
    return c.json({ error: message }, 500)
  }
}
