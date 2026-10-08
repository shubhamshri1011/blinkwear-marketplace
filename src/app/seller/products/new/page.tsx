'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCity } from '@/context/CityContext';
import { createClient } from '@/lib/supabase/client';
import type { Category, ListingType, ProductCondition } from '@/types/database';
import {
  Upload,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Plus,
  Clock,
} from 'lucide-react';


export default function NewProductListingPage() {
  const router = useRouter();
  const { user, profile, sellerProfile } = useAuth();
  const { availableCities, selectedCity } = useCity();
  const supabase = createClient();

  const [isSuccess, setIsSuccess] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [listingType, setListingType] = useState<ListingType>('rent');
  const [rentPricePerDay, setRentPricePerDay] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [minRentalDays, setMinRentalDays] = useState('3');
  const [maxRentalDays, setMaxRentalDays] = useState('10');
  const [salePrice, setSalePrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('1');
  const [size, setSize] = useState('M');
  const [color, setColor] = useState('Red / Maroon');
  const [condition, setCondition] = useState<ProductCondition>('like_new');
  const [city, setCity] = useState(profile?.city || selectedCity);

  // Images state (URLs or uploaded files)
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (data) {
        setCategories(data as Category[]);
        if (data.length > 0) {
          setCategoryId(data[0].id);
        }
      }
    }

    fetchCategories();
  }, [supabase]);

  // Handle uploading files to Supabase Storage
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const uploaded: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = `${user.id}/${Date.now()}_${i}.${ext}`;

        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(fileName, file, { cacheControl: '3600', upsert: true });

        if (!error && data) {
          const { data: publicData } = supabase.storage
            .from('product-images')
            .getPublicUrl(fileName);

          uploaded.push(publicData.publicUrl);
        }
      }

      if (uploaded.length > 0) {
        setImageUrls((prev) => [...prev, ...uploaded]);
      }
    } catch (err: unknown) {
      console.error('Storage upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddImageUrl = () => {
    if (newImageUrl.trim()) {
      setImageUrls((prev) => [...prev, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    if (imageUrls.length === 0) {
      setErrorMessage('Please provide at least one product photo.');
      setIsSubmitting(false);
      return;
    }

    try {
      // 1. Create product row
      const { data: product, error: prodErr } = await supabase
        .from('products')
        .insert({
          seller_id: user.id,
          category_id: categoryId || null,
          title: title.trim(),
          description: description.trim() || null,
          brand: brand.trim() || 'Designer Atelier',
          size: size.trim(),
          color: color.trim(),
          condition,
          listing_type: listingType,
          rent_price_per_day: rentPricePerDay ? Number(rentPricePerDay) : null,
          security_deposit: securityDeposit ? Number(securityDeposit) : null,
          min_rental_days: Number(minRentalDays) || 3,
          max_rental_days: Number(maxRentalDays) || 10,
          sale_price: salePrice ? Number(salePrice) : null,
          discount_price: discountPrice ? Number(discountPrice) : null,
          stock_quantity: Number(stockQuantity) || 1,
          city,
          status: 'pending_approval',
          featured: false,
          view_count: 1,
          search_tags: [brand, color, size, city].filter(Boolean),
        })
        .select()
        .single();

      if (prodErr || !product) throw prodErr;

      // 2. Insert image rows into product_images
      const imageRecords = imageUrls.map((url, idx) => ({
        product_id: product.id,
        image_url: url,
        sort_order: idx,
      }));

      await supabase.from('product_images').insert(imageRecords);

      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to publish outfit');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
          <Clock className="w-8 h-8" />
        </div>
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
            Status: Pending Admin Moderation
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900 mt-3">
            Outfit Submitted for Verification!
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 max-w-md mx-auto mt-2 leading-relaxed">
            Your listing for <strong className="text-neutral-900">{title}</strong> has been received.
            Per BlinkWear marketplace policy, every seller-listed product must first enter Pending
            Verification, and will go live once verified and approved from the Admin Panel.
          </p>
        </div>

        <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5 text-left text-xs space-y-2 max-w-md mx-auto text-neutral-700">
          <p className="font-semibold text-neutral-900">What happens next?</p>
          <ul className="list-disc list-inside space-y-1 text-neutral-600">
            <li>BlinkWear Admins review photos, pricing, and description for catalog standards.</li>
            <li>Once approved, the status turns to <strong className="text-emerald-700">Active</strong> and appears in search and category feeds.</li>
            <li>You can track the moderation status at any time in your listings dashboard.</li>
          </ul>
        </div>

        <div className="pt-2 flex justify-center gap-3">
          <Link
            href="/seller/products"
            className="px-6 py-2.5 rounded-full bg-neutral-950 text-white font-bold text-xs shadow-md"
          >
            View My Listings →
          </Link>
          <button
            onClick={() => {
              setIsSuccess(false);
              setTitle('');
              setDescription('');
              setImageUrls([]);
            }}
            className="px-6 py-2.5 rounded-full border border-neutral-300 text-neutral-700 font-bold text-xs hover:bg-neutral-50 transition-colors"
          >
            List Another Outfit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <Link
        href="/seller/products"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to My Listings
      </Link>

      <div className="pb-6 border-b border-neutral-100">
        <h1 className="font-serif text-3xl font-bold text-neutral-900">List a Designer Outfit</h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Set your rental daily rate, security deposit, and specify garment details for buyers
        </p>
      </div>

      {/* Moderation Policy Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900">
        <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Mandatory Admin Moderation:</span> Every seller-listed product
          first enters <strong>Pending Verification</strong> upon submission. Only after Admin verifies
          and approves the listing from the Admin Panel does the product become active and live for buyers.
        </div>
      </div>

      {(!sellerProfile?.is_verified || sellerProfile?.verification_status === 'pending') && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Seller KYC Account Pending:</span> Your seller account is
            currently pending KYC approval. You can prepare and submit this listing now, but the garment
            will only go live after both your seller profile and the product are approved by an admin.
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Details */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-2xs space-y-4">
          <h3 className="font-semibold text-sm text-neutral-900">1. General Information</h3>

          <div>
            <label className="text-xs font-bold text-neutral-700 block mb-1">
              Outfit Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sabyasachi Crimson Velvet Bridal Lehenga"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-hidden focus:border-neutral-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Designer / Brand *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Manish Malhotra, Anita Dongre"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-hidden focus:border-neutral-900"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                aria-label="Select category"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-hidden focus:border-neutral-900"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-neutral-700 block mb-1">
              Description & Craftsmanship Details
            </label>
            <textarea
              rows={3}
              placeholder="Describe embroidery, fabric (e.g. pure raw silk with zardozi and sequins work), dupatta details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-hidden focus:border-neutral-900"
            />
          </div>
        </div>

        {/* Pricing & Listing Type */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-2xs space-y-4">
          <h3 className="font-semibold text-sm text-neutral-900">2. Pricing & Availability Mode</h3>

          <div className="grid grid-cols-3 gap-2 p-1 bg-neutral-100 rounded-xl">
            {(['rent', 'sale', 'both'] as ListingType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setListingType(t)}
                className={`py-2 text-xs font-bold rounded-lg capitalize transition-all ${
                  listingType === t ? 'bg-white text-neutral-950 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                {t === 'both' ? 'Rent & Buy' : `For ${t}`}
              </button>
            ))}
          </div>

          {/* Rental Pricing fields */}
          {(listingType === 'rent' || listingType === 'both') && (
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-4">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                Rental Rates
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-neutral-700 block mb-1">
                    Rent Price Per Day (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="1499"
                    value={rentPricePerDay}
                    onChange={(e) => setRentPricePerDay(e.target.value)}
                    className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-neutral-700 block mb-1">
                    Refundable Security Deposit (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="3000 (Defaults to 20% if left empty)"
                    value={securityDeposit}
                    onChange={(e) => setSecurityDeposit(e.target.value)}
                    className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-neutral-700 block mb-1">
                    Min Rental Days
                  </label>
                  <input
                    type="number"
                    value={minRentalDays}
                    onChange={(e) => setMinRentalDays(e.target.value)}
                    className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-neutral-700 block mb-1">
                    Max Rental Days
                  </label>
                  <input
                    type="number"
                    value={maxRentalDays}
                    onChange={(e) => setMaxRentalDays(e.target.value)}
                    className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Sale Pricing fields */}
          {(listingType === 'sale' || listingType === 'both') && (
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-4">
              <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider block">
                Purchase Price
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-neutral-700 block mb-1">
                    MRP / Original Price (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="45000"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-neutral-700 block mb-1">
                    Discounted Selling Price (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="18000"
                    value={discountPrice}
                    onChange={(e) => setDiscountPrice(e.target.value)}
                    className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Specifications */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-2xs space-y-4">
          <h3 className="font-semibold text-sm text-neutral-900">3. Garment Specifications</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">Size *</label>
              <input
                type="text"
                required
                placeholder="e.g. S, M, L or 38, 40"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">Color *</label>
              <input
                type="text"
                required
                placeholder="e.g. Ruby Red, Emerald Green"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">Condition *</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as ProductCondition)}
                aria-label="Select condition"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 text-xs"
              >
                <option value="new">Brand New with Tags</option>
                <option value="like_new">Like New (Worn Once)</option>
                <option value="good">Good Condition</option>
                <option value="fair">Fair</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-neutral-700 block mb-1">City Hub *</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              aria-label="Select city"
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 text-xs"
            >
              {availableCities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Photos */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-2xs space-y-4">
          <h3 className="font-semibold text-sm text-neutral-900">4. Outfit Photos</h3>
          <p className="text-xs text-neutral-500">
            Upload high-resolution front, back, and close-up detail photos of embroidery/fabric.
          </p>

          {/* Upload input */}
          <div className="flex flex-wrap items-center gap-3">
            <label className="py-2.5 px-5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs cursor-pointer inline-flex items-center gap-2 transition-colors">
              <Upload className="w-4 h-4 text-emerald-600" />
              {isUploading ? 'Uploading to Bucket...' : 'Upload Photos'}
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>

            {/* URL input */}
            <div className="flex items-center gap-2 w-full sm:flex-1 sm:min-w-[200px]">
              <input
                type="url"
                placeholder="Or paste image URL..."
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                className="flex-1 bg-neutral-50 border border-neutral-200 rounded-full px-3.5 py-2 text-xs min-w-0"
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="py-2 px-4 rounded-full bg-neutral-950 text-white font-bold text-xs shrink-0"
              >
                Add URL
              </button>
            </div>
          </div>

          {/* Image Previews */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {imageUrls.map((url, idx) => (
              <div key={idx} className="relative aspect-3/4 rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200 group">
                <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-neutral-950/80 text-white hover:bg-rose-600 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || isUploading}
          className="w-full py-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl transition-all disabled:opacity-50"
        >
          {isSubmitting ? 'Publishing Outfit...' : 'Publish Outfit to BlinkWear'}
        </button>
      </form>
    </div>
  );
}
