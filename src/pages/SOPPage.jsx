import { useState, useMemo } from 'react';
import { useSopStore } from '../store/sopStore';

export default function SOPPage() {
    const { sops, addSop, updateSop, deleteSop } = useSopStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedSop, setSelectedSop] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ title: '', category: '', content: '', tags: '' });

    const categories = useMemo(() => {
        const cats = ['All', ...new Set(sops.map(s => s.category))];
        return cats;
    }, [sops]);

    const filteredSops = useMemo(() => {
        return sops.filter(sop => {
            const matchesSearch = sop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                sop.content.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || sop.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [sops, searchQuery, selectedCategory]);

    const handleEdit = (sop) => {
        setSelectedSop(sop);
        setEditForm({
            title: sop.title,
            category: sop.category,
            content: sop.content,
            tags: sop.tags.join(', ')
        });
        setIsEditing(true);
    };

    const handleNew = () => {
        setSelectedSop(null);
        setEditForm({ title: '', category: '', content: '', tags: '' });
        setIsEditing(true);
    };

    const handleSave = (e) => {
        e.preventDefault();
        const sopData = {
            title: editForm.title,
            category: editForm.category,
            content: editForm.content,
            tags: editForm.tags.split(',').map(t => t.trim()).filter(t => t),
        };

        if (selectedSop) {
            updateSop(selectedSop.id, sopData);
        } else {
            addSop({ ...sopData, authorName: 'Current User' });
        }
        setIsEditing(false);
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-dark-bg p-4 sm:p-6 overflow-hidden">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">SOP Manager</h1>
                    <p className="text-gray-400 text-sm">Standard Operating Procedures & Guidelines</p>
                </div>
                <button
                    onClick={handleNew}
                    className="btn-primary flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New SOP
                </button>
            </div>

            {!isEditing && (
                <div className="flex flex-col h-full overflow-hidden">
                    {/* Filters & Search */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Search procedures..."
                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-accent-primary transition-colors"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <select
                            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-primary transition-colors cursor-pointer"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    {/* SOP Grid */}
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6">
                            {filteredSops.map((sop) => (
                                <div
                                    key={sop.id}
                                    className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-accent-primary/50 transition-all group flex flex-col h-full"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="px-2 py-1 rounded-md bg-accent-primary/10 text-accent-primary text-[10px] font-bold uppercase tracking-wider">
                                            {sop.category}
                                        </span>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(sop)}
                                                className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                                                title="Edit"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                    <h3 className="text-white font-semibold mb-2 group-hover:text-accent-primary transition-colors">
                                        {sop.title}
                                    </h3>
                                    <p className="text-gray-400 text-sm line-clamp-3 mb-4 flex-1">
                                        {sop.content.replace(/[#*`]/g, '')}
                                    </p>
                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                                        <span className="text-[10px] text-gray-500">Updated {new Date(sop.updatedAt).toLocaleDateString()}</span>
                                        <div className="flex gap-1">
                                            {sop.tags?.slice(0, 2).map(tag => (
                                                <span key={tag} className="text-[10px] text-gray-500">#{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {filteredSops.length === 0 && (
                                <div className="col-span-full py-12 text-center border-2 border-dashed border-white/5 rounded-2xl">
                                    <p className="text-gray-500">No procedures found matching your search.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {isEditing && (
                <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-6 overflow-y-auto">
                    <form onSubmit={handleSave} className="space-y-6 max-w-4xl mx-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white">
                                {selectedSop ? 'Edit Procedure' : 'New Procedure'}
                            </h2>
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                Cancel
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Title</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent-primary"
                                    value={editForm.title}
                                    onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Category</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent-primary"
                                    value={editForm.category}
                                    onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                                    placeholder="e.g. Finance, Client Management"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 relative">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Content (Markdown supported)</label>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        const { generateSop } = useSopStore.getState();
                                        const desc = prompt('Describe the procedure for Claude to generate:');
                                        if (desc) {
                                            const content = await generateSop(editForm.title || 'New Procedure', desc);
                                            if (content) setEditForm(prev => ({ ...prev, content }));
                                        }
                                    }}
                                    className="text-[10px] flex items-center gap-1 text-accent-primary hover:text-accent-primary/80 font-bold uppercase tracking-tighter transition-colors"
                                >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    AI Generate with Sonnet
                                </button>
                            </div>
                            <textarea
                                required
                                rows={12}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent-primary font-mono text-sm leading-relaxed"
                                value={editForm.content}
                                onChange={e => setEditForm({ ...editForm, content: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tags (comma separated)</label>
                            <input
                                type="text"
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent-primary"
                                value={editForm.tags}
                                onChange={e => setEditForm({ ...editForm, tags: e.target.value })}
                                placeholder="tag1, tag2"
                            />
                        </div>

                        <div className="pt-6 flex justify-between items-center border-t border-white/10">
                            {selectedSop && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (confirm('Are you sure you want to delete this SOP?')) {
                                            deleteSop(selectedSop.id);
                                            setIsEditing(false);
                                        }
                                    }}
                                    className="text-red-500 hover:text-red-400 text-sm font-medium transition-colors"
                                >
                                    Delete SOP
                                </button>
                            )}
                            <div className="flex gap-3 ml-auto">
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="px-6 py-2.5 rounded-lg border border-white/10 text-white hover:bg-white/5 transition-all"
                                >
                                    Discard Changes
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary px-8 py-2.5"
                                >
                                    Save SOP
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
