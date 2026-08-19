// ============================================================
// Typed endpoint functions used by TanStack Query hooks.
// ============================================================

import { api } from "@/lib/api/client"
import type {
  Branch,
  Company,
  CompanyConfiguration,
  DashboardStats,
  Paged,
  Permission,
  Role,
  SignInResponse,
  Staff,
  UploadUrlResponse,
  User,
  UserProfile,
  Customer,
  Brand,
  Category,
  Product,
  BatchImportRequest,
  BatchImportResponse,
  Loan,
  LoanDetails,
  Invoice,
  InvoiceDetails,
  Payment,
  Attachment,
  CreateAttachmentInput,
  UpdateAttachmentInput,
  AttachmentDownloadResponse,
  AttachmentQueryParams,
} from "@/lib/types"

export interface ListParams {
  page?: number
  limit?: number
  search?: string
  includeDeleted?: boolean
}

function listQuery(params: ListParams = {}) {
  const page = params.page ?? 1
  return {
    page: Math.max(0, page - 1),
    limit: params.limit ?? 10,
    search: params.search || undefined,
    includeDeleted: params.includeDeleted ? "true" : undefined,
  }
}

/**
 * Safely converts raw backend lists, Spring Data PageResponse ({ content, totalElements }),
 * or custom Paged objects into a normalized Paged<T> structure with guaranteed .items array.
 */
export function normalizePaged<T>(data: any): Paged<T> {
  if (!data) {
    return { items: [], page: 1, limit: 10, total: 0, totalPages: 1 }
  }
  if (Array.isArray(data)) {
    return {
      items: data,
      page: 1,
      limit: data.length || 10,
      total: data.length,
      totalPages: 1,
    }
  }
  if (typeof data === "object") {
    const items = Array.isArray(data.items)
      ? data.items
      : Array.isArray(data.content)
      ? data.content
      : Array.isArray(data.data)
      ? data.data
      : []
    const total =
      typeof data.total === "number"
        ? data.total
        : typeof data.totalElements === "number"
        ? data.totalElements
        : items.length
    const page =
      typeof data.page === "number"
        ? data.page
        : typeof data.pageNumber === "number"
        ? data.pageNumber + 1
        : 1
    const limit =
      typeof data.limit === "number"
        ? data.limit
        : typeof data.pageSize === "number"
        ? data.pageSize
        : 10
    const totalPages =
      typeof data.totalPages === "number"
        ? data.totalPages
        : Math.ceil(total / (limit || 1)) || 1
    return { items, page, limit, total, totalPages }
  }
  return { items: [], page: 1, limit: 10, total: 0, totalPages: 1 }
}

export const authApi = {
  signIn: async (body: { username: string; password: string }) => {
    try {
      const res = await api.post<SignInResponse>("/auth/login", body)
      return res.data
    } catch (err: any) {
      if (err?.status === 404) {
        const res = await api.post<SignInResponse>("/auth/sign-in", body)
        return res.data
      }
      throw err
    }
  },
  refreshToken: () => api.post<{ token: string }>("/auth/refresh-token").then((r) => r.data),
  signOut: () => api.post("/auth/sign-out").then((r) => r.data),
  forgotPassword: (body: { email: string }) =>
    api.post<{ resetToken: string }>("/auth/forget-password", body).then((r) => r.data),
  resetPassword: (body: { token: string; password: string }) =>
    api.post("/auth/reset-password", body).then((r) => r.data),
  registerByAdmin: (body: any) => api.post("/auth/register-by-admin", body).then((r) => r.data),
}

