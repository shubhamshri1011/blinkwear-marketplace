import type { PlatformSettings, Product } from '@/types/database';

export interface RentalItemInput {
  productId: string;
  product: Pick<Product, 'id' | 'title' | 'rent_price_per_day' | 'security_deposit' | 'delivery_charge' | 'city' | 'status' | 'min_rental_days' | 'max_rental_days' | 'seller_id' | 'listing_type'>;
  rentalStartDate: string;
  rentalEndDate: string;
  selectedSize?: string | null;
  selectedColor?: string | null;
}

export interface CalculatedRentalItem {
  productId: string;
  sellerId: string | null;
  title: string;
  rentalStartDate: string;
  rentalEndDate: string;
  rentalDays: number;
  rentPerDay: number;
  rentalAmount: number;
  securityDeposit: number;
  deliveryCharge: number;
  pickupReturnCharge: number;
  buyerPlatformFee: number;
  sellerCommissionAmount: number;
  sellerPayoutAmount: number;
  itemTotal: number;
  selectedSize: string | null;
  selectedColor: string | null;
}

export interface RentalOrderCalculation {
  items: CalculatedRentalItem[];
  rentalSubtotal: number;
  depositTotal: number;
  deliveryTotal: number;
  pickupReturnTotal: number;
  buyerFeeTotal: number;
  grandTotal: number;
}

export interface BuyItemInput {
  productId: string;
  product: Pick<Product, 'id' | 'title' | 'sale_price' | 'discount_price' | 'delivery_charge' | 'stock_quantity' | 'seller_id' | 'status' | 'listing_type'>;
  quantity: number;
  selectedSize?: string | null;
  selectedColor?: string | null;
}

export interface CalculatedBuyItem {
  productId: string;
  sellerId: string | null;
  title: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  deliveryCharge: number;
  selectedSize: string | null;
  selectedColor: string | null;
}

export interface BuyOrderCalculation {
  items: CalculatedBuyItem[];
  subtotal: number;
  deliveryTotal: number;
  buyerFeeTotal: number;
  grandTotal: number;
}

/**
 * Calculates rental days between two dates inclusively.
 */
export function getRentalDays(startDateStr: string, endDateStr: string): number {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diffDays);
}

/**
 * Authoritative single rental item pricing engine.
 */
export function calculateRentalItem(
  item: RentalItemInput,
  settings: PlatformSettings | null
): CalculatedRentalItem {
  const days = getRentalDays(item.rentalStartDate, item.rentalEndDate);
  const dailyRate = Number(item.product.rent_price_per_day || 0);
  const rentalAmount = dailyRate * days;

  // Security deposit: fixed on product if > 0, otherwise default percentage of rental amount
  const defaultDepositPct = Number(settings?.default_security_deposit_percentage ?? 20);
  const deposit =
    item.product.security_deposit != null && Number(item.product.security_deposit) > 0
      ? Number(item.product.security_deposit)
      : Math.round(rentalAmount * (defaultDepositPct / 100));

  // Delivery charge: product custom override if set, otherwise platform default
  const defaultDelivery = Number(settings?.default_delivery_charge ?? 70);
  const delivery =
    item.product.delivery_charge != null
      ? Number(item.product.delivery_charge)
      : defaultDelivery;

  const pickupReturn = Number(settings?.pickup_return_charge ?? 70);
  const buyerFeePct = Number(settings?.buyer_platform_fee_percentage ?? 5);
  const buyerPlatformFee = Math.round(rentalAmount * (buyerFeePct / 100));

  const sellerCommPct = Number(settings?.seller_commission_percentage ?? 10);
  const sellerCommissionAmount = Math.round(rentalAmount * (sellerCommPct / 100));
  const sellerPayoutAmount = rentalAmount - sellerCommissionAmount;

  const itemTotal = rentalAmount + deposit + delivery + pickupReturn + buyerPlatformFee;

  return {
    productId: item.product.id,
    sellerId: item.product.seller_id,
    title: item.product.title,
    rentalStartDate: item.rentalStartDate,
    rentalEndDate: item.rentalEndDate,
    rentalDays: days,
    rentPerDay: dailyRate,
    rentalAmount,
    securityDeposit: deposit,
    deliveryCharge: delivery,
    pickupReturnCharge: pickupReturn,
    buyerPlatformFee,
    sellerCommissionAmount,
    sellerPayoutAmount,
    itemTotal,
    selectedSize: item.selectedSize ?? null,
    selectedColor: item.selectedColor ?? null,
  };
}

/**
 * Authoritative multi-item rental order calculation engine.
 */
export function calculateMultiRentalOrder(
  items: RentalItemInput[],
  settings: PlatformSettings | null
): RentalOrderCalculation {
  const calculatedItems = items.map((i) => calculateRentalItem(i, settings));

  const rentalSubtotal = calculatedItems.reduce((acc, i) => acc + i.rentalAmount, 0);
  const depositTotal = calculatedItems.reduce((acc, i) => acc + i.securityDeposit, 0);
  const deliveryTotal = calculatedItems.reduce((acc, i) => acc + i.deliveryCharge, 0);
  const pickupReturnTotal = calculatedItems.reduce((acc, i) => acc + i.pickupReturnCharge, 0);
  const buyerFeeTotal = calculatedItems.reduce((acc, i) => acc + i.buyerPlatformFee, 0);
  const grandTotal = rentalSubtotal + depositTotal + deliveryTotal + pickupReturnTotal + buyerFeeTotal;

  return {
    items: calculatedItems,
    rentalSubtotal,
    depositTotal,
    deliveryTotal,
    pickupReturnTotal,
    buyerFeeTotal,
    grandTotal,
  };
}

/**
 * Authoritative buy items order calculation engine.
 */
export function calculateBuyOrder(
  items: BuyItemInput[],
  settings: PlatformSettings | null
): BuyOrderCalculation {
  const defaultDelivery = Number(settings?.default_delivery_charge ?? 70);
  const buyerFeePct = Number(settings?.buyer_platform_fee_percentage ?? 5);

  const calculatedItems: CalculatedBuyItem[] = items.map((item) => {
    const unitPrice = Number(item.product.discount_price ?? item.product.sale_price ?? 0);
    const lineTotal = unitPrice * item.quantity;
    const delivery =
      item.product.delivery_charge != null
        ? Number(item.product.delivery_charge)
        : defaultDelivery;

    return {
      productId: item.product.id,
      sellerId: item.product.seller_id,
      title: item.product.title,
      quantity: item.quantity,
      unitPrice,
      lineTotal,
      deliveryCharge: delivery,
      selectedSize: item.selectedSize ?? null,
      selectedColor: item.selectedColor ?? null,
    };
  });

  const subtotal = calculatedItems.reduce((acc, i) => acc + i.lineTotal, 0);
  const deliveryTotal = calculatedItems.reduce((acc, i) => acc + i.deliveryCharge, 0);
  const buyerFeeTotal = Math.round(subtotal * (buyerFeePct / 100));
  const grandTotal = subtotal + deliveryTotal + buyerFeeTotal;

  return {
    items: calculatedItems,
    subtotal,
    deliveryTotal,
    buyerFeeTotal,
    grandTotal,
  };
}
