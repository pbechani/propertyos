'use client';

import { StickyNote, Plus, Edit2, Trash2, Clock, Pin, AlertCircle } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { AddNoteModal } from './AddNoteModal';
import { EditNoteModal } from './EditNoteModal';
import { propertiesApi } from '@/lib/api-client';

interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
  pinned: boolean;
  category: string;
}

interface Props { propertyId: string; authToken: string; }

export function Notes({ propertyId, authToken }: Props) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isTogglingPin, setIsTogglingPin] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const data = await propertiesApi.listNotes(authToken, propertyId);
      setNotes(data.map(n => ({
        id: n.id,
        title: n.title,
        content: n.content,
        date: n.created_at,
        pinned: n.is_pinned,
        category: n.category,
      })));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load notes');
    }
  }, [authToken, propertyId]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    try {
      await propertiesApi.deleteNote(authToken, propertyId, id);
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to delete note');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleTogglePin = async (note: Note) => {
    setIsTogglingPin(note.id);
    try {
      await propertiesApi.updateNote(authToken, propertyId, note.id, { isPinned: !note.pinned });
      setNotes(prev => prev.map(n => n.id === note.id ? { ...n, pinned: !n.pinned } : n).sort((a, b) => {
        if (a.pinned === b.pinned) return new Date(b.date).getTime() - new Date(a.date).getTime();
        return a.pinned ? -1 : 1;
      }));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to update note');
    } finally {
      setIsTogglingPin(null);
    }
  };

  const pinnedNotes = notes.filter(note => note.pinned);
  const regularNotes = notes.filter(note => !note.pinned);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Agent Notes</h2>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Note
        </button>
      </div>

      {loadError && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {loadError}
        </div>
      )}

      {notes.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <StickyNote className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No notes yet</p>
          <p className="text-xs text-gray-400 mt-1">Add private notes about this listing</p>
        </div>
      ) : (
        <>
          {pinnedNotes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Pin className="w-4 h-4" />
                Pinned Notes
              </div>
              {pinnedNotes.map((note) => (
                <div key={note.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{note.title}</h3>
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                            {note.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <Clock className="w-3 h-3" />
                          {new Date(note.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          className="p-1.5 hover:bg-yellow-100 rounded transition-colors disabled:opacity-50"
                          disabled={isTogglingPin === note.id}
                          onClick={() => handleTogglePin(note)}
                        >
                          <Pin className="w-4 h-4 text-yellow-700 fill-yellow-700" />
                        </button>
                        <button
                          className="p-1.5 hover:bg-yellow-100 rounded transition-colors"
                          onClick={() => {
                            setSelectedNote(note);
                            setIsEditModalOpen(true);
                          }}
                        >
                          <Edit2 className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          className="p-1.5 hover:bg-yellow-100 rounded transition-colors disabled:opacity-50"
                          disabled={isDeleting === note.id}
                          onClick={() => handleDelete(note.id)}
                        >
                          <Trash2 className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{note.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {pinnedNotes.length > 0 && (
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 pt-2">
                <StickyNote className="w-4 h-4" />
                All Notes
              </div>
            )}
            {regularNotes.map((note) => (
              <div key={note.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{note.title}</h3>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                          {note.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <Clock className="w-3 h-3" />
                        {new Date(note.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        className="p-1.5 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                        disabled={isTogglingPin === note.id}
                        onClick={() => handleTogglePin(note)}
                      >
                        <Pin className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                        onClick={() => {
                          setSelectedNote(note);
                          setIsEditModalOpen(true);
                        }}
                      >
                        <Edit2 className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        className="p-1.5 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                        disabled={isDeleting === note.id}
                        onClick={() => handleDelete(note.id)}
                      >
                        <Trash2 className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{note.content}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <AddNoteModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        propertyId={propertyId}
        authToken={authToken}
        onSaved={load}
      />
      <EditNoteModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        note={selectedNote}
        propertyId={propertyId}
        authToken={authToken}
        onSaved={load}
      />
    </div>
  );
}
