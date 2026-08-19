// ============================================================
// Rumluos — In-memory mock backend database.
// Swap the API route handlers for the real backend without
// touching any client code: response shapes are identical.
// ============================================================

import type {
  Branch,
  Company,
  CompanyConfiguration,
  Customer,
  Permission,
  Role,
  Staff,
  User,
} from "@/lib/types"

interface StoredFile {
  contentType: string
  data: Uint8Array
}

interface MockDb {
  companies: Company[]
  configurations: CompanyConfiguration[]
  branches: Branch[]
  staff: Staff[]
  customers: Customer[]
  users: User[]
  roles: Role[]
  permissions: Permission[]
  passwords: Map<string, string> // userId -> password (mock only)
  resetTokens: Map<string, string> // token -> userId
  files: Map<string, StoredFile>
}

const now = () => new Date().toISOString()

let counter = 100
export const uid = (prefix: string) => `${prefix}_${(counter++).toString(36)}${Date.now().toString(36).slice(-4)}`

function seed(): MockDb {
  const permissions: Permission[] = [
    // Super admin scope
    { id: "perm_companies_read", name: "companies.read", module: "Companies", description: "View companies" },
    { id: "perm_companies_create", name: "companies.create", module: "Companies", description: "Create companies" },
    { id: "perm_companies_update", name: "companies.update", module: "Companies", description: "Update companies" },
    { id: "perm_companies_delete", name: "companies.delete", module: "Companies", description: "Delete / restore companies" },
    { id: "perm_admins_read", name: "admins.read", module: "System Admins", description: "View system admins" },
    { id: "perm_admins_create", name: "admins.create", module: "System Admins", description: "Register system admins" },
    // Tenant scope
    { id: "perm_branches_read", name: "branches.read", module: "Branches", description: "View branches" },
    { id: "perm_branches_create", name: "branches.create", module: "Branches", description: "Create branches" },
    { id: "perm_branches_update", name: "branches.update", module: "Branches", description: "Update branches" },
    { id: "perm_branches_delete", name: "branches.delete", module: "Branches", description: "Delete / restore branches" },
    { id: "perm_staff_read", name: "staff.read", module: "Staff", description: "View staff profiles" },
    { id: "perm_staff_create", name: "staff.create", module: "Staff", description: "Create staff profiles" },
    { id: "perm_staff_update", name: "staff.update", module: "Staff", description: "Update staff profiles" },
    { id: "perm_staff_delete", name: "staff.delete", module: "Staff", description: "Delete / restore staff" },
    { id: "perm_users_read", name: "users.read", module: "Users", description: "View user accounts" },
    { id: "perm_users_create", name: "users.create", module: "Users", description: "Register users" },
    { id: "perm_users_update", name: "users.update", module: "Users", description: "Update users and assign roles" },
    { id: "perm_users_permissions", name: "users.manage_permissions", module: "Users", description: "Manage custom user permissions" },
    { id: "perm_roles_read", name: "roles.read", module: "Roles", description: "View roles" },
    { id: "perm_roles_create", name: "roles.create", module: "Roles", description: "Create roles" },
    { id: "perm_roles_update", name: "roles.update", module: "Roles", description: "Update roles" },
    { id: "perm_roles_delete", name: "roles.delete", module: "Roles", description: "Delete roles" },
  ]

  const tenantPermissionIds = permissions
    .filter((p) => !p.name.startsWith("companies.") && !p.name.startsWith("admins."))
    .map((p) => p.id)

  const companies: Company[] = [
    {
      id: "comp_acme",
      name: "Acme Financial",
      email: "hello@acmefinancial.com",
      phone: "+1 (415) 555-0134",
      address: "580 Market St, San Francisco, CA",
      description: "Retail banking and micro-lending services.",
      enableBranch: true,
      active: true,
      deletedAt: null,
      createdAt: "2026-01-12T09:30:00.000Z",
    },
    {
      id: "comp_northwind",
      name: "Northwind Retail",
      email: "ops@northwindretail.io",
      phone: "+1 (206) 555-0177",
      address: "22 Pike Pl, Seattle, WA",
      description: "Multi-store retail chain operations.",
      enableBranch: true,
      active: true,
      deletedAt: null,
      createdAt: "2026-02-03T14:00:00.000Z",
    },
    {
      id: "comp_helios",
      name: "Helios Energy",
      email: "contact@heliosenergy.co",
      phone: "+44 20 7946 0810",
      address: "1 Canary Wharf, London, UK",
      description: "Solar installation and maintenance company.",
      enableBranch: false,
      active: false,
      deletedAt: null,
      createdAt: "2026-03-21T10:15:00.000Z",
    },
  ]

  const roles: Role[] = [
    {
      id: "role_super",
      companyId: null,
      name: "super_admin",
      description: "Global system administrator with full access.",
      permissionIds: permissions.map((p) => p.id),
      isSystem: true,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "role_company_admin",
      companyId: "comp_acme",
      name: "company_admin",
      description: "Full administrative access within the company.",
      permissionIds: tenantPermissionIds,
      isSystem: true,
      createdAt: "2026-01-12T09:31:00.000Z",
    },
    {
      id: "role_branch_manager",
      companyId: "comp_acme",
      name: "branch_manager",
      description: "Manages a branch: staff and day-to-day users.",
      permissionIds: [
        "perm_branches_read",
        "perm_staff_read",
        "perm_staff_create",
        "perm_staff_update",
        "perm_users_read",
      ],
      isSystem: false,
      createdAt: "2026-01-15T11:00:00.000Z",
    },
    {
      id: "role_teller",
      companyId: "comp_acme",
      name: "teller",
      description: "Front-desk operations, read-only access.",
      permissionIds: ["perm_branches_read", "perm_staff_read"],
      isSystem: false,
      createdAt: "2026-01-16T08:45:00.000Z",
    },
  ]

  const users: User[] = [
    {
      id: "user_menglang",
      username: "menglang",
      email: "menglang@rumluos.com",
      firstName: "Menglang",
      lastName: "Huo",
      avatarKey: null,
      companyId: null,
      isSuperAdmin: true,
      roleIds: ["role_super"],
      addedPermissionIds: [],
      excludedPermissionIds: [],
      active: true,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "user_tech_admin",
      username: "tech_admin",
      email: "tech_admin@rumluos.com",
      firstName: "Tech",
      lastName: "Admin",
      avatarKey: null,
      companyId: "comp_acme",
      isSuperAdmin: false,
      roleIds: ["role_company_admin"],
      addedPermissionIds: [],
      excludedPermissionIds: [],
      active: true,
      createdAt: "2026-01-12T09:32:00.000Z",
    },
    {
      id: "user_villa_admin",
      username: "villa_admin",
      email: "villa_admin@rumluos.com",
      firstName: "Villa",
      lastName: "Admin",
      avatarKey: null,
      companyId: "comp_acme",
      isSuperAdmin: false,
      roleIds: ["role_company_admin"],
      addedPermissionIds: [],
      excludedPermissionIds: [],
      active: true,
      createdAt: "2026-01-12T09:32:00.000Z",
    },
    {
      id: "user_super",
      username: "superadmin",
      email: "root@rumluos.com",
      firstName: "Sam",
      lastName: "Rivera",
      avatarKey: null,
      companyId: null,
      isSuperAdmin: true,
      roleIds: ["role_super"],
      addedPermissionIds: [],
      excludedPermissionIds: [],
      active: true,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "user_acme_admin",
      username: "acmeadmin",
      email: "admin@acmefinancial.com",
      firstName: "Alexis",
      lastName: "Chen",
      avatarKey: null,
      companyId: "comp_acme",
      isSuperAdmin: false,
      roleIds: ["role_company_admin"],
      addedPermissionIds: [],
      excludedPermissionIds: [],
      active: true,
      createdAt: "2026-01-12T09:32:00.000Z",
    },
    {
      id: "user_manager",
      username: "jmorgan",
      email: "j.morgan@acmefinancial.com",
      firstName: "Jordan",
      lastName: "Morgan",
      avatarKey: null,
      companyId: "comp_acme",
      isSuperAdmin: false,
      roleIds: ["role_branch_manager"],
      addedPermissionIds: [],
      excludedPermissionIds: [],
      active: true,
      createdAt: "2026-01-20T13:10:00.000Z",
    },
    {
      id: "user_teller",
      username: "pnguyen",
      email: "p.nguyen@acmefinancial.com",
      firstName: "Phuong",
      lastName: "Nguyen",
      avatarKey: null,
      companyId: "comp_acme",
      isSuperAdmin: false,
      roleIds: ["role_teller"],
      addedPermissionIds: [],
      excludedPermissionIds: [],
      active: true,
      createdAt: "2026-02-02T09:00:00.000Z",
    },
  ]

  const branches: Branch[] = [
    {
      id: "br_downtown",
      companyId: "comp_acme",
      name: "Downtown HQ",
      phone: "+1 (415) 555-0101",
      address: "580 Market St, San Francisco, CA",
      active: true,
      deletedAt: null,
      createdAt: "2026-01-13T09:00:00.000Z",
    },
    {
      id: "br_mission",
      companyId: "comp_acme",
      name: "Mission District",
      phone: "+1 (415) 555-0155",
      address: "2200 Mission St, San Francisco, CA",
      active: true,
      deletedAt: null,
      createdAt: "2026-01-25T09:00:00.000Z",
    },
    {
      id: "br_oakland",
      companyId: "comp_acme",
      name: "Oakland Center",
      phone: "+1 (510) 555-0190",
      address: "1955 Broadway, Oakland, CA",
      active: false,
      deletedAt: null,
      createdAt: "2026-02-10T09:00:00.000Z",
    },
  ]

  const staff: Staff[] = [
    {
      id: "stf_1",
      companyId: "comp_acme",
      branchId: "br_downtown",
      firstName: "Jordan",
      lastName: "Morgan",
      position: "Branch Manager",
      salary: 86000,
      email: "j.morgan@acmefinancial.com",
      phone: "+1 (415) 555-0122",
      urgentContactName: "Casey Morgan",
      urgentContactPhone: "+1 (415) 555-0123",
      documents: [],
      userId: "user_manager",
      deletedAt: null,
      createdAt: "2026-01-20T13:00:00.000Z",
    },
    {
      id: "stf_2",
      companyId: "comp_acme",
      branchId: "br_downtown",
      firstName: "Phuong",
      lastName: "Nguyen",
      position: "Senior Teller",
      salary: 52000,
      email: "p.nguyen@acmefinancial.com",
      phone: "+1 (415) 555-0144",
      urgentContactName: "Linh Nguyen",
      urgentContactPhone: "+1 (415) 555-0145",
      documents: [],
      userId: "user_teller",
      deletedAt: null,
      createdAt: "2026-02-02T09:00:00.000Z",
    },
    {
      id: "stf_3",
      companyId: "comp_acme",
      branchId: "br_mission",
      firstName: "Diego",
      lastName: "Alvarez",
      position: "Loan Officer",
      salary: 68000,
      email: "d.alvarez@acmefinancial.com",
      phone: "+1 (415) 555-0166",
      urgentContactName: "Maria Alvarez",
      urgentContactPhone: "+1 (415) 555-0167",
      documents: [],
      userId: null,
      deletedAt: null,
      createdAt: "2026-02-14T09:00:00.000Z",
    },
  ]

  const configurations: CompanyConfiguration[] = [
    {
      id: "cfg_loan_rules",
      companyId: "comp_acme",
      configKey: "loan_policy",
      configValue: {
        maxLoanAmount: 50000,
        defaultCurrency: "USD",
        interestCalculation: "DECLINING_BALANCE",
        maxTermMonths: 48,
        penaltyFeePercentage: 2.5,
        gracePeriodDays: 5,
      },
      description: "Default loan interest policy and term constraints for Acme Financial.",
      createdAt: "2026-01-15T10:00:00.000Z",
      updatedAt: "2026-02-01T12:00:00.000Z",
    },
    {
      id: "cfg_payment_gateway",
      companyId: "comp_acme",
      configKey: "payment_gateway",
      configValue: {
        provider: "Stripe",
        autoReconciliation: true,
        supportedMethods: ["CARD", "BANK_TRANSFER", "ABA_PAY"],
        environment: "production",
      },
      description: "Payment gateway integration credentials and configuration.",
      createdAt: "2026-01-18T14:30:00.000Z",
      updatedAt: "2026-02-10T16:20:00.000Z",
    },
    {
      id: "cfg_northwind_retail",
      companyId: "comp_northwind",
      configKey: "pos_settings",
      configValue: {
        taxPercentage: 10,
        allowNegativeStock: false,
        barcodePrefix: "NW-2026",
        receiptFooterMessage: "Thank you for shopping with Northwind Retail!",
      },
      description: "POS terminal and inventory control settings.",
      createdAt: "2026-02-04T09:15:00.000Z",
      updatedAt: "2026-02-04T09:15:00.000Z",
    },
  ]

  const customers: Customer[] = [
    {
      id: "cust_1",
      companyId: "comp_acme",
      branchId: "br_downtown",
      name: "Sokha Chan",
      industry: "Retail & Trade",
      customerGroup: "VIP",
      phone: "+855 12 345 678",
      address: "#123 St 271, Khan Sen Sok, Phnom Penh",
      occupation: "Business Owner",
      imageUrl: "",
      preferredCurrency: "USD",
      isActive: true,
      email: "sokha.chan@example.com",
      dateOfBirth: "1988-05-15",
      gender: "male",
      nationalId: "ID-019827364",
      documents: [
        {
          id: "doc_1",
          fileKey: "customers/cust_1/id_card.pdf",
          fileName: "national_id_card.pdf",
          docType: "ID_CARD",
          fileSize: 1245000,
          mimeType: "application/pdf",
          createdAt: "2026-02-01T10:00:00.000Z",
        },
        {
          id: "doc_2",
          fileKey: "customers/cust_1/home_book.pdf",
          fileName: "family_home_book.pdf",
          docType: "HOME_BOOK",
          fileSize: 2310000,
          mimeType: "application/pdf",
          createdAt: "2026-02-01T10:05:00.000Z",
        },
        {
          id: "doc_3",
          fileKey: "customers/cust_1/payroll.pdf",
          fileName: "monthly_salary_slip.pdf",
          docType: "PAYROLL",
          fileSize: 850000,
          mimeType: "application/pdf",
          createdAt: "2026-02-01T10:10:00.000Z",
        },
      ],
      createdAt: "2026-02-01T10:00:00.000Z",
      updatedAt: null,
    },
  ]

  const passwords = new Map<string, string>([
    ["user_menglang", "Menglang@dmin!"],
    ["user_tech_admin", "Password@123"],
    ["user_villa_admin", "Password@123"],
    ["user_super", "admin123"],
    ["user_acme_admin", "admin123"],
    ["user_manager", "admin123"],
    ["user_teller", "admin123"],
  ])

  return {
    companies,
    configurations,
    branches,
    staff,
    customers,
    users,
    roles,
    permissions,
    passwords,
    resetTokens: new Map(),
    files: new Map(),
  }
}

