'use client';

import { X, Upload, Camera, Trash2, Check } from 'lucide-react';
import { useState, useRef } from 'react';

interface ChangePhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (photo: string) => void;
  currentPhoto?: string;
}

export function ChangePhotoModal({ isOpen, onClose, onSave, currentPhoto }: ChangePhotoModalProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!preview) return;
    setUploading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    onSave(preview);
    setUploading(false);
    setPreview(null);
    onClose();
  };

  const handleRemove = () => {
    setPreview(null);
    onSave('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Change Profile Photo</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                {preview || currentPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview || currentPhoto} alt="Profile preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-12 h-12 text-white" />
                )}
              </div>
              {(preview || currentPhoto) && (
                <button
                  onClick={handleRemove}
                  className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-3 text-gray-700 hover:text-blue-700"
            >
              <Upload className="w-5 h-5" />
              <span className="font-medium">Upload from computer</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-3"
            >
              <Camera className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-700">Take a photo</span>
            </button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Photo guidelines:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>File size must be less than 5MB</li>
              <li>Recommended: Square image, at least 400x400px</li>
              <li>Formats: JPG, PNG, or GIF</li>
            </ul>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={uploading}
          >
            Cancel
          </button>
          {preview && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save Photo
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
