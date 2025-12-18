import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string;
    image?: string;
    url?: string;
    type?: string;
}

export default function SEO({
    title = "Extrovert - Educational Resource Sharing Platform",
    description = "The #1 resource hub for Medicaps University students. Download notes, PYQs, syllabus, and study materials for B.Tech, MBA, BBA, and more. Join the Extrovert community today.",
    keywords = "Medicaps University notes, Medicaps PYQs, Medicaps syllabus, Medicaps B.Tech notes, Medicaps MBA notes, Medicaps previous year papers, Extrovert, engineering notes, medical notes, college study material, Medicaps CSE, Medicaps BBA",
    image = "/LOGO.png",
    url,
    type = "website"
}: SEOProps) {
    const location = useLocation();
    const siteTitle = title === "Extrovert - Educational Resource Sharing Platform" ? title : `${title} | Extrovert`;
    const fullImage = image.startsWith('http') ? image : `https://extrovert.site${image.startsWith('/') ? '' : '/'}${image}`;

    // Dynamic canonical URL - use provided URL or fallback to current location
    const canonicalUrl = url || `https://extrovert.site${location.pathname}`;

    return (
        <Helmet>
            {/* Standard metadata tags */}
            <title>{siteTitle}</title>
            <meta name='description' content={description} />
            <meta name='keywords' content={keywords} />

            {/* Open Graph tags (Facebook, LinkedIn, etc.) */}
            <meta property="og:title" content={siteTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={fullImage} />
            <meta property="og:url" content={canonicalUrl} />
            <meta property="og:type" content={type} />

            {/* Twitter Card tags */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={siteTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={fullImage} />

            {/* Canonical URL */}
            <link rel="canonical" href={canonicalUrl} />
        </Helmet>
    );
}
