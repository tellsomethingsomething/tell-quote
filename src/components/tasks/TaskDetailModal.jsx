import React, { useState, useEffect, useRef } from 'react';
import {
    X,
    CreditCard,
    AlignLeft,
    Tag,
    CheckSquare,
    Clock,
    Copy,
    Trash2,
    ArrowRight,
    Flag,
    Link2,
} from 'lucide-react';
import {
    useTaskBoardStore,
    LABEL_COLORS,
    CARD_PRIORITIES,
    formatDueDate,
} from '../../store/taskBoardStore';
import {
    LabelPicker,
    DatePicker,
    PriorityPicker,
    MoveCardPicker,
    LinkPicker,
    LinkedEntities,
    ChecklistSection,
    CommentsSection,
} from './taskDetail';

const TaskDetailModal = ({ card, labels, lists, onClose }) => {
    const [title, setTitle] = useState(card.title);
    const [description, setDescription] = useState(card.description || '');
    const [isEditingDesc, setIsEditingDesc] = useState(false);
    const [showLabelPicker, setShowLabelPicker] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showPriorityPicker, setShowPriorityPicker] = useState(false);
    const [showMovePicker, setShowMovePicker] = useState(false);
    const [showLinkPicker, setShowLinkPicker] = useState(false);

    const { updateCard, deleteCard, duplicateCard, addChecklist } = useTaskBoardStore();
    const titleRef = useRef(null);

    const dueInfo = formatDueDate(card.due_date);
    const cardLabels = card.card_labels?.map(cl => labels.find(l => l.id === cl.label_id)).filter(Boolean) || [];
    const priority = CARD_PRIORITIES[card.priority];
    const currentList = lists.find(l => l.id === card.list_id);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handleTitleBlur = () => {
        if (title.trim() && title !== card.title) {
            updateCard(card.id, { title });
        }
    };

    const handleDescriptionSave = () => {
        updateCard(card.id, { description });
        setIsEditingDesc(false);
    };

    const handleDelete = () => {
        if (confirm('Delete this card? This cannot be undone.')) {
            deleteCard(card.id);
            onClose();
        }
    };

    const handleDuplicate = async () => {
        await duplicateCard(card.id);
        onClose();
    };

    const handleAddChecklist = () => {
        addChecklist(card.id, 'Checklist');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 px-4 pb-4 overflow-y-auto">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/50" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-gray-100 rounded-xl w-full max-w-3xl shadow-2xl">
                {/* Cover */}
                {card.cover_color && (
                    <div
                        className="h-24 rounded-t-xl"
                        style={{ backgroundColor: card.cover_color }}
                    />
                )}

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 p-2 bg-gray-200/80 hover:bg-gray-300 rounded-full"
                >
                    <X size={18} />
                </button>

                {/* Content */}
                <div className="flex gap-4 p-6">
                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                        {/* Title */}
                        <div className="flex items-start gap-3 mb-4">
                            <CreditCard size={24} className="text-gray-600 mt-1" />
                            <div className="flex-1">
                                <input
                                    ref={titleRef}
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    onBlur={handleTitleBlur}
                                    className="w-full text-xl font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0"
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    in list <span className="font-medium underline">{currentList?.title}</span>
                                </p>
                            </div>
                        </div>

                        {/* Labels display */}
                        {cardLabels.length > 0 && (
                            <div className="mb-4 ml-9">
                                <h5 className="text-xs text-gray-500 mb-2">Labels</h5>
                                <div className="flex flex-wrap gap-2">
                                    {cardLabels.map(label => (
                                        <span
                                            key={label.id}
                                            className="px-3 py-1 rounded text-sm font-medium text-white"
                                            style={{ backgroundColor: LABEL_COLORS[label.color]?.color }}
                                        >
                                            {label.name || LABEL_COLORS[label.color]?.label}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Linked entities display */}
                        <LinkedEntities card={card} />

                        {/* Due date & Priority display */}
                        <div className="flex gap-4 mb-4 ml-9">
                            {dueInfo && (
                                <div>
                                    <h5 className="text-xs text-gray-500 mb-1">Due date</h5>
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm ${
                                        dueInfo.status === 'overdue' ? 'bg-red-500 text-white' :
                                        dueInfo.status === 'due-soon' ? 'bg-yellow-500 text-white' :
                                        'bg-gray-200 text-gray-700'
                                    }`}>
                                        <Clock size={14} />
                                        {new Date(card.due_date).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: 'numeric',
                                            minute: '2-digit',
                                        })}
                                    </span>
                                </div>
                            )}
                            {priority && priority.id !== 'none' && (
                                <div>
                                    <h5 className="text-xs text-gray-500 mb-1">Priority</h5>
                                    <span
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-sm"
                                        style={{ backgroundColor: priority.color + '20', color: priority.color }}
                                    >
                                        {priority.icon} {priority.label}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-2">
                                <AlignLeft size={18} className="text-gray-600" />
                                <h4 className="font-semibold text-gray-900">Description</h4>
                            </div>
                            {isEditingDesc ? (
                                <div className="ml-6">
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Add a more detailed description..."
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                                        rows={6}
                                        autoFocus
                                    />
                                    <div className="flex gap-2 mt-2">
                                        <button
                                            onClick={handleDescriptionSave}
                                            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={() => { setDescription(card.description || ''); setIsEditingDesc(false); }}
                                            className="px-3 py-1.5 text-gray-600 hover:bg-gray-200 text-sm rounded"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    onClick={() => setIsEditingDesc(true)}
                                    className="ml-6 min-h-[60px] p-3 bg-gray-200 rounded-lg cursor-pointer hover:bg-gray-300 text-sm text-gray-700"
                                >
                                    {description || 'Add a more detailed description...'}
                                </div>
                            )}
                        </div>

                        {/* Checklists */}
                        {card.checklists?.map(checklist => (
                            <ChecklistSection key={checklist.id} checklist={checklist} />
                        ))}

                        {/* Comments */}
                        <CommentsSection cardId={card.id} comments={card.comments} />
                    </div>

                    {/* Sidebar */}
                    <div className="w-48 space-y-4">
                        <div>
                            <h5 className="text-xs text-gray-500 mb-2 font-medium">Add to card</h5>
                            <div className="space-y-1">
                                <div className="relative">
                                    <button
                                        onClick={() => setShowLabelPicker(!showLabelPicker)}
                                        className="w-full flex items-center gap-2 px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm text-gray-700"
                                    >
                                        <Tag size={14} />
                                        Labels
                                    </button>
                                    {showLabelPicker && (
                                        <LabelPicker
                                            cardId={card.id}
                                            cardLabels={card.card_labels}
                                            labels={labels}
                                            onClose={() => setShowLabelPicker(false)}
                                        />
                                    )}
                                </div>

                                <button
                                    onClick={handleAddChecklist}
                                    className="w-full flex items-center gap-2 px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm text-gray-700"
                                >
                                    <CheckSquare size={14} />
                                    Checklist
                                </button>

                                <div className="relative">
                                    <button
                                        onClick={() => setShowDatePicker(!showDatePicker)}
                                        className="w-full flex items-center gap-2 px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm text-gray-700"
                                    >
                                        <Clock size={14} />
                                        Due date
                                    </button>
                                    {showDatePicker && (
                                        <DatePicker
                                            cardId={card.id}
                                            currentDate={card.due_date}
                                            onClose={() => setShowDatePicker(false)}
                                        />
                                    )}
                                </div>

                                <div className="relative">
                                    <button
                                        onClick={() => setShowPriorityPicker(!showPriorityPicker)}
                                        className="w-full flex items-center gap-2 px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm text-gray-700"
                                    >
                                        <Flag size={14} />
                                        Priority
                                    </button>
                                    {showPriorityPicker && (
                                        <PriorityPicker
                                            cardId={card.id}
                                            currentPriority={card.priority}
                                            onClose={() => setShowPriorityPicker(false)}
                                        />
                                    )}
                                </div>

                                <div className="relative">
                                    <button
                                        onClick={() => setShowLinkPicker(!showLinkPicker)}
                                        className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm ${
                                            card.project_id || card.opportunity_id || card.client_id
                                                ? 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                                                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                        }`}
                                    >
                                        <Link2 size={14} />
                                        Link
                                        {(card.project_id || card.opportunity_id || card.client_id) && (
                                            <span className="ml-auto text-xs bg-blue-500 text-white px-1.5 rounded">
                                                {[card.project_id, card.opportunity_id, card.client_id].filter(Boolean).length}
                                            </span>
                                        )}
                                    </button>
                                    {showLinkPicker && (
                                        <LinkPicker
                                            cardId={card.id}
                                            card={card}
                                            onClose={() => setShowLinkPicker(false)}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        <div>
                            <h5 className="text-xs text-gray-500 mb-2 font-medium">Actions</h5>
                            <div className="space-y-1">
                                <div className="relative">
                                    <button
                                        onClick={() => setShowMovePicker(!showMovePicker)}
                                        className="w-full flex items-center gap-2 px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm text-gray-700"
                                    >
                                        <ArrowRight size={14} />
                                        Move
                                    </button>
                                    {showMovePicker && (
                                        <MoveCardPicker
                                            cardId={card.id}
                                            lists={lists}
                                            currentListId={card.list_id}
                                            onClose={() => setShowMovePicker(false)}
                                        />
                                    )}
                                </div>

                                <button
                                    onClick={handleDuplicate}
                                    className="w-full flex items-center gap-2 px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm text-gray-700"
                                >
                                    <Copy size={14} />
                                    Copy
                                </button>

                                <button
                                    onClick={handleDelete}
                                    className="w-full flex items-center gap-2 px-3 py-2 bg-red-100 hover:bg-red-200 rounded text-sm text-red-700"
                                >
                                    <Trash2 size={14} />
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskDetailModal;
