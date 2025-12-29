import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useTaskBoardStore } from '../../../store/taskBoardStore';

const DatePicker = ({ cardId, currentDate, onClose }) => {
    const { updateCard } = useTaskBoardStore();
    const [date, setDate] = useState(currentDate ? new Date(currentDate).toISOString().split('T')[0] : '');
    const [time, setTime] = useState(currentDate ? new Date(currentDate).toTimeString().slice(0, 5) : '12:00');

    const handleSave = () => {
        const dateTime = date ? new Date(`${date}T${time}`).toISOString() : null;
        updateCard(cardId, { due_date: dateTime });
        onClose();
    };

    const handleRemove = () => {
        updateCard(cardId, { due_date: null });
        onClose();
    };

    return (
        <div className="absolute left-0 top-full mt-2 w-72 bg-white rounded-lg shadow-xl border z-30">
            <div className="p-3 border-b flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">Due Date</h4>
                <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                    <X size={16} />
                </button>
            </div>
            <div className="p-3 space-y-3">
                <div>
                    <label className="text-sm text-gray-600 mb-1 block">Date</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="text-sm text-gray-600 mb-1 block">Time</label>
                    <input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleSave}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Save
                    </button>
                    {currentDate && (
                        <button
                            onClick={handleRemove}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded"
                        >
                            Remove
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DatePicker;
