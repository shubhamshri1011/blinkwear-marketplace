declare module '@cashfreepayments/cashfree-js' {
  export interface CashfreeCheckoutOptions {
    paymentSessionId: string;
    redirectTarget?: '_self' | '_blank' | '_top' | '_modal';
  }

  export interface CashfreeInstance {
    checkout(options: CashfreeCheckoutOptions): Promise<{ error?: any; paymentDetails?: any }>;
  }

  export function load(config: { mode: 'sandbox' | 'production' }): Promise<CashfreeInstance>;
}
