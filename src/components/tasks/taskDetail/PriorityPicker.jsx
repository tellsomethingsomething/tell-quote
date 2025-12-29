import React from 'react';
import { X } from 'lucide-react';
import { useTaskBoardStore, CARD_PRIORITIES } from '../../../store/taskBoardStore';

const PriorityPicker = ({ cardId, currentPriority, onClose }) => {
    const { updateCard } = useTaskBoardStore();

    const handleSelect = (priority) => {
        updateCard(cardId, { priority });
        onClose();
    };

    return (
        <div className="absolute left-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border z-30">
            <div className="p-3 border-b flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">Priority</h4>
                <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                    <X size={16} />
                </button>
            </div>
            <div className="p-2">
                {Object.values(CARD_PRIORITIES).map(priority => (
                    <button
                        key={priority.id}
                        onClick={() => handleSelect(priority.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-50 ${
                            currentPriority === priority.id ? 'bg-blue-50' : ''
                        }`}
                    >
                        <span style={{ color: priority.color }}>{priority.icon}</span>
                        <span className="text-gray-900">{priority.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default PriorityPicker;
