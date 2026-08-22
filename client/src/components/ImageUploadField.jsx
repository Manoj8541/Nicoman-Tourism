import React, { useState, useRef, useEffect } from 'react';
import { FaCloudUploadAlt, FaCheckCircle, FaExclamationCircle, FaImage } from 'react-icons/fa';
import { compressAndConvertToWebp, formatBytes, validateImageFileType } from '../lib/imageCompressor';
import toast from 'react-hot-toast';

export default function ImageUploadField({
  label = 'Image',
  value = '',
  pendingImage = null,
  onChange,
  onPendingChange,
  required = false,
  maxDimension = 1600,
  maxSizeBytes = 512000,
}) {
  const [compressing, setCompressing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Clean up object URLs when unmounted
  useEffect(() => {
    return () => {
      if (pendingImage?.previewUrl) {
        URL.revokeObjectURL(pendingImage.previewUrl);
      }
    };
  }, [pendingImage]);

  const handleFileProcess = async (file) => {
    if (!file) return;
    setErrorMsg('');

    // Validate MIME type
    const validation = validateImageFileType(file);
    if (!validation.valid) {
      setErrorMsg(validation.error);
      toast.error(validation.error);
      return;
    }

    setCompressing(true);

    try {
      // Compress in browser memory — ZERO storage upload yet
      const { blob, width, height, sizeBytes } = await compressAndConvertToWebp(file, {
        maxDimension,
        maxSizeBytes,
      });

      // Revoke previous object URL if any
      if (pendingImage?.previewUrl) {
        URL.revokeObjectURL(pendingImage.previewUrl);
      }

      const previewUrl = URL.createObjectURL(blob);
      const pendingObj = {
        blob,
        previewUrl,
        sizeFormatted: formatBytes(sizeBytes),
        dimensions: `${width}×${height}`,
        file,
      };

      onPendingChange?.(pendingObj);
      toast.success(`Image optimized (${formatBytes(sizeBytes)} WebP) — ready to save!`);
    } catch (err) {
      console.error('[ImageUploadField] Compression error:', err);
      const msg = err.message || 'Failed to process image';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setCompressing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileProcess(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileProcess(file);
  };

  const handleRemove = () => {
    if (pendingImage?.previewUrl) {
      URL.revokeObjectURL(pendingImage.previewUrl);
    }
    onPendingChange?.(null);
    onChange?.('');
    setErrorMsg('');
  };

  // Determine what image to display (pending in-memory preview takes precedence over saved value)
  const displaySrc = pendingImage?.previewUrl || value;
  const isPending = !!pendingImage?.blob;

  return (
    <div className="space-y-2">
      {/* Label */}
      <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Current Image Preview Mode */}
      {displaySrc && !compressing ? (
        <div className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/80 rounded-2xl border border-gray-200 dark:border-gray-700">
          <div className="relative group w-20 h-20 rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0 border border-gray-200 dark:border-gray-600 shadow-sm">
            <img
              src={displaySrc}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <FaImage className="text-white text-lg" />
            </div>
          </div>

          <div className="flex-1 min-w-0 text-center sm:text-left space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
              {isPending ? (
                <>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                    <FaCheckCircle size={10} /> Pending Save
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300">
                    {pendingImage.sizeFormatted} · WebP
                  </span>
                </>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
                  <FaCheckCircle size={10} /> Active Photo
                </span>
              )}
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-2 pt-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 hover:underline cursor-pointer"
              >
                Replace Image
              </button>
              <span className="text-gray-300 dark:text-gray-600">·</span>
              <button
                type="button"
                onClick={handleRemove}
                className="text-xs font-bold text-red-500 hover:text-red-600 hover:underline cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : compressing ? (
        /* In-Memory Compression State */
        <div className="p-6 rounded-2xl border-2 border-dashed border-teal-500/50 bg-teal-50/50 dark:bg-teal-950/20 text-center space-y-3">
          <div className="w-9 h-9 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <div>
            <p className="text-sm font-bold text-teal-700 dark:text-teal-300">Optimizing image in browser...</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Converting to WebP &le; 500KB</p>
          </div>
        </div>
      ) : (
        /* Dropzone Upload Prompt */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`group p-6 rounded-2xl border-2 border-dashed transition-all duration-200 text-center cursor-pointer ${
            isDragOver
              ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/30 scale-[0.99]'
              : 'border-gray-300 dark:border-gray-700 hover:border-teal-500/60 bg-gray-50/50 dark:bg-gray-800/40 hover:bg-teal-50/20 dark:hover:bg-teal-950/10'
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto mb-2.5 group-hover:scale-110 transition-transform">
            <FaCloudUploadAlt size={22} />
          </div>
          <p className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200">
            Click to upload or drag &amp; drop
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            JPG, PNG, or WebP · Auto-converted to WebP (&le; 500KB, max 1600px)
          </p>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 mt-1 px-1">
          <FaExclamationCircle className="flex-shrink-0" size={12} />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
