import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout({ children }) {
    const location = useLocation();

    // Scroll to top on route change
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.pathname]);

    return (
        <div className="min-h-screen bg-marketing-background text-marketing-text-primary font-sans antialiased selection:bg-marketing-primary selection:text-white">
            <Navbar />
            <main className="pt-16">
                {children}
            </main>
            <Footer />
        </div>
    );
}
