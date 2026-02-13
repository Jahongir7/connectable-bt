import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  User, 
  UserRole, 
  Client, 
  CashIn, 
  CashOut, 
  FXOperation, 
  CardOpen, 
  DepositOpen, 
  ActivityLog, 
  ChatMessage,
  ManagerReportItem,
  AccountingJournalEntry,
  LoanApplication,
  StudentScore,
  AuditMark,
  AuditStatus,
  Currency,
  ManualScore,
  OperationCode,
  DEFAULT_OPERATION_CODES
} from '@/types/bank';

interface BankState {
  // User
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  updateUserRole: (role: UserRole) => void;
  
  // Clients
  clients: Client[];
  addClient: (client: Client) => void;
  updateClient: (id: string, data: Partial<Client>) => void;
  getClientById: (id: string) => Client | undefined;
  fetchClients: () => Promise<void>;
  
  // Operations
  cashInOps: CashIn[];
  cashOutOps: CashOut[];
  fxOps: FXOperation[];
  cardOps: CardOpen[];
  depositOps: DepositOpen[];
  fetchCashInOps: () => Promise<void>;
  fetchCashOutOps: () => Promise<void>;
  fetchFXOps: () => Promise<void>;
  fetchCardOps: () => Promise<void>;
  fetchDepositOps: () => Promise<void>;
  managerReport: ManagerReportItem[];
  fetchManagerReport: () => Promise<void>;
  
  addCashIn: (op: CashIn) => void;
  addCashOut: (op: CashOut) => void;
  addFxOp: (op: FXOperation) => void;
  addCardOp: (op: CardOpen) => void;
  addDepositOp: (op: DepositOpen) => void;
  
  updateOperationStatus: (type: string, id: string, status: 'draft' | 'completed' | 'cancelled') => void;
  
  // Activity Log
  activityLog: ActivityLog[];
  addActivityLog: (log: ActivityLog) => void;
  
  // Chat
  chatMessages: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  clearChat: () => void;
  
  // UI State
  isChatOpen: boolean;
  toggleChat: () => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  
  // Accounting Journal
  journalEntries: AccountingJournalEntry[];
  addJournalEntry: (entry: AccountingJournalEntry) => void;
  generateJournalEntries: (operationType: string, operationId: string, amount: number, currency: Currency, createdBy: string) => void;
  
  // Loan
  loanOps: LoanApplication[];
  addLoanOp: (op: LoanApplication) => void;
  updateLoanOp: (id: string, data: Partial<LoanApplication>) => void;
  
  // Gamification
  studentScore: StudentScore;
  addCorrectOperation: () => void;
  addMistake: () => void;
  
  // Audit/Control
  auditMarks: AuditMark[];
  setAuditMark: (mark: AuditMark) => void;
  
  // Manual Scores (Leader-controlled)
  manualScores: ManualScore[];
  addManualScore: (score: ManualScore) => void;
  updateManualScore: (id: string, data: Partial<ManualScore>) => void;
  
  // Operation Codes (CRUD)
  operationCodes: Record<string, OperationCode>;
  addOperationCode: (key: string, code: OperationCode) => void;
  updateOperationCode: (key: string, data: Partial<OperationCode>) => void;
  deleteOperationCode: (key: string) => void;
  
  // Stats
  getStats: () => {
    totalOperations: number;
    todayOperations: number;
    totalClients: number;
    totalAmount: { UZS: number; USD: number; EUR: number };
  };
}

const JOURNAL_MAPPINGS: Record<string, { debit: string; credit: string }> = {
  cash_in: { debit: 'Kassa', credit: 'Mijoz hisobi' },
  cash_out: { debit: 'Mijoz hisobi', credit: 'Kassa' },
  loan: { debit: 'Kredit hisobi', credit: 'Kassa' },
  interest: { debit: 'Mijoz hisobi', credit: 'Foiz daromadi hisobi' },
  fx: { debit: 'Valyuta hisobi', credit: 'Kassa' },
  deposit: { debit: 'Kassa', credit: 'Omonat hisobi' },
};

const initialChatMessage: ChatMessage = {
  id: '1',
  role: 'assistant',
  content: "Assalomu alaykum! 👋 Men Mamun Bank Trenajer yordamchisiman. Sizga bank operatsiyalarini o'rganishda yordam beraman. Qanday savol bor?",
  timestamp: new Date()
};

