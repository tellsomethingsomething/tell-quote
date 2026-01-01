import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://www.productionos.io';
const SITE_NAME = 'ProductionOS';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;
const TWITTER_HANDLE = '@productionos';

/**
 * SEO Head Component - Adds comprehensive meta tags for SEO and social sharing
 * @param {string} title - Page title
 * @param {string} description - Page description (max 160 chars recommended)
 * @param {string} path - Page path (e.g., '/features/crm')
 * @param {string} type - Page type: 'website', 'article', 'product'
 * @param {string} image - OG image URL (optional)
 * @param {object} article - Article data for blog posts (optional)
 * @param {object} structuredData - Additional JSON-LD structured data (optional)
 */
export default function SEOHead({
    title,
    description,
    path = '/',
    type = 'website',
    image = DEFAULT_OG_IMAGE,
    article = null,
    structuredData = null,
}) {
    const fullUrl = `${SITE_URL}${path}`;
    const fullTitle = title.includes('ProductionOS') ? title : `${title} | ProductionOS`;

    // Base organization structured data
    const organizationSchema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'ProductionOS',
        url: SITE_URL,
        logo: `${SITE_URL}/logo.png`,
        description: 'The first CRM built for production companies. Manage quotes, projects, crew, equipment, and finances in one platform.',
        sameAs: [
            'https://twitter.com/productionos',
            'https://linkedin.com/company/productionos',
        ],
        contactPoint: {
            '@type': 'ContactPoint',
            email: 'contact@productionos.io',
            contactType: 'customer service',
        },
    };

    // Software application structured data
    const softwareSchema = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'ProductionOS',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        url: SITE_URL,
        description: 'Production management software for video and event companies. CRM, quoting, project management, crew and equipment tracking, financials.',
        offers: {
            '@type': 'Offer',
            price: '24.00',
            priceCurrency: 'USD',
            priceValidUntil: '2026-12-31',
        },
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.8',
            ratingCount: '127',
            bestRating: '5',
            worstRating: '1',
        },
        featureList: [
            'CRM & Sales Pipeline',
            'Quote Builder with Margin Calculator',
            'Project Management',
            'Crew Database',
            'Equipment Tracking',
            'Financial Overview',
            'Call Sheet Generator',
            'Multi-currency Support',
        ],
    };

    // Article structured data for blog posts
    const articleSchema = article ? {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: title,
        description: description,
        url: fullUrl,
        datePublished: article.datePublished,
        dateModified: article.dateModified || article.datePublished,
        author: {
            '@type': 'Organization',
            name: article.author || 'ProductionOS Team',
        },
        publisher: {
            '@type': 'Organization',
            name: 'ProductionOS',
            logo: {
                '@type': 'ImageObject',
                url: `${SITE_URL}/logo.png`,
            },
        },
        image: image,
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': fullUrl,
        },
    } : null;

    // Combine all structured data
    const allStructuredData = [
        organizationSchema,
        ...(path === '/' || path === '/pricing' ? [softwareSchema] : []),
        ...(articleSchema ? [articleSchema] : []),
        ...(structuredData ? [structuredData] : []),
    ];

    return (
        <Helmet>
            {/* Primary Meta Tags */}
            <title>{fullTitle}</title>
            <meta name="title" content={fullTitle} />
            <meta name="description" content={description} />
            <link rel="canonical" href={fullUrl} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={fullUrl} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />
            <meta property="og:site_name" content={SITE_NAME} />
            <meta property="og:locale" content="en_US" />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={fullUrl} />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />
            <meta name="twitter:site" content={TWITTER_HANDLE} />

            {/* Additional SEO */}
            <meta name="robots" content="index, follow" />
            <meta name="googlebot" content="index, follow, max-video-preview:-1, max-image-preview:large, max-snippet:-1" />

            {/* Structured Data */}
            {allStructuredData.map((schema, index) => (
                <script
                    key={index}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
                />
            ))}
        </Helmet>
    );
}

// FAQ structured data helper for pages with FAQs
export function createFAQSchema(faqs) {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map(faq => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
            },
        })),
    };
}

// Breadcrumb structured data helper
export function createBreadcrumbSchema(items) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    };
}
