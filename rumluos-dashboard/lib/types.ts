// ============================================================
// Rumluos — Shared domain types
// ============================================================

export interface ApiSuccess<T> {
  success: true
  data: T
  timestamp: string
}

export interface ApiFailure {
  success: false
  message: string
  error: string
  timestamp: string
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure

export interface Paged<T> {
  items: T[]
  page: number
  limit: number
  total: number
  totalPages: number
}

// ------------------------------------------------------------
// Core Auth / Identity
// ------------------------------------------------------------

export interface Permission {
  id: string
  name: string
  module: string
  description: string
}

export interface RolePermissionItem {
  name: string
  enabled: boolean
}

export type RolePermissionsMap = Record<string, RolePermissionItem[]>

export interface Role {
  id: string | number
  companyId?: string | null
  name: string
  displayName?: string
  description?: string
  priority?: number
  permissions?: RolePermissionsMap | Record<string, any>
  permissionIds?: string[]
  excludedPermissionIds?: string[]
  isSystem?: boolean
  createdAt?: string
  updatedAt?: string | null
}

export interface Company {
  id: string
  name: string
  email: string
  phone: string
  address: string
  description: string
  enableBranch: boolean
  active: boolean
  deletedAt: string | null
  createdAt: string
}

export interface CompanyConfiguration {
  id: string
  companyId: string
  configKey: string
  configValue: Record<string, any>
  description: string
  createdAt: string
  updatedAt: string
}

export interface Branch {
  id: string
  companyId: string
  name: string
  phone: string
  address: string
  active: boolean
  deletedAt: string | null
  createdAt: string
}

export interface StaffDocument {
  fileKey: string
  fileName: string
}

export interface Staff {
  id: string
  companyId: string
  branchId: string | null
  firstName: string
  lastName: string
  position: string
  salary: number
  email: string
  phone: string
  urgentContactName: string
  urgentContactPhone: string
  documents: StaffDocument[]
  userId: string | null
  deletedAt: string | null
  createdAt: string
}

export interface StaffSummary {
  id: string
  name: string
  position: string
  phone: string
  email: string
  branchId: string | null
  branchName?: string | null
  urgentContactName: string
  urgentContactPhone: string
  salary?: number | null
  isActive: boolean
}

export interface User {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  contact?: string | null
  avatarUrl?: string | null
  avatarKey?: string | null
  companyId: string | null
  companyName?: string | null
  branchId?: string | null
  branchName?: string | null
  lastLoginAt?: string | null
  isSuperAdmin?: boolean
  isSystemAdmin?: boolean
  grants?: string[]
  roleIds: string[]
  addedPermissionIds: string[]
  excludedPermissionIds: string[]
  active: boolean
  createdAt: string
  staffInfo?: StaffSummary | null
}

/** User enriched with resolved roles + effective permissions */
export interface UserProfile extends User {
  roles: Role[]
  permissions: Permission[]
  company: Company | null
}

export interface SignInResponse {
  accessToken: string
  refreshToken: string
  tokenType?: string
  expiresIn?: number
  user?: UserProfile
}

export interface UploadUrlResponse {
  uploadUrl: string
  fileKey: string
}

export interface DashboardStats {
  companies?: number
  admins?: number
  branches?: number
  staff?: number
  users?: number
  roles?: number
}

// ------------------------------------------------------------
// Customers
// ------------------------------------------------------------

export interface CustomerDocument {
  id?: string
  fileKey: string
  fileName: string
  docType: string // 'ID_CARD' | 'HOME_BOOK' | 'PAYROLL' | 'BANK_STATEMENT' | 'INCOME_PROOF' | 'PASSPORT' | 'LAND_TITLE' | 'VEHICLE_TITLE' | 'EMPLOYMENT_LETTER' | 'OTHER'
  fileSize?: number
  mimeType?: string
  url?: string
  createdAt?: string
}

export interface Customer {
  id: string
  companyId: string
  branchId: string | null
  name: string
  industry: string
  customerGroup: string
  phone: string
  address: string
  occupation: string
  imageUrl: string
  preferredCurrency: string
  isActive: boolean
  active?: boolean
  email: string
  dateOfBirth: string | null
  gender: string
  nationalId: string
  documents?: CustomerDocument[]
  createdAt: string
  updatedAt: string | null
}

// ------------------------------------------------------------
// Products / Inventory
// ------------------------------------------------------------

export interface Brand {
  id: string
  companyId: string
  name: string
  description: string
  logoUrl: string
  isActive: boolean
  createdAt: string
  updatedAt: string | null
}

export interface Category {
  id: string
  companyId: string
  name: string
  description: string
  color: string
  parentId: string | null
  imageUrl: string
  sortOrder: number
  isActive?: boolean
  createdAt: string
  updatedAt: string | null
}

export interface Product {
  id: string
  companyId: string
  brandId: string | null
  categoryId: string | null
  name: string
  model: string
  serialNumber: string
  year: number | null
  condition: string
  basePrice: number
  sellPrice: number
  currency: string
  description: string
  imageUrl: string
  attributes: Record<string, any>
  status: string
  isActive: boolean
  notes: string
  createdAt: string
  updatedAt: string | null
}

export interface BatchImportProductInput {
  brandId?: string | number | null
  categoryId?: string | number | null
  name: string
  model?: string
  serialNumber?: string
  year?: number | null
  condition?: string
  basePrice?: number
  sellPrice?: number
  currency?: string
  description?: string
  imageUrl?: string
  attributes?: Record<string, any>
  status?: string
  isActive?: boolean
  notes?: string
}

export interface BatchImportRequest {
  products: BatchImportProductInput[]
}

export interface BatchImportError {
  index: number
  serialNumber?: string | null
  reason: string
}

export interface BatchImportResponse {
  totalRequested: number
  successCount: number
  failedCount: number
  imported: Product[]
  errors: BatchImportError[]
}

// ------------------------------------------------------------
// Loans
// ------------------------------------------------------------

export interface Loan {
  id: string
  loanKey: string
  branchId: string | null
  loanOfficerId: string | null
  customerId: string
  currency: string
  term: string
  interestMethod: string
  interestRateBps: number
  assetPrice: number
  principal: number
  totalInterest: number
  deposit: number
  status: string
  daysInArrears: number
  startDate: string | null
  endDate: string | null
  numberOfPeriods: number
  description: string
  approvedBy: string | null
  approvedAt: string | null
  disbursedAt: string | null
  closedAt: string | null
  notes: string
  parentLoanId: string | null
  items?: LoanItem[]
  createdAt: string
  updatedAt: string | null
}

export interface LoanSchedule {
  id: string
  loanId: string
  periodNumber: number
  dueDate: string
  principalDue: number
  interestDue: number
  totalDue: number
  principalBalance: number
  outstandingBalance: number
  paidAmount?: number
  paidAt?: string | null
  status: string
  isPenalty?: boolean
  createdAt?: string
  updatedAt?: string | null
}

export interface LoanItem {
  id?: string
  loanId?: string
  productId?: string | null
  productName?: string
  productModel?: string
  serialNumber?: string
  condition?: string
  unitPriceSnapshot?: number
  totalCostSnapshot?: number
  currency?: string
  quantity?: number
  attributesSnapshot?: Record<string, any>
  createdAt?: string
}

export interface LoanDetails {
  loan: Loan
  customer: Customer | null
  items: LoanItem[]
  schedules: LoanSchedule[]
  invoices?: Invoice[]
  restructuredToLoan?: Loan | null
  parentLoan?: Loan | null
}

// ------------------------------------------------------------
// Finance
// ------------------------------------------------------------

export interface Invoice {
  id: string
  companyId: string
  invoiceNo: string
  branchId: string | null
  categoryId: string | null
  customerId: string
  loanId: string | null
  loanScheduleId: string | null
  subtotal: number
  taxAmount: number
  discountAmount: number
  totalAmount: number
  currency: string
  dueDate: string
  status: string
  description: string
  issuedAt: string | null
  paidAt: string | null
  createdAt: string
  updatedAt: string | null
}

export interface Payment {
  id: string
  companyId: string
  paymentRef: string
  branchId: string | null
  collectedByStaffId: string | null
  categoryId: string | null
  invoiceId: string | null
  loanScheduleId: string | null
  customerId: string | null
  amountInBaseCurrency: number
  exchangeRateSnapshot: number
  penaltyAmount: number
  amountPaid: number
  paymentCurrency: string
  paymentMethod: string
  reference: string
  paymentDate: string
  status: string
  notes: string
  receiptUrl: string
  createdAt: string
  updatedAt: string | null
}

export interface InvoiceDetails {
  invoice: Invoice
  loan?: Loan | null
  customer?: Customer | null
  payments: Payment[]
}

export interface LoanPaymentRequest {
  loanId: string
  loanScheduleId: string
  collectedByStaffId: string
  categoryId: string
  amountPaid: number
  paymentMethod: string
  paymentCurrency: string
  paymentDate: string
  notes: string
  receiptUrl: string
}

// ------------------------------------------------------------
// Storage & Attachments Management
// ------------------------------------------------------------

export interface Attachment {
  id: string
  companyId: string | null
  branchId: string | null
  fileName: string
  fileKey: string
  fileUrl: string | null
  mimeType: string | null
  fileSize: number
  category: string | null
  description: string | null
  uploadedByUserId: string | null
  isPublic: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string | null
}

export interface CreateAttachmentInput {
  fileName: string
  fileKey: string
  fileUrl?: string
  mimeType?: string
  fileSize: number
  category?: string
  description?: string
  branchId?: number | string | null
  isPublic?: boolean
}

export interface UpdateAttachmentInput {
  fileName?: string
  category?: string
  description?: string
  branchId?: number | string | null
  isPublic?: boolean
}

export interface AttachmentDownloadResponse {
  attachmentId: string | number
  fileName: string
  downloadUrl: string
  expirationTimeMillis: number
}

export interface AttachmentQueryParams {
  category?: string
  branchId?: string | number
  search?: string
  page?: number
  limit?: number
}

