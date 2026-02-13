export type UserRole = 'kassir' | 'valyuta' | 'plastik' | 'omonat' | 'rahbar' | 'kredit' | 'buxgalteriya';
export type OperationStatus = 'draft' | 'completed' | 'cancelled';
export type Currency = 'UZS' | 'USD' | 'EUR';
export type CardType = 'Humo' | 'Uzcard' | 'Visa';
export type DepositType = 'muddatli' | 'jamgarma' | 'bolalar';
export type DeliveryType = 'filial' | 'kuryer';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
}

export interface Client {
  client_id: string;
  full_name: string;
  birth_date?: string;
  phone: string;
  passport_series_number: string;
  passport_issued_date?: string;
  address?: string;
  notes?: string;
  created_at: Date;
  created_by: string;
}

export interface CashIn {
  oper_id: string;
  sana_vaqt: Date;
  kassir_id: string;
  kassir_fio: string;
  client_id: string;
  client_fio: string;
  valuta: Currency;
  summa: number;
  maqsad: string;
  izoh?: string;
  status: OperationStatus;
  print_count: number;
}

export interface CashOut {
  oper_id: string;
  sana_vaqt: Date;
  kassir_id: string;
  kassir_fio: string;
  client_id: string;
  client_fio: string;
  valuta: Currency;
  summa: number;
  asos: string;
  izoh?: string;
  status: OperationStatus;
  print_count: number;
}

export interface FXOperation {
  oper_id: string;
  sana_vaqt: Date;
  operator_id: string;
  operator_fio: string;
  client_id: string;
  client_fio: string;
  turi: 'buy' | 'sell';
  berilgan_valyuta: Currency;
  berilgan_summa: number;
  olinadigan_valyuta: Currency;
  olinadigan_summa: number;
  kurs: number;
  komissiya: number;
  izoh?: string;
  status: OperationStatus;
}

export interface CardOpen {
  oper_id: string;
  sana_vaqt: Date;
  operator_id: string;
  operator_fio: string;
  client_id: string;
  client_fio: string;
  karta_turi: CardType;
  valuta: Currency;
  sms: boolean;
  telefon: string;
  yetkazish_turi: DeliveryType;
  boshlangich_depozit: number;
  kartaning_holati: 'pending' | 'active' | 'blocked';
  status: OperationStatus;
}

export interface DepositOpen {
  oper_id: string;
  sana_vaqt: Date;
  operator_id: string;
  operator_fio: string;
  client_id: string;
  client_fio: string;
  omonat_turi: DepositType;
  valuta: Currency;
  summa: number;
  muddat_oy: number;
  foiz: number;
  izoh?: string;
  status: OperationStatus;
}

