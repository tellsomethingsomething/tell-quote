const QUOTE_STORAGE_KEY = 'tell_quote_current';
const QUOTES_LIST_KEY = 'tell_quotes_list';

// Save current quote
export function saveQuote(quote) {
    try {
        localStorage.setItem(QUOTE_STORAGE_KEY, JSON.stringify(quote));
        return true;
    } catch (e) {
        console.error('Failed to save quote:', e);
        return false;
    }
}

// Load current quote
export function loadQuote() {
    try {
        const saved = localStorage.getItem(QUOTE_STORAGE_KEY);
        return saved ? JSON.parse(saved) : null;
    } catch (e) {
        console.error('Failed to load quote:', e);
        return null;
    }
}

// Clear current quote
export function clearQuote() {
    try {
        localStorage.removeItem(QUOTE_STORAGE_KEY);
        return true;
    } catch (e) {
        console.error('Failed to clear quote:', e);
        return false;
    }
}

// Save quote to history
export function saveQuoteToHistory(quote) {
    try {
        const list = loadQuotesList();
        const existingIndex = list.findIndex(q => q.quoteNumber === quote.quoteNumber);

        const quoteWithMeta = {
            ...quote,
            savedAt: new Date().toISOString(),
        };

        if (existingIndex >= 0) {
            list[existingIndex] = quoteWithMeta;
        } else {
            list.unshift(quoteWithMeta);
        }

        // Keep only last 50 quotes
        const trimmedList = list.slice(0, 50);
        localStorage.setItem(QUOTES_LIST_KEY, JSON.stringify(trimmedList));
        return true;
    } catch (e) {
        console.error('Failed to save quote to history:', e);
        return false;
    }
}

// Load quotes list
export function loadQuotesList() {
    try {
        const saved = localStorage.getItem(QUOTES_LIST_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        console.error('Failed to load quotes list:', e);
        return [];
    }
}

// Delete quote from history
export function deleteQuoteFromHistory(quoteNumber) {
    try {
        const list = loadQuotesList();
        const filtered = list.filter(q => q.quoteNumber !== quoteNumber);
        localStorage.setItem(QUOTES_LIST_KEY, JSON.stringify(filtered));
        return true;
    } catch (e) {
        console.error('Failed to delete quote from history:', e);
        return false;
    }
}

// Generate new quote number
// prefix defaults to 'QT' but should be passed from settings.quoteDefaults.quotePrefix
export function generateQuoteNumber(prefix = 'QT') {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 9000) + 1000;
    return `${prefix}-${year}-${random}`;
}

// Generate new invoice number
export function generateInvoiceNumber(prefix = 'INV') {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 9000) + 1000;
    return `${prefix}-${year}-${random}`;
}
