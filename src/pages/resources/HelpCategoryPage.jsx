import React, { useMemo } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, ChevronRight, ArrowRight } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import { helpCategories, getArticlesByCategory } from '../../data/helpCenter';

export default function HelpCategoryPage() {
    const { categoryId } = useParams();

    const category = useMemo(() => {
        return helpCategories.find(cat => cat.id === categoryId);
    }, [categoryId]);

    const articles = useMemo(() => {
        return getArticlesByCategory(categoryId);
    }, [categoryId]);

    if (!category) {
        return <Navigate to="/help" replace />;
    }

    return (
        <Layout>
            <Helmet>
                <title>{category.title} - Help Center - ProductionOS</title>
                <meta name="description" content={`Help articles about ${category.title}. ${category.description}`} />
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
                        <span className="text-marketing-text-primary">{category.title}</span>
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

                    {/* Category Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mb-10"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className={`w-14 h-14 rounded-xl ${category.bgColor} flex items-center justify-center`}>
                                <category.icon size={28} className={category.color} />
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold text-marketing-text-primary">
                                    {category.title}
                                </h1>
                                <p className="text-marketing-text-secondary">
                                    {articles.length} {articles.length === 1 ? 'article' : 'articles'}
                                </p>
                            </div>
                        </div>
                        <p className="text-lg text-marketing-text-secondary">
                            {category.description}
                        </p>
                    </motion.div>

                    {/* Articles List */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-4"
                    >
                        {articles.map((article, i) => (
                            <motion.div
                                key={article.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 + i * 0.05 }}
                            >
                                <Link
                                    to={`/help/${article.slug}`}
                                    className="block p-6 bg-marketing-surface border border-marketing-border rounded-xl hover:border-marketing-primary/50 hover:shadow-lg transition-all group"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-bold text-marketing-text-primary mb-2 group-hover:text-marketing-primary transition-colors">
                                                {article.title}
                                            </h3>
                                            <p className="text-marketing-text-secondary mb-3">
                                                {article.description}
                                            </p>
                                            <div className="flex items-center gap-4">
                                                <span className="flex items-center gap-1 text-sm text-marketing-text-secondary">
                                                    <Clock size={14} />
                                                    {article.readTime}
                                                </span>
                                                {article.popular && (
                                                    <span className="px-2 py-0.5 bg-marketing-primary/10 text-marketing-primary text-xs font-medium rounded-full">
                                                        Popular
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <ArrowRight size={20} className="text-marketing-text-secondary shrink-0 mt-1 group-hover:text-marketing-primary group-hover:translate-x-1 transition-all" />
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Empty State */}
                    {articles.length === 0 && (
                        <div className="text-center py-16">
                            <category.icon size={48} className="mx-auto text-marketing-text-secondary mb-4 opacity-50" />
                            <h3 className="text-lg font-bold text-marketing-text-primary mb-2">
                                No articles yet
                            </h3>
                            <p className="text-marketing-text-secondary mb-6">
                                We're working on adding content to this category.
                            </p>
                            <Link
                                to="/help"
                                className="text-marketing-primary hover:underline"
                            >
                                Browse other categories
                            </Link>
                        </div>
                    )}

                    {/* Other Categories */}
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="mt-16 pt-12 border-t border-marketing-border"
                    >
                        <h2 className="text-xl font-bold text-marketing-text-primary mb-6">
                            Other Categories
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {helpCategories
                                .filter(cat => cat.id !== categoryId)
                                .slice(0, 4)
                                .map((cat) => (
                                    <Link
                                        key={cat.id}
                                        to={`/help/category/${cat.id}`}
                                        className="p-4 bg-marketing-surface border border-marketing-border rounded-xl hover:border-marketing-primary/50 transition-all group text-center"
                                    >
                                        <div className={`w-10 h-10 rounded-lg ${cat.bgColor} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                                            <cat.icon size={20} className={cat.color} />
                                        </div>
                                        <h3 className="font-medium text-sm text-marketing-text-primary group-hover:text-marketing-primary transition-colors">
                                            {cat.title}
                                        </h3>
                                    </Link>
                                ))}
                        </div>
                    </motion.section>
                </div>
            </div>
        </Layout>
    );
}
