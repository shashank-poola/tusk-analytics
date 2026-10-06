"use server"

import { type InstallStatus, siteIdSchema } from "@workspace/contracts"

import { getInstallStatus } from "@/features/sites/server/sites.queries"

/**
 * Polled by the verify panel. Server actions are public POST endpoints, so
 * the id is validated before it goes into the API path; the API checks that
 * the signed-in user owns the site.
 */
export async function checkInstallStatus(
  siteId: string
): Promise<InstallStatus> {
  const id = siteIdSchema.safeParse(siteId)
  if (!id.success) throw new Error("checkInstallStatus needs a valid site id")
  return getInstallStatus(id.data)
}
