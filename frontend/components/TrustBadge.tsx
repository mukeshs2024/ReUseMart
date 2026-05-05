'use client';

type SellerLevel = 'BASIC' | 'VERIFIED' | 'TRUSTED' | 'PRO';

interface TrustBadgeProps {
    level: SellerLevel;
    trustScore?: number;
    isPhoneVerified?: boolean;
    showScore?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const badgeConfig: Record<SellerLevel, {
    icon: string;
    label: string;
    className: string;
    description: string;
}> = {
    BASIC: {
        icon: 'ðŸ‘¤',
        label: 'Basic',
        className: 'bg-gray-500/10 text-gray-300 border border-gray-500/20',
        description: 'New seller',
    },
    VERIFIED: {
        icon: 'âœ”',
        label: 'Verified',
        className: 'bg-[#0D1B4C]/10 text-[#0D1B4C] border border-[#0D1B4C]/30',
        description: 'Email verified',
    },
    TRUSTED: {
        icon: 'â­',
        label: 'Trusted Seller',
        className: 'bg-purple-500/10 text-purple-300 border border-purple-500/30',
        description: 'Trusted by the community',
    },
    PRO: {
        icon: 'ðŸ›¡ï¸',
        label: 'Pro Seller',
        className: 'bg-orange-500/10 text-orange-300 border border-orange-500/30',
        description: 'Premium seller status',
    },
};

export default function TrustBadge({
    level,
    trustScore = 0,
    isPhoneVerified = false,
    showScore = false,
    size = 'md',
    className = '',
}: TrustBadgeProps) {
    const config = badgeConfig[level];

    const sizeClasses = {
        sm: 'py-0.5 px-2 text-xs gap-1',
        md: 'py-1 px-3 text-sm gap-1.5',
        lg: 'py-2 px-4 text-base gap-2',
    };

    return (
        <div className={`inline-flex items-center rounded-full font-medium ${config.className} ${sizeClasses[size]} ${className}`}>
            <span>{config.icon}</span>
            <span>{config.label}</span>
            {showScore && (
                <span className="opacity-60 text-xs ml-1">({trustScore})</span>
            )}
        </div>
    );
}

interface SellerTrustCardProps {
    name: string;
    level: SellerLevel;
    trustScore: number;
    isPhoneVerified: boolean;
    avatarUrl?: string;
    className?: string;
}

export function SellerTrustCard({
    name,
    level,
    trustScore,
    isPhoneVerified,
    avatarUrl,
    className = '',
}: SellerTrustCardProps) {
    return (
        <div className={`rounded-lg p-4 ${className}`} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="relative">
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt={name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                            {name[0]?.toUpperCase()}
                        </div>
                    )}
                    {/* Verified checkmark */}
                    {isPhoneVerified && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#0D1B4C' }}>
                            <span className="text-white text-xs">âœ“</span>
                        </div>
                    )}
                </div>

                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{name}</h3>
                        <TrustBadge level={level} size="sm" />
                    </div>
                    {/* Trust score bar */}
                    <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                            <span>Trust Score</span>
                            <span className="font-medium">{trustScore}/100</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-hover)' }}>
                            <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{ width: `${trustScore}%`, background: 'linear-gradient(90deg, #22C55E, #2563EB)' }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Badges row */}
            <div className="mt-3 flex gap-2 flex-wrap">
                {isPhoneVerified && (
                    <TrustBadge level="VERIFIED" size="sm" />
                )}
                {trustScore >= 50 && (
                    <TrustBadge level="TRUSTED" size="sm" />
                )}
                {trustScore >= 80 && (
                    <TrustBadge level="PRO" size="sm" />
                )}
            </div>
        </div>
    );
}
