import { useEffect, useState } from 'react';
import { useAdmin } from '../../hooks/useAdmin';
import { X, ShieldAlert, Users, MicOff, ChevronDown, Check } from 'lucide-react';
import { useAuth } from '../../../auth/hooks/useAuth';

interface ManageUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeChannelId: string;
}

// Custom select component for better aesthetics
function CustomRoleSelect({ 
  value, 
  onChange, 
  disabled, 
  isAdmin 
}: { 
  value: string; 
  onChange: (val: string) => void; 
  disabled: boolean;
  isAdmin: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Close when clicking outside (simple implementation via overlay)
  return (
    <div className="relative">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center justify-between gap-2 bg-white border border-gray-200 rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wider outline-none transition-all ${
          disabled ? 'opacity-50 cursor-not-allowed bg-gray-50 text-gray-500' : 'text-gray-700 hover:border-blue-400 hover:bg-blue-50/30'
        } ${isOpen ? 'ring-2 ring-blue-600/20 border-blue-600' : ''}`}
      >
        <span>{value}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !disabled && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-20 overflow-hidden transform origin-top-right transition-all">
            <button
              onClick={() => { onChange('MEMBER'); setIsOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider flex items-center justify-between hover:bg-gray-50 ${value === 'MEMBER' ? 'text-blue-600 bg-blue-50/50' : 'text-gray-700'}`}
            >
              MEMBER {value === 'MEMBER' && <Check className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => { onChange('MODERATOR'); setIsOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider flex items-center justify-between hover:bg-gray-50 ${value === 'MODERATOR' ? 'text-blue-600 bg-blue-50/50' : 'text-gray-700'}`}
            >
              MODERATOR {value === 'MODERATOR' && <Check className="w-3.5 h-3.5" />}
            </button>
            {isAdmin && (
              <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center justify-between bg-gray-50/50 border-t border-gray-100 cursor-not-allowed" title="You cannot assign the Admin role">
                ADMIN {value === 'ADMIN' && <Check className="w-3.5 h-3.5" />}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function ManageUsersModal({ isOpen, onClose, activeChannelId }: ManageUsersModalProps) {
  const { user: currentUser } = useAuth();
  const { users, isLoading, error, fetchUsers, changeRole, toggleMute, fetchChannelMembers, addMember } = useAdmin();
  
  // Local state to track which users are muted in this session (since isMuted is channel specific, 
  // and we didn't fetch full channel memberships for the modal, we'll maintain a local UI toggle state)
  const [mutedUsers, setMutedUsers] = useState<Set<string>>(new Set());
  const [channelMembers, setChannelMembers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      fetchChannelMembers(activeChannelId).then((members: any[]) => {
        setChannelMembers(new Set(members.map(m => m.userId)));
        const muted = new Set(members.filter(m => m.isMuted).map(m => m.userId));
        setMutedUsers(muted);
      });
    }
  }, [isOpen, fetchUsers, activeChannelId, fetchChannelMembers]);

  if (!isOpen) return null;

  const handleMuteToggle = async (userId: string) => {
    const isCurrentlyMuted = mutedUsers.has(userId);
    await toggleMute(activeChannelId, userId, !isCurrentlyMuted);
    
    setMutedUsers(prev => {
      const next = new Set(prev);
      if (isCurrentlyMuted) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-2 text-gray-900">
            <Users className="w-5 h-5 text-gray-500" />
            <h2 className="font-bold">Manage Users <span className="ml-1 text-sm font-semibold text-gray-500 bg-gray-200/50 px-2 py-0.5 rounded-full">{users.length}</span></h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center p-8 text-gray-400">Loading users...</div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Joined Users Section */}
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider px-1">Members in Channel</h3>
                {users.filter(u => channelMembers.has(u.id)).map(u => (
                  <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border border-gray-100 rounded-lg bg-gray-50/30 hover:bg-gray-50 transition-colors">
                    
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-gray-900 text-sm">{u.email.split('@')[0]}</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Joined</span>
                      </div>
                      <span className="text-xs text-gray-500 break-all">{u.email}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {(currentUser?.role === 'ADMIN' || currentUser?.role === 'MODERATOR') && currentUser?.id !== u.id && 
                        (currentUser?.role === 'ADMIN' ? u.role !== 'ADMIN' : u.role === 'MEMBER') && (
                        <button
                          onClick={() => handleMuteToggle(u.id)}
                          className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                            mutedUsers.has(u.id) 
                              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          title={mutedUsers.has(u.id) ? "Unmute in channel" : "Mute in channel"}
                        >
                          <MicOff className="w-3.5 h-3.5" />
                          {mutedUsers.has(u.id) ? 'Muted' : 'Mute'}
                        </button>
                      )}

                      {currentUser?.role === 'ADMIN' && (
                        <CustomRoleSelect
                          value={u.role}
                          onChange={(newRole) => changeRole(u.id, newRole)}
                          disabled={currentUser?.id === u.id || u.email === 'admin@test.com' || u.role === 'ADMIN'}
                          isAdmin={u.role === 'ADMIN'}
                        />
                      )}
                      
                      {currentUser?.role !== 'ADMIN' && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-gray-200/50 text-gray-500 border border-gray-200">
                          {u.role}
                        </span>
                      )}
                    </div>

                  </div>
                ))}
              </div>

              {/* Not Joined Users Section */}
              {users.filter(u => !channelMembers.has(u.id)).length > 0 && (
                <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider px-1">Available to Add</h3>
                  {users.filter(u => !channelMembers.has(u.id)).map(u => (
                    <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border border-gray-100 rounded-lg bg-gray-50/30 hover:bg-gray-50 transition-colors opacity-80">
                      
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-gray-900 text-sm">{u.email.split('@')[0]}</span>
                          <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">Not Joined</span>
                        </div>
                        <span className="text-xs text-gray-500 break-all">{u.email}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        {currentUser?.role === 'ADMIN' && (
                          <button
                            onClick={async () => {
                              try {
                                await addMember(activeChannelId, u.id);
                                setChannelMembers(prev => new Set([...prev, u.id]));
                              } catch (e) {
                                alert('Failed to add user to channel');
                              }
                            }}
                            className="px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1 bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-sm"
                            title="Add User to Channel"
                          >
                            Add to Channel
                          </button>
                        )}
                        
                        {currentUser?.role !== 'ADMIN' && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-gray-200/50 text-gray-500 border border-gray-200">
                            {u.role}
                          </span>
                        )}
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
