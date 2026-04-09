import Link from 'next/link';
import { Search, ShieldCheck, BadgeCheck, Wallet, Smartphone, Sofa, Shirt, Watch, Laptop } from 'lucide-react';
import ProductCard from '@/components/products/ProductCard';

async function getPublicProducts() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    const res = await fetch(`${baseUrl}/products`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data.slice(0, 12) : [];
  } catch {
    return [];
  }
}

const categories = [
  { label: 'Electronics', Icon: Laptop },
  { label: 'Mobiles', Icon: Smartphone },
  { label: 'Furniture', Icon: Sofa },
  { label: 'Fashion', Icon: Shirt },
  { label: 'Accessories', Icon: Watch },
];

export default async function HomePage() {
  const products: any[] = await getPublicProducts();
  const deals = products.slice(0, 8);

  return (
    <main style={{ background: 'var(--bg-primary)', paddingTop: 88, minHeight: '100vh' }}>
      <section className="page-container" style={{ paddingBottom: 18 }}>
        <div className="card" style={{ padding: 28 }}>
          <p style={{ color: 'var(--accent-primary)', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
            Trusted second-hand marketplace
          </p>
          <h1 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', lineHeight: 1.15, fontWeight: 800 }}>
            Buy Smarter. Save More.
          </h1>
          <p style={{ marginTop: 10, color: 'var(--text-secondary)', fontSize: 16 }}>
            Quality second-hand products from trusted sellers
          </p>

          <form action="/products" method="get" style={{ marginTop: 16 }}>
            <div style={{ position: 'relative', maxWidth: 760 }}>
              <Search className="w-4 h-4" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                name="q"
                placeholder="Search mobiles, furniture, electronics and more"
                className="input-field"
                style={{ height: 44, paddingLeft: 36, background: '#F8FAFF' }}
              />
            </div>
          </form>
        </div>
      </section>

      <section className="page-container" style={{ paddingBottom: 18 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Categories</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
          {categories.map(({ label, Icon }) => (
            <Link
              key={label}
              href={`/products?category=${encodeURIComponent(label)}`}
              className="card-hover"
              style={{ padding: 14, textDecoration: 'none', display: 'grid', placeItems: 'center', gap: 8 }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 8, background: '#EEF4FF', display: 'grid', placeItems: 'center' }}>
                <Icon className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="page-container" style={{ paddingBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>Best Deals</h2>
          <Link href="/products" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
            View all
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
          {deals.length ? deals.map((p) => <ProductCard key={p.id} product={p} />) : <p style={{ color: 'var(--text-secondary)' }}>No deals yet.</p>}
        </div>
      </section>

      <section className="page-container" style={{ paddingBottom: 30 }}>
        <div className="card" style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          {[
            { title: 'Verified Sellers', subtitle: 'Trusted seller profiles', Icon: BadgeCheck },
            { title: 'Buyer Protection', subtitle: 'Safer marketplace support', Icon: ShieldCheck },
            { title: 'Secure Payments', subtitle: 'Transparent secure checkout', Icon: Wallet },
          ].map(({ title, subtitle, Icon }) => (
            <div key={title} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: '#E6FFFA', display: 'grid', placeItems: 'center' }}>
                <Icon className="w-4 h-4" style={{ color: 'var(--accent-secondary)' }} />
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{title}</p>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 12 }}>{subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
