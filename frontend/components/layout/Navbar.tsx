'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
    ChevronDown,
    Inbox,
    LayoutDashboard,
    LogOut,
    Menu,
    Package,
    Search,
    ShoppingCart,
    Tag,
    UserCircle2,
    X,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { getActiveMarketplaceMode, isSellerAccount, isSellerMode } from '@/lib/authMode';
import api from '@/lib/axios';
import { disconnectChatSocket, getChatSocket, type LiveChatMessage } from '@/lib/chatSocket';

const BUYER_LINKS = [
    { href: '/', label: 'Home', icon: null },
    { href: '/products', label: 'All Products', icon: null },
    { href: '/profile', label: 'Profile', icon: UserCircle2 },
    { href: '/messages', label: 'Messages', icon: Inbox },
];

const SELLER_LINKS = [
    { href: '/seller/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/seller/products', label: 'My Listings', icon: Package },
    { href: '/profile', label: 'Profile', icon: UserCircle2 },
    { href: '/messages', label: 'Messages', icon: Inbox },
];

const CATEGORIES = ['Electronics', 'Mobiles', 'Furniture', 'Fashion', 'Accessories'];

export function Navbar() {
    const { user, isAuthenticated, logout, setActiveMode } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [query, setQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const cartCount = useCartStore((state) => state.items.reduce((sum, item) => sum + item.quantity, 0));

    const isSeller = isSellerAccount(user);
    const activeMode = getActiveMarketplaceMode(user);
    const sellerModeActive = isSellerMode(user);
    const navLinks = sellerModeActive ? SELLER_LINKS : BUYER_LINKS;

    const isAdminPage = pathname?.startsWith('/admin');
    const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/admin-secret-login';
    const isOnboardingPage = pathname === '/become-seller';

    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    useEffect(() => {
        if (!isAuthenticated || isAuthPage || isAdminPage || isOnboardingPage || !user) {
            return;
        }

        let isMounted = true;

        const fetchUnreadCount = () => {
            api.get('/messages/unread-count')
                .then((response) => {
                    if (isMounted) {
                        setUnreadCount(response.data.count ?? 0);
                    }
                })
                .catch(() => {});
        };

        fetchUnreadCount();
        const timerId = setInterval(fetchUnreadCount, 30_000);

        const token = typeof window !== 'undefined' ? localStorage.getItem('reusemart_token') : null;
        const socket = token ? getChatSocket(token) : null;

        const handleLiveMessage = (message: LiveChatMessage) => {
            if (message.buyerId !== user.id && message.sellerId !== user.id) {
                return;
            }

            fetchUnreadCount();
        };

        if (socket) {
            socket.on('chat:new-message', handleLiveMessage);
        }

        return () => {
            isMounted = false;
            clearInterval(timerId);
            if (socket) {
                socket.off('chat:new-message', handleLiveMessage);
            }
        };
    }, [isAuthenticated, isAuthPage, isAdminPage, isOnboardingPage, user?.id]);

    if (isAdminPage || isAuthPage || isOnboardingPage) {
        return null;
    }

    const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname?.startsWith(href));

    const handleModeSwitch = async (mode: 'BUYER' | 'SELLER') => {
        if (mode === 'SELLER' && !isSeller) {
            router.push('/become-seller');
            return;
        }

        setDropdownOpen(false);
        setMobileOpen(false);
        setActiveMode(mode);

        try {
            await api.patch('/auth/mode', { mode });
        } catch {
            // Keep optimistic mode switch in UI even if this call fails.
        }

        router.push(mode === 'SELLER' ? '/seller/dashboard' : '/');
    };

    const handleSellNow = () => {
        setMobileOpen(false);

        if (!isAuthenticated) {
            router.push('/register');
            return;
        }

        if (!isSeller) {
            router.push('/become-seller');
            return;
        }

        if (sellerModeActive) {
            router.push('/seller/dashboard');
            return;
        }

        setDropdownOpen(true);
    };

    const handleSearch = (event: FormEvent) => {
        event.preventDefault();
        const trimmedQuery = query.trim();

        if (!trimmedQuery) {
            router.push('/products');
            return;
        }

        router.push(`/products?q=${encodeURIComponent(trimmedQuery)}`);
    };

    const handleLogout = () => {
        disconnectChatSocket();
        logout();
        setDropdownOpen(false);
        setMobileOpen(false);
        router.push('/');
    };

    const handleCartClick = () => {
        setDropdownOpen(false);
        setMobileOpen(false);
        router.push('/cart');
    };

    return (
        <header
            className="fixed top-0 left-0 right-0 z-50"
            style={{
                background: '#ffffff',
                borderBottom: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-navbar)',
                height: 75,
            }}
        >
            <nav className="page-container flex items-center h-full gap-3">
                <Link href={sellerModeActive ? '/seller/dashboard' : '/'} className="flex items-center gap-2.5" style={{ textDecoration: 'none' }}>
                    <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
                        ReUseMart
                    </span>
                </Link>

                <form onSubmit={handleSearch} className="hidden lg:flex items-center flex-1 max-w-xl ml-2">
                    <div className="relative w-full">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search second-hand products"
                            className="input-field"
                            style={{ paddingLeft: 34, height: 38, background: '#F8FAFF' }}
                        />
                    </div>
                </form>

                <div className="hidden md:flex items-center gap-4">
                    <Link
                        href="/products"
                        style={{
                            color: isActive('/products') ? 'var(--accent-primary)' : 'var(--text-secondary)',
                            textDecoration: 'none',
                            fontWeight: 600,
                            fontSize: 14,
                        }}
                    >
                        Products
                    </Link>

                    <div className="relative group">
                        <button
                            type="button"
                            className="inline-flex items-center gap-1 text-sm font-medium"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            Categories <ChevronDown className="w-4 h-4" />
                        </button>
                        <div className="absolute left-0 top-full w-44 pt-2 opacity-0 invisible translate-y-1 transition-all duration-150 ease-out group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:visible group-focus-within:opacity-100 group-focus-within:translate-y-0">
                            <div className="card p-2">
                                {CATEGORIES.map((category) => (
                                    <button
                                        key={category}
                                        type="button"
                                        onClick={() => router.push(`/products?category=${encodeURIComponent(category)}`)}
                                        className="w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors"
                                        style={{ color: 'var(--text-secondary)' }}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="hidden lg:flex items-center gap-3 ml-auto">
                    <button onClick={handleCartClick} className="btn-secondary" style={{ padding: '8px 12px', position: 'relative' }}>
                        <ShoppingCart className="w-4 h-4" /> Cart
                        {cartCount > 0 && (
                            <span
                                style={{
                                    position: 'absolute',
                                    top: -6,
                                    right: -6,
                                    minWidth: 18,
                                    height: 18,
                                    borderRadius: 99,
                                    background: 'var(--accent-primary)',
                                    color: '#fff',
                                    fontSize: 11,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '0 5px',
                                    fontWeight: 700,
                                }}
                            >
                                {cartCount}
                            </span>
                        )}
                    </button>

                    {!sellerModeActive && (
                        <button onClick={handleSellNow} className="btn-secondary" style={{ padding: '8px 12px' }}>
                            <Tag className="w-4 h-4" /> Sell
                        </button>
                    )}

                    {isAuthenticated && user ? (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setDropdownOpen((prev) => !prev)}
                                className="inline-flex items-center gap-2 px-2 py-2 rounded-md"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                <UserCircle2 className="w-5 h-5" />
                                <span className="text-sm font-medium max-w-[120px] truncate">{user.name}</span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {dropdownOpen && (
                                <div className="absolute right-0 mt-2 w-64 card p-2">
                                    <div className="px-2 py-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
                                        <p className="text-sm font-semibold truncate">{user.name}</p>
                                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
                                    </div>

                                    {isSeller && (
                                        <div className="px-2 py-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
                                            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Mode</p>
                                            <div className="flex gap-2">
                                                {(['BUYER', 'SELLER'] as const).map((mode) => (
                                                    <button
                                                        key={mode}
                                                        onClick={() => handleModeSwitch(mode)}
                                                        className="flex-1 text-xs font-semibold rounded-md py-1.5"
                                                        style={{
                                                            background: activeMode === mode ? 'var(--accent-primary)' : 'var(--bg-hover)',
                                                            color: activeMode === mode ? '#fff' : 'var(--text-secondary)',
                                                        }}
                                                    >
                                                        {mode}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {navLinks.map((link) => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            onClick={() => setDropdownOpen(false)}
                                            className="flex items-center gap-2 px-2 py-2 rounded-md text-sm"
                                            style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
                                        >
                                            {link.icon && <link.icon className="w-4 h-4" />}
                                            {link.label}
                                            {link.href === '/messages' && unreadCount > 0 && (
                                                <span className="ml-auto text-[10px] text-white px-1.5 py-0.5 rounded-full" style={{ background: 'var(--accent-primary)' }}>
                                                    {unreadCount}
                                                </span>
                                            )}
                                        </Link>
                                    ))}

                                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm" style={{ color: '#DC2626' }}>
                                        <LogOut className="w-4 h-4" /> Log out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <Link href="/login" className="btn-secondary" style={{ padding: '8px 12px', textDecoration: 'none' }}>
                                Login
                            </Link>
                            <Link href="/register" className="btn-primary" style={{ padding: '8px 12px', textDecoration: 'none' }}>
                                Register
                            </Link>
                        </>
                    )}
                </div>

                <button className="md:hidden nav-icon-btn ml-auto" onClick={() => setMobileOpen((prev) => !prev)}>
                    {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </nav>

            {mobileOpen && (
                <div className="md:hidden border-t" style={{ borderColor: 'var(--border-color)', background: '#fff' }}>
                    <div className="page-container py-3 space-y-2">
                        <form onSubmit={handleSearch}>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                                <input
                                    value={query}
                                    onChange={(event) => setQuery(event.target.value)}
                                    className="input-field"
                                    style={{ paddingLeft: 34 }}
                                    placeholder="Search products"
                                />
                            </div>
                        </form>

                        {isSeller && (
                            <div className="flex gap-2 pt-1">
                                {(['BUYER', 'SELLER'] as const).map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => void handleModeSwitch(mode)}
                                        className="flex-1 text-xs font-semibold rounded-md py-2"
                                        style={{
                                            background: activeMode === mode ? 'var(--accent-primary)' : 'var(--bg-hover)',
                                            color: activeMode === mode ? '#fff' : 'var(--text-secondary)',
                                        }}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>
                        )}

                        {navLinks.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                className="block px-2 py-2 rounded-md text-sm"
                                style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
                            >
                                {item.label}
                            </Link>
                        ))}

                        <button
                            onClick={handleCartClick}
                            className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            <ShoppingCart className="w-4 h-4" /> Cart {cartCount > 0 ? `(${cartCount})` : ''}
                        </button>

                        {CATEGORIES.map((category) => (
                            <button
                                key={category}
                                onClick={() => {
                                    setMobileOpen(false);
                                    router.push(`/products?category=${encodeURIComponent(category)}`);
                                }}
                                className="w-full text-left px-2 py-2 rounded-md text-sm"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                {category}
                            </button>
                        ))}

                        {!isAuthenticated ? (
                            <div className="flex gap-2 pt-1">
                                <Link href="/login" onClick={() => setMobileOpen(false)} className="btn-secondary flex-1">
                                    Login
                                </Link>
                                <Link href="/register" onClick={() => setMobileOpen(false)} className="btn-primary flex-1">
                                    Register
                                </Link>
                            </div>
                        ) : (
                            <button onClick={handleLogout} className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm" style={{ color: '#DC2626' }}>
                                <LogOut className="w-4 h-4" /> Log out
                            </button>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
