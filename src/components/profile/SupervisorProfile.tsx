'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { LayoutDashboard, Users, CheckSquare, Clock } from 'lucide-react';
import '@/styles/profile.css';

interface SupervisorStats {
  activeToday: number;
  totalSellers: number;
  pendingApprovals: number;
  teamHoursToday: number;
}

export default function SupervisorProfile() {
  const { user, isLoaded } = useUser();
  const [stats, setStats] = useState<SupervisorStats>({
    activeToday: 0,
    totalSellers: 0,
    pendingApprovals: 0,
    teamHoursToday: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !user) return;
    Promise.all([
      fetch('/api/supervisor/sellers').then((r) => r.json()).catch(() => []),
      fetch('/api/supervisor/activity').then((r) => r.json()).catch(() => []),
    ]).then(([sellers, activity]) => {
      const sellerList = Array.isArray(sellers) ? sellers : [];
      const activityList = Array.isArray(activity) ? activity : [];
      const today = new Date().toDateString();
      const activeToday = sellerList.filter((s: { clockedInToday?: boolean }) => s.clockedInToday).length;
      const pendingApprovals = activityList.filter(
        (a: { status: string; created_at: string }) =>
          a.status === 'pending' && new Date(a.created_at).toDateString() === today
      ).length;
      setStats({
        activeToday,
        totalSellers: sellerList.length,
        pendingApprovals,
        teamHoursToday: 0,
      });
      setLoading(false);
    });
  }, [isLoaded, user]);

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString([], { month: 'long', year: 'numeric' })
    : '—';

  if (!isLoaded || loading) return <div className="profile-loading">Loading…</div>;

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <div className="profile-avatar-wrap">
          {user?.imageUrl ? (
            <img src={user.imageUrl} alt="avatar" className="profile-avatar" />
          ) : (
            <div className="profile-avatar-placeholder">{user?.firstName?.[0] ?? '?'}</div>
          )}
        </div>
        <div className="profile-header-info">
          <h1 className="profile-name">{user?.fullName ?? user?.firstName ?? 'Supervisor'}</h1>
          <span className="profile-role-badge" style={{ background: '#F97316' }}>Supervisor</span>
          <p className="profile-member-since">Member since {memberSince}</p>
          <p className="profile-email">{user?.primaryEmailAddress?.emailAddress}</p>
        </div>
      </div>

      {/* Team overview */}
      <section className="profile-section">
        <h2 className="profile-section-title"><Users size={18} /> Team Overview</h2>
        <div className="profile-stats-grid">
          <div className="profile-stat-card">
            <p className="profile-stat-value">{stats.activeToday}</p>
            <p className="profile-stat-label">Active Today</p>
          </div>
          <div className="profile-stat-card">
            <p className="profile-stat-value">{stats.totalSellers}</p>
            <p className="profile-stat-label">Total Sellers</p>
          </div>
          <div className="profile-stat-card" style={{ position: 'relative' }}>
            <p className="profile-stat-value">{stats.pendingApprovals}</p>
            <p className="profile-stat-label">Pending Approvals</p>
          </div>
        </div>
      </section>

      {/* Permissions info */}
      <section className="profile-section">
        <h2 className="profile-section-title"><CheckSquare size={18} /> Access Level</h2>
        <div className="profile-permissions">
          <p className="profile-permission allow">Can view all seller activity</p>
          <p className="profile-permission allow">Can approve / reject clock events</p>
          <p className="profile-permission allow">Can assign tasks to sellers</p>
          <p className="profile-permission deny">Cannot edit products or pricing</p>
          <p className="profile-permission deny">Cannot access financial reports</p>
        </div>
      </section>

      {/* Quick links */}
      <section className="profile-section">
        <h2 className="profile-section-title">Quick Links</h2>
        <div className="profile-quick-links">
          <Link href="/supervisor/dashboard" className="profile-quick-link">
            <LayoutDashboard size={16} /> Supervisor Dashboard
          </Link>
        </div>
      </section>
    </div>
  );
}
