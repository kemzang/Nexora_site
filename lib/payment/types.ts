export interface InitPaymentParams {
  amount: number
  currency?: string
  email: string
  name: string
  phone?: string
  description: string
  reference: string
  callbackUrl: string
  metadata?: Record<string, string>
}

export interface InitPaymentResult {
  success: boolean
  reference?: string
  authorizationUrl?: string
  error?: string
  raw?: unknown
}

export interface ProcessPaymentResult {
  success: boolean
  status?: string
  message?: string
  raw?: unknown
}

export interface VerifyPaymentResult {
  success: boolean
  status?: string
  transaction?: Record<string, unknown>
  raw?: unknown
}

export interface MobileMoneyChannel {
  id: string
  name: string
  icon: string
}

export interface MobileMoneyCountry {
  name: string
  flag: string
  code: string
  dialCode: string
  phoneLength: number
  channels: MobileMoneyChannel[]
}

export interface PaymentProvider {
  initializePayment(params: InitPaymentParams): Promise<InitPaymentResult>
  processPayment(reference: string, channel: string, data: Record<string, string>): Promise<ProcessPaymentResult>
  verifyPayment(reference: string): Promise<VerifyPaymentResult>
  mobileMoneyCountries: Record<string, MobileMoneyCountry>
}
