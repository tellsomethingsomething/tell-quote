import React, { useState } from 'react';
import { Activity } from 'lucide-react';
import { useTaskBoardStore } from '../../../store/taskBoardStore';

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

export default CommentsSection;
