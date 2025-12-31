import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Home, ArrowLeft, Search } from 'lucide-react';
import Layout from '../components/layout/Layout';

export default function NotFoundPage() {
    return (
        <Layout>
            <Helmet>
                <title>Page Not Found - ProductionOS</title>
                <meta name="robots" content="noindex" />
            </Helmet>

            <div className="min-h-[70vh] flex items-center justify-center px-4">
                <div className="text-center max-w-lg">
                    {/* 404 Illustration */}
                    <div className="mb-8">
                        <div className="text-[120px] md:text-[180px] font-bold leading-none bg-gradient-to-r from-marketing-primary to-marketing-accent bg-clip-text text-transparent">
                            404
                        </div>
                    </div>

                    {/* Message */}
                    <h1 className="text-2xl md:text-3xl font-bold text-marketing-text-primary mb-4">
                        Page not found
                    </h1>
                    <p className="text-marketing-text-secondary mb-8">
                        Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
                    </p>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-marketing-accent to-marketing-primary text-white font-bold rounded-xl hover:shadow-glow transition-all"
                        >
                            <Home size={18} />
                            Go to Homepage
                        </Link>
                        <button
                            onClick={() => window.history.back()}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-marketing-surface border border-marketing-border text-marketing-text-primary font-medium rounded-xl hover:bg-marketing-border/50 transition-all"
                        >
                            <ArrowLeft size={18} />
                            Go Back
                        </button>
                    </div>

                    {/* Help Links */}
                    <div className="mt-12 pt-8 border-t border-marketing-border">
                        <p className="text-sm text-marketing-text-secondary mb-4">
                            Looking for something specific?
                        </p>
                        <div className="flex flex-wrap justify-center gap-4 text-sm">
                            <Link to="/pricing" className="text-marketing-primary hover:underline">
                                Pricing
                            </Link>
                            <Link to="/help" className="text-marketing-primary hover:underline">
                                Help Center
                            </Link>
                            <Link to="/contact" className="text-marketing-primary hover:underline">
                                Contact Us
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
