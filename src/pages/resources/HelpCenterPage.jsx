import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Search, ArrowRight, Clock, ChevronRight } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import { helpCategories, helpArticles, getPopularArticles, searchArticles, getArticlesByCategory } from '../../data/helpCenter';

export default function HelpCenterPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const popularArticles = useMemo(() => getPopularArticles(), []);

    const handleSearch = (query) => {
        setSearchQuery(query);
        if (query.trim().length >= 2) {
            setIsSearching(true);
            setSearchResults(searchArticles(query));
        } else {
            setIsSearching(false);
            setSearchResults([]);
        }
    };

    const getCategoryForArticle = (categoryId) => {
        return helpCategories.find(cat => cat.id === categoryId);
    };

    return (
        <Layout>
            <Helmet>
                <title>Help Center - ProductionOS</title>
                <meta name="description" content="Get help with ProductionOS. Browse guides, tutorials, and documentation for quoting, projects, CRM, crew management, and more." />
            </Helmet>

            {/* Hero Section */}
            <section className="pt-24 md:pt-32 pb-12 md:pb-16 text-center container mx-auto px-4 md:px-6">
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6"
                >
                    How can we help?
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-lg md:text-xl text-marketing-text-secondary max-w-2xl mx-auto mb-8 md:mb-12"
                >
                    Search our knowledge base or browse by category
                </motion.p>

                {/* Search Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="max-w-2xl mx-auto relative"
                >
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-marketing-text-secondary" size={20} />
                        <input
                            type="text"
                            placeholder="Search for help articles..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-marketing-surface border border-marketing-border rounded-xl text-marketing-text-primary placeholder:text-marketing-text-secondary focus:outline-none focus:border-marketing-primary focus:ring-2 focus:ring-marketing-primary/20 transition-all text-lg"
                        />
                    </div>

                    {/* Search Results Dropdown */}
                    {isSearching && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-marketing-surface border border-marketing-border rounded-xl shadow-xl overflow-hidden z-50"
                        >
                            {searchResults.length > 0 ? (
                                <div className="max-h-96 overflow-y-auto">
                                    {searchResults.slice(0, 8).map((article) => {
                                        const category = getCategoryForArticle(article.category);
                                        return (
                                            <Link
                                                key={article.id}
                                                to={`/help/${article.slug}`}
                                                className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors border-b border-marketing-border/50 last:border-0"
                                            >
                                                {category && (
                                                    <div className={`w-10 h-10 rounded-lg ${category.bgColor} flex items-center justify-center shrink-0`}>
                                                        <category.icon size={20} className={category.color} />
                                                    </div>
                                                )}
                                                <div className="text-left flex-1 min-w-0">
                                                    <h4 className="font-medium text-marketing-text-primary truncate">{article.title}</h4>
                                                    <p className="text-sm text-marketing-text-secondary truncate">{article.description}</p>
                                                </div>
                                                <ChevronRight size={16} className="text-marketing-text-secondary shrink-0" />
                                            </Link>
                                        );
                                    })}
                                    {searchResults.length > 8 && (
                                        <div className="p-3 text-center text-sm text-marketing-text-secondary bg-white/5">
                                            {searchResults.length - 8} more results...
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-6 text-center text-marketing-text-secondary">
                                    No articles found for "{searchQuery}"
                                </div>
                            )}
                        </motion.div>
                    )}
                </motion.div>
            </section>

            {/* Categories Grid */}
            <section className="pb-16 md:pb-20 container mx-auto px-4 md:px-6">
                <h2 className="text-xl font-bold text-marketing-text-primary mb-6 md:mb-8">Browse by Category</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
                    {helpCategories.map((category, i) => {
                        const articleCount = getArticlesByCategory(category.id).length;
                        return (
                            <motion.div
                                key={category.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <Link
                                    to={`/help/category/${category.id}`}
                                    className="block p-6 bg-marketing-surface border border-marketing-border rounded-xl hover:border-marketing-primary/50 hover:shadow-lg transition-all group"
                                >
                                    <div className={`w-12 h-12 rounded-xl ${category.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                        <category.icon size={24} className={category.color} />
                                    </div>
                                    <h3 className="font-bold text-marketing-text-primary mb-1 group-hover:text-marketing-primary transition-colors">
                                        {category.title}
                                    </h3>
                                    <p className="text-sm text-marketing-text-secondary mb-2">
                                        {category.description}
                                    </p>
                                    <span className="text-xs text-marketing-text-secondary">
                                        {articleCount} {articleCount === 1 ? 'article' : 'articles'}
                                    </span>
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>
            </section>

            {/* Popular Articles */}
            <section className="py-16 md:py-20 bg-marketing-surface border-y border-marketing-border">
                <div className="container mx-auto px-4 md:px-6">
                    <h2 className="text-xl font-bold text-marketing-text-primary mb-6 md:mb-8">Popular Articles</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {popularArticles.map((article, i) => {
                            const category = getCategoryForArticle(article.category);
                            return (
                                <motion.div
                                    key={article.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                >
                                    <Link
                                        to={`/help/${article.slug}`}
                                        className="block p-6 bg-marketing-background border border-marketing-border rounded-xl hover:border-marketing-primary/50 hover:shadow-lg transition-all group h-full"
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            {category && (
                                                <div className={`w-8 h-8 rounded-lg ${category.bgColor} flex items-center justify-center`}>
                                                    <category.icon size={16} className={category.color} />
                                                </div>
                                            )}
                                            <span className="text-xs text-marketing-text-secondary uppercase tracking-wider font-medium">
                                                {category?.title}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-marketing-text-primary mb-2 group-hover:text-marketing-primary transition-colors">
                                            {article.title}
                                        </h3>
                                        <p className="text-sm text-marketing-text-secondary mb-4">
                                            {article.description}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <span className="flex items-center gap-1 text-xs text-marketing-text-secondary">
                                                <Clock size={12} />
                                                {article.readTime}
                                            </span>
                                            <span className="text-marketing-primary text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                                                Read <ArrowRight size={14} />
                                            </span>
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Still Need Help */}
            <section className="py-16 md:py-20 container mx-auto px-4 md:px-6 text-center">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">Still need help?</h2>
                <p className="text-marketing-text-secondary mb-8 max-w-xl mx-auto">
                    Can't find what you're looking for? Our support team is here to help.
                </p>
                <Link
                    to="/company/contact"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-marketing-accent to-marketing-primary text-white font-bold rounded-xl hover:shadow-glow transition-all"
                >
                    Contact Support
                    <ArrowRight size={18} />
                </Link>
            </section>
        </Layout>
    );
}
