import React, { useState } from 'react';
import { X, Briefcase, Lightbulb, Building2 } from 'lucide-react';
import { useTaskBoardStore } from '../../../store/taskBoardStore';
import { useProjectStore } from '../../../store/projectStore';
import { useOpportunityStore } from '../../../store/opportunityStore';
import { useClientStore } from '../../../store/clientStore';

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

export default LinkPicker;
