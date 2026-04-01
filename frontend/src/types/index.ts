// === Nhost Auth ===

export interface NhostUser {
  id: string
  email: string
  displayName: string
  avatarUrl: string
  locale: string
  defaultRole: string
  roles: string[]
}

export interface NhostSession {
  accessToken: string
  accessTokenExpiresIn: number
  refreshToken: string
  user: NhostUser
}

export interface NhostError {
  message: string
  status?: number
  error?: string
}

export interface GraphQLResponse<T> {
  data: T | null
  error: { message: string }[] | null
}

// === Roles ===

export type PlatformRole =
  | 'super_admin'
  | 'admin_ops'
  | 'account_manager'
  | 'sprint_manager'
  | 'finance_admin'
  | 'client_owner'
  | 'client_collaborator'
  | 'prospect_sprint'

export const ADMIN_ROLES: PlatformRole[] = [
  'super_admin', 'admin_ops', 'account_manager', 'sprint_manager', 'finance_admin'
]

export const CLIENT_ROLES: PlatformRole[] = [
  'client_owner', 'client_collaborator', 'prospect_sprint'
]

// === Profile ===

export interface UserProfile {
  id: string
  user_id: string
  platform_role: PlatformRole
  display_name: string
  phone?: string
  avatar_url?: string
}

// === Client ===

export type ClientStatus = 'active' | 'sprint' | 'suspended' | 'archived'

export interface Offer {
  id: string
  name: string
  description?: string
  monthly_credits: number
  carry_over_enabled: boolean
  price_monthly?: number
  is_sprint: boolean
}

export interface Client {
  id: string
  name: string
  logo_url?: string
  status: ClientStatus
  offer_id: string
  industry?: string
  website?: string
  notes?: string
  offer?: Offer
  wallet?: Wallet
  created_at: string
  updated_at: string
}

export type ClientMemberRole = 'owner' | 'collaborator'

export interface ClientMembership {
  client_id: string
  role: ClientMemberRole
  client: Client
}

// === Wallet ===

export interface Wallet {
  id: string
  client_id: string
  balance: number
  reserved: number
  carried_over: number
}

export type TransactionType =
  | 'allocation' | 'consumption' | 'reservation' | 'release'
  | 'recharge' | 'carry_over' | 'adjustment' | 'expiration'

export interface WalletTransaction {
  id: string
  wallet_id: string
  type: TransactionType
  amount: number
  balance_after: number
  description?: string
  reference_id?: string
  created_at: string
}

// === Campaigns ===

export type CampaignStatus = 'active' | 'draft' | 'completed' | 'paused'

export interface Campaign {
  id: string
  client_id: string
  name: string
  description?: string
  status: CampaignStatus
  objectives?: string
  kpi_targets?: string
  kpi_results?: string
  start_date?: string
  end_date?: string
  credits_budget: number
  credits_consumed: number
  client?: Client
  actions?: Action[]
  documents?: Document[]
  created_at: string
  updated_at: string
}

// === Actions ===

export type ActionStatus = 'a_valider' | 'planifiee' | 'en_cours' | 'review' | 'terminee'
export type ActionPriority = 'low' | 'medium' | 'high' | 'critical'

export interface Action {
  id: string
  campaign_id: string
  client_id: string
  title: string
  description?: string
  status: ActionStatus
  priority: ActionPriority
  credits_reserved: number
  credits_consumed: number
  due_date?: string
  assigned_to?: string
  campaign?: Campaign
  status_history?: ActionStatusHistory[]
  created_at: string
  updated_at: string
}

export interface ActionStatusHistory {
  id: string
  action_id: string
  old_status?: ActionStatus
  new_status: ActionStatus
  changed_by?: string
  created_at: string
}

// === Documents ===

export type DocumentType =
  | 'strategy' | 'audit' | 'report' | 'script' | 'sequence'
  | 'export' | 'page' | 'replay' | 'other'

export interface Document {
  id: string
  client_id: string
  campaign_id?: string
  strategic_block_id?: string
  title: string
  description?: string
  type: DocumentType
  file_id?: string
  file_url?: string
  is_published: boolean
  version_number: number
  uploaded_by?: string
  client?: Client
  versions?: DocumentVersion[]
  created_at: string
  updated_at: string
}

export interface DocumentVersion {
  id: string
  document_id: string
  version_number: number
  file_id: string
  file_url: string
  uploaded_by?: string
  created_at: string
}

// === Strategic Blocks ===

export type BlockCategory =
  | 'acquisition' | 'conversion' | 'events'
  | 'automation' | 'sales_enablement' | 'other'

export interface StrategicBlock {
  id: string
  client_id: string
  title: string
  description?: string
  category: BlockCategory
  kpi_targets?: string
  status: string
  created_at: string
  updated_at: string
}

// === Upgrades ===

export type UpgradeStatus = 'brouillon' | 'demande' | 'valide' | 'paye' | 'credite' | 'annule'
export type UpgradePackType = '500' | '1000' | '2000' | 'custom'

export interface Upgrade {
  id: string
  client_id: string
  wallet_id: string
  credits_amount: number
  pack_type: UpgradePackType
  status: UpgradeStatus
  allocation_target?: string
  requested_by?: string
  validated_by?: string
  wallet?: Wallet
  client?: Client
  created_at: string
  updated_at: string
}

// === Notifications ===

export interface Notification {
  id: string
  user_id: string
  client_id?: string
  title: string
  message: string
  type: string
  is_read: boolean
  read_at?: string
  created_at: string
}

// === Auth Context ===

export interface AuthContextValue {
  user: NhostUser | null
  profile: (UserProfile & { clientMemberships: ClientMembership[] }) | null
  session: NhostSession | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: NhostError | null }>
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: NhostError | null }>
  signOut: () => Promise<void>
  isAdmin: boolean
  isClient: boolean
  currentClient: Client | null
  currentWallet: Wallet | null
  nhost: typeof import('../lib/nhost').default
}
