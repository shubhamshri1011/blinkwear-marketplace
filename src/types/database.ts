export type City = string;
export type UserRole = 'buyer' | 'seller' | 'admin' | 'delivery';
export type ListingType = 'sale' | 'rent' | 'both';
export type ProductCondition = 'new' | 'like_new' | 'good' | 'fair';
export type ProductStatus =
  | 'draft'
  | 'pending_approval'
  | 'active'
  | 'rejected'
  | 'sold_out'
  | 'inactive'
  | 'archived';

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  address: string | null;
  pincode: string | null;
  city: City;
  active_role: UserRole;
  is_seller: boolean;
  is_admin: boolean;
  is_delivery_person?: boolean;
  created_at: string;
  updated_at?: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  icon_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export type Product = {
  id: string;
  seller_id: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  title: string;
  description: string | null;
  brand: string | null;
  size: string | null;
  color: string | null;
  condition: ProductCondition;
  listing_type: ListingType;
  sale_price: number | null;
  discount_price: number | null;
  stock_quantity: number;
  rent_price_per_day: number | null;
  security_deposit: number | null;
  min_rental_days: number | null;
  max_rental_days: number | null;
  city: City;
  status: ProductStatus;
  view_count: number;
  search_tags: string[];
  video_url: string | null;
  rejection_reason: string | null;
  featured: boolean;
  featured_sort_order: number;
  locked_until: string | null;
  locked_reason: string | null;
  delivery_charge: number | null;
  created_at: string;
  updated_at: string;
};

export type ProductImage = {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number;
  created_at: string;
};

export type ProductWithImages = Product & {
  product_images: ProductImage[];
  category?: Pick<Category, 'id' | 'name' | 'slug'> | null;
  subcategory?: Pick<Category, 'id' | 'name' | 'slug'> | null;
  seller?: Pick<Profile, 'id' | 'full_name'> | null;
  store?: { id: string; store_name: string; is_verified?: boolean } | null;
};

export type WishlistItem = {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
};

export type WishlistItemWithProduct = WishlistItem & {
  product: ProductWithImages;
};

export type PurchaseType = 'buy' | 'rent';

export type CartItem = {
  id: string;
  user_id: string;
  product_id: string;
  purchase_type: PurchaseType;
  quantity: number;
  selected_size: string | null;
  selected_color: string | null;
  rental_start_date: string | null;
  rental_end_date: string | null;
  rental_days: number | null;
  created_at: string;
  updated_at: string;
};

export type CartItemWithProduct = CartItem & {
  product: ProductWithImages | null;
};

export type BuyOrderItemStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'preparing'
  | 'ready_for_pickup'
  | 'picked_up'
  | 'out_for_delivery'
  | 'delivered'
  | 'completed'
  | 'confirmed'
  | 'shipped'
  | 'cancelled';

export type Order = {
  id: string;
  buyer_id: string;
  status: 'pending' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method: 'prepaid' | 'cashfree';
  order_total: number;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  seller_id: string;
  product_id: string | null;
  product_title: string;
  purchase_type: PurchaseType;
  quantity: number;
  unit_price: number;
  security_deposit: number | null;
  selected_size: string | null;
  selected_color: string | null;
  item_status: BuyOrderItemStatus;
  line_total: number;
  accepted_at: string | null;
  rejected_at: string | null;
  preparing_at: string | null;
  ready_for_pickup_at: string | null;
  picked_up_at: string | null;
  out_for_delivery_at: string | null;
  delivered_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderWithItems = Order & {
  order_items: (OrderItem & {
    product?: ProductWithImages | null;
  })[];
};

export type RentalBookingStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'active'
  | 'return_initiated'
  | 'returned'
  | 'completed'
  | 'cancelled'
  | 'payment_failed';

export type RentalPaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'partially_refunded';

export type DepositRefundStatus =
  | 'not_applicable'
  | 'pending'
  | 'refunded'
  | 'partially_refunded'
  | 'forfeited';

export type RentalFulfillmentStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'preparing'
  | 'ready_for_pickup'
  | 'picked_up'
  | 'out_for_delivery'
  | 'delivered'
  | 'return_initiated'
  | 'returned'
  | 'completed'
  | 'cancelled';

export type RentalBooking = {
  id: string;
  buyer_id: string;
  seller_id: string;
  product_id: string;
  rental_start_date: string;
  rental_end_date: string;
  rental_days: number;
  rent_per_day: number;
  rental_amount: number;
  security_deposit: number;
  total_charged: number;
  selected_size: string | null;
  selected_color: string | null;
  status: RentalBookingStatus;
  fulfillment_status: RentalFulfillmentStatus;
  cashfree_order_id: string | null;
  cashfree_payment_id: string | null;
  payment_status: RentalPaymentStatus;
  payment_method: 'prepaid' | 'cashfree';
  deposit_refund_status: DepositRefundStatus;
  deposit_refund_amount: number | null;
  deposit_refunded_at: string | null;
  cancellation_reason: string | null;
  seller_notes: string | null;
  delivered_at?: string | null;
  rental_start_timestamp?: string | null;
  return_deadline_timestamp?: string | null;
  returned_at?: string | null;
  late_hours?: number | null;
  rental_due_at?: string | null;
  is_late?: boolean;
  late_fee_rate_per_hour?: number;
  late_fee_amount?: number;
  created_at: string;
  updated_at: string;
};

export type RentalBookingWithDetails = RentalBooking & {
  product: ProductWithImages;
  seller?: Profile | null;
  buyer?: Profile | null;
};

export type BannerPanel = 'buyer';
export type BannerTargetType = 'product' | 'category' | 'subcategory' | 'url' | 'none';

export type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  cta_label: string | null;
  image_url: string;
  panel: BannerPanel;
  target_type: BannerTargetType;
  target_value: string | null;
  display_order: number;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
};

