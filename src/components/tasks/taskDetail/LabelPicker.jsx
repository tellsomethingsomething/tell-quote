import React, { useState } from 'react';
import { X, MoreHorizontal } from 'lucide-react';
import { useTaskBoardStore, LABEL_COLORS } from '../../../store/taskBoardStore';

const LabelPicker = ({ cardId, cardLabels, labels, onClose }) => {
    const { addLabelToCard, removeLabelFromCard, updateLabel } = useTaskBoardStore();
    const [editingLabel, setEditingLabel] = useState(null);
    const [labelName, setLabelName] = useState('');

    const isSelected = (labelId) => cardLabels?.some(cl => cl.label_id === labelId);

    const toggleLabel = (labelId) => {
        if (isSelected(labelId)) {
            removeLabelFromCard(cardId, labelId);
        } else {
            addLabelToCard(cardId, labelId);
        }
    };

    const handleEditLabel = (label) => {
        setEditingLabel(label);
        setLabelName(label.name || '');
    };

    const handleSaveLabel = () => {
        if (editingLabel) {
            updateLabel(editingLabel.id, { name: labelName });
            setEditingLabel(null);
            setLabelName('');
        }
    };

    return (
        <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border z-30">
            <div className="p-3 border-b flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">Labels</h4>
                <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                    <X size={16} />
                </button>
            </div>
            <div className="p-3 space-y-2">
                {editingLabel ? (
                    <div className="space-y-2">
                        <input
                            type="text"
                            value={labelName}
                            onChange={(e) => setLabelName(e.target.value)}
                            placeholder="Label name"
                            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleSaveLabel}
                                className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Save
                            </button>
                            <button
                                onClick={() => setEditingLabel(null)}
                                className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    labels.map(label => (
                        <div key={label.id} className="flex items-center gap-2">
                            <button
                                onClick={() => toggleLabel(label.id)}
                                className={`flex-1 h-8 rounded flex items-center px-3 ${
                                    isSelected(label.id) ? 'ring-2 ring-blue-500 ring-offset-1' : ''
                                }`}
                                style={{ backgroundColor: LABEL_COLORS[label.color]?.color }}
                            >
                                <span className="text-white text-sm font-medium">
                                    {label.name || LABEL_COLORS[label.color]?.label}
                                </span>
                            </button>
                            <button
                                onClick={() => handleEditLabel(label)}
                                className="p-1 hover:bg-gray-100 rounded"
                            >
                                <MoreHorizontal size={14} className="text-gray-500" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default LabelPicker;
