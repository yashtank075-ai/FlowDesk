import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { apiClient } from '../services/api';
import {
  User,
  Building,
  Mail,
  Shield,
  Save,
  CheckCircle,
  AlertCircle,
  Calendar,
  Users,
  UserPlus,
  RefreshCw,
  Copy,
  Check,
  Share2,
  ExternalLink,
} from 'lucide-react';

interface WorkspaceMemberItem {
  membershipId: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER';
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    title?: string | null;
    avatarUrl?: string | null;
  };
}

export const SettingsPage: React.FC = () => {
  const { user, currentWorkspace, updateProfile } = useAuth();
  const { canInviteMembers, canChangeRoles } = usePermissions();

  // Profile Form State
  const [fullName, setFullName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [imageLoadError, setImageLoadError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Team Management State
  const [members, setMembers] = useState<WorkspaceMemberItem[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER'>('MEMBER');
  const [isInviting, setIsInviting] = useState(false);
  const [teamMessage, setTeamMessage] = useState<string | null>(null);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [lastInviteData, setLastInviteData] = useState<{ email: string; role: string; link: string } | null>(null);
  const [hasCopiedLink, setHasCopiedLink] = useState(false);

  // Sync state whenever the authenticated user updates
  useEffect(() => {
    if (user) {
      setFullName(user.name || '');
      setJobTitle(user.title || '');
      setAvatarUrl(user.avatarUrl || '');
      setImageLoadError(false);
    }
  }, [user]);

  // Fetch Workspace Members
  const fetchMembers = async () => {
    setIsLoadingMembers(true);
    try {
      const res = await apiClient.get('/workspace/members');
      setMembers(res.data.data);
    } catch {
      // Non-blocking in dev
    } finally {
      setIsLoadingMembers(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [currentWorkspace?.id]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMessage('Full name cannot be empty');
      return;
    }

    setIsSubmitting(true);
    setSavedMessage(null);
    setErrorMessage(null);

    try {
      await updateProfile({
        name: fullName.trim(),
        title: jobTitle.trim() || null,
        avatarUrl: avatarUrl.trim() || null,
      });
      setSavedMessage('Profile updated successfully!');
      setTimeout(() => setSavedMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsInviting(true);
    setTeamMessage(null);
    setTeamError(null);
    setLastInviteData(null);
    setHasCopiedLink(false);

    try {
      const res = await apiClient.post('/workspace/members', {
        email: inviteEmail.trim(),
        role: inviteRole,
      });

      const token = res.data.data.invitationToken;
      const origin = window.location.origin;
      const inviteUrl = `${origin}/accept-invitation?token=${token}`;

      setLastInviteData({
        email: res.data.data.email,
        role: res.data.data.role,
        link: inviteUrl,
      });

      setTeamMessage(`Invitation created for ${res.data.data.email} as ${res.data.data.role}!`);
      setInviteEmail('');
      fetchMembers();
    } catch (err: any) {
      setTeamError(err.message || 'Failed to invite member');
    } finally {
      setIsInviting(false);
    }
  };

  const handleCopyLink = async () => {
    if (!lastInviteData?.link) return;
    try {
      await navigator.clipboard.writeText(lastInviteData.link);
      setHasCopiedLink(true);
      setTimeout(() => setHasCopiedLink(false), 3000);
    } catch {
      // Fallback
      setHasCopiedLink(true);
    }
  };

  const handleShareInvite = () => {
    if (!lastInviteData) return;
    if (navigator.share) {
      navigator.share({
        title: `Join our team on FlowDesk AI`,
        text: `You have been invited to join ${currentWorkspace?.name || 'our workspace'} as a ${lastInviteData.role}.`,
        url: lastInviteData.link,
      }).catch(() => {});
    } else {
      handleCopyLink();
    }
  };

  const handleRoleChange = async (membershipId: string, newRole: string) => {
    setTeamMessage(null);
    setTeamError(null);
    try {
      await apiClient.patch(`/workspace/members/${membershipId}`, {
        role: newRole,
      });
      setTeamMessage('Member role updated successfully');
      setTimeout(() => setTeamMessage(null), 4000);
      fetchMembers();
    } catch (err: any) {
      setTeamError(err.message || 'Failed to update member role');
    }
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'FD';

  const role = currentWorkspace?.role || 'MEMBER';
  const roleColorMap: Record<string, { bg: string; text: string; border: string }> = {
    OWNER: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    ADMIN: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    MANAGER: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    MEMBER: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
    VIEWER: { bg: 'bg-zinc-50', text: 'text-zinc-600', border: 'border-zinc-200' },
  };
  const roleStyle = roleColorMap[role] || roleColorMap.MEMBER;

  const formattedJoinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Active Session';

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Account & Workspace Settings</h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage your personal profile, security credentials, and workspace preferences
          </p>
        </div>
        {savedMessage && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-medium animate-fadeIn">
            <CheckCircle className="w-3.5 h-3.5" />
            {savedMessage}
          </div>
        )}
        {errorMessage && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-medium animate-fadeIn">
            <AlertCircle className="w-3.5 h-3.5" />
            {errorMessage}
          </div>
        )}
      </div>

      {/* Authenticated User Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_4px_rgba(0,0,0,0.02)] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            {user?.avatarUrl && !imageLoadError ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                onError={() => setImageLoadError(true)}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-100 shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-bold text-xl flex items-center justify-center shadow-md shadow-indigo-100 ring-4 ring-indigo-50/50">
                {initials}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">{user?.name || 'Authenticated User'}</h3>
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}
                >
                  <Shield className="w-3 h-3" />
                  {role}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {user?.status || 'ACTIVE'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {user?.email}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 bg-slate-50/80 px-4 py-3 rounded-xl border border-slate-200/60">
            <div className="flex items-center gap-1.5">
              <Building className="w-4 h-4 text-indigo-500" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Workspace</span>
                <span className="font-semibold text-slate-800">{currentWorkspace?.name || 'Primary Workspace'}</span>
              </div>
            </div>
            <div className="h-6 w-px bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Member Since</span>
                <span className="font-medium text-slate-700">{formattedJoinDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Editing Form */}
        <form onSubmit={handleSaveProfile} className="space-y-4 pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Account Email <span className="text-slate-400 font-normal">(Read-only)</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-100/80 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed select-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Job Title</label>
              <div className="relative">
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. VP of Operations"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Avatar Image URL</label>
              <div className="relative">
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-[11px] text-slate-400">
              User ID: <code className="text-slate-500 bg-slate-50 px-1 py-0.5 rounded">{user?.id}</code>
            </span>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Save Profile Changes
            </button>
          </div>
        </form>
      </div>

      {/* Team Members & Role Management Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_4px_rgba(0,0,0,0.02)] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Workspace Team Members</h3>
              <p className="text-xs text-slate-500">
                Collaborators with authorized access to this business workspace
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchMembers}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors self-start sm:self-auto"
            title="Refresh Members"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingMembers ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {teamMessage && (
          <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-medium">
            <CheckCircle className="w-3.5 h-3.5" />
            {teamMessage}
          </div>
        )}
        {teamError && (
          <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            {teamError}
          </div>
        )}

        {/* Invite Member Section (OWNER & ADMIN only) */}
        {canInviteMembers && (
          <div className="mb-6 space-y-3">
            <form onSubmit={handleInviteMember} className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/60">
              <span className="text-xs font-bold text-slate-800 block mb-2 flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-indigo-600" /> Invite New Team Member
              </span>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  required
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-medium"
                >
                  {role === 'OWNER' && <option value="ADMIN">ADMIN</option>}
                  <option value="MANAGER">MANAGER</option>
                  <option value="MEMBER">MEMBER</option>
                  <option value="VIEWER">VIEWER</option>
                </select>
                <button
                  type="submit"
                  disabled={isInviting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shrink-0 disabled:opacity-60"
                >
                  {isInviting ? 'Sending...' : 'Generate Invite Link'}
                </button>
              </div>
            </form>

            {/* Generated Invitation Link Card */}
            {lastInviteData && (
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-900">
                      Invitation Ready for {lastInviteData.email}
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                      Role: {lastInviteData.role}
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-medium italic">
                    Status: Pending Acceptance
                  </span>
                </div>

                <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-emerald-200">
                  <input
                    type="text"
                    readOnly
                    value={lastInviteData.link}
                    className="flex-1 text-xs text-slate-600 bg-transparent outline-none font-mono select-all truncate"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold transition-colors shrink-0 shadow-xs"
                  >
                    {hasCopiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{hasCopiedLink ? 'Copied Link!' : 'Copy Invitation Link'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleShareInvite}
                    title="Share Invitation"
                    className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md border border-emerald-200 transition-colors shrink-0"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[11px] text-emerald-800">
                  Share this link directly with your team member. The link is securely cryptographically signed and valid for 48 hours.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Member List */}
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200/80 overflow-hidden">
          {members.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">Loading workspace members...</div>
          ) : (
            members.map((m) => {
              const isCurrentUser = m.user.id === user?.id;
              const mInitials = m.user.name
                ? m.user.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()
                : 'U';
              const mRoleStyle = roleColorMap[m.role] || roleColorMap.MEMBER;

              return (
                <div key={m.membershipId} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-white hover:bg-slate-50/50 transition-colors gap-3">
                  <div className="flex items-center gap-3">
                    {m.user.avatarUrl ? (
                      <img
                        src={m.user.avatarUrl}
                        alt={m.user.name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-xs flex items-center justify-center">
                        {mInitials}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                        {m.user.name}
                        {isCurrentUser && (
                          <span className="text-[10px] text-indigo-600 font-normal bg-indigo-50 border border-indigo-200/60 px-1.5 py-0.2 rounded-full">
                            You
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-slate-400">{m.user.email} {m.user.title ? `• ${m.user.title}` : ''}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {canChangeRoles && !isCurrentUser ? (
                      <select
                        value={m.role}
                        onChange={(e) => handleRoleChange(m.membershipId, e.target.value)}
                        className={`text-[11px] font-semibold px-2 py-1 rounded-lg border ${mRoleStyle.bg} ${mRoleStyle.text} ${mRoleStyle.border} focus:outline-none`}
                      >
                        <option value="OWNER">OWNER</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="MANAGER">MANAGER</option>
                        <option value="MEMBER">MEMBER</option>
                        <option value="VIEWER">VIEWER</option>
                      </select>
                    ) : (
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${mRoleStyle.bg} ${mRoleStyle.text} ${mRoleStyle.border}`}>
                        {m.role}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
