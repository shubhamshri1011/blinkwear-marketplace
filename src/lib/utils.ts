import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function calculateRentalDays(start: string | Date, end: string | Date): number {
  const s = new Date(start);
  const e = new Date(end);
  const diffTime = e.getTime() - s.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diffDays);
}

export function calculateRentalPricing({
  rentPricePerDay,
  days,
  securityDeposit,
  deliveryCharge = 70,
  pickupReturnCharge = 70,
  buyerPlatformFeePct = 5,
  defaultSecurityDepositPct = 20,
}: {
  rentPricePerDay: number;
  days: number;
  securityDeposit?: number | null;
  deliveryCharge?: number;
  pickupReturnCharge?: number;
  buyerPlatformFeePct?: number;
  defaultSecurityDepositPct?: number;
}) {
  const rentalAmount = rentPricePerDay * days;
  const deposit =
    securityDeposit && securityDeposit > 0
      ? securityDeposit
      : Math.round((rentalAmount * defaultSecurityDepositPct) / 100);
  const buyerFee = Math.round((rentalAmount * buyerPlatformFeePct) / 100);
  const totalCharged =
    rentalAmount + deposit + deliveryCharge + pickupReturnCharge + buyerFee;

  return {
    days,
    rentalAmount,
    securityDeposit: deposit,
    deliveryCharge,
    pickupReturnCharge,
    buyerPlatformFee: buyerFee,
    totalCharged,
  };
}