// ---- Profile -------------------------------------------------
export const profileApi = {
  me: () => api.get<UserProfile>("/users/me/profile").then((r) => r.data),
  update: (body: { firstName?: string; lastName?: string; contact?: string; avatarUrl?: string | null; avatarKey?: string | null }) => {
    const avatarVal = body.avatarUrl || body.avatarKey || null
    return api.put<UserProfile>("/users/me/profile", {
      ...body,
      avatarUrl: avatarVal,
      avatarKey: avatarVal,
    }).then((r) => r.data)
  },
  changePassword: (body: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
    api.post("/users/me/password", body).then((r) => r.data),
}

// ---- Dashboard -----------------------------------------------
export const dashboardApi = {
  stats: () => api.get<DashboardStats>("/dashboard/stats").then((r) => r.data),
}

// ---- Companies (super admin) ---------------------------------
export interface CompanyInput {
  name: string
  email: string
  phone: string
  address: string
  description: string
  enableBranch: boolean
  ownerUsername?: string
  ownerPassword?: string
  active?: boolean
}

// ---- Mapping Helpers ------------------------------------------
function mapCompanyFromBackend(c: any): any {
  if (!c) return c
  return {
    ...c,
    active: c.active !== undefined ? c.active : c.isActive,
  }
}

function mapCompanyToBackend(c: any): any {
  if (!c) return c
  const { active, ...rest } = c
  return {
    ...rest,
    isActive: active,
  }
}

function mapBranchFromBackend(b: any): any {
  if (!b) return b
  return {
    ...b,
    active: b.active !== undefined ? b.active : b.isActive,
  }
}

function mapBranchToBackend(b: any): any {
  if (!b) return b
  const { active, ...rest } = b
  return {
    ...rest,
    isActive: active,
  }
}

function mapStaffFromBackend(s: any): Staff {
  if (!s) return s
  const nameParts = (s.name || "").trim().split(/\s+/)
  const firstName = nameParts[0] || ""
  const lastName = nameParts.slice(1).join(" ") || ""
  const documents = Array.isArray(s.documents)
    ? s.documents.map((doc: any) => ({
        fileKey: doc.url || "",
        fileName: doc.fileName || "",
      }))
    : []
  return {
    ...s,
    firstName,
    lastName,
    documents,
    active: s.active !== undefined ? s.active : s.isActive,
  }
}

function mapStaffToBackend(s: Partial<StaffInput>): any {
  if (!s) return s
  const { firstName, lastName, documents, ...rest } = s
  const name = [firstName, lastName].filter(Boolean).join(" ")
  const mappedDocuments = Array.isArray(documents)
    ? documents.map((doc: any) => ({
        url: doc.fileKey || "",
        fileName: doc.fileName || "",
        docType: "DOCUMENT",
      }))
    : undefined
  return {
    ...rest,
    name,
    documents: mappedDocuments,
  }
}

export const companiesApi = {
  list: (params: ListParams) =>
    api.get<Paged<Company>>("/companies", { params: listQuery(params) }).then((r) => {
      const paged = normalizePaged<Company>(r.data)
      paged.items = paged.items.map(mapCompanyFromBackend)
      return paged
    }),
  get: (id: string) =>
    api.get<Company & { branchCount?: number; staffCount?: number; userCount?: number }>(`/companies/${id}`).then((r) => mapCompanyFromBackend(r.data)),
  getProfile: () =>
    api.get<Company & { branchCount?: number; staffCount?: number; userCount?: number }>("/companies/me").then((r) => mapCompanyFromBackend(r.data)),
  updateProfile: (body: Partial<CompanyInput>) =>
    api.put<Company>("/companies/me", mapCompanyToBackend(body)).then((r) => mapCompanyFromBackend(r.data)),
  create: (body: CompanyInput) => api.post<Company>("/companies", mapCompanyToBackend(body)).then((r) => mapCompanyFromBackend(r.data)),
  update: (id: string, body: Partial<CompanyInput>) =>
    api.put<Company>(`/companies/${id}`, mapCompanyToBackend(body)).then((r) => mapCompanyFromBackend(r.data)),
  remove: (id: string) => api.delete(`/companies/${id}`).then((r) => r.data),
  restore: (id: string) => api.patch<Company>(`/companies/${id}/restore`).then((r) => mapCompanyFromBackend(r.data)),
  toggleActive: (id: string) => api.patch<Company>(`/companies/${id}/toggle-active`).then((r) => mapCompanyFromBackend(r.data)),
}

// ---- System admins (super admin) -----------------------------
export const adminsApi = {
  list: (params: ListParams) =>
    api.get<Paged<User>>("/system-admins", { params: listQuery(params) }).then((r) => normalizePaged<User>(r.data)),
  get: (id: string) => api.get<User>(`/system-admins/${id}`).then((r) => r.data),
  create: (body: { username: string; email: string; firstName: string; lastName: string; password: string }) =>
    api.post<User>("/system-admins", body).then((r) => r.data),
}

// ---- Company Configurations (super admin) -------------------
export interface ConfigurationInput {
  companyId: string
  configKey: string
  configValue: Record<string, any>
  description?: string
}

export const configurationsApi = {
  list: (params: ListParams & { companyId?: string }) =>
    api
      .get<Paged<CompanyConfiguration>>("/super-admin/configurations", {
        params: { ...listQuery(params), companyId: params.companyId || undefined },
      })
      .then((r) => normalizePaged<CompanyConfiguration>(r.data)),
  get: (id: string) =>
    api.get<CompanyConfiguration>(`/super-admin/configurations/${id}`).then((r) => r.data),
  create: (body: ConfigurationInput) =>
    api.post<CompanyConfiguration>("/super-admin/configurations", body).then((r) => r.data),
  update: (id: string, body: Partial<ConfigurationInput>) =>
    api.put<CompanyConfiguration>(`/super-admin/configurations/${id}`, body).then((r) => r.data),
  remove: (id: string) =>
    api.delete(`/super-admin/configurations/${id}`).then((r) => r.data),
}

// ---- Branches (tenant) ---------------------------------------
export interface BranchInput {
  name: string
  phone: string
  address: string
  active?: boolean
}

export const branchesApi = {
  list: (params: ListParams) =>
    api.get<Paged<Branch>>("/branches", { params: listQuery(params) }).then((r) => {
      const paged = normalizePaged<Branch>(r.data)
      paged.items = paged.items.map(mapBranchFromBackend)
      return paged
    }),
  create: (body: BranchInput) => api.post<Branch>("/branches", mapBranchToBackend(body)).then((r) => mapBranchFromBackend(r.data)),
  update: (id: string, body: Partial<BranchInput>) =>
    api.put<Branch>(`/branches/${id}`, mapBranchToBackend(body)).then((r) => mapBranchFromBackend(r.data)),
  remove: (id: string) => api.delete(`/branches/${id}`).then((r) => r.data),
  restore: (id: string) => api.patch<Branch>(`/branches/${id}/restore`).then((r) => mapBranchFromBackend(r.data)),
}

// ---- Staff (tenant) ------------------------------------------
export interface StaffInput {
  firstName: string
  lastName: string
  position: string
  salary: number
  email: string
  phone: string
  branchId?: string | null
  urgentContactName: string
  urgentContactPhone: string
  documents?: { fileKey: string; fileName: string }[]
  userId?: string | null
}

export const staffApi = {
  list: (params: ListParams) =>
    api.get<Paged<Staff>>("/staffs", { params: listQuery(params) }).then((r) => {
      const paged = normalizePaged<Staff>(r.data)
      paged.items = paged.items.map(mapStaffFromBackend)
      return paged
    }),
  get: (id: string) => api.get<Staff>(`/staffs/${id}`).then((r) => mapStaffFromBackend(r.data)),
  create: (body: StaffInput) => api.post<Staff>("/staffs", mapStaffToBackend(body)).then((r) => mapStaffFromBackend(r.data)),
  update: (id: string, body: Partial<StaffInput>) =>
    api.put<Staff>(`/staffs/${id}`, mapStaffToBackend(body)).then((r) => mapStaffFromBackend(r.data)),
  remove: (id: string) => api.delete(`/staffs/${id}`).then((r) => r.data),
  restore: (id: string) => api.patch<Staff>(`/staffs/${id}/restore`).then((r) => mapStaffFromBackend(r.data)),
}

// ---- Users (tenant) ------------------------------------------
export const usersApi = {
  list: (params: ListParams) =>
    api.get<Paged<User>>("/users", { params: listQuery(params) }).then((r) => normalizePaged<User>(r.data)),
  create: (body: {
    username: string
    email: string
    firstName: string
    lastName: string
    password: string
    roleIds: string[]
  }) => api.post<User>("/users/register", body).then((r) => r.data),
  update: (id: string, body: { roleIds?: string[]; active?: boolean }) =>
    api.put<User>(`/users/${id}`, body).then((r) => r.data),
  remove: (id: string) => api.delete(`/users/${id}`).then((r) => r.data),
  addPermissions: (id: string, permissionIds: string[]) =>
    api.post<User>(`/users/${id}/permissions`, { permissionIds }).then((r) => r.data),
  excludePermissions: (id: string, permissionIds: string[]) =>
    api.post<User>(`/users/${id}/exclude-permissions`, { permissionIds }).then((r) => r.data),
  restore: (id: string) => api.post<User>(`/users/${id}/restore`).then((r) => r.data),
}

// ---- Roles & permissions (tenant) ----------------------------
import { normalizeRole } from "@/lib/role-utils"

export const rolesApi = {
  list: (params: ListParams) =>
    api.get<Paged<Role>>("/roles", { params: listQuery(params) }).then((r) => {
      const paged = normalizePaged<Role>(r.data)
      paged.items = paged.items.map(normalizeRole)
      return paged
    }),
  get: (id: string | number) => api.get<Role>(`/roles/${id}`).then((r) => normalizeRole(r.data)),
  create: (body: { name: string; description: string; permissionIds: string[] }) =>
    api.post<Role>("/roles", body).then((r) => normalizeRole(r.data)),
  update: (id: string | number, body: any) =>
    api
      .put<Role>(`/roles/${id}`, body)
      .catch((err) => {
        if (err?.status === 405 || err?.status === 404) {
          return api.patch<Role>(`/roles/${id}`, body)
        }
        throw err
      })
      .then((r) => normalizeRole(r.data)),
  remove: (id: string | number) => api.delete(`/roles/${id}`).then((r) => r.data),
  restore: (id: string | number) => api.post<Role>(`/roles/${id}/restore`).then((r) => normalizeRole(r.data)),
  excludePermissions: (id: string | number, permissionIds: string[]) =>
    api.post<Role>(`/roles/${id}/exclude-permissions`, { permissionIds }).then((r) => normalizeRole(r.data)),
}

export const permissionsApi = {
  list: () =>
    api.get<any[]>("/permissions").then((r) => {
      const data = Array.isArray(r.data) ? r.data : []
      const result: Permission[] = []

      data.forEach((perm: any) => {
        const domain = perm.name || "General"
        const moduleName = domain.charAt(0).toUpperCase() + domain.slice(1)
        const grants = Array.isArray(perm.grants) ? perm.grants : []

        if (grants.length === 0) {
          result.push({
            id: String(perm.id),
            name: domain,
            module: moduleName,
            description: perm.description || `${moduleName} permission`,
          })
        } else {
          grants.forEach((grant: any) => {
            const action = grant.actionName || "access"
            const code = `${domain}.${action}`
            const grantId = grant.grantId ? String(grant.grantId) : `${perm.id}-${action}`
            result.push({
              id: grantId,
              name: code,
              module: moduleName,
              description: `${action.toUpperCase()} operation for ${domain}`,
            })
          })
        }
      })

      return result
    }),
}

// ---- Storage: presigned S3-style upload ----------------------
export const storageApi = {
  getUploadUrl: (body: { fileName: string; contentType: string; isPublic?: boolean; folder?: string }) =>
    api.post<UploadUrlResponse>("/storage/upload-url", body).then((r) => r.data),
  getDownloadUrl: (key: string) =>
    api.get<{ downloadUrl: string }>(`/storage/download-url?key=${encodeURIComponent(key)}`).then((r) => r.data),
}

export async function uploadFile(
  file: File,
  options?: { isPublic?: boolean; folder?: string }
): Promise<string> {
  const { uploadUrl, fileKey } = await storageApi.getUploadUrl({
    fileName: file.name,
    contentType: file.type || "application/octet-stream",
    isPublic: options?.isPublic,
    folder: options?.folder,
  })
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  })
  if (!res.ok) throw new Error("Upload to storage failed")
  return fileKey
}

