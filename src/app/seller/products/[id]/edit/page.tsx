'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCity } from '@/context/CityContext';
import { createClient } from '@/lib/supabase/client';
import type { Category, ListingType, ProductCondition, ProductWithImages } from '@/types/database';
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

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user, profile } = useAuth();
  const { availableCities, selectedCity } = useCity();
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // Form state
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
  const [city, setCity] = useState(selectedCity);

  // Images state
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load product and categories
  useEffect(() => {
    if (!user) return;

    async function loadData() {
      setIsLoading(true);
      try {
        const [{ data: prod, error: prodErr }, { data: cats }] = await Promise.all([
          supabase
            .from('products')
            .select(`
              *,
              product_images (*)
            `)
            .eq('id', id)
            .single(),
          supabase
            .from('categories')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true }),
        ]);

        if (prodErr || !prod) {
          throw new Error('Listing not found');
        }

        // Verify seller ownership
        if (prod.seller_id !== user!.id) {
          throw new Error('You do not have permission to edit this listing');
        }

        const p = prod as unknown as ProductWithImages;
        setTitle(p.title || '');
        setDescription(p.description || '');
        setBrand(p.brand || '');
        setCategoryId(p.category_id || '');
        setListingType(p.listing_type || 'rent');
        setRentPricePerDay(p.rent_price_per_day ? String(p.rent_price_per_day) : '');
        setSecurityDeposit(p.security_deposit ? String(p.security_deposit) : '');
        setMinRentalDays(p.min_rental_days ? String(p.min_rental_days) : '3');
        setMaxRentalDays(p.max_rental_days ? String(p.max_rental_days) : '10');
        setSalePrice(p.sale_price ? String(p.sale_price) : '');
        setDiscountPrice(p.discount_price ? String(p.discount_price) : '');
        setStockQuantity(p.stock_quantity ? String(p.stock_quantity) : '1');
        setSize(p.size || 'M');
        setColor(p.color || '');
        setCondition(p.condition || 'like_new');
        setCity(p.city || selectedCity);

        const imgs = p.product_images
          ? [...p.product_images].sort((a, b) => a.sort_order - b.sort_order).map((img) => img.image_url)
          : [];
        setImageUrls(imgs);

        if (cats) {
          setCategories(cats as Category[]);
        }
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : 'Error loading listing');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [id, user, selectedCity, supabase]);

  // Handle uploading files to Supabase Storage
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const uploaded: string[] = [];
      const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
      const ALLOWED_EXTS = ['jpg', 'jpeg', 'png', 'webp'];
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate MIME type
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
          setErrorMessage(`File "${file.name}" is not a supported format. Please upload JPEG, PNG, or WebP images only (SVGs are not permitted).`);
          setIsUploading(false);
          return;
        }

        // Validate extension
        const ext = (file.name.split('.').pop() || '').toLowerCase();
        if (!ALLOWED_EXTS.includes(ext)) {
          setErrorMessage(`Invalid file extension ".${ext}". Allowed extensions: jpg, jpeg, png, webp.`);
          setIsUploading(false);
          return;
        }

        // Validate size
        if (file.size > MAX_FILE_SIZE) {
          setErrorMessage(`File "${file.name}" exceeds the 5MB size limit.`);
          setIsUploading(false);
          return;
        }

        const fileName = `${user.id}/${Date.now()}_${crypto.randomUUID()}.${ext}`;

        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(fileName, file, { cacheControl: '3600', upsert: true });

        if (error) {
          throw new Error(error.message);
        }

        if (data) {
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
      // 1. Update product row and reset status to 'pending_approval' for re-moderation
      const { error: prodErr } = await supabase
        .from('products')
        .update({
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
          // CRITICAL: Any edit sends the product back for admin approval
          status: 'pending_approval',
          rejection_reason: null,
          search_tags: [brand, color, size, city].filter(Boolean),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('seller_id', user.id);

      if (prodErr) throw prodErr;

      // 2. Re-sync images
      await supabase.from('product_images').delete().eq('product_id', id);

      const imageRecords = imageUrls.map((url, idx) => ({
        product_id: id,
        image_url: url,
        sort_order: idx,
      }));

      await supabase.from('product_images').insert(imageRecords);

      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update outfit');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center animate-pulse">
        <p className="text-neutral-500 text-sm">Loading listing details...</p>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-xs border border-amber-200">
          <Clock className="w-8 h-8" />
        </div>

        <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
          Resubmitted For Verification
        </span>

        <h1 className="font-serif text-3xl font-bold text-neutral-900">
          Listing Updated Successfully!
        </h1>

        <p className="text-neutral-600 text-sm leading-relaxed max-w-lg mx-auto">
          Your changes have been saved. Per BlinkWear quality & authenticity guidelines, modified listings enter <span className="font-semibold text-neutral-900">Pending Review</span> before becoming live for buyers again.
        </p>

        <div className="pt-6 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/seller/products"
            className="px-8 py-3 rounded-full bg-neutral-950 text-white font-bold text-xs hover:bg-neutral-800 transition-colors shadow-md"
          >
            Back to My Listings
          </Link>
          <Link
            href="/seller/dashboard"
            className="px-8 py-3 rounded-full border border-neutral-300 text-neutral-800 font-bold text-xs hover:bg-neutral-50 transition-colors"
          >
            Seller Dashboard
          </Link>
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
        <ArrowLeft className="w-4 h-4" /> Back to Listings
      </Link>

      <div className="pb-6 border-b border-neutral-100">
        <h1 className="font-serif text-3xl font-bold text-neutral-900">Edit Outfit Listing</h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Update prices, rental terms, and photos. Saving changes will submit the item for admin review.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Moderation notice */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
        <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Quality & Re-Moderation Notice</p>
          <p className="text-amber-800 mt-0.5 leading-relaxed">
            Editing any pricing or outfit details will temporarily switch the status to <strong>Pending Review</strong> while BlinkWear admins inspect the update.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Details */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-2xs space-y-6">
          <h3 className="font-semibold text-sm text-neutral-900 uppercase tracking-wider">
            1. Outfit Identity
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Listing Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Sabyasachi Crimson Velvet Bridal Lehenga"
                className="w-full text-sm rounded-xl border border-neutral-300 px-4 py-2.5 focus:border-neutral-900 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Designer / Brand *
                </label>
                <input
                  type="text"
                  required
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Manish Malhotra, Anita Dongre, Raw Mango"
                  className="w-full text-sm rounded-xl border border-neutral-300 px-4 py-2.5 focus:border-neutral-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Category *
                </label>
                <select
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full text-sm rounded-xl border border-neutral-300 px-4 py-2.5 focus:border-neutral-900 focus:outline-hidden bg-white"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Description & Styling Details
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the fabric, embroidery, occasion suitability, fit notes, and accessories included..."
                className="w-full text-sm rounded-xl border border-neutral-300 px-4 py-2.5 focus:border-neutral-900 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Listing Type & Pricing */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-2xs space-y-6">
          <h3 className="font-semibold text-sm text-neutral-900 uppercase tracking-wider">
            2. Listing Model & Pricing
          </h3>

          <div className="grid grid-cols-3 gap-3">
            {(['rent', 'sale', 'both'] as ListingType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setListingType(type)}
                className={`py-3 px-4 rounded-2xl text-xs font-bold border transition-all ${
                  listingType === type
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                {type === 'rent'
                  ? 'Rentals Only'
                  : type === 'sale'
                  ? 'Sell (Pre-Loved)'
                  : 'Rent & Sell Both'}
              </button>
            ))}
          </div>

          {(listingType === 'rent' || listingType === 'both') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-neutral-100">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Rental Price per Day (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={rentPricePerDay}
                  onChange={(e) => setRentPricePerDay(e.target.value)}
                  placeholder="e.g. 1999"
                  className="w-full text-sm rounded-xl border border-neutral-300 px-4 py-2.5 focus:border-neutral-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Refundable Security Deposit (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={securityDeposit}
                  onChange={(e) => setSecurityDeposit(e.target.value)}
                  placeholder="e.g. 3000"
                  className="w-full text-sm rounded-xl border border-neutral-300 px-4 py-2.5 focus:border-neutral-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Min Rental Days
                </label>
                <input
                  type="number"
                  min="1"
                  value={minRentalDays}
                  onChange={(e) => setMinRentalDays(e.target.value)}
                  className="w-full text-sm rounded-xl border border-neutral-300 px-4 py-2.5 focus:border-neutral-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Max Rental Days
                </label>
                <input
                  type="number"
                  min="1"
                  value={maxRentalDays}
                  onChange={(e) => setMaxRentalDays(e.target.value)}
                  className="w-full text-sm rounded-xl border border-neutral-300 px-4 py-2.5 focus:border-neutral-900 focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {(listingType === 'sale' || listingType === 'both') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-neutral-100">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Selling Price (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder="e.g. 15000"
                  className="w-full text-sm rounded-xl border border-neutral-300 px-4 py-2.5 focus:border-neutral-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Discounted / Offer Price (Optional) (₹)
                </label>
                <input
                  type="number"
                  min="1"
                  value={discountPrice}
                  onChange={(e) => setDiscountPrice(e.target.value)}
                  placeholder="e.g. 12999"
                  className="w-full text-sm rounded-xl border border-neutral-300 px-4 py-2.5 focus:border-neutral-900 focus:outline-hidden"
                />
              </div>
            </div>
          )}
        </div>

        {/* Size, Color, Condition & City */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-2xs space-y-6">
          <h3 className="font-semibold text-sm text-neutral-900 uppercase tracking-wider">
            3. Specifications & Location
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Size *
              </label>
              <input
                type="text"
                required
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="e.g. S, M, L, XL or Free Size"
                className="w-full text-sm rounded-xl border border-neutral-300 px-4 py-2.5 focus:border-neutral-900 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Color *
              </label>
              <input
                type="text"
                required
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="e.g. Royal Blue, Emerald Green, Ivory Gold"
                className="w-full text-sm rounded-xl border border-neutral-300 px-4 py-2.5 focus:border-neutral-900 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Garment Condition *
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as ProductCondition)}
                className="w-full text-sm rounded-xl border border-neutral-300 px-4 py-2.5 focus:border-neutral-900 focus:outline-hidden bg-white"
              >
                <option value="new">Brand New (With Tags)</option>
                <option value="like_new">Like New (Worn Once, Pristine)</option>
                <option value="good">Good (Lightly Worn, Well Maintained)</option>
                <option value="fair">Fair</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                City Hub *
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full text-sm rounded-xl border border-neutral-300 px-4 py-2.5 focus:border-neutral-900 focus:outline-hidden bg-white"
              >
                {availableCities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Photos Management */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-2xs space-y-6">
          <h3 className="font-semibold text-sm text-neutral-900 uppercase tracking-wider">
            4. Outfit Photos ({imageUrls.length})
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {imageUrls.map((url, idx) => (
              <div key={idx} className="relative aspect-3/4 rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity"
                  aria-label="Remove photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                {idx === 0 && (
                  <span className="absolute bottom-2 left-2 text-[10px] bg-neutral-950/80 text-white font-bold px-2 py-0.5 rounded-full">
                    Cover
                  </span>
                )}
              </div>
            ))}

            {/* Upload trigger */}
            <label className="aspect-3/4 rounded-2xl border-2 border-dashed border-neutral-300 hover:border-neutral-400 flex flex-col items-center justify-center text-center p-4 cursor-pointer hover:bg-neutral-50 transition-colors">
              <Upload className="w-6 h-6 text-neutral-400 mb-2" />
              <span className="text-xs font-semibold text-neutral-700">
                {isUploading ? 'Uploading...' : 'Upload Photos'}
              </span>
              <span className="text-[10px] text-neutral-400 mt-1">PNG, JPG up to 10MB</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="url"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="Or enter public image URL..."
              className="flex-1 text-xs rounded-xl border border-neutral-300 px-4 py-2.5 focus:border-neutral-900 focus:outline-hidden"
            />
            <button
              type="button"
              onClick={handleAddImageUrl}
              className="py-2.5 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition-colors"
            >
              Add URL
            </button>
          </div>
        </div>

        {/* Submit Action */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <Link
            href="/seller/products"
            className="py-3 px-6 rounded-full border border-neutral-300 text-neutral-700 font-bold text-xs hover:bg-neutral-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || isUploading}
            className="py-3.5 px-8 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Saving & Submitting...' : 'Save Changes & Resubmit for Approval'}
          </button>
        </div>
      </form>
    </div>
  );
}
