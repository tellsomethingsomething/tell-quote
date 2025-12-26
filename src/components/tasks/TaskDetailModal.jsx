import React, { useState, useEffect, useRef } from 'react';
import {
    X,
    CreditCard,
    AlignLeft,
    Tag,
    User,
    CheckSquare,
    Clock,
    Paperclip,
    MessageSquare,
    Activity,
    Copy,
    Trash2,
    Archive,
    Share2,
    Eye,
    ArrowRight,
    Plus,
    MoreHorizontal,
    Calendar,
    Flag,
    Link2,
    Briefcase,
    Lightbulb,
    Building2,
    ExternalLink,
} from 'lucide-react';
import {
    useTaskBoardStore,
    LABEL_COLORS,
    CARD_PRIORITIES,
    formatDueDate,
} from '../../store/taskBoardStore';
import { useProjectStore } from '../../store/projectStore';
import { useOpportunityStore } from '../../store/opportunityStore';
import { useClientStore } from '../../store/clientStore';

// ============ LABEL PICKER ============
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

// ============ DATE PICKER ============
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

// ============ PRIORITY PICKER ============
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

// ============ MOVE CARD ============
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

// ============ LINK PICKER (Projects & Opportunities) ============
const LinkPicker = ({ cardId, card, onClose }) => {
    const { updateCard } = useTaskBoardStore();
    const projects = useProjectStore(s => s.projects);
    const opportunities = useOpportunityStore(s => s.opportunities);
    const clients = useClientStore(s => s.clients);
    const [tab, setTab] = useState('project'); // 'project' | 'opportunity' | 'client'
    const [search, setSearch] = useState('');

    const filteredProjects = projects.filter(p =>
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.client?.toLowerCase().includes(search.toLowerCase())
    );

    const filteredOpportunities = opportunities.filter(o =>
        o.name?.toLowerCase().includes(search.toLowerCase()) ||
        o.company?.toLowerCase().includes(search.toLowerCase())
    );

    const filteredClients = clients.filter(c =>
        c.company?.toLowerCase().includes(search.toLowerCase())
    );

    const handleLinkProject = (projectId) => {
        updateCard(cardId, { project_id: projectId });
        onClose();
    };

    const handleLinkOpportunity = (opportunityId) => {
        updateCard(cardId, { opportunity_id: opportunityId });
        onClose();
    };

    const handleLinkClient = (clientId) => {
        updateCard(cardId, { client_id: clientId });
        onClose();
    };

    const handleUnlink = (type) => {
        if (type === 'project') updateCard(cardId, { project_id: null });
        else if (type === 'opportunity') updateCard(cardId, { opportunity_id: null });
        else if (type === 'client') updateCard(cardId, { client_id: null });
    };

    return (
        <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border z-30">
            <div className="p-3 border-b flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">Link to...</h4>
                <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                    <X size={16} />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b">
                <button
                    onClick={() => setTab('project')}
                    className={`flex-1 px-3 py-2 text-sm font-medium ${
                        tab === 'project' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Briefcase size={14} className="inline mr-1" />
                    Project
                </button>
                <button
                    onClick={() => setTab('opportunity')}
                    className={`flex-1 px-3 py-2 text-sm font-medium ${
                        tab === 'opportunity' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Lightbulb size={14} className="inline mr-1" />
                    Opportunity
                </button>
                <button
                    onClick={() => setTab('client')}
                    className={`flex-1 px-3 py-2 text-sm font-medium ${
                        tab === 'client' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Building2 size={14} className="inline mr-1" />
                    Client
                </button>
            </div>

            {/* Search */}
            <div className="p-2 border-b">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={`Search ${tab}s...`}
                    className="w-full px-3 py-2 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* List */}
            <div className="max-h-64 overflow-y-auto p-2">
                {tab === 'project' && (
                    <>
                        {card.project_id && (
                            <button
                                onClick={() => handleUnlink('project')}
                                className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded text-sm mb-2"
                            >
                                <X size={14} />
                                Remove project link
                            </button>
                        )}
                        {filteredProjects.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">No projects found</p>
                        ) : (
                            filteredProjects.slice(0, 20).map(project => (
                                <button
                                    key={project.id}
                                    onClick={() => handleLinkProject(project.id)}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded text-left hover:bg-gray-50 ${
                                        card.project_id === project.id ? 'bg-blue-50 ring-1 ring-blue-500' : ''
                                    }`}
                                >
                                    <Briefcase size={14} className="text-gray-400 flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-gray-900 truncate">{project.name}</p>
                                        <p className="text-xs text-gray-500 truncate">{project.client}</p>
                                    </div>
                                    {card.project_id === project.id && (
                                        <span className="text-xs text-blue-600">Linked</span>
                                    )}
                                </button>
                            ))
                        )}
                    </>
                )}

                {tab === 'opportunity' && (
                    <>
                        {card.opportunity_id && (
                            <button
                                onClick={() => handleUnlink('opportunity')}
                                className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded text-sm mb-2"
                            >
                                <X size={14} />
                                Remove opportunity link
                            </button>
                        )}
                        {filteredOpportunities.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">No opportunities found</p>
                        ) : (
                            filteredOpportunities.slice(0, 20).map(opp => (
                                <button
                                    key={opp.id}
                                    onClick={() => handleLinkOpportunity(opp.id)}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded text-left hover:bg-gray-50 ${
                                        card.opportunity_id === opp.id ? 'bg-blue-50 ring-1 ring-blue-500' : ''
                                    }`}
                                >
                                    <Lightbulb size={14} className="text-yellow-500 flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-gray-900 truncate">{opp.name}</p>
                                        <p className="text-xs text-gray-500 truncate">{opp.company} - {opp.stage}</p>
                                    </div>
                                    {card.opportunity_id === opp.id && (
                                        <span className="text-xs text-blue-600">Linked</span>
                                    )}
                                </button>
                            ))
                        )}
                    </>
                )}

                {tab === 'client' && (
                    <>
                        {card.client_id && (
                            <button
                                onClick={() => handleUnlink('client')}
                                className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded text-sm mb-2"
                            >
                                <X size={14} />
                                Remove client link
                            </button>
                        )}
                        {filteredClients.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">No clients found</p>
                        ) : (
                            filteredClients.slice(0, 20).map(client => (
                                <button
                                    key={client.id}
                                    onClick={() => handleLinkClient(client.id)}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded text-left hover:bg-gray-50 ${
                                        card.client_id === client.id ? 'bg-blue-50 ring-1 ring-blue-500' : ''
                                    }`}
                                >
                                    <Building2 size={14} className="text-gray-400 flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-gray-900 truncate">{client.company}</p>
                                        <p className="text-xs text-gray-500 truncate">{client.contact}</p>
                                    </div>
                                    {card.client_id === client.id && (
                                        <span className="text-xs text-blue-600">Linked</span>
                                    )}
                                </button>
                            ))
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

// ============ LINKED ENTITIES DISPLAY ============
const LinkedEntities = ({ card }) => {
    const projects = useProjectStore(s => s.projects);
    const opportunities = useOpportunityStore(s => s.opportunities);
    const clients = useClientStore(s => s.clients);

    const linkedProject = card.project_id ? projects.find(p => p.id === card.project_id) : null;
    const linkedOpportunity = card.opportunity_id ? opportunities.find(o => o.id === card.opportunity_id) : null;
    const linkedClient = card.client_id ? clients.find(c => c.id === card.client_id) : null;

    if (!linkedProject && !linkedOpportunity && !linkedClient) return null;

    return (
        <div className="mb-4 ml-9">
            <h5 className="text-xs text-gray-500 mb-2">Linked to</h5>
            <div className="space-y-2">
                {linkedProject && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                        <Briefcase size={14} className="text-blue-600" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{linkedProject.name}</p>
                            <p className="text-xs text-gray-500">{linkedProject.client}</p>
                        </div>
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">Project</span>
                    </div>
                )}
                {linkedOpportunity && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 rounded-lg">
                        <Lightbulb size={14} className="text-yellow-600" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{linkedOpportunity.name}</p>
                            <p className="text-xs text-gray-500">{linkedOpportunity.company} - {linkedOpportunity.stage}</p>
                        </div>
                        <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded">Opportunity</span>
                    </div>
                )}
                {linkedClient && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                        <Building2 size={14} className="text-gray-600" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{linkedClient.company}</p>
                            <p className="text-xs text-gray-500">{linkedClient.contact}</p>
                        </div>
                        <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-700 rounded">Client</span>
                    </div>
                )}
            </div>
        </div>
    );
};