export type SellerVerificationStatus = 'not_verified' | 'pending' | 'verified' | 'rejected';

export type SellerProfile = {
  id: string;
  store_name: string;
  owner_name: string;
  phone: string;
  email: string;
  business_address: string;
  city: City;
  state: string;
  pincode: string;
  business_type: string | null;
  seller_category: string | null;
  gst_number: string | null;
  pan_number: string | null;
  store_description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  kyc_docs?: Record<string, any> | null;
  is_active: boolean;
  is_verified: boolean;
  verification_status: SellerVerificationStatus;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SellerStorefront = {
  id: string;
  store_name: string;
  store_description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  city: City;
  state: string;
  phone: string;
  email: string;
  is_verified: boolean;
  verified_at: string | null;
};

export type SellerPublicProfile = {
  id: string;
  store_name: string;
  store_description: string | null;
  city: string | null;
  logo_url: string | null;
  banner_url: string | null;
  is_verified: boolean;
};

export type Address = {
  id: string;
  user_id: string;
  label: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type PlatformSettings = {
  id: number;
  seller_commission_percentage: number;
  buyer_platform_fee_percentage: number;
  default_delivery_charge: number;
  pickup_return_charge: number;
  default_security_deposit_percentage: number;
  updated_at: string;
};

export type PlatformCity = {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
};

export type HomepageSectionType = 'horizontal_scroll' | 'grid_2x2' | 'featured_showcase';
export type HomepageFilterRule = 'curated' | 'trending_rentals' | 'new_arrivals' | 'popular_buys' | 'featured' | 'curated_or_auto';

export type HomepageSection = {
  id: string;
  title: string;
  subtitle: string | null;
  badge_text: string | null;
  display_order: number;
  is_active: boolean;
  section_type: HomepageSectionType;
  filter_rule: HomepageFilterRule;
  item_limit: number;
  created_at: string;
  updated_at: string;
};

export type HomepageSectionProduct = {
  id: string;
  section_id: string;
  product_id: string;
  display_order: number;
  created_at: string;
  product?: ProductWithImages;
};

export type HomepageSectionWithProducts = HomepageSection & {
  products: ProductWithImages[];
};

export type Database = {
  public: {
    Tables: {
      platform_settings: {
        Row: PlatformSettings;
        Insert: Partial<PlatformSettings>;
        Update: Partial<PlatformSettings>;
        Relationships: [];
      };
      platform_cities: {
        Row: PlatformCity;
        Insert: Partial<PlatformCity>;
        Update: Partial<PlatformCity>;
        Relationships: [];
      };
      profiles: {
        Row: Profile;
        Insert: Partial<Omit<Profile, 'id'>> & { id: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      categories: {
        Row: Category;
        Insert: Partial<Category>;
        Update: Partial<Category>;
        Relationships: [
          {
            foreignKeyName: 'categories_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          }
        ];
      };
      products: {
        Row: Product;
        Insert: Partial<Product>;
        Update: Partial<Product>;
        Relationships: [
          {
            foreignKeyName: 'products_seller_id_fkey';
            columns: ['seller_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_subcategory_id_fkey';
            columns: ['subcategory_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          }
        ];
      };
      product_images: {
        Row: ProductImage;
        Insert: Partial<ProductImage>;
        Update: Partial<ProductImage>;
        Relationships: [
          {
            foreignKeyName: 'product_images_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          }
        ];
      };
      wishlist_items: {
        Row: WishlistItem;
        Insert: Partial<WishlistItem> & { user_id: string; product_id: string };
        Update: Partial<WishlistItem>;
        Relationships: [
          {
            foreignKeyName: 'wishlist_items_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'wishlist_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          }
        ];
      };
      cart_items: {
        Row: CartItem;
        Insert: Partial<CartItem> & { user_id: string; product_id: string; purchase_type: PurchaseType };
        Update: Partial<CartItem>;
        Relationships: [
          {
            foreignKeyName: 'cart_items_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cart_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          }
        ];
      };
      addresses: {
        Row: Address;
        Insert: Partial<Address> & { user_id: string; full_name: string; phone: string; address_line1: string; city: string; state: string; pincode: string };
        Update: Partial<Address>;
        Relationships: [
          {
            foreignKeyName: 'addresses_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      orders: {
        Row: Order;
        Insert: Partial<Order> & { buyer_id: string };
        Update: Partial<Order>;
        Relationships: [
          {
            foreignKeyName: 'orders_buyer_id_fkey';
            columns: ['buyer_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      order_items: {
        Row: OrderItem;
        Insert: Partial<OrderItem> & { order_id: string; seller_id: string; product_title: string };
        Update: Partial<OrderItem>;
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_items_seller_id_fkey';
            columns: ['seller_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          }
        ];
      };
      seller_profiles: {
        Row: SellerProfile;
        Insert: Partial<Omit<SellerProfile, 'id'>> & { id: string };
        Update: Partial<SellerProfile>;
        Relationships: [
          {
            foreignKeyName: 'seller_profiles_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      banners: {
        Row: Banner;
        Insert: Partial<Banner>;
        Update: Partial<Banner>;
        Relationships: [];
      };
      rental_bookings: {
        Row: RentalBooking;
        Insert: Partial<RentalBooking> & {
          buyer_id: string;
          seller_id: string;
          product_id: string;
          rental_start_date: string;
          rental_end_date: string;
          rent_per_day: number;
          rental_amount: number;
          total_charged: number;
        };
        Update: Partial<RentalBooking>;
        Relationships: [
          {
            foreignKeyName: 'rental_bookings_buyer_id_fkey';
            columns: ['buyer_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'rental_bookings_seller_id_fkey';
            columns: ['seller_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'rental_bookings_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          }
        ];
      };
      homepage_sections: {
        Row: HomepageSection;
        Insert: Partial<HomepageSection>;
        Update: Partial<HomepageSection>;
        Relationships: [];
      };
      homepage_section_products: {
        Row: HomepageSectionProduct;
        Insert: Partial<HomepageSectionProduct> & { section_id: string; product_id: string };
        Update: Partial<HomepageSectionProduct>;
        Relationships: [
          {
            foreignKeyName: 'homepage_section_products_section_id_fkey';
            columns: ['section_id'];
            isOneToOne: false;
            referencedRelation: 'homepage_sections';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'homepage_section_products_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      seller_public_profiles: {
        Row: {
          id: string;
          store_name: string;
          store_description: string | null;
          city: string | null;
          logo_url: string | null;
          banner_url: string | null;
          is_verified: boolean;
        };
        Relationships: [];
      };
    };
    Functions: {
      increment_product_views: {
        Args: { p_product_id: string };
        Returns: void;
      };
      get_seller_storefront: {
        Args: { p_seller_id: string };
        Returns: SellerStorefront[];
      };
      get_verified_seller_ids: {
        Args: Record<string, never>;
        Returns: { id: string }[];
      };
      get_seller_store_names: {
        Args: { p_seller_ids: string[] };
        Returns: { id: string; store_name: string; is_verified: boolean }[];
      };
      check_rental_availability: {
        Args: {
          p_product_id: string;
          p_start_date: string;
          p_end_date: string;
        };
        Returns: boolean;
      };
      get_product_booked_dates: {
        Args: { p_product_id: string };
        Returns: { rental_start_date: string; rental_end_date: string }[];
      };
      create_paid_rental_booking: {
        Args: { p_payment_attempt_id: string };
        Returns: string;
      };
      create_order: {
        Args: Record<string, never>;
        Returns: string;
      };

      advance_order_item_status: {
        Args: { p_order_item_id: string; p_new_status: string };
        Returns: string;
      };
      advance_rental_fulfillment_status: {
        Args: { p_booking_id: string; p_new_status: string };
        Returns: string;
      };
      cancel_rental_booking: {
        Args: { p_booking_id: string; p_reason?: string };
        Returns: boolean;
      };
    };
  };
};
