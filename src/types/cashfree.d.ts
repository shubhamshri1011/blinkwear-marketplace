declare module '@cashfreepayments/cashfree-js' {
  export interface CashfreeCheckoutOptions {
    paymentSessionId: string;
    redirectTarget?: '_self' | '_blank' | '_top' | '_modal';
  }

  export interface CashfreeInstance {
    checkout(options: CashfreeCheckoutOptions): Promise<{ error?: unknown; paymentDetails?: unknown }>;
  }

  export function load(config: { mode: 'sandbox' | 'production' }): Promise<CashfreeInstance>;
}
