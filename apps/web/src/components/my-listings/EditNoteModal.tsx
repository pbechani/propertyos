'use client';

import { X, StickyNote, Tag, Pin, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';

interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
  pinned: boolean;
  category: string;
}

interface EditNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: Note | null;
  onSave?: (note: Note) => void;
}

const categories = [
  'Important',
  'Property Details',
  'Pricing',
  'Feedback',
  'Client Notes',
  'Marketing',
  'Legal',
  'Maintenance',
  'Other'
];

export function EditNoteModal({ open, onOpenChange, note, onSave }: EditNoteModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'Important',
    pinned: false,
  });

  useEffect(() => {
    if (note) {
      setFormData({
        title: note.title,
        content: note.content,
        category: note.category,
        pinned: note.pinned,
      });
    }
  }, [note]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (note && onSave) {
      onSave({
        ...note,
        ...formData,
      });
    }
    onOpenChange(false);
  };

  if (!note) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden z-50">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <StickyNote className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-semibold text-gray-900">
                  Edit Note
                </Dialog.Title>
                <p className="text-sm text-gray-600">
                  Last updated: {new Date(note.date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
            </div>
            <Dialog.Close className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </Dialog.Close>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col h-[calc(90vh-140px)]">
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Pin Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Pin className={`w-5 h-5 ${formData.pinned ? 'text-yellow-600 fill-yellow-600' : 'text-gray-400'}`} />
                  <div>
                    <div className="font-medium text-gray-900">Pin this note</div>
                    <div className="text-sm text-gray-600">Pinned notes appear at the top</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, pinned: !formData.pinned })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    formData.pinned ? 'bg-yellow-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      formData.pinned ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Note Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Seller Motivation, Property Features, etc."
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Category
                  </div>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setFormData({ ...formData, category })}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                        formData.category === category
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note Content *
                </label>
                <textarea
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={8}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Add your detailed notes here..."
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500">
                    {formData.content.length} characters
                  </p>
                  <p className="text-xs text-gray-500">
                    Use this space to track important property details, client preferences, or any observations
                  </p>
                </div>
              </div>

              {/* Quick Templates */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Templates
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ 
                      ...formData, 
                      content: formData.content + '\n\nKey Points:\n• \n• \n• ' 
                    })}
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 text-sm text-gray-700 transition-colors"
                  >
                    Add Bullet Points
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ 
                      ...formData, 
                      content: formData.content + '\n\nFollow-up needed: ' 
                    })}
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 text-sm text-gray-700 transition-colors"
                  >
                    Add Follow-up
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ 
                      ...formData, 
                      content: formData.content + '\n\nAction Items:\n1. \n2. \n3. ' 
                    })}
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 text-sm text-gray-700 transition-colors"
                  >
                    Add Action Items
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ 
                      ...formData, 
                      content: formData.content + '\n\nDate: ' + new Date().toLocaleDateString() 
                    })}
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 text-sm text-gray-700 transition-colors"
                  >
                    Add Timestamp
                  </button>
                </div>
              </div>

              {/* Note Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <StickyNote className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">Note Management Tips</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Pin important notes to keep them easily accessible</li>
                      <li>• Use categories to organize notes by topic</li>
                      <li>• Add specific details that will help you or your team later</li>
                      <li>• Include dates, names, and key points for future reference</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
