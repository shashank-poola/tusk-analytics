import * as z from "zod"

// JSON-RPC 2.0, the envelope MCP speaks: https://www.jsonrpc.org/specification

export const JSON_RPC_ERRORS = {
  parseError: -32700,
  invalidRequest: -32600,
  methodNotFound: -32601,
  invalidParams: -32602,
} as const

const requestIdSchema = z.union([z.string().max(200), z.number()])
export type RequestId = z.infer<typeof requestIdSchema>

/** A request (with an id) or a notification (without one). */
export const jsonRpcMessageSchema = z.object({
  jsonrpc: z.literal("2.0"),
  id: requestIdSchema.optional(),
  method: z.string().max(100),
  params: z.record(z.string(), z.unknown()).optional(),
})
export type JsonRpcMessage = z.infer<typeof jsonRpcMessageSchema>

export type JsonRpcResponse =
  | { jsonrpc: "2.0"; id: RequestId | null; result: unknown }
  | {
      jsonrpc: "2.0"
      id: RequestId | null
      error: { code: number; message: string }
    }

export function rpcResult(id: RequestId, result: unknown): JsonRpcResponse {
  return { jsonrpc: "2.0", id, result }
}

export function rpcError(
  id: RequestId | null,
  code: number,
  message: string
): JsonRpcResponse {
  return { jsonrpc: "2.0", id, error: { code, message } }
}