export function fileUrl(fileKey: string | null | undefined) {
  if (!fileKey) return undefined
  if (fileKey.startsWith("http://") || fileKey.startsWith("https://")) return fileKey
  if (fileKey.startsWith("public/")) {
    return `https://public-rumluos-amz-s3.s3.us-east-1.amazonaws.com/${fileKey}`
  }
  return `/api/v1/storage/object/${fileKey.split("/").map(encodeURIComponent).join("/")}`
}

// ---- Attachments Management -----------------------------------
export interface AttachmentListParams extends ListParams {
  category?: string
  branchId?: string | number
}

export const attachmentsApi = {
  list: (params: AttachmentListParams = {}) => {
    const pageZeroBased = Math.max(0, (params.page ?? 1) - 1)
    return api
      .get<Paged<Attachment>>("/attachments", {
        params: {
          category: params.category || undefined,
          branchId: params.branchId || undefined,
          search: params.search || undefined,
          page: pageZeroBased,
          size: params.limit ?? 20,
        },
      })
      .then((r) => normalizePaged<Attachment>(r.data))
  },
  get: (id: string | number) =>
    api.get<Attachment>(`/attachments/${id}`).then((r) => r.data),
  create: (body: CreateAttachmentInput) =>
    api.post<Attachment>("/attachments", body).then((r) => r.data),
  update: (id: string | number, body: UpdateAttachmentInput) =>
    api.put<Attachment>(`/attachments/${id}`, body).then((r) => r.data),
  remove: (id: string | number) =>
    api.delete(`/attachments/${id}`).then((r) => r.data),
  getDownloadUrl: (id: string | number) =>
    api.get<AttachmentDownloadResponse>(`/attachments/${id}/download-url`).then((r) => r.data),
}