// ============ CHECKLIST SECTION ============
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

// ============ COMMENTS SECTION ============
const CommentsSection = ({ cardId, comments }) => {
    const [newComment, setNewComment] = useState('');
    const { addComment, deleteComment } = useTaskBoardStore();

    // TODO: Get actual user ID
    const currentUserId = 'demo-user-id';

    const handleAddComment = () => {
        if (newComment.trim()) {
            addComment(cardId, newComment, currentUserId);
            setNewComment('');
        }
    };

    return (
        <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
                <Activity size={18} className="text-gray-600" />
                <h4 className="font-semibold text-gray-900">Activity</h4>
            </div>

            {/* Add comment */}
            <div className="flex gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                    U
                </div>
                <div className="flex-1">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                        rows={2}
                    />
                    {newComment && (
                        <button
                            onClick={handleAddComment}
                            className="mt-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                            Save
                        </button>
                    )}
                </div>
            </div>

            {/* Comments list */}
            <div className="space-y-4">
                {(comments || []).map(comment => (
                    <div key={comment.id} className="flex gap-3 group">
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-sm font-medium">
                            {comment.user?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900 text-sm">
                                    {comment.user?.name || 'Unknown'}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {new Date(comment.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-sm text-gray-700 mt-1">{comment.text}</p>
                            <button
                                onClick={() => deleteComment(comment.id)}
                                className="opacity-0 group-hover:opacity-100 text-xs text-red-600 hover:underline mt-1"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ============ MAIN MODAL ============
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
