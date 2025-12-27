import React from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowLeft, User } from 'lucide-react';
import Layout from '../../components/layout/Layout';

const blogPosts = [
    {
        id: 1,
        slug: "how-to-price-production-services-2025",
        title: "How to Price Your Production Services in 2025",
        excerpt: "A comprehensive guide to setting competitive rates while maintaining healthy margins in the evolving production landscape.",
        category: "Business",
        author: "ProductionOS Team",
        date: "Dec 20, 2025",
        readTime: "8 min read",
        image: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1200&h=600&fit=crop",
        content: `
            <p>Pricing your production services effectively is one of the most critical decisions you'll make as a production company owner. Get it right, and you'll build a sustainable, profitable business. Get it wrong, and you'll either leave money on the table or price yourself out of the market.</p>

            <h2>Understanding Your Costs</h2>
            <p>Before you can set competitive rates, you need to understand your true costs. This includes not just your direct costs (equipment, crew, travel) but also your overhead (office space, software, insurance) and the often-forgotten cost of your own time.</p>

            <h2>Market Research</h2>
            <p>Understanding what competitors charge is valuable, but don't let it dictate your pricing. Your rates should reflect the value you provide, not just match what others charge. Premium positioning often attracts better clients who value quality over cost.</p>

            <h2>Value-Based Pricing</h2>
            <p>The most successful production companies price based on the value they deliver to clients, not just their costs. A commercial that helps a brand increase sales by millions is worth far more than the sum of crew days and equipment rentals.</p>

            <h2>Regional Considerations</h2>
            <p>Rates vary significantly by region. What works in London or New York may not be appropriate for smaller markets. ProductionOS helps you manage regional rate cards so you can quote appropriately for each market.</p>
        `
    },
    {
        id: 2,
        slug: "complete-guide-production-call-sheets",
        title: "The Complete Guide to Production Call Sheets",
        excerpt: "Learn how to create call sheets that keep your crew informed, your clients happy, and your shoots running smoothly.",
        category: "Operations",
        author: "ProductionOS Team",
        date: "Dec 15, 2025",
        readTime: "6 min read",
        image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&h=600&fit=crop",
        content: `
            <p>A well-crafted call sheet is the backbone of any successful production day. It's the single document that tells everyone where to be, when to be there, and what to expect.</p>

            <h2>Essential Elements</h2>
            <p>Every call sheet should include: production title, date, location address with parking info, call times for each department, weather forecast, emergency contacts, and a brief schedule of the day.</p>

            <h2>Timing is Everything</h2>
            <p>Send call sheets at least 12 hours before the shoot, ideally the evening before. This gives crew time to plan their travel and prepare any necessary equipment.</p>

            <h2>Digital Distribution</h2>
            <p>Gone are the days of faxing call sheets. Modern production companies use digital tools like ProductionOS to generate and distribute call sheets automatically, with real-time updates if anything changes.</p>
        `
    },
    {
        id: 3,
        slug: "managing-crew-rates-multiple-regions",
        title: "Managing Crew Rates Across Multiple Regions",
        excerpt: "Strategies for handling different day rates, currencies, and labor laws when working internationally.",
        category: "Finance",
        author: "ProductionOS Team",
        date: "Dec 10, 2025",
        readTime: "5 min read",
        image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=600&fit=crop",
        content: `
            <p>International production work is incredibly rewarding, but it comes with complex financial challenges. Managing different currencies, understanding local labor laws, and maintaining consistent margins across regions requires careful planning.</p>

            <h2>Building Regional Rate Cards</h2>
            <p>Create separate rate cards for each region you operate in. What's a competitive day rate in Southeast Asia will be very different from rates in Western Europe or North America.</p>

            <h2>Currency Management</h2>
            <p>Quote in your client's preferred currency when possible, but always calculate your margins in your home currency. Use real-time exchange rates and build in a buffer for currency fluctuations.</p>
        `
    },
    {
        id: 4,
        slug: "streamlining-client-communication",
        title: "Streamlining Client Communication in Production",
        excerpt: "Best practices for keeping clients in the loop without overwhelming your inbox or your team.",
        category: "Client Relations",
        author: "ProductionOS Team",
        date: "Dec 5, 2025",
        readTime: "7 min read",
        image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200&h=600&fit=crop",
        content: `
            <p>Effective client communication is the difference between a one-time project and a long-term relationship. But managing multiple clients across multiple projects can quickly become overwhelming.</p>

            <h2>Set Clear Expectations</h2>
            <p>At the start of every project, establish communication norms: how often you'll update them, what channels you'll use, and who their main point of contact will be.</p>

            <h2>Centralize Communication</h2>
            <p>Use a dedicated platform for project communication rather than scattered emails and messages. This creates a clear record and ensures nothing falls through the cracks.</p>
        `
    },
    {
        id: 5,
        slug: "equipment-tracking-chaos-to-control",
        title: "Equipment Tracking: From Chaos to Control",
        excerpt: "How modern production companies are using digital tools to manage kit, reduce losses, and improve utilization.",
        category: "Operations",
        author: "ProductionOS Team",
        date: "Nov 28, 2025",
        readTime: "6 min read",
        image: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1200&h=600&fit=crop",
        content: `
            <p>Lost equipment, double-bookings, and mystery damage are the bane of every production company's existence. But with the right systems in place, equipment management can become a competitive advantage.</p>

            <h2>Digital Inventory</h2>
            <p>Maintain a complete digital inventory of every piece of equipment you own. Include purchase price, current value, serial numbers, and maintenance history.</p>

            <h2>Check-in/Check-out Systems</h2>
            <p>Implement a formal check-in/check-out process for every shoot. This creates accountability and helps identify when and where damage occurs.</p>
        `
    },
    {
        id: 6,
        slug: "building-sustainable-freelance-crew-network",
        title: "Building a Sustainable Freelance Crew Network",
        excerpt: "Tips for creating and maintaining relationships with reliable freelancers in a competitive market.",
        category: "HR",
        author: "ProductionOS Team",
        date: "Nov 20, 2025",
        readTime: "9 min read",
        image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=600&fit=crop",
        content: `
            <p>Your crew network is one of your most valuable assets. The ability to quickly assemble a talented, reliable team can make or break your production company's reputation.</p>

            <h2>Quality Over Quantity</h2>
            <p>It's better to have a smaller network of trusted freelancers than a massive database of people you barely know. Focus on building deep relationships with your go-to crew members.</p>

            <h2>Fair Rates and Prompt Payment</h2>
            <p>Pay competitive rates and pay on time, every time. Word travels fast in the production community, and your reputation as a good client will attract the best talent.</p>
        `
    },
];

