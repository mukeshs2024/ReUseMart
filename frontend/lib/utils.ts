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
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
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

export function getPlaceholderImage(category?: string | null, id?: string): string {
    const charCodeSum = (id || '').split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const cat = categoryLabelFromValue(category);
    
    switch(cat) {
        case 'Electronics':
            const electronics = [
                'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=80',
                'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=600&q=80',
                'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=600&q=80',
                'https://images.unsplash.com/photo-1588702545922-e612f02685de?w=600&q=80'
            ];
            return electronics[charCodeSum % electronics.length];
        case 'Mobiles':
            const mobiles = [
                'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80',
                'https://images.unsplash.com/photo-1598327105666-5b89351cb31b?w=600&q=80',
                'https://images.unsplash.com/photo-1533228100845-08145b01de14?w=600&q=80',
                'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=600&q=80'
            ];
            return mobiles[charCodeSum % mobiles.length];
        case 'Furniture':
            const furniture = [
                'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=600&q=80',
                'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80',
                'https://images.unsplash.com/photo-1505693314120-0d443867891c?w=600&q=80',
                'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600&q=80'
            ];
            return furniture[charCodeSum % furniture.length];
        case 'Fashion':
            const fashion = [
                'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&q=80',
                'https://images.unsplash.com/photo-1550639525-c97d455acf70?w=600&q=80',
                'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=600&q=80',
                'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&q=80'
            ];
            return fashion[charCodeSum % fashion.length];
        case 'Accessories':
            const accessories = [
                'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80',
                'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600&q=80',
                'https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?w=600&q=80',
                'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=600&q=80'
            ];
            return accessories[charCodeSum % accessories.length];
        default:
            return 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80';
    }
}
