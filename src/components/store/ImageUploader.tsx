'use client';

import React, { useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { Upload, X, AlertCircle, CheckCircle, ImageIcon, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type UploadVariant = 'logo' | 'banner';

interface ImageUploaderProps {
  variant: UploadVariant;
  sellerId: string;
  currentUrl: string | null;
  onUploadComplete: (url: string) => void;
  onRemove: () => void;
}

const CONSTRAINTS = {
  logo: {
    label: 'Logo',
    hint: 'Square · 512×512 · PNG, JPG, or WEBP · max 5 MB',
    aspectLabel: '1:1',
    outputWidth: 512,
    outputHeight: 512,
    minWidth: 100,
    minHeight: 100,
    maxFileMB: 5,
    previewClass: 'aspect-square w-32',
    previewFit: 'object-cover' as const,
  },
  banner: {
    label: 'Banner',
    hint: 'Wide · 1600×600 · PNG, JPG, or WEBP · max 5 MB · min width 1200px',
    aspectLabel: '8:3',
    outputWidth: 1600,
    outputHeight: 600,
    minWidth: 1200,
    minHeight: 200,
    maxFileMB: 5,
    previewClass: 'aspect-[8/3] w-full',
    previewFit: 'object-cover' as const,
  },
} as const;

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

/** Resize & convert an image File to a webp Blob using an off-screen canvas */
async function resizeToWebp(
  file: File,
  targetWidth: number,
  targetHeight: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context unavailable'));
        return;
      }
      // Fill white background (for PNG with transparency)
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
      // Draw image centered / cover crop
      const srcAspect = img.naturalWidth / img.naturalHeight;
      const dstAspect = targetWidth / targetHeight;
      let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
      if (srcAspect > dstAspect) {
        sw = img.naturalHeight * dstAspect;
        sx = (img.naturalWidth - sw) / 2;
      } else {
        sh = img.naturalWidth / dstAspect;
        sy = (img.naturalHeight - sh) / 2;
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob failed'));
      }, 'image/webp', 0.88);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };
    img.src = objectUrl;
  });
}

/** Validate file before processing */
function validateFile(
  file: File,
  cfg: typeof CONSTRAINTS[UploadVariant]
): Promise<string | null> {
  return new Promise((resolve) => {
    if (!ALLOWED_MIME.includes(file.type)) {
      resolve('Only JPG, PNG, and WEBP files are allowed.');
      return;
    }
    const maxBytes = cfg.maxFileMB * 1024 * 1024;
    if (file.size > maxBytes) {
      resolve(`File exceeds ${cfg.maxFileMB} MB limit.`);
      return;
    }
    const img = document.createElement('img');
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      if (img.naturalWidth < cfg.minWidth || img.naturalHeight < cfg.minHeight) {
        resolve(`Image is too small. Minimum ${cfg.minWidth}×${cfg.minHeight}px.`);
      } else {
        resolve(null);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve('Could not read image dimensions. Please try another file.');
    };
    img.src = objectUrl;
  });
}

