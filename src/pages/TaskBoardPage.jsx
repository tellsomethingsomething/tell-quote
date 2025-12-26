import React, { useState, useEffect, useRef } from 'react';
import {
    Plus,
    MoreHorizontal,
    X,
    Star,
    Filter,
    Users,
    Calendar,
    Search,
    Settings,
    Trash2,
    Copy,
    Edit3,
    ChevronDown,
    Layout,
    Grid,
    List,
    Clock,
    CheckSquare,
    MessageSquare,
    Paperclip,
    Tag,
    User,
    ArrowLeft,
    Briefcase,
    Lightbulb,
    Building2,
    Link2,
} from 'lucide-react';
import {
    useTaskBoardStore,
    BOARD_BACKGROUNDS,
    LABEL_COLORS,
    CARD_PRIORITIES,
    formatDueDate,
} from '../store/taskBoardStore';
import { useProjectStore } from '../store/projectStore';
import { useOpportunityStore } from '../store/opportunityStore';
import { useClientStore } from '../store/clientStore';
import TaskDetailModal from '../components/tasks/TaskDetailModal';

// ============ BOARD SELECTOR ============
const BoardSelector = ({ boards, currentBoard, onSelect, onCreate }) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [newBoardName, setNewBoardName] = useState('');
    const [newBoardBg, setNewBoardBg] = useState('blue');

    const handleCreate = () => {
        if (newBoardName.trim()) {
            onCreate({ name: newBoardName, background: newBoardBg });
            setNewBoardName('');
            setNewBoardBg('blue');
            setShowCreate(false);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
            >
                <Layout size={18} />
                <span className="font-medium">{currentBoard?.name || 'Select Board'}</span>
                <ChevronDown size={16} />
            </button>

            {showDropdown && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                    <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg shadow-xl border z-20">
                        <div className="p-3 border-b">
                            <h3 className="font-semibold text-gray-900">Your Boards</h3>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                            {boards.map(board => (
                                <button
                                    key={board.id}
                                    onClick={() => { onSelect(board.id); setShowDropdown(false); }}
                                    className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 ${
                                        currentBoard?.id === board.id ? 'bg-blue-50' : ''
                                    }`}
                                >
                                    <div
                                        className="w-8 h-6 rounded"
                                        style={{ backgroundColor: BOARD_BACKGROUNDS[board.background]?.color || '#0079BF' }}
                                    />
                                    <span className="text-gray-900">{board.name}</span>
                                </button>
                            ))}
                        </div>
                        <div className="p-2 border-t">
                            {!showCreate ? (
                                <button
                                    onClick={() => setShowCreate(true)}
                                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                >
                                    <Plus size={18} />
                                    Create new board
                                </button>
                            ) : (
                                <div className="p-2 space-y-3">
                                    <input
                                        type="text"
                                        value={newBoardName}
                                        onChange={(e) => setNewBoardName(e.target.value)}
                                        placeholder="Board name"
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        autoFocus
                                    />
                                    <div className="flex gap-2 flex-wrap">
                                        {Object.values(BOARD_BACKGROUNDS).slice(0, 6).map(bg => (
                                            <button
                                                key={bg.id}
                                                onClick={() => setNewBoardBg(bg.id)}
                                                className={`w-8 h-6 rounded ${newBoardBg === bg.id ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                                                style={{ backgroundColor: bg.color }}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleCreate}
                                            className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                        >
                                            Create
                                        </button>
                                        <button
                                            onClick={() => setShowCreate(false)}
                                            className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

// ============ TASK CARD ============
const TaskCard = ({ card, labels, onDragStart, onDragEnd, onClick }) => {
    const dueInfo = formatDueDate(card.due_date);
    const progress = useTaskBoardStore(s => s.getChecklistProgress(card));
    const cardLabels = card.card_labels?.map(cl => labels.find(l => l.id === cl.label_id)).filter(Boolean) || [];
    const priority = CARD_PRIORITIES[card.priority];

    // Get linked entities
    const projects = useProjectStore(s => s.projects);
    const opportunities = useOpportunityStore(s => s.opportunities);
    const clients = useClientStore(s => s.clients);

    const linkedProject = card.project_id ? projects.find(p => p.id === card.project_id) : null;
    const linkedOpportunity = card.opportunity_id ? opportunities.find(o => o.id === card.opportunity_id) : null;
    const linkedClient = card.client_id ? clients.find(c => c.id === card.client_id) : null;
    const hasLinks = linkedProject || linkedOpportunity || linkedClient;

    const handleDragStart = (e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('cardId', card.id);
        onDragStart(card);
    };

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            onDragEnd={onDragEnd}
            onClick={() => onClick(card)}
            className="bg-white rounded-lg shadow-sm border border-gray-200 hover:border-gray-300 cursor-pointer group transition-all hover:shadow-md"
        >
            {/* Cover */}
            {card.cover_color && (
                <div
                    className="h-8 rounded-t-lg"
                    style={{ backgroundColor: card.cover_color }}
                />
            )}

            <div className="p-3">
                {/* Linked entity badge */}
                {hasLinks && (
                    <div className="flex flex-wrap gap-1 mb-2">
                        {linkedProject && (
                            <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded" title={linkedProject.name}>
                                <Briefcase size={10} />
                                {linkedProject.name?.substring(0, 15)}{linkedProject.name?.length > 15 ? '...' : ''}
                            </span>
                        )}
                        {linkedOpportunity && (
                            <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 bg-yellow-50 text-yellow-700 rounded" title={linkedOpportunity.name}>
                                <Lightbulb size={10} />
                                {linkedOpportunity.name?.substring(0, 15)}{linkedOpportunity.name?.length > 15 ? '...' : ''}
                            </span>
                        )}
                        {linkedClient && !linkedProject && !linkedOpportunity && (
                            <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded" title={linkedClient.company}>
                                <Building2 size={10} />
                                {linkedClient.company?.substring(0, 15)}{linkedClient.company?.length > 15 ? '...' : ''}
                            </span>
                        )}
                    </div>
                )}

                {/* Labels */}
                {cardLabels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                        {cardLabels.map(label => (
                            <div
                                key={label.id}
                                className="h-2 w-10 rounded-full"
                                style={{ backgroundColor: LABEL_COLORS[label.color]?.color }}
                                title={label.name || LABEL_COLORS[label.color]?.label}
                            />
                        ))}
                    </div>
                )}

                {/* Title */}
                <h4 className="text-sm text-gray-900 font-medium">{card.title}</h4>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                    {/* Priority */}
                    {card.priority && card.priority !== 'none' && (
                        <span
                            className="text-xs px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: priority?.color + '20', color: priority?.color }}
                        >
                            {priority?.icon} {priority?.label}
                        </span>
                    )}

                    {/* Due Date */}
                    {dueInfo && (
                        <span className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${
                            dueInfo.status === 'overdue' ? 'bg-red-100 text-red-700' :
                            dueInfo.status === 'due-soon' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-600'
                        }`}>
                            <Clock size={12} />
                            {dueInfo.text}
                        </span>
                    )}

                    {/* Description indicator */}
                    {card.description && (
                        <span className="text-gray-400">
                            <List size={14} />
                        </span>
                    )}

                    {/* Checklist progress */}
                    {progress && (
                        <span className={`flex items-center gap-1 text-xs ${
                            progress.percent === 100 ? 'text-green-600' : 'text-gray-500'
                        }`}>
                            <CheckSquare size={12} />
                            {progress.completed}/{progress.total}
                        </span>
                    )}

                    {/* Comments count */}
                    {card.comments?.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                            <MessageSquare size={12} />
                            {card.comments.length}
                        </span>
                    )}

                    {/* Attachments count */}
                    {card.attachments?.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Paperclip size={12} />
                            {card.attachments.length}
                        </span>
                    )}
                </div>

                {/* Assignees */}
                {card.assignees?.length > 0 && (
                    <div className="flex justify-end mt-2 -space-x-1">
                        {card.assignees.slice(0, 3).map(a => (
                            <div
                                key={a.user_id}
                                className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-700"
                                title={a.users?.name}
                            >
                                {a.users?.avatar_url ? (
                                    <img src={a.users.avatar_url} alt="" className="w-full h-full rounded-full" />
                                ) : (
                                    a.users?.name?.charAt(0) || '?'
                                )}
                            </div>
                        ))}
                        {card.assignees.length > 3 && (
                            <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
                                +{card.assignees.length - 3}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// ============ TASK LIST ============
const TaskList = ({ list, cards, labels, onCreateCard, onCardClick }) => {
    const [showAddCard, setShowAddCard] = useState(false);
    const [newCardTitle, setNewCardTitle] = useState('');
    const [showMenu, setShowMenu] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [listTitle, setListTitle] = useState(list.title);
    const inputRef = useRef(null);

    const { setDraggedCard, clearDragState, moveCard, updateList, deleteList } = useTaskBoardStore();

    const handleAddCard = () => {
        if (newCardTitle.trim()) {
            onCreateCard(list.id, { title: newCardTitle });
            setNewCardTitle('');
            setShowAddCard(false);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const cardId = e.dataTransfer.getData('cardId');
        if (cardId) {
            const targetPosition = cards.length;
            moveCard(cardId, list.id, targetPosition);
        }
        clearDragState();
    };

    const handleSaveTitle = () => {
        if (listTitle.trim() && listTitle !== list.title) {
            updateList(list.id, { title: listTitle });
        }
        setIsEditingTitle(false);
    };

    const handleDeleteList = () => {
        if (confirm('Delete this list and all its cards?')) {
            deleteList(list.id);
        }
    };

    useEffect(() => {
        if (isEditingTitle && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditingTitle]);

    return (
        <div
            className="flex-shrink-0 w-72 bg-gray-100 rounded-xl flex flex-col max-h-full"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            {/* List Header */}
            <div className="p-3 flex items-center justify-between">
                {isEditingTitle ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={listTitle}
                        onChange={(e) => setListTitle(e.target.value)}
                        onBlur={handleSaveTitle}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                        className="flex-1 px-2 py-1 font-semibold text-gray-900 bg-white border-2 border-blue-500 rounded focus:outline-none"
                    />
                ) : (
                    <h3
                        className="font-semibold text-gray-900 cursor-pointer hover:text-gray-600"
                        onClick={() => setIsEditingTitle(true)}
                    >
                        {list.title}
                    </h3>
                )}
                <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-500">{cards.length}</span>
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-1 hover:bg-gray-200 rounded"
                        >
                            <MoreHorizontal size={16} className="text-gray-500" />
                        </button>
                        {showMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border z-20">
                                    <button
                                        onClick={() => { setIsEditingTitle(true); setShowMenu(false); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50"
                                    >
                                        <Edit3 size={16} />
                                        Rename list
                                    </button>
                                    <button
                                        onClick={handleDeleteList}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-left text-red-600 hover:bg-red-50"
                                    >
                                        <Trash2 size={16} />
                                        Delete list
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Cards */}
            <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
                {cards.map(card => (
                    <TaskCard
                        key={card.id}
                        card={card}
                        labels={labels}
                        onDragStart={setDraggedCard}
                        onDragEnd={clearDragState}
                        onClick={onCardClick}
                    />
                ))}

                {/* Add Card */}
                {showAddCard ? (
                    <div className="bg-white rounded-lg shadow-sm border p-2">
                        <textarea
                            value={newCardTitle}
                            onChange={(e) => setNewCardTitle(e.target.value)}
                            placeholder="Enter a title for this card..."
                            className="w-full px-2 py-1.5 text-sm border rounded resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows={2}
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAddCard();
                                }
                            }}
                        />
                        <div className="flex gap-2 mt-2">
                            <button
                                onClick={handleAddCard}
                                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                            >
                                Add card
                            </button>
                            <button
                                onClick={() => { setShowAddCard(false); setNewCardTitle(''); }}
                                className="p-1.5 hover:bg-gray-100 rounded"
                            >
                                <X size={18} className="text-gray-500" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowAddCard(true)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        <Plus size={18} />
                        Add a card
                    </button>
                )}
            </div>
        </div>
    );
};

// ============ ADD LIST BUTTON ============
const AddListButton = ({ onAdd }) => {
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState('');

    const handleAdd = () => {
        if (title.trim()) {
            onAdd(title);
            setTitle('');
            setShowForm(false);
        }
    };

    if (!showForm) {
        return (
            <button
                onClick={() => setShowForm(true)}
                className="flex-shrink-0 w-72 h-12 flex items-center gap-2 px-4 bg-white/30 hover:bg-white/40 rounded-xl text-white transition-colors"
            >
                <Plus size={18} />
                Add another list
            </button>
        );
    }

    return (
        <div className="flex-shrink-0 w-72 bg-gray-100 rounded-xl p-3">
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter list title..."
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <div className="flex gap-2 mt-2">
                <button
                    onClick={handleAdd}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Add list
                </button>
                <button
                    onClick={() => { setShowForm(false); setTitle(''); }}
                    className="p-2 hover:bg-gray-200 rounded-lg"
                >
                    <X size={18} className="text-gray-500" />
                </button>
            </div>
        </div>
    );
};

// ============ BOARD FILTERS ============
const BoardFilters = ({ labels, filters, onFilterChange }) => {
    const [showFilters, setShowFilters] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    Object.values(filters).some(f => f?.length > 0)
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/20 hover:bg-white/30 text-white'
                }`}
            >
                <Filter size={18} />
                Filter
            </button>

            {showFilters && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowFilters(false)} />
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-xl border z-20 p-4">
                        <h4 className="font-semibold text-gray-900 mb-3">Filter cards</h4>

                        {/* Labels */}
                        <div className="mb-4">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Labels</h5>
                            <div className="flex flex-wrap gap-2">
                                {labels.map(label => (
                                    <button
                                        key={label.id}
                                        onClick={() => {
                                            const current = filters.labels || [];
                                            const updated = current.includes(label.id)
                                                ? current.filter(id => id !== label.id)
                                                : [...current, label.id];
                                            onFilterChange({ ...filters, labels: updated });
                                        }}
                                        className={`h-6 px-2 rounded text-xs font-medium ${
                                            (filters.labels || []).includes(label.id)
                                                ? 'ring-2 ring-offset-1 ring-blue-500'
                                                : ''
                                        }`}
                                        style={{
                                            backgroundColor: LABEL_COLORS[label.color]?.color,
                                            color: 'white',
                                        }}
                                    >
                                        {label.name || LABEL_COLORS[label.color]?.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Priority */}
                        <div className="mb-4">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Priority</h5>
                            <div className="flex flex-wrap gap-2">
                                {Object.values(CARD_PRIORITIES).filter(p => p.id !== 'none').map(priority => (
                                    <button
                                        key={priority.id}
                                        onClick={() => {
                                            const current = filters.priorities || [];
                                            const updated = current.includes(priority.id)
                                                ? current.filter(id => id !== priority.id)
                                                : [...current, priority.id];
                                            onFilterChange({ ...filters, priorities: updated });
                                        }}
                                        className={`px-2 py-1 rounded text-xs font-medium ${
                                            (filters.priorities || []).includes(priority.id)
                                                ? 'ring-2 ring-offset-1 ring-blue-500'
                                                : ''
                                        }`}
                                        style={{
                                            backgroundColor: priority.color + '20',
                                            color: priority.color,
                                        }}
                                    >
                                        {priority.icon} {priority.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Due Date */}
                        <div className="mb-4">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Due date</h5>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { id: 'overdue', label: 'Overdue' },
                                    { id: 'today', label: 'Due today' },
                                    { id: 'week', label: 'Due this week' },
                                    { id: 'none', label: 'No due date' },
                                ].map(option => (
                                    <button
                                        key={option.id}
                                        onClick={() => {
                                            onFilterChange({
                                                ...filters,
                                                dueDate: filters.dueDate === option.id ? null : option.id,
                                            });
                                        }}
                                        className={`px-2 py-1 rounded text-xs ${
                                            filters.dueDate === option.id
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Clear */}
                        <button
                            onClick={() => onFilterChange({})}
                            className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                        >
                            Clear all filters
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

// ============ EMPTY STATE ============
const EmptyState = ({ onCreateBoard }) => {
    const [name, setName] = useState('');
    const [background, setBackground] = useState('blue');

    const handleCreate = () => {
        if (name.trim()) {
            onCreateBoard({ name, background });
        }
    };

    return (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Layout size={40} className="text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Create your first board</h2>
                <p className="text-gray-600 mb-6">
                    Organize your tasks with a Trello-style board. Create lists, add cards, and drag them around.
                </p>
                <div className="bg-white rounded-xl border p-6 text-left">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter board name..."
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
                    />
                    <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">Choose a background</p>
                        <div className="flex gap-2">
                            {Object.values(BOARD_BACKGROUNDS).map(bg => (
                                <button
                                    key={bg.id}
                                    onClick={() => setBackground(bg.id)}
                                    className={`w-10 h-8 rounded-lg ${background === bg.id ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                                    style={{ backgroundColor: bg.color }}
                                />
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={handleCreate}
                        disabled={!name.trim()}
                        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                        Create Board
                    </button>
                </div>
            </div>
        </div>
    );
};

// ============ MAIN PAGE ============
const TaskBoardPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({});

    const {
        boards,
        currentBoard,
        lists,
        cards,
        labels,
        loading,
        selectedCard,
        cardDetailOpen,
        loadBoards,
        loadBoard,
        createBoard,
        createList,
        createCard,
        openCardDetail,
        closeCardDetail,
    } = useTaskBoardStore();

    useEffect(() => {
        loadBoards();
    }, []);

    useEffect(() => {
        if (boards.length > 0 && !currentBoard) {
            loadBoard(boards[0].id);
        }
    }, [boards, currentBoard]);

    const getListCards = (listId) => {
        let filtered = cards.filter(c => c.list_id === listId);

        // Apply search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(c =>
                c.title.toLowerCase().includes(query) ||
                c.description?.toLowerCase().includes(query)
            );
        }

        // Apply label filter
        if (filters.labels?.length > 0) {
            filtered = filtered.filter(c =>
                c.card_labels?.some(cl => filters.labels.includes(cl.label_id))
            );
        }

        // Apply priority filter
        if (filters.priorities?.length > 0) {
            filtered = filtered.filter(c => filters.priorities.includes(c.priority));
        }

        // Apply due date filter
        if (filters.dueDate) {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

            filtered = filtered.filter(c => {
                if (filters.dueDate === 'none') return !c.due_date;
                if (!c.due_date) return false;
                const due = new Date(c.due_date);
                if (filters.dueDate === 'overdue') return due < today;
                if (filters.dueDate === 'today') return due >= today && due < new Date(today.getTime() + 24 * 60 * 60 * 1000);
                if (filters.dueDate === 'week') return due >= today && due < weekEnd;
                return true;
            });
        }

        return filtered.sort((a, b) => a.position - b.position);
    };

    const handleCreateBoard = async (boardData) => {
        const board = await createBoard(boardData);
        loadBoard(board.id);
    };

    const handleCreateCard = async (listId, cardData) => {
        await createCard(listId, cardData);
    };

    const handleAddList = async (title) => {
        await createList(currentBoard.id, title);
    };

    if (loading && !currentBoard) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
        );
    }

    if (boards.length === 0) {
        return <EmptyState onCreateBoard={handleCreateBoard} />;
    }

    const bgColor = BOARD_BACKGROUNDS[currentBoard?.background]?.color || '#0079BF';

    return (
        <div className="flex-1 flex flex-col h-screen" style={{ backgroundColor: bgColor }}>
            {/* Board Header */}
            <div className="px-4 py-3 flex items-center gap-4 text-white">
                <BoardSelector
                    boards={boards}
                    currentBoard={currentBoard}
                    onSelect={loadBoard}
                    onCreate={handleCreateBoard}
                />

                <button className="p-2 hover:bg-white/20 rounded-lg">
                    <Star size={18} />
                </button>

                <div className="flex-1" />

                {/* Search */}
                <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search cards..."
                        className="w-64 pl-10 pr-4 py-2 bg-white/20 border border-white/20 rounded-lg text-white placeholder-white/60 focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/40"
                    />
                </div>

                <BoardFilters
                    labels={labels}
                    filters={filters}
                    onFilterChange={setFilters}
                />

                <button className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg">
                    <Users size={18} />
                    Share
                </button>

                <button className="p-2 hover:bg-white/20 rounded-lg">
                    <MoreHorizontal size={18} />
                </button>
            </div>

            {/* Board Content */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden px-4 pb-4">
                <div className="flex gap-4 h-full items-start">
                    {lists.map(list => (
                        <TaskList
                            key={list.id}
                            list={list}
                            cards={getListCards(list.id)}
                            labels={labels}
                            onCreateCard={handleCreateCard}
                            onCardClick={openCardDetail}
                        />
                    ))}
                    <AddListButton onAdd={handleAddList} />
                </div>
            </div>

            {/* Card Detail Modal */}
            {cardDetailOpen && selectedCard && (
                <TaskDetailModal
                    card={selectedCard}
                    labels={labels}
                    lists={lists}
                    onClose={closeCardDetail}
                />
            )}
        </div>
    );
};

export default TaskBoardPage;
