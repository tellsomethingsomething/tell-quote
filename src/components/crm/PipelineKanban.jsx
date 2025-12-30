/**
 * Pipeline Kanban View
 * Drag-and-drop sales pipeline with stage columns
 */

import { useState, useMemo } from 'react';
import { DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PIPELINE_STAGES, PIPELINE_STAGE_ORDER } from '../../store/opportunityStore';
import { formatCurrency, convertCurrency } from '../../utils/currency';

// Format date helper
const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

// Droppable stage column
function DroppableStage({ stageId, children, isOver }) {
    const { setNodeRef } = useDroppable({ id: stageId });
    const stage = PIPELINE_STAGES[stageId];

    return (
        <div
            ref={setNodeRef}
            className={`flex-1 min-w-[280px] max-w-[320px] flex flex-col rounded-xl transition-all ${
                isOver ? 'ring-2 ring-offset-2 ring-offset-dark-bg' : ''
            }`}
            style={{
                borderColor: isOver ? stage.color : 'transparent',
                '--ring-color': stage.color
            }}
        >
            {children}
        </div>
    );
}

// Sortable opportunity card for pipeline
function SortablePipelineCard({ opportunity, onSelect, onDelete, dashboardCurrency, rates }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: opportunity.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const convertedValue = useMemo(() => {
        return convertCurrency(opportunity.value || 0, opportunity.currency || 'USD', dashboardCurrency, rates);
    }, [opportunity.value, opportunity.currency, dashboardCurrency, rates]);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-dark-card border border-dark-border rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-gray-600 transition-all ${
                isDragging ? 'shadow-xl ring-2 ring-accent-primary/50' : ''
            }`}
            {...attributes}
            {...listeners}
        >
            {/* Title row */}
            <div className="flex items-start justify-between gap-2 mb-2">
                <h4
                    onClick={(e) => { e.stopPropagation(); onSelect(opportunity.id); }}
                    className="font-medium text-sm text-gray-200 hover:text-accent-primary cursor-pointer line-clamp-2"
                >
                    {opportunity.title || 'Untitled'}
                </h4>
                <button
                    onClick={(e) => { e.stopPropagation(); onSelect(opportunity.id); }}
                    className="p-1 text-gray-500 hover:text-accent-primary flex-shrink-0"
                >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                </button>
            </div>

            {/* Client */}
            {opportunity.client?.company && (
                <p className="text-xs text-gray-500 mb-2 truncate">
                    {opportunity.client.company}
                </p>
            )}

            {/* Value */}
            <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-emerald-400">
                    {formatCurrency(convertedValue, dashboardCurrency, 0)}
                </span>
                {opportunity.probability > 0 && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">
                        {opportunity.probability}%
                    </span>
                )}
            </div>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-2 mt-2 text-[10px] text-gray-500">
                {opportunity.country && (
                    <span className="px-1.5 py-0.5 bg-dark-bg rounded">{opportunity.country}</span>
                )}
                {opportunity.expectedCloseDate && (
                    <span className="text-purple-400">
                        {formatDate(opportunity.expectedCloseDate)}
                    </span>
                )}
            </div>

            {/* Next action */}
            {opportunity.nextAction && (
                <div className="mt-2 pt-2 border-t border-dark-border">
                    <p className="text-[10px] text-cyan-400 truncate">
                        → {opportunity.nextAction}
                    </p>
                </div>
            )}
        </div>
    );
}

// Pipeline card for drag overlay
function PipelineCardOverlay({ opportunity, dashboardCurrency, rates }) {
    const convertedValue = convertCurrency(opportunity.value || 0, opportunity.currency || 'USD', dashboardCurrency, rates);

    return (
        <div className="bg-dark-card border-2 border-accent-primary rounded-lg p-3 shadow-2xl min-w-[250px]">
            <h4 className="font-medium text-sm text-gray-200 mb-1">
                {opportunity.title || 'Untitled'}
            </h4>
            <span className="text-sm font-semibold text-emerald-400">
                {formatCurrency(convertedValue, dashboardCurrency, 0)}
            </span>
        </div>
    );
}

export default function PipelineKanban({
    opportunities,
    onSelectOpportunity,
    onDeleteOpportunity,
    onUpdateStage,
    dashboardCurrency = 'USD',
    rates = {}
}) {
    const [activeId, setActiveId] = useState(null);
    const [overStage, setOverStage] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        })
    );

    // Group opportunities by stage
    const groupedByStage = useMemo(() => {
        const grouped = {};
        PIPELINE_STAGE_ORDER.forEach(stageId => {
            grouped[stageId] = [];
        });

        opportunities.forEach(opp => {
            const stage = opp.stage || 'lead';
            if (grouped[stage]) {
                grouped[stage].push(opp);
            } else {
                grouped['lead'].push(opp);
            }
        });

        return grouped;
    }, [opportunities]);

    // Calculate stage totals
    const stageTotals = useMemo(() => {
        const totals = {};
        PIPELINE_STAGE_ORDER.forEach(stageId => {
            const stageOpps = groupedByStage[stageId] || [];
            totals[stageId] = {
                count: stageOpps.length,
                value: stageOpps.reduce((sum, o) => {
                    return sum + convertCurrency(o.value || 0, o.currency || 'USD', dashboardCurrency, rates);
                }, 0),
                weighted: stageOpps.reduce((sum, o) => {
                    const prob = (o.probability || 0) / 100;
                    const converted = convertCurrency(o.value || 0, o.currency || 'USD', dashboardCurrency, rates);
                    return sum + converted * prob;
                }, 0),
            };
        });
        return totals;
    }, [groupedByStage, dashboardCurrency, rates]);

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragOver = (event) => {
        const { over } = event;
        if (over && PIPELINE_STAGE_ORDER.includes(over.id)) {
            setOverStage(over.id);
        } else {
            setOverStage(null);
        }
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveId(null);
        setOverStage(null);

        if (!over) return;

        // Check if dropped on a stage
        if (PIPELINE_STAGE_ORDER.includes(over.id)) {
            const opportunity = opportunities.find(o => o.id === active.id);
            if (opportunity && opportunity.stage !== over.id) {
                onUpdateStage(active.id, over.id);
            }
        }
    };

    const activeOpportunity = activeId ? opportunities.find(o => o.id === activeId) : null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-4 overflow-x-auto pb-4">
                {PIPELINE_STAGE_ORDER.map(stageId => {
                    const stage = PIPELINE_STAGES[stageId];
                    const stageOpps = groupedByStage[stageId] || [];
                    const totals = stageTotals[stageId];
                    const isOver = overStage === stageId;
                    const oppIds = stageOpps.map(o => o.id);

                    return (
                        <DroppableStage key={stageId} stageId={stageId} isOver={isOver}>
                            {/* Stage header */}
                            <div
                                className="rounded-t-xl px-3 py-2 border-b-2"
                                style={{
                                    backgroundColor: `${stage.color}15`,
                                    borderColor: stage.color
                                }}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-semibold text-sm" style={{ color: stage.color }}>
                                        {stage.label}
                                    </h3>
                                    <span
                                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                                        style={{
                                            backgroundColor: `${stage.color}20`,
                                            color: stage.color
                                        }}
                                    >
                                        {totals.count}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-gray-400">
                                    <span>{formatCurrency(totals.value, dashboardCurrency, 0)}</span>
                                    {stageId !== 'won' && stageId !== 'lost' && totals.weighted > 0 && (
                                        <span className="text-amber-400">
                                            ~{formatCurrency(totals.weighted, dashboardCurrency, 0)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Cards container */}
                            <div
                                className="flex-1 p-2 space-y-2 bg-dark-bg/30 rounded-b-xl min-h-[200px] overflow-y-auto max-h-[calc(100vh-320px)]"
                            >
                                <SortableContext items={oppIds} strategy={verticalListSortingStrategy}>
                                    {stageOpps.map(opp => (
                                        <SortablePipelineCard
                                            key={opp.id}
                                            opportunity={opp}
                                            onSelect={onSelectOpportunity}
                                            onDelete={onDeleteOpportunity}
                                            dashboardCurrency={dashboardCurrency}
                                            rates={rates}
                                        />
                                    ))}
                                </SortableContext>

                                {/* Empty state */}
                                {stageOpps.length === 0 && (
                                    <div className="flex items-center justify-center h-24 border-2 border-dashed border-dark-border rounded-lg">
                                        <p className="text-xs text-gray-600">Drop here</p>
                                    </div>
                                )}
                            </div>
                        </DroppableStage>
                    );
                })}
            </div>

            {/* Drag overlay */}
            <DragOverlay>
                {activeOpportunity && (
                    <PipelineCardOverlay
                        opportunity={activeOpportunity}
                        dashboardCurrency={dashboardCurrency}
                        rates={rates}
                    />
                )}
            </DragOverlay>
        </DndContext>
    );
}
