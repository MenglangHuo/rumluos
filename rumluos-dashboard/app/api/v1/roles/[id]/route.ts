import { db } from "@/lib/server/db"
import { ok, fail, requireAuth } from "@/lib/server/api"

async function updateRoleHandler(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { profile, error } = await requireAuth("roles.update")
  if (error) return error
  const { id } = await params
  const role = db.roles.find((r) => r.id === id || String(r.id) === String(id))
  if (!role) return fail("Role not found", "NOT_FOUND", 404)
  if (role.isSystem) return fail("System roles cannot be modified", "SYSTEM_ROLE", 400)
  const body = await request.json()
  if (body.name !== undefined) role.name = String(body.name).trim()
  if (body.displayName !== undefined) role.displayName = String(body.displayName).trim()
  if (body.description !== undefined) role.description = String(body.description).trim()
  if (body.priority !== undefined) role.priority = Number(body.priority)
  if (Array.isArray(body.permissionIds)) {
    role.permissionIds = body.permissionIds
  }
  return ok(role)
}

export const PUT = updateRoleHandler
export const PATCH = updateRoleHandler

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { profile, error } = await requireAuth("roles.delete")
  if (error) return error
  const { id } = await params
  const idx = db.roles.findIndex((r) => r.id === id && r.companyId === profile.companyId)
  if (idx === -1) return fail("Role not found", "NOT_FOUND", 404)
  if (db.roles[idx].isSystem) return fail("System roles cannot be deleted", "SYSTEM_ROLE", 400)
  const inUse = db.users.some((u) => u.roleIds.includes(id))
  if (inUse) return fail("Role is assigned to users and cannot be deleted", "ROLE_IN_USE", 409)
  db.roles.splice(idx, 1)
  return ok({ id })
}
