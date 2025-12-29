import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import logger from '../utils/logger';

// Board backgrounds/themes
export const BOARD_BACKGROUNDS = {
    blue: { id: 'blue', color: '#0079BF', label: 'Blue' },
    green: { id: 'green', color: '#519839', label: 'Green' },
    orange: { id: 'orange', color: '#D29034', label: 'Orange' },
    red: { id: 'red', color: '#B04632', label: 'Red' },
    purple: { id: 'purple', color: '#89609E', label: 'Purple' },
    pink: { id: 'pink', color: '#CD5A91', label: 'Pink' },
    gray: { id: 'gray', color: '#838C91', label: 'Gray' },
    dark: { id: 'dark', color: '#1a1a2e', label: 'Dark' },
};

// Label colors
export const LABEL_COLORS = {
    green: { id: 'green', color: '#61BD4F', label: 'Green' },
    yellow: { id: 'yellow', color: '#F2D600', label: 'Yellow' },
    orange: { id: 'orange', color: '#FF9F1A', label: 'Orange' },
    red: { id: 'red', color: '#EB5A46', label: 'Red' },
    purple: { id: 'purple', color: '#C377E0', label: 'Purple' },
    blue: { id: 'blue', color: '#0079BF', label: 'Blue' },
    sky: { id: 'sky', color: '#00C2E0', label: 'Sky' },
    lime: { id: 'lime', color: '#51E898', label: 'Lime' },
    pink: { id: 'pink', color: '#FF78CB', label: 'Pink' },
    black: { id: 'black', color: '#344563', label: 'Black' },
};

// Card priorities
export const CARD_PRIORITIES = {
    urgent: { id: 'urgent', label: 'Urgent', color: '#EB5A46', icon: '🔴' },
    high: { id: 'high', label: 'High', color: '#FF9F1A', icon: '🟠' },
    medium: { id: 'medium', label: 'Medium', color: '#F2D600', icon: '🟡' },
    low: { id: 'low', label: 'Low', color: '#61BD4F', icon: '🟢' },
    none: { id: 'none', label: 'None', color: '#838C91', icon: '⚪' },
};

// Default lists for new boards
export const DEFAULT_LISTS = [
    { title: 'To Do', position: 0 },
    { title: 'In Progress', position: 1 },
    { title: 'Review', position: 2 },
    { title: 'Done', position: 3 },
];

