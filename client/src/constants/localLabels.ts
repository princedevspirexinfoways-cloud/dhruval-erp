/**
 * Local labels for shop-floor users (spec: Dhruval ERP Next Phase - Section 8)
 * Primary label in English font (local-friendly), optional English below.
 */
export const localLabels = {
  // Sales / Customer
  customer: { primary: 'Customer / Party', en: 'Customer' },
  orderNumber: { primary: 'Order No.', en: 'Order Number' },
  designNumber: { primary: 'Design No.', en: 'Design Number' },
  quality: { primary: 'Quality', en: 'Quality' },
  qty: { primary: 'Jatlu (Qty)', en: 'Qty' },
  unit: { primary: 'Unit', en: 'Unit' },
  rate: { primary: 'Bhaav (Rate)', en: 'Rate' },
  dispatch: { primary: 'Mal Moklvo (Dispatch)', en: 'Dispatch' },
  vehicleNo: { primary: 'Gaadi No.', en: 'Vehicle No.' },
  gatePass: { primary: 'Gate Pass', en: 'Gate Pass' },
  weighSlip: { primary: 'Kata Chithi', en: 'Weigh Slip' },
  remarks: { primary: 'Remarks / Nondh', en: 'Remarks / Notes' },
  paymentStatus: { primary: 'Payment Status', en: 'Payment Status' },
  paidAmount: { primary: 'Jama Amount', en: 'Paid Amount' },
  dueAmount: { primary: 'Baaki Amount', en: 'Due Amount' },
} as const

/** Get primary (local) label; optional second line in English */
export function getLabel(
  key: keyof typeof localLabels,
  options?: { showEnglish?: boolean }
): string {
  const item = localLabels[key]
  if (options?.showEnglish && item.en !== item.primary) {
    return `${item.primary}\n${item.en}`
  }
  return item.primary
}

export default localLabels
