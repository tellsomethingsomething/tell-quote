import React from 'react';
import { Briefcase, Lightbulb, Building2 } from 'lucide-react';
import { useProjectStore } from '../../../store/projectStore';
import { useOpportunityStore } from '../../../store/opportunityStore';
import { useClientStore } from '../../../store/clientStore';

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

export default LinkedEntities;