export const useTaskBoardStore = create(
    subscribeWithSelector((set, get) => ({
        // State
        boards: [],
        currentBoard: null,
        lists: [],
        cards: [],
        labels: [],
        loading: false,
        error: null,

        // Drag state
        draggedCard: null,
        draggedList: null,
        dragOverList: null,
        dragOverCard: null,

        // UI state
        selectedCard: null,
        cardDetailOpen: false,

        // ============ BOARD OPERATIONS ============

        loadBoards: async () => {
            set({ loading: true, error: null });
            try {
                const { data, error } = await supabase
                    .from('task_boards')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                set({ boards: data || [], loading: false });
            } catch (error) {
                logger.error('Error loading boards:', error);
                set({ error: error.message, loading: false });
            }
        },

        createBoard: async (boardData) => {
            try {
                const { data: board, error } = await supabase
                    .from('task_boards')
                    .insert({
                        name: boardData.name,
                        description: boardData.description || '',
                        background: boardData.background || 'blue',
                        is_template: boardData.is_template || false,
                        settings: boardData.settings || {},
                    })
                    .select()
                    .single();

                if (error) throw error;

                // Create default lists
                const listsToCreate = (boardData.lists || DEFAULT_LISTS).map((list, index) => ({
                    board_id: board.id,
                    title: list.title,
                    position: list.position ?? index,
                }));

                const { error: listsError } = await supabase
                    .from('task_lists')
                    .insert(listsToCreate);

                if (listsError) throw listsError;

                // Create default labels
                const labelsToCreate = Object.values(LABEL_COLORS).map(color => ({
                    board_id: board.id,
                    name: '',
                    color: color.id,
                }));

                const { error: labelsError } = await supabase
                    .from('task_labels')
                    .insert(labelsToCreate);

                if (labelsError) throw labelsError;

                set(state => ({ boards: [board, ...state.boards] }));
                return board;
            } catch (error) {
                logger.error('Error creating board:', error);
                throw error;
            }
        },

        updateBoard: async (boardId, updates) => {
            try {
                const { data, error } = await supabase
                    .from('task_boards')
                    .update({
                        ...updates,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', boardId)
                    .select()
                    .single();

                if (error) throw error;

                set(state => ({
                    boards: state.boards.map(b => b.id === boardId ? data : b),
                    currentBoard: state.currentBoard?.id === boardId ? data : state.currentBoard,
                }));
                return data;
            } catch (error) {
                logger.error('Error updating board:', error);
                throw error;
            }
        },

        deleteBoard: async (boardId) => {
            try {
                const { error } = await supabase
                    .from('task_boards')
                    .delete()
                    .eq('id', boardId);

                if (error) throw error;

                set(state => ({
                    boards: state.boards.filter(b => b.id !== boardId),
                    currentBoard: state.currentBoard?.id === boardId ? null : state.currentBoard,
                }));
            } catch (error) {
                logger.error('Error deleting board:', error);
                throw error;
            }
        },

        // ============ LOAD BOARD DATA ============

        loadBoard: async (boardId) => {
            set({ loading: true, error: null });
            try {
                // Load board
                const { data: board, error: boardError } = await supabase
                    .from('task_boards')
                    .select('*')
                    .eq('id', boardId)
                    .single();

                if (boardError) throw boardError;

                // Load lists
                const { data: lists, error: listsError } = await supabase
                    .from('task_lists')
                    .select('*')
                    .eq('board_id', boardId)
                    .order('position', { ascending: true });

                if (listsError) throw listsError;

                // Load cards with all related data
                const { data: cards, error: cardsError } = await supabase
                    .from('task_cards')
                    .select(`
                        *,
                        assignees:task_card_assignees(user_id, users:user_id(id, name, avatar_url)),
                        card_labels:task_card_labels(label_id),
                        checklists:task_checklists(*, items:task_checklist_items(*)),
                        comments:task_comments(*, user:user_id(id, name, avatar_url)),
                        attachments:task_attachments(*)
                    `)
                    .eq('board_id', boardId)
                    .order('position', { ascending: true });

                if (cardsError) throw cardsError;

                // Load labels
                const { data: labels, error: labelsError } = await supabase
                    .from('task_labels')
                    .select('*')
                    .eq('board_id', boardId);

                if (labelsError) throw labelsError;

                set({
                    currentBoard: board,
                    lists: lists || [],
                    cards: cards || [],
                    labels: labels || [],
                    loading: false,
                });
            } catch (error) {
                logger.error('Error loading board:', error);
                set({ error: error.message, loading: false });
            }
        },

        // ============ LIST OPERATIONS ============

        createList: async (boardId, title, position = null) => {
            try {
                const { lists } = get();
                const newPosition = position ?? lists.length;

                const { data, error } = await supabase
                    .from('task_lists')
                    .insert({
                        board_id: boardId,
                        title,
                        position: newPosition,
                    })
                    .select()
                    .single();

                if (error) throw error;

                set(state => ({ lists: [...state.lists, data] }));
                return data;
            } catch (error) {
                logger.error('Error creating list:', error);
                throw error;
            }
        },

        updateList: async (listId, updates) => {
            try {
                const { data, error } = await supabase
                    .from('task_lists')
                    .update(updates)
                    .eq('id', listId)
                    .select()
                    .single();

                if (error) throw error;

                set(state => ({
                    lists: state.lists.map(l => l.id === listId ? data : l),
                }));
                return data;
            } catch (error) {
                logger.error('Error updating list:', error);
                throw error;
            }
        },

        deleteList: async (listId) => {
            try {
                const { error } = await supabase
                    .from('task_lists')
                    .delete()
                    .eq('id', listId);

                if (error) throw error;

                set(state => ({
                    lists: state.lists.filter(l => l.id !== listId),
                    cards: state.cards.filter(c => c.list_id !== listId),
                }));
            } catch (error) {
                logger.error('Error deleting list:', error);
                throw error;
            }
        },

        moveList: async (listId, newPosition) => {
            const { lists, currentBoard } = get();
            const oldList = lists.find(l => l.id === listId);
            if (!oldList) return;

            const oldPosition = oldList.position;

            // Optimistic update
            const updatedLists = lists.map(list => {
                if (list.id === listId) {
                    return { ...list, position: newPosition };
                }
                if (oldPosition < newPosition) {
                    // Moving right: shift items between old and new position left
                    if (list.position > oldPosition && list.position <= newPosition) {
                        return { ...list, position: list.position - 1 };
                    }
                } else {
                    // Moving left: shift items between new and old position right
                    if (list.position >= newPosition && list.position < oldPosition) {
                        return { ...list, position: list.position + 1 };
                    }
                }
                return list;
            });

            set({ lists: updatedLists.sort((a, b) => a.position - b.position) });

            // Persist changes
            try {
                const updates = updatedLists
                    .filter(l => l.position !== lists.find(ol => ol.id === l.id)?.position)
                    .map(l => supabase
                        .from('task_lists')
                        .update({ position: l.position })
                        .eq('id', l.id)
                    );

                await Promise.all(updates);
            } catch (error) {
                logger.error('Error moving list:', error);
                // Revert on error
                set({ lists });
            }
        },

        // ============ CARD OPERATIONS ============

        createCard: async (listId, cardData) => {
            try {
                const { cards, currentBoard } = get();
                const listCards = cards.filter(c => c.list_id === listId);
                const position = listCards.length;

                const { data, error } = await supabase
                    .from('task_cards')
                    .insert({
                        board_id: currentBoard.id,
                        list_id: listId,
                        title: cardData.title,
                        description: cardData.description || '',
                        position,
                        priority: cardData.priority || 'none',
                        due_date: cardData.due_date || null,
                        cover_color: cardData.cover_color || null,
                        cover_image: cardData.cover_image || null,
                    })
                    .select()
                    .single();

                if (error) throw error;

                // Add empty arrays for related data
                const cardWithRelations = {
                    ...data,
                    assignees: [],
                    card_labels: [],
                    checklists: [],
                    comments: [],
                    attachments: [],
                };

                set(state => ({ cards: [...state.cards, cardWithRelations] }));
                return cardWithRelations;
            } catch (error) {
                logger.error('Error creating card:', error);
                throw error;
            }
        },

        updateCard: async (cardId, updates) => {
            try {
                const { data, error } = await supabase
                    .from('task_cards')
                    .update({
                        ...updates,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', cardId)
                    .select()
                    .single();

                if (error) throw error;

                set(state => ({
                    cards: state.cards.map(c => c.id === cardId ? { ...c, ...data } : c),
                    selectedCard: state.selectedCard?.id === cardId ? { ...state.selectedCard, ...data } : state.selectedCard,
                }));
                return data;
            } catch (error) {
                logger.error('Error updating card:', error);
                throw error;
            }
        },

        deleteCard: async (cardId) => {
            try {
                const { error } = await supabase
                    .from('task_cards')
                    .delete()
                    .eq('id', cardId);

                if (error) throw error;

                set(state => ({
                    cards: state.cards.filter(c => c.id !== cardId),
                    selectedCard: state.selectedCard?.id === cardId ? null : state.selectedCard,
                    cardDetailOpen: state.selectedCard?.id === cardId ? false : state.cardDetailOpen,
                }));
            } catch (error) {
                logger.error('Error deleting card:', error);
                throw error;
            }
        },

        moveCard: async (cardId, targetListId, targetPosition) => {
            const { cards } = get();
            const card = cards.find(c => c.id === cardId);
            if (!card) return;

            const sourceListId = card.list_id;
            const sourcePosition = card.position;

            // Optimistic update
            let updatedCards = [...cards];

            if (sourceListId === targetListId) {
                // Moving within same list
                updatedCards = cards.map(c => {
                    if (c.list_id !== sourceListId) return c;
                    if (c.id === cardId) {
                        return { ...c, position: targetPosition };
                    }
                    if (sourcePosition < targetPosition) {
                        if (c.position > sourcePosition && c.position <= targetPosition) {
                            return { ...c, position: c.position - 1 };
                        }
                    } else {
                        if (c.position >= targetPosition && c.position < sourcePosition) {
                            return { ...c, position: c.position + 1 };
                        }
                    }
                    return c;
                });
            } else {
                // Moving to different list
                updatedCards = cards.map(c => {
                    if (c.id === cardId) {
                        return { ...c, list_id: targetListId, position: targetPosition };
                    }
                    // Shift down cards in source list
                    if (c.list_id === sourceListId && c.position > sourcePosition) {
                        return { ...c, position: c.position - 1 };
                    }
                    // Shift up cards in target list
                    if (c.list_id === targetListId && c.position >= targetPosition) {
                        return { ...c, position: c.position + 1 };
                    }
                    return c;
                });
            }

            set({ cards: updatedCards });

            // Persist
            try {
                await supabase
                    .from('task_cards')
                    .update({ list_id: targetListId, position: targetPosition })
                    .eq('id', cardId);

                // Update positions for affected cards
                const affectedCards = updatedCards.filter(c => {
                    const original = cards.find(oc => oc.id === c.id);
                    return original && (original.position !== c.position || original.list_id !== c.list_id);
                });

                for (const c of affectedCards) {
                    if (c.id !== cardId) {
                        await supabase
                            .from('task_cards')
                            .update({ position: c.position })
                            .eq('id', c.id);
                    }
                }
            } catch (error) {
                logger.error('Error moving card:', error);
                set({ cards });
            }
        },

        duplicateCard: async (cardId) => {
            try {
                const { cards, currentBoard } = get();
                const card = cards.find(c => c.id === cardId);
                if (!card) return;

                const listCards = cards.filter(c => c.list_id === card.list_id);
                const position = listCards.length;

                const { data, error } = await supabase
                    .from('task_cards')
                    .insert({
                        board_id: currentBoard.id,
                        list_id: card.list_id,
                        title: `${card.title} (copy)`,
                        description: card.description,
                        position,
                        priority: card.priority,
                        due_date: card.due_date,
                        cover_color: card.cover_color,
                        cover_image: card.cover_image,
                    })
                    .select()
                    .single();

                if (error) throw error;

                const newCard = {
                    ...data,
                    assignees: [],
                    card_labels: [],
                    checklists: [],
                    comments: [],
                    attachments: [],
                };

                set(state => ({ cards: [...state.cards, newCard] }));
                return newCard;
            } catch (error) {
                logger.error('Error duplicating card:', error);
                throw error;
            }
        },

        // ============ LABEL OPERATIONS ============

        updateLabel: async (labelId, updates) => {
            try {
                const { data, error } = await supabase
                    .from('task_labels')
                    .update(updates)
                    .eq('id', labelId)
                    .select()
                    .single();

                if (error) throw error;

                set(state => ({
                    labels: state.labels.map(l => l.id === labelId ? data : l),
                }));
                return data;
            } catch (error) {
                logger.error('Error updating label:', error);
                throw error;
            }
        },

        addLabelToCard: async (cardId, labelId) => {
            try {
                const { error } = await supabase
                    .from('task_card_labels')
                    .insert({ card_id: cardId, label_id: labelId });

                if (error && !error.message.includes('duplicate')) throw error;

                set(state => ({
                    cards: state.cards.map(c => {
                        if (c.id !== cardId) return c;
                        const hasLabel = c.card_labels?.some(cl => cl.label_id === labelId);
                        if (hasLabel) return c;
                        return {
                            ...c,
                            card_labels: [...(c.card_labels || []), { label_id: labelId }],
                        };
                    }),
                    selectedCard: state.selectedCard?.id === cardId ? {
                        ...state.selectedCard,
                        card_labels: [...(state.selectedCard.card_labels || []), { label_id: labelId }],
                    } : state.selectedCard,
                }));
            } catch (error) {
                logger.error('Error adding label to card:', error);
                throw error;
            }
        },

        removeLabelFromCard: async (cardId, labelId) => {
            try {
                const { error } = await supabase
                    .from('task_card_labels')
                    .delete()
                    .eq('card_id', cardId)
                    .eq('label_id', labelId);

                if (error) throw error;

                set(state => ({
                    cards: state.cards.map(c => {
                        if (c.id !== cardId) return c;
                        return {
                            ...c,
                            card_labels: (c.card_labels || []).filter(cl => cl.label_id !== labelId),
                        };
                    }),
                    selectedCard: state.selectedCard?.id === cardId ? {
                        ...state.selectedCard,
                        card_labels: (state.selectedCard.card_labels || []).filter(cl => cl.label_id !== labelId),
                    } : state.selectedCard,
                }));
            } catch (error) {
                logger.error('Error removing label from card:', error);
                throw error;
            }
        },

        // ============ CHECKLIST OPERATIONS ============

        addChecklist: async (cardId, title = 'Checklist') => {
            try {
                const { data, error } = await supabase
                    .from('task_checklists')
                    .insert({ card_id: cardId, title, position: 0 })
                    .select()
                    .single();

                if (error) throw error;

                const checklist = { ...data, items: [] };

                set(state => ({
                    cards: state.cards.map(c => {
                        if (c.id !== cardId) return c;
                        return {
                            ...c,
                            checklists: [...(c.checklists || []), checklist],
                        };
                    }),
                    selectedCard: state.selectedCard?.id === cardId ? {
                        ...state.selectedCard,
                        checklists: [...(state.selectedCard.checklists || []), checklist],
                    } : state.selectedCard,
                }));
                return checklist;
            } catch (error) {
                logger.error('Error adding checklist:', error);
                throw error;
            }
        },

        deleteChecklist: async (checklistId) => {
            try {
                const { error } = await supabase
                    .from('task_checklists')
                    .delete()
                    .eq('id', checklistId);

                if (error) throw error;

                set(state => ({
                    cards: state.cards.map(c => ({
                        ...c,
                        checklists: (c.checklists || []).filter(cl => cl.id !== checklistId),
                    })),
                    selectedCard: state.selectedCard ? {
                        ...state.selectedCard,
                        checklists: (state.selectedCard.checklists || []).filter(cl => cl.id !== checklistId),
                    } : null,
                }));
            } catch (error) {
                logger.error('Error deleting checklist:', error);
                throw error;
            }
        },

        addChecklistItem: async (checklistId, text) => {
            try {
                const { cards, selectedCard } = get();
                const card = cards.find(c => c.checklists?.some(cl => cl.id === checklistId));
                const checklist = card?.checklists?.find(cl => cl.id === checklistId);
                const position = checklist?.items?.length || 0;

                const { data, error } = await supabase
                    .from('task_checklist_items')
                    .insert({ checklist_id: checklistId, text, position, is_complete: false })
                    .select()
                    .single();

                if (error) throw error;

                set(state => ({
                    cards: state.cards.map(c => ({
                        ...c,
                        checklists: (c.checklists || []).map(cl => {
                            if (cl.id !== checklistId) return cl;
                            return { ...cl, items: [...(cl.items || []), data] };
                        }),
                    })),
                    selectedCard: state.selectedCard ? {
                        ...state.selectedCard,
                        checklists: (state.selectedCard.checklists || []).map(cl => {
                            if (cl.id !== checklistId) return cl;
                            return { ...cl, items: [...(cl.items || []), data] };
                        }),
                    } : null,
                }));
                return data;
            } catch (error) {
                logger.error('Error adding checklist item:', error);
                throw error;
            }
        },

        updateChecklistItem: async (itemId, updates) => {
            try {
                const { data, error } = await supabase
                    .from('task_checklist_items')
                    .update(updates)
                    .eq('id', itemId)
                    .select()
                    .single();

                if (error) throw error;

                set(state => ({
                    cards: state.cards.map(c => ({
                        ...c,
                        checklists: (c.checklists || []).map(cl => ({
                            ...cl,
                            items: (cl.items || []).map(item => item.id === itemId ? data : item),
                        })),
                    })),
                    selectedCard: state.selectedCard ? {
                        ...state.selectedCard,
                        checklists: (state.selectedCard.checklists || []).map(cl => ({
                            ...cl,
                            items: (cl.items || []).map(item => item.id === itemId ? data : item),
                        })),
                    } : null,
                }));
                return data;
            } catch (error) {
                logger.error('Error updating checklist item:', error);
                throw error;
            }
        },

        deleteChecklistItem: async (itemId) => {
            try {
                const { error } = await supabase
                    .from('task_checklist_items')
                    .delete()
                    .eq('id', itemId);

                if (error) throw error;

                set(state => ({
                    cards: state.cards.map(c => ({
                        ...c,
                        checklists: (c.checklists || []).map(cl => ({
                            ...cl,
                            items: (cl.items || []).filter(item => item.id !== itemId),
                        })),
                    })),
                    selectedCard: state.selectedCard ? {
                        ...state.selectedCard,
                        checklists: (state.selectedCard.checklists || []).map(cl => ({
                            ...cl,
                            items: (cl.items || []).filter(item => item.id !== itemId),
                        })),
                    } : null,
                }));
            } catch (error) {
                logger.error('Error deleting checklist item:', error);
                throw error;
            }
        },

        // ============ COMMENT OPERATIONS ============

        addComment: async (cardId, text, userId) => {
            try {
                const { data, error } = await supabase
                    .from('task_comments')
                    .insert({ card_id: cardId, user_id: userId, text })
                    .select(`*, user:user_id(id, name, avatar_url)`)
                    .single();

                if (error) throw error;

                set(state => ({
                    cards: state.cards.map(c => {
                        if (c.id !== cardId) return c;
                        return {
                            ...c,
                            comments: [data, ...(c.comments || [])],
                        };
                    }),
                    selectedCard: state.selectedCard?.id === cardId ? {
                        ...state.selectedCard,
                        comments: [data, ...(state.selectedCard.comments || [])],
                    } : state.selectedCard,
                }));
                return data;
            } catch (error) {
                logger.error('Error adding comment:', error);
                throw error;
            }
        },

        deleteComment: async (commentId) => {
            try {
                const { error } = await supabase
                    .from('task_comments')
                    .delete()
                    .eq('id', commentId);

                if (error) throw error;

                set(state => ({
                    cards: state.cards.map(c => ({
                        ...c,
                        comments: (c.comments || []).filter(cm => cm.id !== commentId),
                    })),
                    selectedCard: state.selectedCard ? {
                        ...state.selectedCard,
                        comments: (state.selectedCard.comments || []).filter(cm => cm.id !== commentId),
                    } : null,
                }));
            } catch (error) {
                logger.error('Error deleting comment:', error);
                throw error;
            }
        },

        // ============ ASSIGNEE OPERATIONS ============

        addAssignee: async (cardId, userId) => {
            try {
                const { error } = await supabase
                    .from('task_card_assignees')
                    .insert({ card_id: cardId, user_id: userId });

                if (error && !error.message.includes('duplicate')) throw error;

                // Get user info
                const { data: user } = await supabase
                    .from('users')
                    .select('id, name, avatar_url')
                    .eq('id', userId)
                    .single();

                const assignee = { user_id: userId, users: user };

                set(state => ({
                    cards: state.cards.map(c => {
                        if (c.id !== cardId) return c;
                        const hasAssignee = c.assignees?.some(a => a.user_id === userId);
                        if (hasAssignee) return c;
                        return {
                            ...c,
                            assignees: [...(c.assignees || []), assignee],
                        };
                    }),
                    selectedCard: state.selectedCard?.id === cardId ? {
                        ...state.selectedCard,
                        assignees: [...(state.selectedCard.assignees || []), assignee],
                    } : state.selectedCard,
                }));
            } catch (error) {
                logger.error('Error adding assignee:', error);
                throw error;
            }
        },

        removeAssignee: async (cardId, userId) => {
            try {
                const { error } = await supabase
                    .from('task_card_assignees')
                    .delete()
                    .eq('card_id', cardId)
                    .eq('user_id', userId);

                if (error) throw error;

                set(state => ({
                    cards: state.cards.map(c => {
                        if (c.id !== cardId) return c;
                        return {
                            ...c,
                            assignees: (c.assignees || []).filter(a => a.user_id !== userId),
                        };
                    }),
                    selectedCard: state.selectedCard?.id === cardId ? {
                        ...state.selectedCard,
                        assignees: (state.selectedCard.assignees || []).filter(a => a.user_id !== userId),
                    } : state.selectedCard,
                }));
            } catch (error) {
                logger.error('Error removing assignee:', error);
                throw error;
            }
        },

        // ============ DRAG & DROP ============

        setDraggedCard: (card) => set({ draggedCard: card }),
        setDraggedList: (list) => set({ draggedList: list }),
        setDragOverList: (listId) => set({ dragOverList: listId }),
        setDragOverCard: (cardId) => set({ dragOverCard: cardId }),
        clearDragState: () => set({
            draggedCard: null,
            draggedList: null,
            dragOverList: null,
            dragOverCard: null,
        }),

        // ============ UI STATE ============

        openCardDetail: (card) => set({ selectedCard: card, cardDetailOpen: true }),
        closeCardDetail: () => set({ selectedCard: null, cardDetailOpen: false }),

        // ============ HELPERS ============

        getListCards: (listId) => {
            const { cards } = get();
            return cards
                .filter(c => c.list_id === listId)
                .sort((a, b) => a.position - b.position);
        },

        getCardLabel: (labelId) => {
            const { labels } = get();
            return labels.find(l => l.id === labelId);
        },

        getChecklistProgress: (card) => {
            if (!card?.checklists?.length) return null;

            let total = 0;
            let completed = 0;

            card.checklists.forEach(cl => {
                cl.items?.forEach(item => {
                    total++;
                    if (item.is_complete) completed++;
                });
            });

            return total > 0 ? { total, completed, percent: Math.round((completed / total) * 100) } : null;
        },
    }))
);

// Helper to format due date
export const formatDueDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: 'Overdue', status: 'overdue' };
    if (diffDays === 0) return { text: 'Today', status: 'due-soon' };
    if (diffDays === 1) return { text: 'Tomorrow', status: 'due-soon' };
    if (diffDays <= 7) return { text: d.toLocaleDateString('en-US', { weekday: 'short' }), status: 'upcoming' };
    return { text: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), status: 'normal' };
};
