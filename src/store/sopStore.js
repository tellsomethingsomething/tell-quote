import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const MOCK_SOPS = [
    {
        id: '1',
        title: 'New Client Onboarding',
        category: 'Client Management',
        content: '# New Client Onboarding Procedure\n\n1. Receive initial inquiry\n2. Schedule discovery call\n3. Send proposal\n4. Follow up after 2 days',
        tags: ['onboarding', 'client'],
        status: 'published',
        authorName: 'Admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: '2',
        title: 'Quote Approval Workflow',
        category: 'Financial',
        content: '# Quote Approval Workflow\n\n1. Draft quote\n2. Submit for internal review\n3. Send to client\n4. Mark as Won/Lost',
        tags: ['finance', 'workflow'],
        status: 'published',
        authorName: 'Admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }
];

export const useSopStore = create(
    persist(
        (set, get) => ({
            sops: MOCK_SOPS,
            isLoading: false,
            error: null,

            addSop: (sop) => {
                const newSop = {
                    id: Math.random().toString(36).substring(2, 9),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    status: 'draft',
                    tags: [],
                    ...sop,
                };
                set((state) => ({ sops: [newSop, ...state.sops] }));
                return newSop;
            },

            updateSop: (id, updates) => {
                set((state) => ({
                    sops: state.sops.map((sop) =>
                        sop.id === id ? { ...sop, ...updates, updatedAt: new Date().toISOString() } : sop
                    ),
                }));
            },

            deleteSop: (id) => {
                set((state) => ({
                    sops: state.sops.filter((sop) => sop.id !== id),
                }));
            },

            getSop: (id) => {
                return get().sops.find((sop) => sop.id === id);
            },

            generateSop: async (title, description) => {
                set({ isLoading: true, error: null });
                try {
                    // Logic to call Anthropic via Supabase Edge Function
                    // const { data, error } = await supabase.functions.invoke('generate-sop', {
                    //   body: { title, description }
                    // });
                    // return data.content;

                    // Mock response for now
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    return `# ${title}\n\n## Purpose\nThis SOP covers ${description}.\n\n## Steps\n1. Prepare environment\n2. Execute core task\n3. Validate results`;
                } catch (err) {
                    set({ error: 'Failed to generate SOP' });
                    return null;
                } finally {
                    set({ isLoading: false });
                }
            },
        }),
        {
            name: 'tell_sop_storage',
        }
    )
);
