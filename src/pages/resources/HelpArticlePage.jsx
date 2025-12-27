import React, { useMemo } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, ChevronRight, ArrowRight } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import { helpCategories, getArticleBySlug, getArticlesByCategory } from '../../data/helpCenter';
import ReactMarkdown from 'react-markdown';

export default function HelpArticlePage() {
    const { slug } = useParams();
    const article = useMemo(() => getArticleBySlug(slug), [slug]);

    if (!article) {
        return <Navigate to="/help" replace />;
    }

    const category = helpCategories.find(cat => cat.id === article.category);
    const relatedArticles = useMemo(() => {
        return getArticlesByCategory(article.category)
            .filter(a => a.id !== article.id)
            .slice(0, 3);
    }, [article]);

    return (
        <Layout>
            <Helmet>
                <title>{article.title} - Help Center - ProductionOS</title>
                <meta name="description" content={article.description} />
            </Helmet>

            <div className="container mx-auto px-4 md:px-6 pt-24 md:pt-32 pb-16 md:pb-20">
                <div className="max-w-4xl mx-auto">
                    {/* Breadcrumb */}
                    <motion.nav
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 text-sm text-marketing-text-secondary mb-6"
                    >
                        <Link to="/help" className="hover:text-marketing-primary transition-colors">
                            Help Center
                        </Link>
                        <ChevronRight size={14} />
                        {category && (
                            <>
                                <Link
                                    to={`/help/category/${category.id}`}
                                    className="hover:text-marketing-primary transition-colors"
                                >
                                    {category.title}
                                </Link>
                                <ChevronRight size={14} />
                            </>
                        )}
                        <span className="text-marketing-text-primary truncate">{article.title}</span>
                    </motion.nav>

                    {/* Back Link */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                    >
                        <Link
                            to="/help"
                            className="inline-flex items-center gap-2 text-marketing-text-secondary hover:text-marketing-primary transition-colors mb-8"
                        >
                            <ArrowLeft size={16} />
                            Back to Help Center
                        </Link>
                    </motion.div>

                    {/* Article Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mb-8"
                    >
                        {category && (
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`w-10 h-10 rounded-lg ${category.bgColor} flex items-center justify-center`}>
                                    <category.icon size={20} className={category.color} />
                                </div>
                                <span className="text-sm text-marketing-text-secondary font-medium">
                                    {category.title}
                                </span>
                            </div>
                        )}
                        <h1 className="text-3xl md:text-4xl font-bold text-marketing-text-primary mb-4">
                            {article.title}
                        </h1>
                        <p className="text-lg text-marketing-text-secondary mb-4">
                            {article.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-marketing-text-secondary">
                            <span className="flex items-center gap-1">
                                <Clock size={14} />
                                {article.readTime} read
                            </span>
                        </div>
                    </motion.div>

                    {/* Article Content */}
                    <motion.article
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="prose prose-invert prose-lg max-w-none mb-16"
                    >
                        <ReactMarkdown
                            components={{
                                h2: ({ children }) => (
                                    <h2 className="text-2xl font-bold text-marketing-text-primary mt-10 mb-4 pb-2 border-b border-marketing-border">
                                        {children}
                                    </h2>
                                ),
                                h3: ({ children }) => (
                                    <h3 className="text-xl font-bold text-marketing-text-primary mt-8 mb-3">
                                        {children}
                                    </h3>
                                ),
                                h4: ({ children }) => (
                                    <h4 className="text-lg font-bold text-marketing-text-primary mt-6 mb-2">
                                        {children}
                                    </h4>
                                ),
                                p: ({ children }) => (
                                    <p className="text-marketing-text-secondary leading-relaxed mb-4">
                                        {children}
                                    </p>
                                ),
                                ul: ({ children }) => (
                                    <ul className="list-disc list-inside text-marketing-text-secondary space-y-2 mb-4 ml-4">
                                        {children}
                                    </ul>
                                ),
                                ol: ({ children }) => (
                                    <ol className="list-decimal list-inside text-marketing-text-secondary space-y-2 mb-4 ml-4">
                                        {children}
                                    </ol>
                                ),
                                li: ({ children }) => (
                                    <li className="text-marketing-text-secondary">
                                        {children}
                                    </li>
                                ),
                                strong: ({ children }) => (
                                    <strong className="text-marketing-text-primary font-semibold">
                                        {children}
                                    </strong>
                                ),
                                a: ({ href, children }) => (
                                    <Link
                                        to={href?.startsWith('/') ? href : `/help/${href?.replace('/help/', '')}`}
                                        className="text-marketing-primary hover:underline"
                                    >
                                        {children}
                                    </Link>
                                ),
                                img: ({ src, alt }) => (
                                    <div className="my-6 rounded-xl overflow-hidden border border-marketing-border bg-marketing-surface">
                                        <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-marketing-primary/10 to-marketing-accent/10">
                                            <span className="text-marketing-text-secondary text-sm">
                                                {alt || 'Screenshot placeholder'}
                                            </span>
                                        </div>
                                    </div>
                                ),
                                code: ({ inline, children }) => {
                                    if (inline) {
                                        return (
                                            <code className="px-1.5 py-0.5 bg-marketing-surface border border-marketing-border rounded text-sm font-mono text-marketing-primary">
                                                {children}
                                            </code>
                                        );
                                    }
                                    return (
                                        <pre className="p-4 bg-marketing-surface border border-marketing-border rounded-xl overflow-x-auto mb-4">
                                            <code className="text-sm font-mono text-marketing-text-secondary">
                                                {children}
                                            </code>
                                        </pre>
                                    );
                                },
                                pre: ({ children }) => children,
                                table: ({ children }) => (
                                    <div className="overflow-x-auto mb-6">
                                        <table className="w-full border border-marketing-border rounded-lg overflow-hidden">
                                            {children}
                                        </table>
                                    </div>
                                ),
                                thead: ({ children }) => (
                                    <thead className="bg-marketing-surface">
                                        {children}
                                    </thead>
                                ),
                                th: ({ children }) => (
                                    <th className="px-4 py-3 text-left text-sm font-bold text-marketing-text-primary border-b border-marketing-border">
                                        {children}
                                    </th>
                                ),
                                td: ({ children }) => (
                                    <td className="px-4 py-3 text-sm text-marketing-text-secondary border-b border-marketing-border/50">
                                        {children}
                                    </td>
                                ),
                                blockquote: ({ children }) => (
                                    <blockquote className="border-l-4 border-marketing-primary pl-4 my-4 italic text-marketing-text-secondary">
                                        {children}
                                    </blockquote>
                                ),
                                hr: () => (
                                    <hr className="border-marketing-border my-8" />
                                ),
                            }}
                        >
                            {article.content}
                        </ReactMarkdown>
                    </motion.article>

                    {/* Related Articles */}
                    {relatedArticles.length > 0 && (
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="border-t border-marketing-border pt-12"
                        >
                            <h2 className="text-xl font-bold text-marketing-text-primary mb-6">
                                Related Articles
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {relatedArticles.map((related) => (
                                    <Link
                                        key={related.id}
                                        to={`/help/${related.slug}`}
                                        className="p-4 bg-marketing-surface border border-marketing-border rounded-xl hover:border-marketing-primary/50 transition-all group"
                                    >
                                        <h3 className="font-medium text-marketing-text-primary mb-2 group-hover:text-marketing-primary transition-colors">
                                            {related.title}
                                        </h3>
                                        <p className="text-sm text-marketing-text-secondary line-clamp-2">
                                            {related.description}
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        </motion.section>
                    )}

                    {/* Need More Help */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="mt-12 p-8 bg-gradient-to-br from-marketing-primary/10 to-marketing-accent/10 border border-marketing-primary/20 rounded-2xl text-center"
                    >
                        <h3 className="text-lg font-bold text-marketing-text-primary mb-2">
                            Was this article helpful?
                        </h3>
                        <p className="text-marketing-text-secondary mb-6">
                            If you still need help, our support team is just a message away.
                        </p>
                        <Link
                            to="/company/contact"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-marketing-accent to-marketing-primary text-white font-bold rounded-xl hover:shadow-glow transition-all"
                        >
                            Contact Support
                            <ArrowRight size={16} />
                        </Link>
                    </motion.section>
                </div>
            </div>
        </Layout>
    );
}
