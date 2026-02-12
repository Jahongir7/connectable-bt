export type UserRole = 'kassir' | 'valyuta' | 'plastik' | 'omonat' | 'rahbar';
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
