import React, { useState } from 'react';
import { X, Check, MessageSquarePlus } from 'lucide-react';

interface QuickItemNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  currentNotes: string;
  onSave: (notes: string) => void;
}

const COMMON_TAGS = [
  'Sin cebolla',
  'Término medio',
  'Bien cocido',
  'Poco hecho (Sangrante)',
  'Salsa aparte',
  'Sin sal',
  'Sin hielo',
  'Hielo extra',
  'Alergia a frutos secos',
  'Alergia a lácteos',
  'Picante aparte',
  'Para compartir',
  'Llevar a la vez',
];

export const QuickItemNotesModal: React.FC<QuickItemNotesModalProps> = ({
  isOpen,
  onClose,
  productName,
  currentNotes,
  onSave,
}) => {
  const [noteText, setNoteText] = useState(currentNotes);

  if (!isOpen) return null;

  const handleAddTag = (tag: string) => {
    if (!noteText.trim()) {
      setNoteText(tag);
    } else if (!noteText.includes(tag)) {
      setNoteText(`${noteText}, ${tag}`);
    }
  };

  const handleSave = () => {
    onSave(noteText.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-850">
          <div className="flex items-center gap-2 text-stone-100">
            <MessageSquarePlus className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-semibold text-sm">Nota de Cocina / Bar</h3>
              <p className="text-xs text-stone-400 truncate max-w-[260px]">{productName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1.5">
              Modificación o indicación para la comanda:
            </label>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Ej: Término medio, sin cebolla, aderezo aparte..."
              rows={3}
              className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none"
            />
          </div>

          <div>
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block mb-2">
              Atajos rápidos:
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
              {COMMON_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleAddTag(tag)}
                  className="px-2.5 py-1 rounded-lg text-xs bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700/80 transition"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 bg-stone-850 border-t border-stone-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-stone-300 hover:bg-stone-800 transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-stone-950 flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition"
          >
            <Check className="w-4 h-4" />
            Guardar Nota
          </button>
        </div>
      </div>
    </div>
  );
};
