import React, { useRef } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  Star,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
} from 'lucide-react';

export interface SelectedPhoto {
  id: string;
  file: File;
  previewUrl: string;
  isCover: boolean;
  uploadStatus: 'idle' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
  mediaId?: number;
}

export interface TourMediaPickerProps {
  photos: SelectedPhoto[];
  onChange: (photos: SelectedPhoto[]) => void;
  disabled?: boolean;
}

export const TourMediaPicker: React.FC<TourMediaPickerProps> = ({
  photos,
  onChange,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newPhotos: SelectedPhoto[] = [];
    const hasExistingCover = photos.some((p) => p.isCover);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      const previewUrl = URL.createObjectURL(file);
      const isFirstItem = photos.length === 0 && i === 0 && !hasExistingCover;

      newPhotos.push({
        id: `${file.name}-${file.size}-${Date.now()}-${i}`,
        file,
        previewUrl,
        isCover: isFirstItem,
        uploadStatus: 'idle',
      });
    }

    if (newPhotos.length > 0) {
      onChange([...photos, ...newPhotos]);
    }

    // Reset input
    e.target.value = '';
  };

  const handleSetCover = (id: string) => {
    if (disabled) return;
    const updated = photos.map((p) => ({
      ...p,
      isCover: p.id === id,
    }));
    onChange(updated);
  };

  const handleRemove = (id: string) => {
    if (disabled) return;
    const photoToRemove = photos.find((p) => p.id === id);
    if (photoToRemove) {
      URL.revokeObjectURL(photoToRemove.previewUrl);
    }
    const filtered = photos.filter((p) => p.id !== id);

    // If removed photo was cover and others exist, make the first one cover
    if (photoToRemove?.isCover && filtered.length > 0) {
      filtered[0].isCover = true;
    }
    onChange(filtered);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Upload Drop Area */}
      <div
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
          disabled
            ? 'opacity-60 cursor-not-allowed bg-stone-50 border-stone-200'
            : 'border-stone-300 hover:border-[#1F4E43] hover:bg-[#1F4E43]/5 bg-white'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          disabled={disabled}
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="w-12 h-12 rounded-2xl bg-[#1F4E43]/10 text-[#1F4E43] flex items-center justify-center mx-auto mb-3">
          <UploadCloud className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <p className="text-base font-semibold text-stone-800">
            Chọn ảnh từ máy tính hoặc kéo thả vào đây
          </p>
          <p className="text-sm text-stone-500">
            Hỗ trợ JPG, PNG, WebP. Ảnh sẽ được tự động lưu trữ và tối ưu hóa qua hệ thống lưu trữ.
          </p>
        </div>

        <button
          type="button"
          disabled={disabled}
          className="mt-3.5 px-4 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Duyệt ảnh trên thiết bị</span>
        </button>
      </div>

      {/* Selected Photos Grid */}
      {photos.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-stone-600 font-medium">
            <span>Đã chọn {photos.length} hình ảnh (bấm ngôi sao để chọn ảnh bìa)</span>
            <span className="text-stone-400">
              {photos.filter((p) => p.uploadStatus === 'success').length}/{photos.length} đã tải lên
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
            {photos.map((item) => (
              <div
                key={item.id}
                className={`relative rounded-xl overflow-hidden border transition-all group bg-white ${
                  item.isCover
                    ? 'border-[#C2410C] ring-2 ring-[#C2410C]/20 shadow-xs'
                    : 'border-stone-200'
                }`}
              >
                {/* Image Preview Thumbnail */}
                <div className="aspect-4/3 bg-stone-900 relative overflow-hidden flex items-center justify-center">
                  <img
                    src={item.previewUrl}
                    alt={item.file.name}
                    className="w-full h-full object-cover"
                  />

                  {/* Cover Badge / Cover Selector */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetCover(item.id);
                    }}
                    title={item.isCover ? 'Ảnh bìa chính của tour' : 'Đặt làm ảnh bìa'}
                    className={`absolute top-2 left-2 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs ${
                      item.isCover
                        ? 'bg-[#C2410C] text-white'
                        : 'bg-black/60 text-stone-200 hover:bg-black/80 hover:text-white'
                    }`}
                  >
                    <Star
                      className={`w-3 h-3 ${item.isCover ? 'fill-current text-white' : ''}`}
                    />
                    <span>{item.isCover ? 'Ảnh bìa' : 'Chọn bìa'}</span>
                  </button>

                  {/* Remove Button (if not yet successfully uploaded or allowed) */}
                  {item.uploadStatus !== 'uploading' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(item.id);
                      }}
                      title="Xóa ảnh khỏi danh sách"
                      disabled={disabled}
                      className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/60 text-white hover:bg-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Upload Status Overlay */}
                  {item.uploadStatus === 'uploading' && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white text-sm gap-1.5 p-2 text-center">
                      <Loader2 className="w-5 h-5 animate-spin text-[#B9EADB]" />
                      <span className="font-semibold text-xs">Đang tải lên...</span>
                    </div>
                  )}

                  {item.uploadStatus === 'success' && (
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-emerald-600/90 text-white text-xs font-semibold flex items-center gap-1 shadow-xs">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Đã tải</span>
                    </div>
                  )}

                  {item.uploadStatus === 'error' && (
                    <div className="absolute inset-0 bg-rose-950/80 flex flex-col items-center justify-center text-white text-sm gap-1 p-2 text-center">
                      <AlertCircle className="w-4 h-4 text-rose-300" />
                      <span className="font-bold text-xs text-rose-200">Tải thất bại</span>
                      <span className="text-xs text-rose-200/90 line-clamp-2">
                        {item.errorMessage || 'Lỗi kết nối'}
                      </span>
                    </div>
                  )}
                </div>

                {/* File info footer */}
                <div className="p-2 bg-stone-50 text-xs space-y-0.5 border-t border-stone-100">
                  <p className="font-medium text-stone-800 truncate" title={item.file.name}>
                    {item.file.name}
                  </p>
                  <p className="text-stone-400 font-mono text-xs">
                    {formatFileSize(item.file.size)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