export interface ManagerReportItem {
  id: number;
  operation_date: string;
  operator_name: string;
  operator_role: string;
  operation_type: string;
  operation_id: number;
  client_name: string;
  amount: string;
  currency: string;
  status: OperationStatus;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  sana_vaqt: Date;
  xodim_id: string;
  xodim_fio: string;
  rol: UserRole;
  operatsiya_turi: string;
  oper_id: string;
  mijoz_fio: string;
  summa: number;
  valuta: string;
  status: OperationStatus;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Accounting Journal
export interface AccountingJournalEntry {
  id: string;
  operation_id: string;
  operation_type: string;
  debit_account: string;
  credit_account: string;
  amount: number;
  currency: Currency;
  created_at: Date;
  created_by: string;
}

// Operation Codes
export interface OperationCode {
  code: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
}

export const DEFAULT_OPERATION_CODES: Record<string, OperationCode> = {
  cash_in: { code: 'OP-01', name: 'Naqd pul kirim', description: 'Mijozdan kassaga naqd pul qabul qilish operatsiyasi', status: 'active' },
  cash_out: { code: 'OP-02', name: 'Naqd pul chiqim', description: 'Kassadan mijozga naqd pul berish operatsiyasi', status: 'active' },
  loan: { code: 'OP-03', name: 'Kredit berish', description: 'Mijozga kredit ajratish va pul berish operatsiyasi', status: 'active' },
  fx: { code: 'OP-04', name: 'Valyuta ayirboshlash', description: 'Xorijiy valyutani sotib olish yoki sotish operatsiyasi', status: 'active' },
  deposit: { code: 'OP-05', name: 'Omonat ochish', description: 'Mijoz uchun yangi omonat hisobi ochish operatsiyasi', status: 'active' },
};

// Keep backward compat alias
export const OPERATION_CODES = DEFAULT_OPERATION_CODES;

// Loan
export type LoanStep = 1 | 2 | 3 | 4 | 5;
export type LoanStatus = 'application' | 'verification' | 'insurance' | 'decision' | 'disbursement' | 'approved' | 'rejected';

export interface LoanApplication {
  oper_id: string;
  sana_vaqt: Date;
  operator_id: string;
  operator_fio: string;
  client_id: string;
  client_fio: string;
  summa: number;
  valuta: Currency;
  muddat_oy: number;
  foiz: number;
  maqsad: string;
  oylik_tolov: number;
  current_step: LoanStep;
  scoring: {
    has_income: boolean;
    no_existing_debt: boolean;
    insurance_confirmed: boolean;
  };
  scoring_result: 'recommended' | 'risky' | 'pending';
  loan_status: LoanStatus;
  status: OperationStatus;
}

// Gamification
export interface StudentScore {
  user_id: string;
  score: number;
  error_count: number;
  correct_count: number;
  penalty_status: 'normal' | 'warning' | 'penalty';
}

// Leader-controlled scoring
export interface ManualScore {
  id: string;
  student_id: string;
  student_name: string;
  assigned_by: string;
  assigned_by_name: string;
  score: number;
  comment: string;
  session_id: string;
  created_at: Date;
}

// Control Department
export type AuditStatus = 'unchecked' | 'checked' | 'error_found';

export interface AuditMark {
  operation_id: string;
  operation_type: string;
  audit_status: AuditStatus;
  marked_by: string;
  marked_at: Date;
  note?: string;
}

export const ROLE_CONFIG: Record<UserRole, {
  label: string;
  labelUz: string;
  icon: string;
  description: string;
  color: string;
  bgColor: string;
}> = {
  kassir: {
    label: "Kassir",
    labelUz: "Kassir",
    icon: "banknote",
    description: "Naqd pul kirim va chiqim operatsiyalari",
    color: "text-success-600",
    bgColor: "bg-success-50"
  },
  valyuta: {
    label: "Valyuta operatori",
    labelUz: "Valyuta",
    icon: "arrow-left-right",
    description: "Valyuta sotib olish va sotish operatsiyalari",
    color: "text-primary-600",
    bgColor: "bg-primary-50"
  },
  plastik: {
    label: "Plastik operator",
    labelUz: "Plastik",
    icon: "credit-card",
    description: "Bank kartalari ochish va boshqarish",
    color: "text-purple-600",
    bgColor: "bg-purple-50"
  },
  omonat: {
    label: "Omonat operatori",
    labelUz: "Omonat",
    icon: "landmark",
    description: "Omonat hisoblarini ochish va boshqarish",
    color: "text-amber-600",
    bgColor: "bg-amber-50"
  },
  rahbar: {
    label: "Rahbar / Nazoratchi",
    labelUz: "Rahbar",
    icon: "shield-check",
    description: "Barcha operatsiyalarni ko'rish va nazorat qilish",
    color: "text-gray-700",
    bgColor: "bg-gray-100"
  },
  kredit: {
    label: "Kredit mutaxassisi",
    labelUz: "Kredit",
    icon: "circle-dollar-sign",
    description: "Kredit rasmiylashtirish va tahlil qilish",
    color: "text-blue-600",
    bgColor: "bg-blue-50"
  },
  buxgalteriya: {
    label: "Buxgalter",
    labelUz: "Buxgalteriya",
    icon: "book-open",
    description: "Buxgalteriya jurnalini ko'rish va monitoring",
    color: "text-teal-600",
    bgColor: "bg-teal-50"
  }
};

export const STATUS_CONFIG: Record<OperationStatus, {
  label: string;
  color: string;
  bgColor: string;
}> = {
  draft: {
    label: "Qoralama",
    color: "text-gray-600",
    bgColor: "bg-gray-100"
  },
  completed: {
    label: "Bajarildi",
    color: "text-success-600",
    bgColor: "bg-success-50"
  },
  cancelled: {
    label: "Bekor qilindi",
    color: "text-error-600",
    bgColor: "bg-error-50"
  }
};

export const CURRENCY_CONFIG: Record<Currency, {
  label: string;
  symbol: string;
  flag: string;
}> = {
  UZS: { label: "O'zbek so'mi", symbol: "so'm", flag: "🇺🇿" },
  USD: { label: "AQSH dollari", symbol: "$", flag: "🇺🇸" },
  EUR: { label: "Yevro", symbol: "€", flag: "🇪🇺" }
};
