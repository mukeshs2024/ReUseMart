'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    Package,
    LogOut,
    ShoppingBag,
    ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const navItems = [
    { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/users', icon: Users, label: 'Users' },
    { href: '/admin/products', icon: Package, label: 'Products' },
];

export function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { logout } = useAuthStore();

    const handleLogout = () => {
        logout();
        router.push('/admin-secret-login');
    };

    return (
        <aside className="w-64 min-h-screen bg-bgCard border-r border-borderColor flex flex-col">
            {/* Logo */}
            <div className="px-6 py-5 border-b border-borderColor">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                        <ShoppingBag className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <div className="font-bold text-textPrimary text-sm">ReUseMart</div>
                        <div className="text-[10px] text-textSecondary flex items-center gap-1">
                            <ShieldCheck className="w-2.5 h-2.5" /> Admin Console
                        </div>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                {navItems.map((item) => {
                    const active = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active
                                    ? 'bg-brand-600 text-white'
                                    : 'text-textSecondary hover:text-textPrimary hover:bg-bgHover'
                                }`}
                        >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Logout */}
            <div className="px-3 py-4 border-t border-borderColor">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                     text-textSecondary hover:text-red-400 hover:bg-red-400/10 transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    Log out
                </button>
            </div>
        </aside>
    );
}
