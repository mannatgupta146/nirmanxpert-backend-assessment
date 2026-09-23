import { useEffect, useState } from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { useAdmin } from '../../../admin/hooks/useAdmin';
import { useAuth } from '../../../auth/hooks/useAuth';

interface LeaveChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeChannelId: string;
  onLeave: (successorId?: string) => Promise<boolean | undefined>;
  channelMembersCount: number;
}

export default function LeaveChannelModal({ 
  isOpen, 
  onClose, 
  activeChannelId, 
  onLeave,
  channelMembersCount
}: LeaveChannelModalProps) {
  const { user: currentUser } = useAuth();
  const { fetchChannelMembers, users, fetchUsers } = useAdmin();
  
  const [members, setMembers] = useState<any[]>([]);
  const [successorId, setSuccessorId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = currentUser?.role === 'ADMIN';
  const isAlone = channelMembersCount <= 1;
  const needsTransfer = isAdmin && !isAlone;

  useEffect(() => {
    if (isOpen && needsTransfer) {
      setIsLoading(true);
      fetchUsers().then(() => {
        fetchChannelMembers(activeChannelId).then((channelMems: any[]) => {
          const otherMembers = channelMems
            .filter(m => m.userId !== currentUser?.id)
            .map(m => m.user || { id: m.userId, email: m.userId });
          setMembers(otherMembers);
          if (otherMembers.length > 0) setSuccessorId(otherMembers[0].id);
          setIsLoading(false);
        });
      });
    } else {
      setIsLoading(false);
    }
  }, [isOpen, activeChannelId, fetchChannelMembers, currentUser?.id, fetchUsers, needsTransfer]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    const success = await onLeave(needsTransfer ? successorId : undefined);
    setIsSubmitting(false);
    if (success) onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm overflow-hidden">
        
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-base font-bold text-gray-900">Leave Channel</h2>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 flex flex-col gap-4">
          {needsTransfer ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-gray-500">You must assign a new Admin before leaving since other members are still in this channel.</p>
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 text-amber-700 p-3 rounded-lg text-xs">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <span>The selected person will become the new channel Admin.</span>
              </div>

              {isLoading ? (
                <div className="py-3 text-center text-sm text-gray-400 animate-pulse">Loading members...</div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">Select new Admin</label>
                  <select 
                    value={successorId}
                    onChange={(e) => setSuccessorId(e.target.value)}
                    className="w-full bg-white border border-gray-200 text-gray-800 text-sm rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                  >
                    {members.map(m => {
                      const fullUser = users.find((u: any) => u.id === m.id);
                      return (
                        <option key={m.id} value={m.id}>
                          {fullUser ? fullUser.email : m.email || m.id}
                          {fullUser?.role === 'MODERATOR' ? ' (Moderator)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              {isAdmin && isAlone
                ? 'You are the only member. The channel will be empty after you leave.'
                : 'Are you sure you want to leave? You will no longer be able to see or send messages in this channel.'}
            </p>
          )}

          {/* Footer buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <button 
              onClick={onClose} 
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={handleConfirm}
              disabled={isSubmitting || (needsTransfer && !successorId)}
              className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            >
              {isSubmitting ? 'Leaving...' : 'Leave Channel'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
