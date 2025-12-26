import DOMPurify from 'dompurify';

/**
 * Sanitize HTML to prevent XSS attacks
 * Uses DOMPurify with a safe configuration
 */
export function sanitizeHtml(dirty) {
    if (!dirty) return '';

    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: [
            'p', 'br', 'b', 'i', 'u', 'strong', 'em', 'a', 'ul', 'ol', 'li',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code',
            'span', 'div', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
            'img', 'hr', 'sup', 'sub'
        ],
        ALLOWED_ATTR: [
            'href', 'src', 'alt', 'title', 'class', 'style', 'target', 'rel',
            'width', 'height', 'colspan', 'rowspan'
        ],
        ALLOW_DATA_ATTR: false,
        ADD_ATTR: ['target'],
        FORBID_TAGS: ['script', 'iframe', 'form', 'input', 'button', 'textarea', 'select'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
    });
}

/**
 * Sanitize HTML for email content (more permissive for email styling)
 */
export function sanitizeEmailHtml(dirty) {
    if (!dirty) return '';

    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: [
            'p', 'br', 'b', 'i', 'u', 'strong', 'em', 'a', 'ul', 'ol', 'li',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code',
            'span', 'div', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
            'img', 'hr', 'sup', 'sub', 'font', 'center'
        ],
        ALLOWED_ATTR: [
            'href', 'src', 'alt', 'title', 'class', 'style', 'target', 'rel',
            'width', 'height', 'colspan', 'rowspan', 'align', 'valign',
            'bgcolor', 'color', 'face', 'size', 'border', 'cellpadding', 'cellspacing'
        ],
        ALLOW_DATA_ATTR: false,
        ADD_ATTR: ['target'],
        FORBID_TAGS: ['script', 'iframe', 'form', 'input', 'button', 'textarea', 'select', 'object', 'embed'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onsubmit'],
    });
}

/**
 * Strip all HTML tags, returning plain text
 */
export function stripHtml(dirty) {
    if (!dirty) return '';
    return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
}

export default { sanitizeHtml, sanitizeEmailHtml, stripHtml };
