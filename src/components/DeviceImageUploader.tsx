import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  X,
  Star,
  Check,
  Loader2,
  Plus,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Link,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { processMultipleImageFiles } from '../utils/imageUpload';

interface DeviceImageUploaderProps {
  images: string[];
  onChange: (newImages: string[]) => void;
  maxImages?: number;
}

export const DeviceImageUploader: React.FC<DeviceImageUploaderProps> = ({
  images = [],
  onChange,
  maxImages = 12,
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

  const handleMoveImage = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    const updated = [...images];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    onChange(updated);
  };

  const handleAddUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    const raw = urlInput.trim();
    if (!raw) return;

    // Support single or multiple URLs separated by newlines, commas, or spaces
    const extractedUrls = raw
      .split(/[\n,\s]+/)
      .map((u) => u.trim())
      .filter((u) => u.startsWith('http://') || u.startsWith('https://') || u.startsWith('/'));

    if (extractedUrls.length === 0) {
      setErrorMessage('Please enter a valid image URL starting with http://, https://, or /');
      return;
    }

    const combined = [...images, ...extractedUrls].slice(0, maxImages);
    onChange(combined);
    setUrlInput('');
    setShowUrlInput(false);
  };

  return (
    <div className="space-y-4 bg-[#FAF8F4]/50 p-4 border border-[#E9DFD0] rounded-md">
      {/* Top Header & Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E9DFD0]">
        <div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#292522] flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-[#9A8568]" />
              <span>Product Image Gallery</span>
            </label>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#E9DFD0] text-[#292522]">
              {images.length} of {maxImages} Photos
            </span>
          </div>
          <p className="text-[11px] text-[#766F68] mt-0.5">
            Add multiple photos (front, back, fabric zoom, model styling). First image is the primary cover.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="text-[11px] text-[#9A8568] hover:text-[#292522] font-semibold flex items-center gap-1 cursor-pointer bg-white px-2.5 py-1 rounded-xs border border-[#E9DFD0]"
          >
            <Link className="w-3 h-3" />
            <span>{showUrlInput ? 'Hide URL Input' : '+ Paste Image URL(s)'}</span>
          </button>
        </div>
      </div>

      {/* URL Input Box (Supports Single or Bulk URLs) */}
      {showUrlInput && (
        <div className="p-3 bg-white border border-[#E9DFD0] rounded-xs space-y-2 animate-in fade-in duration-150">
          <label className="block text-[11px] font-semibold text-[#292522]">
            Paste Image URL(s) - You can paste multiple links separated by commas or new lines:
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <textarea
              rows={2}
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                setErrorMessage('');
              }}
              placeholder="https://images.unsplash.com/... or /hero-banner.jpg"
              className="flex-1 px-3 py-2 text-xs bg-white border border-[#E9DFD0] rounded-xs font-mono focus:outline-hidden focus:border-[#9A8568]"
            />
            <button
              type="button"
              onClick={() => handleAddUrl()}
              className="px-4 py-2 bg-[#292522] hover:bg-[#9A8568] text-white text-xs font-semibold uppercase tracking-wider rounded-xs cursor-pointer self-start sm:self-auto shrink-0"
            >
              Add Photo(s)
            </button>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Upload Zone (Supports Selecting Multiple Files at once) */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-[#9A8568] bg-[#FAF8F4] scale-[1.01]'
            : 'border-[#E9DFD0] bg-white hover:bg-[#FAF8F4] hover:border-[#9A8568]'
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
              Optimizing and processing images from your device...
            </p>
            <p className="text-[10px] text-[#766F68]">Preparing high-efficiency boutique web resolution</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#FAF8F4] border border-[#E9DFD0] flex items-center justify-center text-[#9A8568]">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#292522]">
                <span className="text-[#9A8568] underline font-bold">
                  Click to select 1 or more photos
                </span>{' '}
                from phone/computer, or drag & drop here
              </p>
              <p className="text-[11px] text-[#766F68] mt-0.5">
                Supports JPG, PNG, WEBP. You can select multiple files at the same time.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] uppercase tracking-wider text-[#9A8568] font-bold bg-[#FAF8F4] px-2.5 py-0.5 rounded-full border border-[#E9DFD0]">
                Up to {maxImages} Photos per garment
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Image Gallery Manager Grid */}
      {images.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs text-[#766F68]">
            <span className="font-semibold text-[#292522]">
              Manage Uploaded Photos ({images.length}):
            </span>
            <span className="text-[11px]">Use arrows to reorder • First photo is main cover</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {images.map((img, index) => {
              const isPrimary = index === 0;
              return (
                <div
                  key={index}
                  className={`group relative aspect-3/4 rounded-xs overflow-hidden border bg-zinc-100 flex flex-col justify-between ${
                    isPrimary ? 'border-2 border-[#9A8568] ring-2 ring-[#9A8568]/20 shadow-xs' : 'border-[#E9DFD0]'
                  }`}
                >
                  <img
                    src={img}
                    alt={`Garment photo ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/hero-banner.jpg';
                    }}
                  />

                  {/* Position Badge */}
                  <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
                    <span className="bg-[#292522]/85 text-white font-mono text-[9px] px-1.5 py-0.5 rounded-xs backdrop-blur-xs font-bold">
                      #{index + 1}
                    </span>
                    {isPrimary && (
                      <span className="bg-[#9A8568] text-white text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-xs shadow-xs flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-white text-white" />
                        <span>Cover</span>
                      </span>
                    )}
                  </div>

                  {/* Top Right Remove Button (always visible on hover or mobile tap) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage(index);
                    }}
                    className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-rose-600 text-white rounded-xs transition-colors cursor-pointer"
                    title="Remove image"
                    aria-label={`Remove photo ${index + 1}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  {/* Bottom Controls Bar */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-1.5 flex items-center justify-between text-white opacity-90 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-1">
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveImage(index, 'left');
                          }}
                          className="p-1 bg-white/20 hover:bg-white text-white hover:text-[#292522] rounded-xs transition-colors cursor-pointer"
                          title="Move left (earlier in gallery)"
                        >
                          <ArrowLeft className="w-2.5 h-2.5" />
                        </button>
                      )}

                      {index < images.length - 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveImage(index, 'right');
                          }}
                          className="p-1 bg-white/20 hover:bg-white text-white hover:text-[#292522] rounded-xs transition-colors cursor-pointer"
                          title="Move right (later in gallery)"
                        >
                          <ArrowRight className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>

                    {!isPrimary && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetPrimary(index);
                        }}
                        className="px-1.5 py-0.5 bg-white/20 hover:bg-[#9A8568] text-white text-[8px] font-bold uppercase tracking-wider rounded-xs transition-colors cursor-pointer"
                        title="Make this photo the primary cover thumbnail"
                      >
                        Set Cover
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* "+ Add Another Photo" Slot Card if under max */}
            {images.length < maxImages && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-3/4 border-2 border-dashed border-[#E9DFD0] hover:border-[#9A8568] hover:bg-white rounded-xs flex flex-col items-center justify-center text-[#766F68] hover:text-[#9A8568] transition-all cursor-pointer p-2 text-center group"
              >
                <div className="w-8 h-8 rounded-full bg-[#FAF8F4] group-hover:bg-[#E9DFD0] flex items-center justify-center text-[#9A8568] mb-1.5 transition-colors">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-[#292522] block">
                  Add Another Photo
                </span>
                <span className="text-[9px] text-[#766F68] mt-0.5">
                  ({maxImages - images.length} remaining)
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
