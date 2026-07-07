'use client';

import Link from 'next/link';

interface AdminNavCardProps {
  icon: string;
  title: string;
  description: string;
  href: string;
  badge?: string;
}

export default function AdminNavCard({ icon, title, description, href, badge }: AdminNavCardProps) {
  return (
    <Link href={href} className="admin-nav-card">
      <div className="card-icon" aria-hidden="true">{icon}</div>
      <div className="card-content">
        <h3>{title}</h3>
        <p>{description}</p>
        {badge && <span className="card-badge">{badge}</span>}
      </div>
      <div className="card-arrow" aria-hidden="true">→</div>
    </Link>
  );
}
