export function formatDistanceToNow(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHrs / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffWeeks < 4) return `${diffWeeks}w ago`;
    if (diffMonths < 12) return `${diffMonths}mo ago`;
    return `${Math.floor(diffMonths / 12)}y ago`;
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
    }).format(amount);
}

export function cn(...classes: (string | undefined | null | false)[]): string {
    return classes.filter(Boolean).join(' ');
}

export type ProductCondition = 'Like New' | 'Used' | 'Old' | 'Too Old';

export const CATEGORY_LABELS = ['Electronics', 'Mobiles', 'Furniture', 'Fashion', 'Accessories'] as const;

export type ProductCategoryLabel = (typeof CATEGORY_LABELS)[number];

const CATEGORY_ENUM_TO_LABEL: Record<string, ProductCategoryLabel> = {
    ELECTRONICS: 'Electronics',
    MOBILES: 'Mobiles',
    FURNITURE: 'Furniture',
    FASHION: 'Fashion',
    ACCESSORIES: 'Accessories',
};

export function categoryLabelFromValue(raw?: string | null): ProductCategoryLabel | null {
    if (!raw) return null;

    const normalized = raw.trim().toUpperCase().replace(/\s+/g, '_');
    return CATEGORY_ENUM_TO_LABEL[normalized] ?? null;
}

export function normalizeCategoryFilter(raw?: string | null): 'All' | ProductCategoryLabel {
    if (!raw) return 'All';

    const normalized = raw.trim();
    if (!normalized || normalized.toLowerCase() === 'all') {
        return 'All';
    }

    return categoryLabelFromValue(normalized) ?? 'All';
}

export function normalizeCondition(raw?: string): ProductCondition {
    const value = (raw || '').toLowerCase();
    if (value === 'like_new' || value.includes('new') || value.includes('excellent')) return 'Like New';
    if (value === 'too_old' || value.includes('too old')) return 'Too Old';
    if (value === 'old' || value.includes('old')) return 'Old';
    return 'Used';
}

export function estimateOriginalPrice(price: number, condition?: string): number {
    const normalized = normalizeCondition(condition);
    const multiplier = normalized === 'Like New' ? 1.25 : normalized === 'Used' ? 1.45 : normalized === 'Old' ? 1.7 : 2.0;
    return Math.max(price, Number((price * multiplier).toFixed(2)));
}

export function savingsPercent(price: number, originalPrice: number): number {
    if (originalPrice <= 0 || originalPrice <= price) return 0;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
}

// Get category-specific default image (used only as fallback when no image is provided)
export function getCategoryDefaultImage(category?: string | null): string {
    const cat = categoryLabelFromValue(category);

    const categoryDefaults: Record<string, string> = {
        'Electronics': '/images/electronics/default.svg',
        'Mobiles': '/images/electronics/default.svg',
        'Furniture': '/images/furniture/default.svg',
        'Fashion': '/images/fashion/default.svg',
        'Accessories': '/images/accessories/default.svg',
    };

    if (!cat) {
        return '/images/default.svg';
    }

    return categoryDefaults[cat] || '/images/default.svg';
}

// Generate a unique placeholder image based on product ID and category
export function getPlaceholderImage(category?: string | null, id?: string): string {
    // Use category-based default as fallback
    return getCategoryDefaultImage(category);
}