export async function uploadFileWithAttachment(
  file: File,
  options?: {
    category?: string
    description?: string
    branchId?: number | string
    isPublic?: boolean
    onProgress?: (percent: number) => void
  }
): Promise<Attachment> {
  const { uploadUrl, fileKey } = await storageApi.getUploadUrl({
    fileName: file.name,
    contentType: file.type || "application/octet-stream",
    isPublic: options?.isPublic,
    folder: options?.category?.toLowerCase() || "documents",
  })

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("PUT", uploadUrl, true)
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream")

    if (xhr.upload && options?.onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100)
          options.onProgress?.(percent)
        }
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new Error(`Storage upload failed with status ${xhr.status}`))
      }
    }

    xhr.onerror = () => reject(new Error("Network error during file upload to S3"))
    xhr.send(file)
  })

  return attachmentsApi.create({
    fileName: file.name,
    fileKey: fileKey,
    mimeType: file.type || "application/octet-stream",
    fileSize: file.size,
    category: options?.category || "DOCUMENTS",
    description: options?.description,
    branchId: options?.branchId ? Number(options.branchId) : null,
    isPublic: options?.isPublic ?? true,
  })
}


// ---- Customers (tenant) --------------------------------------
export const customersApi = {
  list: (params: ListParams) =>
    api.get<Paged<Customer>>("/customers", { params: listQuery(params) }).then((r) => {
      const paged = normalizePaged<Customer>(r.data)
      paged.items = paged.items.map((c: any) => ({
        ...c,
        isActive: c.isActive !== undefined ? Boolean(c.isActive) : c.active !== undefined ? Boolean(c.active) : true,
      }))
      return paged
    }),
  get: (id: string) =>
    api.get<Customer>(`/customers/${id}`).then((r) => {
      const c: any = r.data
      return {
        ...c,
        isActive: c.isActive !== undefined ? Boolean(c.isActive) : c.active !== undefined ? Boolean(c.active) : true,
      }
    }),
  create: (body: Partial<Customer>) => {
    const payload = {
      ...body,
      active: body.isActive !== undefined ? body.isActive : body.active,
    }
    return api.post<Customer>("/customers", payload).then((r) => r.data)
  },
  update: (id: string, body: Partial<Customer>) => {
    const payload = {
      ...body,
      active: body.isActive !== undefined ? body.isActive : body.active,
    }
    return api.put<Customer>(`/customers/${id}`, payload).then((r) => r.data)
  },
  remove: (id: string) => api.delete(`/customers/${id}`).then((r) => r.data),
}