export default function BlogPostPage() {
    const { slug } = useParams();
    const post = blogPosts.find(p => p.slug === slug);

    if (!post) {
        return <Navigate to="/resources/blog" replace />;
    }

    return (
        <Layout>
            <Helmet>
                <title>{post.title} - ProductionOS Blog</title>
                <meta name="description" content={post.excerpt} />
            </Helmet>

            <article className="pt-32 pb-20 bg-marketing-background">
                <div className="container mx-auto px-6 max-w-4xl">
                    {/* Back Link */}
                    <Link
                        to="/resources/blog"
                        className="inline-flex items-center gap-2 text-marketing-text-secondary hover:text-marketing-primary transition-colors mb-8"
                    >
                        <ArrowLeft size={16} />
                        Back to Blog
                    </Link>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        {/* Category */}
                        <span className="inline-block px-3 py-1 text-xs font-medium text-marketing-primary bg-marketing-primary/10 rounded-full mb-4">
                            {post.category}
                        </span>

                        {/* Title */}
                        <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                            {post.title}
                        </h1>

                        {/* Meta */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-marketing-text-secondary mb-8">
                            <span className="flex items-center gap-2">
                                <User size={16} />
                                {post.author}
                            </span>
                            <span className="flex items-center gap-2">
                                <Calendar size={16} />
                                {post.date}
                            </span>
                            <span className="flex items-center gap-2">
                                <Clock size={16} />
                                {post.readTime}
                            </span>
                        </div>

                        {/* Featured Image */}
                        <div className="rounded-2xl overflow-hidden mb-12">
                            <img
                                src={post.image}
                                alt={post.title}
                                className="w-full h-auto"
                            />
                        </div>

                        {/* Content */}
                        <div
                            className="prose prose-invert prose-lg max-w-none
                                prose-headings:text-white prose-headings:font-bold
                                prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6
                                prose-p:text-marketing-text-secondary prose-p:leading-relaxed
                                prose-a:text-marketing-primary prose-a:no-underline hover:prose-a:underline
                                [&>p]:mb-6 [&>h2]:mt-12 [&>h2]:mb-6 [&>p+p]:mt-6"
                            dangerouslySetInnerHTML={{ __html: post.content }}
                        />

                        {/* CTA */}
                        <div className="mt-16 p-8 bg-marketing-surface border border-marketing-border rounded-2xl text-center">
                            <h3 className="text-2xl font-bold text-white mb-4">Ready to streamline your production workflow?</h3>
                            <p className="text-marketing-text-secondary mb-6">
                                ProductionOS helps production companies manage quotes, projects, crew, and finances in one place.
                            </p>
                            <Link
                                to="/auth/signup"
                                className="inline-flex items-center gap-2 px-8 py-4 bg-marketing-primary text-white font-bold rounded-xl hover:bg-marketing-primary/90 transition-all"
                            >
                                Start Free Trial
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </article>
        </Layout>
    );
}
