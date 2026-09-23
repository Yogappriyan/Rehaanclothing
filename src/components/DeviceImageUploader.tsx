import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, X, Star, Check, Loader2, Plus, AlertCircle } from 'lucide-react';
import { processMultipleImageFiles } from '../utils/imageUpload';

interface DeviceImageUploaderProps {
  images: string[];
  onChange: (newImages: string[]) => void;
  maxImages?: number;
}

export const DeviceImageUploader: React.FC<DeviceImageUploaderProps> = ({
  images = [],
  onChange,
  maxImages = 6,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setErrorMessage('');
    setIsProcessing(true);

    try {
      const results = await processMultipleImageFiles(files);
      if (results.length === 0) {
        setErrorMessage('No valid image files detected. Please choose JPG, PNG, or WEBP files.');
        return;
      }

      const newUrls = results.map((r) => r.dataUrl);
      const combined = [...images, ...newUrls].slice(0, maxImages);
      onChange(combined);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error reading image files from your device.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const updated = images.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  const handleSetPrimary = (indexToPrimary: number) => {
    if (indexToPrimary === 0) return;
    const selected = images[indexToPrimary];
    const filtered = images.filter((_, idx) => idx !== indexToPrimary);
    onChange([selected, ...filtered]);
  };

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = urlInput.trim();
    if (!clean) return;
    onChange([...images, clean].slice(0, maxImages));
    setUrlInput('');
    setShowUrlInput(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#292522]">
          Product Images ({images.length}/{maxImages})
        </label>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[11px] text-[#9A8568] hover:text-[#292522] underline cursor-pointer font-medium"
        >
          {showUrlInput ? 'Hide URL input' : 'Or paste image URL'}
        </button>
      </div>

      {showUrlInput && (
        <div className="flex gap-2 p-2 bg-[#FAF8F4] border border-[#E9DFD0] rounded-xs">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://images.unsplash.com/... or /hero-banner.jpg"
            className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#E9DFD0] rounded-xs focus:outline-hidden focus:border-[#9A8568]"
          />
          <button
            type="button"
            onClick={handleAddUrl}
            className="px-3 py-1.5 bg-[#292522] hover:bg-[#9A8568] text-white text-xs font-semibold rounded-xs cursor-pointer"
          >
            Add URL
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-[#9A8568] bg-[#FAF8F4] scale-[1.01]'
            : 'border-[#E9DFD0] bg-[#FAF8F4]/40 hover:bg-[#FAF8F4] hover:border-[#9A8568]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
          }}
        />

        {isProcessing ? (
          <div className="flex flex-col items-center justify-center py-2 space-y-2">
            <Loader2 className="w-8 h-8 text-[#9A8568] animate-spin" />
            <p className="text-xs font-semibold text-[#292522]">
              Optimizing image from your device...
            </p>
            <p className="text-[10px] text-[#766F68]">Preparing high-efficiency web resolution</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#E9DFD0]/40 flex items-center justify-center text-[#9A8568]">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#292522]">
                <span className="text-[#9A8568] underline">Click to upload from device</span> or drag and drop
              </p>
              <p className="text-[11px] text-[#766F68] mt-0.5">
                PNG, JPG, WEBP from your computer or phone (auto-optimized for web)
              </p>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-[#9A8568] font-bold bg-[#FAF8F4] px-2.5 py-1 rounded-full border border-[#E9DFD0]">
              Supports Multiple Photos
            </span>
          </div>
        )}
      </div>

      {/* Image Gallery Preview Grid */}
      {images.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] text-[#766F68] font-medium block">
            Current Product Images (first image is primary cover thumbnail):
          </span>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
            {images.map((img, index) => {
              const isPrimary = index === 0;
              return (
                <div
                  key={index}
                  className={`group relative aspect-3/4 rounded-xs overflow-hidden border bg-zinc-100 ${
                    isPrimary ? 'border-2 border-[#9A8568] shadow-xs' : 'border-[#E9DFD0]'
                  }`}
                >
                  <img
                    src={img}
                    alt={`Product view ${index + 1}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Primary Badge */}
                  {isPrimary && (
                    <span className="absolute top-1 left-1 bg-[#292522] text-[#FAF8F4] text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-xs shadow-xs flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      <span>Primary</span>
                    </span>
                  )}

                  {/* Controls Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage(index);
                        }}
                        className="p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xs transition-colors cursor-pointer"
                        title="Remove image"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>

                    {!isPrimary && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetPrimary(index);
                        }}
                        className="w-full py-1 bg-[#FAF8F4] hover:bg-white text-[#292522] text-[9px] font-bold uppercase tracking-wider rounded-xs transition-colors cursor-pointer"
                      >
                        Set as Cover
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Quick Add Slot if under max */}
            {images.length < maxImages && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-3/4 border border-dashed border-[#E9DFD0] hover:border-[#9A8568] hover:bg-[#FAF8F4] rounded-xs flex flex-col items-center justify-center text-[#766F68] hover:text-[#9A8568] transition-colors cursor-pointer"
              >
                <Plus className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-semibold">Add Photo</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