// ---- Brands (tenant) -----------------------------------------
export const brandsApi = {
  list: (params: ListParams) =>
    api.get<Paged<Brand>>("/brands", { params: listQuery(params) }).then((r) => normalizePaged<Brand>(r.data)),
  get: (id: string) => api.get<Brand>(`/brands/${id}`).then((r) => r.data),
  create: (body: Partial<Brand>) => api.post<Brand>("/brands", body).then((r) => r.data),
  update: (id: string, body: Partial<Brand>) =>
    api.put<Brand>(`/brands/${id}`, body).then((r) => r.data),
  remove: (id: string) => api.delete(`/brands/${id}`).then((r) => r.data),
}

// ---- Categories (tenant) -------------------------------------
export const categoriesApi = {
  list: (params: ListParams) =>
    api.get<Paged<Category>>("/categories", { params: listQuery(params) }).then((r) => normalizePaged<Category>(r.data)),
  get: (id: string) => api.get<Category>(`/categories/${id}`).then((r) => r.data),
  create: (body: Partial<Category>) => api.post<Category>("/categories", body).then((r) => r.data),
  update: (id: string, body: Partial<Category>) =>
    api.put<Category>(`/categories/${id}`, body).then((r) => r.data),
  remove: (id: string) => api.delete(`/categories/${id}`).then((r) => r.data),
}