export function ImageUploader({
  variant,
  sellerId,
  currentUrl,
  onUploadComplete,
  onRemove,
}: ImageUploaderProps) {
  const cfg = CONSTRAINTS[variant];
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'validating' | 'compressing' | 'uploading' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const processAndUpload = useCallback(async (file: File) => {
    setErrorMsg(null);
    setPhase('validating');
    setProgress(5);

    const validErr = await validateFile(file, cfg);
    if (validErr) {
      setErrorMsg(validErr);
      setPhase('error');
      setProgress(0);
      return;
    }

    setPhase('compressing');
    setProgress(20);

    let blob: Blob;
    try {
      blob = await resizeToWebp(file, cfg.outputWidth, cfg.outputHeight);
    } catch {
      setErrorMsg('Failed to process image. Please try a different file.');
      setPhase('error');
      setProgress(0);
      return;
    }

    setPhase('uploading');
    setProgress(40);

    const timestamp = Date.now();
    const storagePath = `${sellerId}/${variant}-${timestamp}.webp`;

    // Delete previous file in same folder for this variant (best-effort)
    if (currentUrl && currentUrl.includes('/store-assets/')) {
      try {
        const parts = currentUrl.split('/store-assets/');
        if (parts[1]) {
          await supabase.storage.from('store-assets').remove([decodeURIComponent(parts[1].split('?')[0])]);
        }
      } catch {
        // Non-fatal; old file stays orphaned — acceptable
      }
    }

    setProgress(55);

    const { data, error } = await supabase.storage
      .from('store-assets')
      .upload(storagePath, blob, {
        contentType: 'image/webp',
        upsert: false,
        cacheControl: '2592000', // 30 days
      });

    if (error || !data) {
      setErrorMsg(error?.message || 'Upload failed. Please try again.');
      setPhase('error');
      setProgress(0);
      return;
    }

    setProgress(90);

    const { data: publicData } = supabase.storage.from('store-assets').getPublicUrl(data.path);
    const publicUrl = publicData.publicUrl;

    if (!publicUrl) {
      setErrorMsg('Uploaded but could not retrieve public URL. Please refresh.');
      setPhase('error');
      setProgress(0);
      return;
    }

    setProgress(100);
    setPhase('done');
    onUploadComplete(publicUrl);

    // Reset UI back to idle after a moment
    setTimeout(() => {
      setPhase('idle');
      setProgress(0);
    }, 1800);
  }, [variant, sellerId, currentUrl, cfg, supabase, onUploadComplete]);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    processAndUpload(files[0]);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processAndUpload]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const isLoading = phase === 'validating' || phase === 'compressing' || phase === 'uploading';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
          {cfg.label} Image
        </span>
        {currentUrl && (
          <button
            type="button"
            onClick={async (e) => {
              e.stopPropagation();
              if (currentUrl && currentUrl.includes('/store-assets/')) {
                try {
                  const parts = currentUrl.split('/store-assets/');
                  if (parts[1]) {
                    await supabase.storage.from('store-assets').remove([decodeURIComponent(parts[1].split('?')[0])]);
                  }
                } catch {
                  // non-fatal
                }
              }
              onRemove();
            }}
            disabled={isLoading}
            className="text-[11px] font-semibold text-rose-500 hover:text-rose-700 flex items-center gap-1 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <X className="w-3 h-3" /> Remove
          </button>
        )}
      </div>

      {/* Preview Area / Drop Zone */}
      <div
        className={`relative rounded-2xl border-2 border-dashed overflow-hidden transition-all cursor-pointer
          ${cfg.previewClass}
          ${isDragging ? 'border-emerald-500 bg-emerald-50' : currentUrl ? 'border-neutral-200 bg-neutral-50' : 'border-neutral-300 bg-neutral-50 hover:border-neutral-400 hover:bg-neutral-100'}
          ${isLoading ? 'pointer-events-none' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isLoading && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && !isLoading && inputRef.current?.click()}
        aria-label={`Upload ${cfg.label} image`}
      >
        {currentUrl ? (
          currentUrl.startsWith('data:') || currentUrl.startsWith('blob:') ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={currentUrl}
              alt={`${cfg.label} preview`}
              className={`w-full h-full ${cfg.previewFit} transition-opacity ${isLoading ? 'opacity-40' : 'opacity-100'}`}
            />
          ) : (
            <Image
              src={currentUrl}
              alt={`${cfg.label} preview`}
              fill
              className={`${cfg.previewFit} transition-opacity ${isLoading ? 'opacity-40' : 'opacity-100'}`}
              sizes={variant === 'banner' ? '100vw' : '200px'}
            />
          )
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-neutral-400 p-4">
            <ImageIcon className="w-8 h-8 stroke-[1.5]" />
            <span className="text-xs font-medium text-center">
              {isDragging ? 'Drop to upload' : `Click or drag & drop`}
            </span>
          </div>
        )}

        {/* Overlay during loading */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            <span className="text-xs font-semibold text-neutral-700 capitalize">{phase}…</span>
          </div>
        )}
        {phase === 'done' && (
          <div className="absolute inset-0 bg-emerald-900/60 backdrop-blur-sm flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-emerald-300" />
          </div>
        )}
      </div>

      {/* Progress bar */}
      {isLoading && (
        <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Error message */}
      {phase === 'error' && errorMsg && (
        <p className="text-[11px] text-rose-600 flex items-center gap-1 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {errorMsg}
        </p>
      )}

      {/* Hint */}
      {phase === 'idle' && (
        <p className="text-[11px] text-neutral-400">{cfg.hint}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => handleFileSelect(e.target.files)}
        aria-label={`Upload ${cfg.label}`}
        tabIndex={-1}
      />
    </div>
  );
}
