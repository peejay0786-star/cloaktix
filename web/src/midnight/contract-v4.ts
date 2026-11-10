/** LOCAL v4 code-only binding. No proving/verifying keys, no deployment, no live address. */
export { ledger as ledgerV4, pureCircuits as pureCircuitsV4, TicketStatus as TicketStatusV4,
  type Ledger as LedgerV4, type GateInfo, type GateTypeKey, type GateStaffInfo, type Admission,
} from '../../../contract/generated-rate-v4/contract/index.js';
export const PRIVATE_STATE_ID_V4 = 'cloaktix-rate-v4';
export const V4_LOCAL_ONLY = 'Schema 4 is a local contract sketch. Proving keys and a separately authorized deployment are required. No transaction was submitted.';
