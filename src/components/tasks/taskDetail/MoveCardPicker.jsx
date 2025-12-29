import React from 'react';
import { X } from 'lucide-react';
import { useTaskBoardStore } from '../../../store/taskBoardStore';

const MoveCardPicker = ({ cardId, lists, currentListId, onClose }) => {
    const { moveCard } = useTaskBoardStore();

    const handleMove = (listId) => {
        if (listId !== currentListId) {
            moveCard(cardId, listId, 0);
        }
        onClose();
    };

    return (
        <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border z-30">
            <div className="p-3 border-b flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">Move to...</h4>
                <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                    <X size={16} />
                </button>
            </div>
            <div className="p-2 max-h-64 overflow-y-auto">
                {lists.map(list => (
                    <button
                        key={list.id}
                        onClick={() => handleMove(list.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-50 ${
                            currentListId === list.id ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                        }`}
                    >
                        {list.title}
                        {currentListId === list.id && <span className="text-xs">(current)</span>}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default MoveCardPicker;