// Persist across HMR reloads in dev.
const globalStore = globalThis as unknown as { __rumluosDb?: MockDb }
export const db: MockDb = globalStore.__rumluosDb ?? (globalStore.__rumluosDb = seed())

// Ensure new users exist if store was created before edit
if (!db.users.some((u) => u.username === "menglang")) {
  const seeded = seed()
  db.users = seeded.users
  db.passwords = seeded.passwords
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

export function paginate<T extends object>(
  items: T[],
  opts: { page?: number; limit?: number; search?: string; searchFields?: (keyof T)[] },
) {
  const page = Math.max(1, opts.page ?? 1)
  const limit = Math.min(100, Math.max(1, opts.limit ?? 10))
  let filtered = items
  if (opts.search && opts.searchFields?.length) {
    const q = opts.search.toLowerCase()
    filtered = items.filter((item) =>
      opts.searchFields!.some((f) => String(item[f] ?? "").toLowerCase().includes(q)),
    )
  }
  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  return {
    items: filtered.slice((page - 1) * limit, page * limit),
    page,
    limit,
    total,
    totalPages,
  }
}

/** Resolve a user's effective roles + permissions (roles + added - excluded). */
export function resolveProfile(userId: string) {
  const user = db.users.find((u) => u.id === userId)
  if (!user) return null
  const roles = db.roles.filter((r) => user.roleIds.includes(String(r.id)))
  const permIds = new Set<string>()
  for (const role of roles) {
    if (role.permissionIds) {
      for (const pid of role.permissionIds) permIds.add(pid)
    }
  }
  for (const pid of user.addedPermissionIds) permIds.add(pid)
  for (const pid of user.excludedPermissionIds) permIds.delete(pid)
  const permissions = db.permissions.filter((p) => permIds.has(p.id))
  const company = user.companyId ? (db.companies.find((c) => c.id === user.companyId) ?? null) : null
  return { ...user, roles, permissions, company }
}

export { now }