// ---- Products (tenant) ---------------------------------------
export const productsApi = {
  list: (params: ListParams) =>
    api.get<Paged<Product>>("/products", { params: listQuery(params) }).then((r) => normalizePaged<Product>(r.data)),
  get: (id: string) => api.get<Product>(`/products/${id}`).then((r) => r.data),
  create: (body: Partial<Product>) => api.post<Product>("/products", body).then((r) => r.data),
  importBatch: (body: BatchImportRequest) =>
    api.post<BatchImportResponse>("/products/import-batch", body).then((r) => r.data),
  update: (id: string, body: Partial<Product>) =>
    api.put<Product>(`/products/${id}`, body).then((r) => r.data),
  remove: (id: string) => api.delete(`/products/${id}`).then((r) => r.data),
}

// ---- Loans (tenant) ------------------------------------------
export const loansApi = {
  list: (params: ListParams) =>
    api.get<Paged<Loan>>("/loans", { params: listQuery(params) }).then((r) => normalizePaged<Loan>(r.data)),
  get: (id: string) => api.get<Loan>(`/loans/${id}`).then((r) => r.data),
  getDetails: (id: string) => api.get<LoanDetails>(`/loans/${id}`).then((r) => r.data),
  create: (body: Partial<Loan>) => api.post<Loan>("/loans", body).then((r) => r.data),
  activate: (id: string, body?: any) =>
    api.put<Loan>(`/loans/${id}/activate`, body).then((r) => r.data),
  restructure: (id: string, body?: any) =>
    api.put<Loan>(`/loans/${id}/restructure`, body).then((r) => r.data),
  defaultLoan: (id: string, body?: any) =>
    api.put<Loan>(`/loans/${id}/default`, body).then((r) => r.data),
  closeLoan: (id: string, body?: any) =>
    api.put<Loan>(`/loans/${id}/close`, body).then((r) => r.data),
}

// ---- Finance (tenant) ----------------------------------------
export const financeApi = {
  listInvoices: (params: ListParams) =>
    api.get<Paged<Invoice>>("/finance/invoices", { params: listQuery(params) }).then((r) => normalizePaged<Invoice>(r.data)),
  getInvoiceDetails: (id: string) =>
    api.get<InvoiceDetails>(`/finance/invoices/${id}`).then((r) => r.data),
  listPayments: (params: ListParams) =>
    api.get<Paged<Payment>>("/finance/payments", { params: listQuery(params) }).then((r) => normalizePaged<Payment>(r.data)),
  generateInvoice: (body: Partial<Invoice>) =>
    api.post<Invoice>("/finance/invoices", body).then((r) => r.data),
  processPayment: (body: Partial<Payment>) =>
    api.post<Payment>("/finance/payments", body).then((r) => r.data),
}
