import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, File, Image, FileText, Table, Presentation, Archive, AlertCircle, Check } from 'lucide-react';
import { useDocumentStore, getFileTypeConfig, formatFileSize, DOCUMENT_TAGS } from '../../store/documentStore';

// File icon mapping
const FILE_ICONS = {
    pdf: FileText,
    doc: FileText,
    docx: FileText,
    xls: Table,
    xlsx: Table,
    ppt: Presentation,
    pptx: Presentation,
    png: Image,
    jpg: Image,
    jpeg: Image,
    gif: Image,
    svg: Image,
    webp: Image,
    zip: Archive,
    rar: Archive,
};

function getFileIcon(filename) {
    const ext = filename?.split('.').pop()?.toLowerCase() || '';
    return FILE_ICONS[ext] || File;
}

export default function DocumentUploader({
    entityLinks = {},
    onUploadComplete,
    maxFiles = 10,
    maxFileSize = 50 * 1024 * 1024, // 50MB
    accept = '*/*',
    compact = false,
}) {
    const { uploadDocument, isUploading, uploadProgress } = useDocumentStore();

    const [dragActive, setDragActive] = useState(false);
    const [files, setFiles] = useState([]);
    const [errors, setErrors] = useState([]);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [description, setDescription] = useState('');

    const inputRef = useRef(null);

    // Handle drag events
    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    // Handle drop
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const droppedFiles = Array.from(e.dataTransfer.files);
        validateAndAddFiles(droppedFiles);
    }, []);

    // Handle file selection
    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files);
        validateAndAddFiles(selectedFiles);
        e.target.value = ''; // Reset input
    };

    // Validate and add files
    const validateAndAddFiles = (newFiles) => {
        const validFiles = [];
        const newErrors = [];

        for (const file of newFiles) {
            // Check file count
            if (files.length + validFiles.length >= maxFiles) {
                newErrors.push(`Maximum ${maxFiles} files allowed`);
                break;
            }

            // Check file size
            if (file.size > maxFileSize) {
                newErrors.push(`${file.name} exceeds ${formatFileSize(maxFileSize)} limit`);
                continue;
            }

            // Check for duplicates
            if (files.some(f => f.name === file.name && f.size === file.size)) {
                newErrors.push(`${file.name} already added`);
                continue;
            }

            validFiles.push(file);
        }

        setFiles(prev => [...prev, ...validFiles]);
        setErrors(newErrors);
    };

    // Remove file from list
    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Toggle tag selection
    const toggleTag = (tagId) => {
        setSelectedTags(prev =>
            prev.includes(tagId)
                ? prev.filter(t => t !== tagId)
                : [...prev, tagId]
        );
    };

    // Upload all files
    const handleUpload = async () => {
        const uploaded = [];
        const failedUploads = [];

        for (const file of files) {
            const result = await uploadDocument(file, entityLinks, {
                tags: selectedTags,
                description,
            });

            if (result.success) {
                uploaded.push(result.document);
            } else {
                failedUploads.push({ file, error: result.error });
            }
        }

        setUploadedFiles(uploaded);
        setFiles([]);
        setSelectedTags([]);
        setDescription('');

        if (failedUploads.length > 0) {
            setErrors(failedUploads.map(f => `Failed to upload ${f.file.name}: ${f.error}`));
        }

        if (onUploadComplete && uploaded.length > 0) {
            onUploadComplete(uploaded);
        }
    };

    // Compact mode - just a button that opens file picker
    if (compact) {
        return (
            <>
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept={accept}
                    onChange={handleFileSelect}
                    className="hidden"
                />
                <button
                    onClick={() => inputRef.current?.click()}
                    disabled={isUploading}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-dark-border text-gray-300 rounded-lg hover:bg-dark-border/80 hover:text-white disabled:opacity-50"
                >
                    <Upload className="w-4 h-4" />
                    {isUploading ? 'Uploading...' : 'Upload File'}
                </button>
            </>
        );
    }

    return (
        <div className="space-y-4">
            {/* Drop Zone */}
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`
                    relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                    ${dragActive
                        ? 'border-brand-primary bg-brand-primary/5'
                        : 'border-dark-border hover:border-gray-500 bg-dark-card/30'
                    }
                `}
            >
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept={accept}
                    onChange={handleFileSelect}
                    className="hidden"
                />

                <Upload className={`w-10 h-10 mx-auto mb-3 ${dragActive ? 'text-brand-primary' : 'text-gray-400'}`} />
                <p className="text-gray-300 mb-1">
                    {dragActive ? 'Drop files here' : 'Drag & drop files here'}
                </p>
                <p className="text-sm text-gray-500">
                    or click to browse (max {formatFileSize(maxFileSize)} per file)
                </p>
            </div>

            {/* Errors */}
            {errors.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    {errors.map((error, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-red-400">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    ))}
                </div>
            )}

            {/* Selected Files */}
            {files.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-300">Selected Files ({files.length})</h4>

                    <div className="space-y-2">
                        {files.map((file, index) => {
                            const config = getFileTypeConfig(file.name);
                            const Icon = getFileIcon(file.name);

                            return (
                                <div
                                    key={`${file.name}-${file.size}`}
                                    className="flex items-center gap-3 p-3 bg-dark-card rounded-lg border border-dark-border"
                                >
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.bgColor}`}>
                                        <Icon className={`w-5 h-5 ${config.color}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white text-sm truncate">{file.name}</p>
                                        <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeFile(index);
                                        }}
                                        className="p-1 text-gray-400 hover:text-red-400"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Tags (optional)</label>
                        <div className="flex flex-wrap gap-2">
                            {DOCUMENT_TAGS.map(tag => (
                                <button
                                    key={tag.id}
                                    onClick={() => toggleTag(tag.id)}
                                    className={`px-3 py-1 text-sm rounded-full border transition-all ${
                                        selectedTags.includes(tag.id)
                                            ? `${tag.color} border-transparent`
                                            : 'border-dark-border text-gray-400 hover:text-white hover:border-gray-500'
                                    }`}
                                >
                                    {tag.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Description (optional)</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-white focus:border-brand-primary focus:outline-none"
                            placeholder="Add a note about these files..."
                        />
                    </div>

                    {/* Upload Button */}
                    <div className="flex justify-end">
                        <button
                            onClick={handleUpload}
                            disabled={isUploading || files.length === 0}
                            className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 disabled:opacity-50 flex items-center gap-2"
                        >
                            {isUploading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Uploading... {Math.round(uploadProgress)}%
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4" />
                                    Upload {files.length} {files.length === 1 ? 'File' : 'Files'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Recently Uploaded */}
            {uploadedFiles.length > 0 && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-green-400 mb-2">
                        <Check className="w-4 h-4" />
                        <span className="font-medium">Successfully uploaded</span>
                    </div>
                    <div className="space-y-1">
                        {uploadedFiles.map(doc => (
                            <p key={doc.id} className="text-sm text-gray-300">{doc.filename}</p>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
