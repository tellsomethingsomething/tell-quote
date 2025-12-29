import React, { useState } from 'react';
import { CheckSquare, X } from 'lucide-react';
import { useTaskBoardStore } from '../../../store/taskBoardStore';

const ChecklistSection = ({ checklist }) => {
    const [newItemText, setNewItemText] = useState('');
    const [showAddItem, setShowAddItem] = useState(false);
    const { updateChecklistItem, deleteChecklistItem, addChecklistItem, deleteChecklist } = useTaskBoardStore();

    const items = checklist.items || [];
    const completed = items.filter(i => i.is_complete).length;
    const total = items.length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    const handleAddItem = () => {
        if (newItemText.trim()) {
            addChecklistItem(checklist.id, newItemText);
            setNewItemText('');
        }
    };

    return (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <CheckSquare size={18} className="text-gray-600" />
                    <h4 className="font-semibold text-gray-900">{checklist.title}</h4>
                </div>
                <button
                    onClick={() => deleteChecklist(checklist.id)}
                    className="text-sm text-gray-500 hover:text-red-600 px-2 py-1 hover:bg-gray-100 rounded"
                >
                    Delete
                </button>
            </div>

            {/* Progress bar */}
            <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-gray-500 w-8">{percent}%</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full">
                    <div
                        className={`h-2 rounded-full transition-all ${percent === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${percent}%` }}
                    />
                </div>
            </div>

            {/* Items */}
            <div className="space-y-2 ml-6">
                {items.sort((a, b) => a.position - b.position).map(item => (
                    <div key={item.id} className="flex items-start gap-2 group">
                        <input
                            type="checkbox"
                            checked={item.is_complete}
                            onChange={() => updateChecklistItem(item.id, { is_complete: !item.is_complete })}
                            className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className={`flex-1 text-sm ${item.is_complete ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                            {item.text}
                        </span>
                        <button
                            onClick={() => deleteChecklistItem(item.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded"
                        >
                            <X size={14} className="text-gray-400" />
                        </button>
                    </div>
                ))}
            </div>

            {/* Add item */}
            {showAddItem ? (
                <div className="mt-3 ml-6">
                    <input
                        type="text"
                        value={newItemText}
                        onChange={(e) => setNewItemText(e.target.value)}
                        placeholder="Add an item..."
                        className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddItem();
                            if (e.key === 'Escape') setShowAddItem(false);
                        }}
                    />
                    <div className="flex gap-2 mt-2">
                        <button
                            onClick={handleAddItem}
                            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                            Add
                        </button>
                        <button
                            onClick={() => setShowAddItem(false)}
                            className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 text-sm rounded"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setShowAddItem(true)}
                    className="mt-2 ml-6 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-1.5 rounded"
                >
                    Add an item
                </button>
            )}
        </div>
    );
};

export default ChecklistSection;