export const useBankStore = create<BankState>()(
  persist(
    (set, get) => ({
      // User
      currentUser: null,
      setCurrentUser: (user) => set({ currentUser: user }),
      updateUserRole: (role) => set((state) => ({
        currentUser: state.currentUser ? { ...state.currentUser, role } : null
      })),
      
      // Clients
      clients: [],
      addClient: (client) => set((state) => ({ clients: [...state.clients, client] })),
      updateClient: (id, data) => set((state) => ({
        clients: state.clients.map(c => c.client_id === id ? { ...c, ...data } : c)
      })),
      getClientById: (id: string) => get().clients.find(c => c.client_id === id),
      fetchClients: async () => {
        try {
          const response = await fetch('https://mamun.university/api/v1/bt/clients?limit=404');
          if (!response.ok) throw new Error('Failed to fetch clients');
          const result = await response.json();
          
          if (result.status === 200 && result.data?.items) {
            const mappedClients: Client[] = result.data.items.map((item: any) => ({
              client_id: item.id.toString(),
              full_name: item.full_name,
              birth_date: item.birth_date,
              phone: item.phone,
              passport_series_number: item.passport_series_number,
              passport_issued_date: item.passport_issued_date,
              address: item.address || undefined,
              notes: item.notes || undefined,
              created_at: new Date(item.created_at),
              created_by: 'system', // Default for fetched clients
            }));
            
            set({ clients: mappedClients });
          }
        } catch (error) {
          console.error('Error fetching clients:', error);
        }
      },
      
      // Operations
      cashInOps: [],
      cashOutOps: [],
      fxOps: [],
      cardOps: [],
      depositOps: [],
      managerReport: [],
      
      addCashIn: (op) => set((state) => ({ cashInOps: [...state.cashInOps, op] })),
      addCashOut: (op) => set((state) => ({ cashOutOps: [...state.cashOutOps, op] })),
      addFxOp: (op) => set((state) => ({ fxOps: [...state.fxOps, op] })),
      addCardOp: (op) => set((state) => ({ cardOps: [...state.cardOps, op] })),
      addDepositOp: (op) => set((state) => ({ depositOps: [...state.depositOps, op] })),
      
      updateOperationStatus: (type, id, status) => set((state) => {
        const updateOps = <T extends { oper_id: string; status: string }>(ops: T[]) =>
          ops.map(op => op.oper_id === id ? { ...op, status } : op);
        
        switch (type) {
          case 'cashIn': return { cashInOps: updateOps(state.cashInOps) };
          case 'cashOut': return { cashOutOps: updateOps(state.cashOutOps) };
          case 'fx': return { fxOps: updateOps(state.fxOps) };
          case 'card': return { cardOps: updateOps(state.cardOps) };
          case 'deposit': return { depositOps: updateOps(state.depositOps) };
          default: return {};
        }
      }),
      fetchCashInOps: async () => {
        try {
          const response = await fetch('https://mamun.university/api/v1/bt/cash-in?limit=404');
          if (!response.ok) throw new Error('Failed to fetch cash-in operations');
          const result = await response.json();
          
          if (result.status === 200 && result.data?.items) {
            const mappedOps: CashIn[] = result.data.items.map((item: any) => ({
              oper_id: `CI-${item.id}`,
              sana_vaqt: new Date(item.operation_date),
              kassir_id: 'system',
              kassir_fio: item.operator_name,
              client_id: item.client_id.toString(),
              client_fio: item.client_name,
              valuta: item.currency,
              summa: parseFloat(item.amount),
              maqsad: item.purpose,
              izoh: item.notes || undefined,
              status: item.status,
              print_count: item.print_count || 0,
            }));
            
            set({ cashInOps: mappedOps });
          }
        } catch (error) {
          console.error('Error fetching cash-in operations:', error);
        }
      },
      fetchCashOutOps: async () => {
        try {
          const response = await fetch('https://mamun.university/api/v1/bt/cash-out?limit=404');
          if (!response.ok) throw new Error('Failed to fetch cash-out operations');
          const result = await response.json();
          
          if (result.status === 200 && result.data?.items) {
            const mappedOps: CashOut[] = result.data.items.map((item: any) => ({
              oper_id: `CO-${item.id}`,
              sana_vaqt: new Date(item.operation_date),
              kassir_id: 'system',
              kassir_fio: item.operator_name,
              client_id: item.client_id.toString(),
              client_fio: item.client_name,
              valuta: item.currency,
              summa: parseFloat(item.amount),
              asos: item.reason,
              izoh: item.notes || undefined,
              status: item.status,
              print_count: item.print_count || 0,
            }));
            
            set({ cashOutOps: mappedOps });
          }
        } catch (error) {
          console.error('Error fetching cash-out operations:', error);
        }
      },
      fetchFXOps: async () => {
        try {
          const response = await fetch('https://mamun.university/api/v1/bt/currency-exchange?limit=404');
          if (!response.ok) throw new Error('Failed to fetch FX operations');
          const result = await response.json();
          
          if (result.status === 200 && result.data?.items) {
            const mappedOps: FXOperation[] = result.data.items.map((item: any) => ({
              oper_id: `FX-${item.id}`,
              sana_vaqt: new Date(item.operation_date),
              operator_id: 'system',
              operator_fio: item.operator_name,
              client_id: item.client_id.toString(),
              client_fio: item.client_name,
              turi: item.operation_type,
              berilgan_valyuta: item.given_currency,
              berilgan_summa: parseFloat(item.given_amount),
              olinadigan_valyuta: item.received_currency,
              olinadigan_summa: parseFloat(item.received_amount || (item.given_amount * item.exchange_rate)),
              kurs: parseFloat(item.exchange_rate),
              komissiya: parseFloat(item.commission_percent),
              status: item.status,
            }));
            
            set({ fxOps: mappedOps });
          }
        } catch (error) {
          console.error('Error fetching FX operations:', error);
        }
      },
      fetchCardOps: async () => {
        try {
          const response = await fetch('https://mamun.university/api/v1/bt/card-applications?limit=404');
          if (!response.ok) throw new Error('Failed to fetch card applications');
          const result = await response.json();
          
          if (result.status === 200 && result.data?.items) {
            const mappedOps: CardOpen[] = result.data.items.map((item: any) => ({
              oper_id: `CARD-${item.id}`,
              sana_vaqt: new Date(item.operation_date),
              operator_id: 'system',
              operator_fio: item.operator_name,
              client_id: item.client_id.toString(),
              client_fio: item.client_name,
              karta_turi: item.card_type,
              valuta: item.currency,
              sms: item.sms_notification,
              telefon: item.phone,
              yetkazish_turi: item.delivery_type === 'Filialdan olish' ? 'filial' : 'kuryer',
              boshlangich_depozit: parseFloat(item.initial_deposit || 0),
              kartaning_holati: item.card_status === 'Ariza qabul qilindi' ? 'pending' : 'completed',
              status: item.status,
            }));
            
            set({ cardOps: mappedOps });
          }
        } catch (error) {
          console.error('Error fetching card applications:', error);
        }
      },
      fetchManagerReport: async () => {
        try {
          const response = await fetch('https://mamun.university/api/v1/bt/manager-report?limit=404');
          if (!response.ok) throw new Error('Failed to fetch manager report');
          const result = await response.json();
          
          if (result.status === 200 && result.data?.items) {
            set({ managerReport: result.data.items });
          }
        } catch (error) {
          console.error('Error fetching manager report:', error);
        }
      },
      fetchDepositOps: async () => {
        try {
          const response = await fetch('https://mamun.university/api/v1/bt/deposits?limit=404');
          if (!response.ok) throw new Error('Failed to fetch deposits');
          const result = await response.json();
          
          if (result.status === 200 && result.data?.items) {
            const mappedOps: DepositOpen[] = result.data.items.map((item: any) => ({
              oper_id: `DEP-${item.id}`,
              sana_vaqt: new Date(item.operation_date),
              operator_id: 'system',
              operator_fio: item.operator_name,
              client_id: item.client_id.toString(),
              client_fio: item.client_name,
              omonat_turi: item.deposit_type,
              valuta: item.currency,
              summa: parseFloat(item.amount),
              muddat: item.term_months,
              foiz: parseFloat(item.interest_rate),
              status: item.status,
            }));
            
            set({ depositOps: mappedOps });
          }
        } catch (error) {
          console.error('Error fetching deposits:', error);
        }
      },
      
      // Activity Log
      activityLog: [],
      addActivityLog: (log) => set((state) => ({ activityLog: [log, ...state.activityLog] })),
      
      // Chat
      chatMessages: [initialChatMessage],
      addChatMessage: (message) => set((state) => ({ chatMessages: [...state.chatMessages, message] })),
      clearChat: () => set({ chatMessages: [initialChatMessage] }),
      
      // UI State
      isChatOpen: false,
      toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      
      // Accounting Journal
      journalEntries: [],
      addJournalEntry: (entry) => set((state) => ({ journalEntries: [entry, ...state.journalEntries] })),
      generateJournalEntries: (operationType, operationId, amount, currency, createdBy) => {
        const mapping = JOURNAL_MAPPINGS[operationType];
        if (!mapping) return;
        
        const entry: AccountingJournalEntry = {
          id: `JRN-${Date.now()}`,
          operation_id: operationId,
          operation_type: operationType,
          debit_account: mapping.debit,
          credit_account: mapping.credit,
          amount,
          currency,
          created_at: new Date(),
          created_by: createdBy,
        };
        
        set((state) => ({ journalEntries: [entry, ...state.journalEntries] }));
      },
      
      // Loan
      loanOps: [],
      addLoanOp: (op) => set((state) => ({ loanOps: [...state.loanOps, op] })),
      updateLoanOp: (id, data) => set((state) => ({
        loanOps: state.loanOps.map(op => op.oper_id === id ? { ...op, ...data } : op)
      })),
      
      // Gamification
      studentScore: { user_id: '', score: 0, error_count: 0, correct_count: 0, penalty_status: 'normal' as const },
      addCorrectOperation: () => set((state) => {
        const newScore = state.studentScore.score + 10;
        const newCorrect = state.studentScore.correct_count + 1;
        return { studentScore: { ...state.studentScore, score: newScore, correct_count: newCorrect } };
      }),
      addMistake: () => set((state) => {
        const newErrors = state.studentScore.error_count + 1;
        const newScore = Math.max(0, state.studentScore.score - 5);
        let penaltyStatus: 'normal' | 'warning' | 'penalty' = 'normal';
        if (newErrors >= 5) penaltyStatus = 'penalty';
        else if (newErrors >= 3) penaltyStatus = 'warning';
        return { studentScore: { ...state.studentScore, score: newScore, error_count: newErrors, penalty_status: penaltyStatus } };
      }),
      
      // Audit/Control
      auditMarks: [],
      setAuditMark: (mark) => set((state) => ({
        auditMarks: [
          ...state.auditMarks.filter(m => m.operation_id !== mark.operation_id),
          mark
        ]
      })),
      
      // Manual Scores (Leader-controlled)
      manualScores: [],
      addManualScore: (score) => set((state) => ({ manualScores: [score, ...state.manualScores] })),
      updateManualScore: (id, data) => set((state) => ({
        manualScores: state.manualScores.map(s => s.id === id ? { ...s, ...data } : s)
      })),
      
      // Operation Codes (CRUD)
      operationCodes: { ...DEFAULT_OPERATION_CODES },
      addOperationCode: (key, code) => set((state) => ({
        operationCodes: { ...state.operationCodes, [key]: code }
      })),
      updateOperationCode: (key, data) => set((state) => ({
        operationCodes: {
          ...state.operationCodes,
          [key]: { ...state.operationCodes[key], ...data }
        }
      })),
      deleteOperationCode: (key) => set((state) => {
        const { [key]: _, ...rest } = state.operationCodes;
        return { operationCodes: rest };
      }),
      
      // Stats
      getStats: () => {
        const state = get();
        const today = new Date().toDateString();
        
        const allOps = [
          ...state.cashInOps,
          ...state.cashOutOps,
          ...state.fxOps,
          ...state.cardOps,
          ...state.depositOps
        ];
        
        const todayOps = allOps.filter(op => 
          new Date(op.sana_vaqt).toDateString() === today
        );
        
        const totalAmount = { UZS: 0, USD: 0, EUR: 0 };
        
          state.cashInOps.forEach(op => {
            totalAmount[op.valuta] += op.summa;
          });
          
          return {
            totalOperations: allOps.length,
            todayOperations: todayOps.length,
            totalClients: state.clients.length,
            totalAmount
          };
      }
    }),
    {
      name: 'mamun-bank-storage',
      version: 3,
      migrate: (persistedState: any, version: number) => {
        if (version < 3) {
          const state = persistedState as any;
          if (state.clients && Array.isArray(state.clients)) {
            state.clients = state.clients.map((client: any) => ({
              ...client,
              full_name: client.full_name || client.fio || '',
              phone: client.phone || client.telefon || '',
              passport_series_number: client.passport_series_number || client.pasport_seriya_raqam || '',
              birth_date: client.birth_date || client.tugilgan_sana || '',
              passport_issued_date: client.passport_issued_date || client.pasport_berilgan_sana || '',
              address: client.address || client.manzil || '',
              notes: client.notes || client.izoh || '',
            }));
          }
          // Initialize new fields
          state.journalEntries = state.journalEntries || [];
          state.loanOps = state.loanOps || [];
          state.studentScore = state.studentScore || { user_id: '', score: 0, error_count: 0, correct_count: 0, penalty_status: 'normal' };
          state.auditMarks = state.auditMarks || [];
          state.manualScores = state.manualScores || [];
          state.operationCodes = state.operationCodes || { ...DEFAULT_OPERATION_CODES };
          return state;
        }
        return persistedState;
      },
      partialize: (state) => ({
        currentUser: state.currentUser,
        clients: state.clients,
        cashInOps: state.cashInOps,
        cashOutOps: state.cashOutOps,
        fxOps: state.fxOps,
        cardOps: state.cardOps,
        depositOps: state.depositOps,
        managerReport: state.managerReport,
        activityLog: state.activityLog,
        journalEntries: state.journalEntries,
        loanOps: state.loanOps,
        studentScore: state.studentScore,
        auditMarks: state.auditMarks,
        manualScores: state.manualScores,
        operationCodes: state.operationCodes
      })
    }
  )
);
