import { useState, useEffect } from 'react';
import { useAuth } from '../../../auth/hooks/useAuth';
import { useLogout } from '../../../auth/hooks/useLogout';
import { useChat } from '../../hooks/useChat';
import ManageUsersModal from '../../../admin/ui/components/ManageUsersModal';
import LeaveChannelModal from '../components/LeaveChannelModal';
import { LogOut, Hash, Send, Trash2, ShieldAlert, Settings, Plus, X, LogIn, LogOut as LeaveIcon, Pencil, Users, Search, MoreHorizontal, ChevronLeft, Lock, Unlock } from 'lucide-react';
import clsx from 'clsx';

function CreateChannelModal({ isOpen, onClose, onCreate }: { isOpen: boolean, onClose: () => void, onCreate: (name: string, isPublic: boolean) => void }) {
  const [name, setName] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <h2 className="font-bold text-gray-900 flex items-center gap-2"><Hash className="w-4 h-4 text-gray-500" /> Create Channel</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onCreate(name, isPublic); onClose(); setName(''); setIsPublic(true); }} className="p-6">
          <input autoFocus type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. announcements" className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all rounded-lg px-4 py-2.5 text-sm font-medium text-gray-900 mb-4" />
          
          <label className="flex items-center gap-2 mb-6 cursor-pointer group">
            <input type="checkbox" checked={!isPublic} onChange={e => setIsPublic(!e.target.checked)} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer" />
            <span className="text-sm text-gray-700 group-hover:text-gray-900 font-medium">Make Private</span>
          </label>

          <button type="submit" disabled={!name.trim()} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 text-white font-bold py-2.5 rounded-lg transition-all shadow-sm">Create</button>
        </form>
      </div>
    </div>
  );
}

export default function Chat() {
  const { user } = useAuth();
  const { logout } = useLogout();

  const {
    channels,
    activeChannel,
    setActiveChannel,
    messages,
    isConnected,
    isMember,
    joinedChannelIds,
    rateLimitError,
    deleteMessage,
    input,
    handleTyping,
    handleSend,
    messagesEndRef,
    handleCreateChannel,
    handleDeleteChannel,
    handleRenameChannel,
    handleUpdatePrivacy,
    handleJoinChannel,
    handleLeaveChannel,
    editMessage,
    onlineUsers,
    typingUsers
  } = useChat();

  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState('');
  const [channelSearch, setChannelSearch] = useState('');
  const [deleteConfirmChannelId, setDeleteConfirmChannelId] = useState<string | null>(null);
  const [isEditingChannelName, setIsEditingChannelName] = useState(false);
  const [channelNameInput, setChannelNameInput] = useState('');
  const [openChannelMenuId, setOpenChannelMenuId] = useState<string | null>(null);

  // Close channel menu when clicking anywhere outside
  useEffect(() => {
    if (!openChannelMenuId) return;
    const close = () => setOpenChannelMenuId(null);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [openChannelMenuId]);

  return (
    <div className="w-full h-dvh bg-gray-50 p-0 sm:p-4 md:p-6 lg:p-8 flex flex-col overflow-hidden">

      {/* Premium Application Card */}
      <div className="flex-1 max-w-350 mx-auto w-full bg-white sm:border border-gray-200 sm:rounded-2xl shadow-none sm:shadow-xl shadow-gray-200/50 flex overflow-hidden min-h-0 sm:ring-1 ring-gray-900/5">

        {/* Sidebar */}
        <div className={clsx(
          "flex flex-col bg-gray-50/50 border-r border-gray-200 shrink-0",
          "w-full md:w-72 md:flex",
          activeChannel ? "hidden" : "flex"
        )}>

          {/* Brand Header */}
          <div className="h-16 px-6 border-b border-gray-200 flex items-center bg-white shrink-0">
            <div>
              <h2 className="font-bold text-gray-900 tracking-tight">NirmanXpert</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={clsx("w-2 h-2 rounded-full shadow-sm", isConnected ? "bg-emerald-500 shadow-emerald-500/20" : "bg-red-500 shadow-red-500/20")} />
                <span className="text-gray-500 text-[11px] uppercase tracking-wider font-semibold">{isConnected ? 'Online' : 'Connecting...'}</span>
              </div>
            </div>
          </div>

          {/* Channel List */}
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Search Bar */}
            <div className="px-4 pt-4 pb-2 shrink-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search channels..."
                  value={channelSearch}
                  onChange={e => setChannelSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all text-gray-700 placeholder-gray-400"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {/* Channel Sections */}
              {(() => {
                const query = channelSearch.toLowerCase();
                const filtered = channels.filter(ch => ch.name.toLowerCase().includes(query));
                const joined = filtered.filter(ch => joinedChannelIds.has(ch.id));
                const available = filtered.filter(ch => !joinedChannelIds.has(ch.id));

                if (filtered.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in px-4">
                      <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-4 border border-gray-100">
                        <Search className="w-5 h-5 text-gray-400" />
                      </div>
                      <p className="text-[13px] font-semibold text-gray-700 mb-1">No channels found</p>
                      <p className="text-[12px] text-gray-400 mb-6">
                        {channelSearch ? 'Try a different search term' : 'There are no channels yet.'}
                      </p>
                      
                      {user?.role === 'ADMIN' && (
                        <button
                          onClick={() => setIsCreateModalOpen(true)}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-all shadow-sm"
                        >
                          <Plus className="w-4 h-4" /> Create a Channel
                        </button>
                      )}
                    </div>
                  );
                }

                const renderChannel = (ch: any) => (
                  <div key={ch.id} className="relative group">
                    <button
                      onClick={() => setActiveChannel(ch.id)}
                      className={clsx(
                        "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-left text-sm font-medium pr-8",
                        activeChannel === ch.id
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-gray-600 hover:bg-gray-200/50 hover:text-gray-900"
                      )}
                    >
                      <Hash className={clsx("w-4 h-4 shrink-0", activeChannel === ch.id ? "text-blue-300" : "text-gray-400")} />
                      <span className="truncate">{ch.name}</span>
                    </button>

                    {user?.role === 'ADMIN' && (
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 z-10">
                        <button
                          onClick={(e) => { e.stopPropagation(); setOpenChannelMenuId(openChannelMenuId === ch.id ? null : ch.id); }}
                          className={clsx(
                            "p-1 rounded transition-all",
                            openChannelMenuId === ch.id ? "opacity-100" : "opacity-100 md:opacity-0 md:group-hover:opacity-100",
                            activeChannel === ch.id
                              ? "text-blue-100 hover:bg-blue-500"
                              : "text-gray-500 hover:bg-gray-200 hover:text-gray-800"
                          )}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {openChannelMenuId === ch.id && (
                          <>
                            <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-xl border border-gray-100 z-40 overflow-hidden">
                              {/* Channel name label */}
                              <div className="px-3 py-2 border-b border-gray-100">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider truncate"># {ch.name}</p>
                              </div>
                              <div className="py-1">
                                <button
                                  onMouseDown={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setOpenChannelMenuId(null);
                                    setActiveChannel(ch.id);
                                    setChannelNameInput(ch.name);
                                    setIsEditingChannelName(true);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  <Pencil className="w-3.5 h-3.5 text-gray-400" />
                                  Rename
                                </button>
                                <button
                                  onMouseDown={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setOpenChannelMenuId(null);
                                    handleUpdatePrivacy(ch.id, !ch.isPublic);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  {ch.isPublic ? (
                                    <>
                                      <Lock className="w-3.5 h-3.5 text-gray-400" />
                                      Make Private
                                    </>
                                  ) : (
                                    <>
                                      <Unlock className="w-3.5 h-3.5 text-gray-400" />
                                      Make Public
                                    </>
                                  )}
                                </button>
                                <div className="h-px bg-gray-100 mx-2 my-1" />
                                <button
                                  onMouseDown={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setOpenChannelMenuId(null);
                                    setDeleteConfirmChannelId(ch.id);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );

                return (
                  <div className="flex flex-col gap-5">
                    {joined.length > 0 && (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between mb-1 px-1">
                          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Joined</h3>
                          {user?.role === 'ADMIN' && (
                            <button
                              onClick={() => setIsCreateModalOpen(true)}
                              title="New channel"
                              className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-gray-800 hover:bg-gray-200/60 px-2 py-1 rounded-md transition-colors"
                            >
                              <Plus className="w-3 h-3" /> New
                            </button>
                          )}
                        </div>
                        {joined.map(renderChannel)}
                      </div>
                    )}

                    {available.length > 0 && (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between mb-1 px-1">
                          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Available</h3>
                          {joined.length === 0 && user?.role === 'ADMIN' && (
                            <button
                              onClick={() => setIsCreateModalOpen(true)}
                              title="New channel"
                              className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded-md transition-colors"
                            >
                              <Plus className="w-3 h-3" /> New
                            </button>
                          )}
                        </div>
                        {available.map(renderChannel)}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* User Profile Footer */}
          <div className="p-4 border-t border-gray-200 bg-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-linear-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                {user?.email.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col truncate flex-1">
                <span className="text-sm font-semibold text-gray-900 truncate">{user?.email.split('@')[0]}</span>
                <span className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold truncate mt-0.5">{user?.role}</span>
              </div>

              {(user?.role === 'ADMIN' || user?.role === 'MODERATOR') && (
                <button
                  onClick={() => setIsManageModalOpen(true)}
                  className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-gray-500 hover:text-blue-600 shrink-0"
                  title="Manage Users & Mutes"
                >
                  <Settings className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={logout}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-red-600 shrink-0"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className={clsx(
          "flex-1 flex flex-col relative bg-white min-w-0 min-h-0",
          !activeChannel ? "hidden md:flex" : "flex"
        )}>
          {!activeChannel ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 animate-in fade-in bg-gray-50/30">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4 border border-blue-100">
                <Hash className="w-8 h-8 text-blue-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">No Channel Selected</h2>
              <p className="text-sm text-gray-500 max-w-sm">Select an existing channel from the sidebar or create a new one to start chatting.</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-4 sm:px-6 shrink-0 z-10 shadow-sm shadow-gray-100/50">
            <div className="flex items-center">
              <button 
                onClick={() => setActiveChannel(null)} 
                className="md:hidden mr-2 p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to channels"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 mr-3 shrink-0">
                <Hash className="w-4 h-4 text-gray-500" />
              </div>
              <div className="flex flex-col">
                {isEditingChannelName && user?.role === 'ADMIN' ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const trimmed = channelNameInput.trim();
                      if (trimmed && trimmed !== channels.find(c => c.id === activeChannel)?.name) {
                        handleRenameChannel(activeChannel!, trimmed);
                      }
                      setIsEditingChannelName(false);
                    }}
                  >
                    <input
                      autoFocus
                      value={channelNameInput}
                      onChange={e => setChannelNameInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Escape') setIsEditingChannelName(false); }}
                      className="font-bold text-gray-900 text-base tracking-tight leading-tight bg-transparent border-b-2 border-blue-500 outline-none w-full"
                    />
                    <span className="text-[10px] text-gray-400">Enter to save · Esc to cancel</span>
                  </form>
                ) : (
                  <h2
                    className={clsx("font-bold text-gray-900 text-base tracking-tight leading-tight", user?.role === 'ADMIN' && "cursor-pointer hover:text-blue-600 transition-colors")}
                    title={user?.role === 'ADMIN' ? 'Double-click to rename' : undefined}
                    onDoubleClick={() => {
                      if (user?.role === 'ADMIN') {
                        setChannelNameInput(channels.find(c => c.id === activeChannel)?.name || '');
                        setIsEditingChannelName(true);
                      }
                    }}
                  >
                    {channels.find(c => c.id === activeChannel)?.name || 'Loading...'}
                  </h2>
                )}
                {channels.find(c => c.id === activeChannel)?.createdAt && !isEditingChannelName && (
                  <span className="text-[11px] text-gray-400 font-medium">
                    Created {new Date(channels.find(c => c.id === activeChannel)!.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {(user?.role === 'ADMIN' || user?.role === 'MODERATOR') && (
                <button
                  onClick={() => setIsManageModalOpen(true)}
                  className="md:hidden flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  <Users className="w-3.5 h-3.5" /> Manage
                </button>
              )}
              {isMember && (
                <button
                  onClick={() => setIsLeaveModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                >
                  <LeaveIcon className="w-3.5 h-3.5" /> Leave
                </button>
              )}
            </div>
          </div>

          {!isMember ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/50 p-6 text-center">
              <Hash className="w-12 h-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">You are not in this channel</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-sm">Join this channel to see the message history and participate in the conversation.</p>
              <button
                onClick={handleJoinChannel}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold transition-all shadow-sm active:scale-95"
              >
                <LogIn className="w-4 h-4" /> Join Channel
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Message Thread */}
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar bg-gray-50/30">
                {messages.length === 0 && channels.find(c => c.id === activeChannel)?._count?.members === 1 && user?.role === 'ADMIN' && (
                  <div className="flex flex-col items-center justify-center p-6 text-center my-auto">
                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                      <Users className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">It's quiet in here...</h3>
                    <p className="text-sm text-gray-500 mb-6 max-w-sm">You are the only member in this channel. Add some team members to get the conversation started.</p>
                    <button
                      onClick={() => setIsManageModalOpen(true)}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold transition-all shadow-sm active:scale-95 mx-auto"
                    >
                      <Plus className="w-5 h-5" /> Add Members
                    </button>
                  </div>
                )}
                {messages.map((msg, index) => {
                  const isMe = msg.senderId === user?.id;

                  // Admins can moderate anyone. Moderators can moderate anyone EXCEPT Admins.
                  const canModerate = !isMe && (
                    user?.role === 'ADMIN' ||
                    (user?.role === 'MODERATOR' && msg.sender.role !== 'ADMIN')
                  );

                  const showAvatar = index === 0 || messages[index - 1].senderId !== msg.senderId;

                  return (
                    <div key={msg.id} className={clsx("flex flex-col max-w-[85%] group", isMe ? "self-end items-end" : "self-start items-start")}>

                      {showAvatar && (
                        <div className="flex items-center gap-1.5 mb-1.5 px-1">
                          {!isMe && (
                            <span className={clsx("w-1.5 h-1.5 rounded-full shrink-0", onlineUsers.has(msg.senderId) ? "bg-emerald-500 shadow-sm shadow-emerald-500/20" : "bg-gray-300")} title={onlineUsers.has(msg.senderId) ? "Online" : "Offline"} />
                          )}
                          <span className="text-sm font-bold text-gray-900 leading-none">
                            {isMe ? 'You' : msg.sender.email.split('@')[0]}
                          </span>
                          {msg.sender.role === 'ADMIN' && (
                            <span className="relative -top-1.5 text-[8px] font-bold uppercase tracking-wider text-gray-400 leading-none">admin</span>
                          )}
                          {msg.sender.role === 'MODERATOR' && (
                            <span className="relative -top-1.5 text-[8px] font-bold uppercase tracking-wider text-gray-400 leading-none">mod</span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-2 relative">
                        <div className={clsx(
                          "absolute flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all z-10",
                          isMe ? "right-[calc(100%+8px)]" : "left-[calc(100%+8px)]"
                        )}>
                          {isMe && !msg.isDeleted && (Date.now() - new Date(msg.createdAt).getTime() <= 120000) && (
                            <button
                              onClick={() => { setEditingMessageId(msg.id); setEditInput(msg.content); }}
                              className="p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 rounded-lg border border-transparent hover:border-blue-200 shadow-sm"
                              title="Edit Message (within 2 mins)"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}

                          {canModerate && !msg.isDeleted && (
                            <button
                              onClick={() => deleteMessage(msg.id)}
                              className="p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-lg border border-transparent hover:border-red-200 shadow-sm"
                              title="Delete Message"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className={clsx(
                          "relative min-w-15",
                          editingMessageId === msg.id
                            ? "w-fit min-w-60 mt-1"
                            : clsx(
                              "px-4 py-2.5 text-[15px] leading-relaxed shadow-sm",
                              msg.isDeleted
                                ? "bg-gray-100 text-gray-500 border border-gray-200 italic rounded-2xl"
                                : isMe
                                  ? "bg-blue-600 text-white border border-blue-700 rounded-2xl rounded-tr-sm shadow-blue-600/10"
                                  : "bg-white text-gray-900 border border-gray-200 rounded-2xl rounded-tl-sm"
                            )
                        )}>
                          {editingMessageId === msg.id ? (
                            <form
                              className="flex flex-col gap-2 w-full bg-white border border-gray-200 shadow-md rounded-xl p-3 animate-in fade-in slide-in-from-top-1 duration-200"
                              onSubmit={(e) => {
                                e.preventDefault();
                                if (editInput.trim() && editInput.trim() !== msg.content) {
                                  editMessage(msg.id, editInput.trim());
                                }
                                setEditingMessageId(null);
                              }}
                            >
                              <textarea
                                autoFocus
                                className="bg-gray-50/50 focus:bg-white text-gray-900 placeholder-gray-400 border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none w-full text-[15px] py-2 px-3 rounded-lg transition-all resize-none min-h-15"
                                value={editInput}
                                onChange={(e) => setEditInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Escape') setEditingMessageId(null);
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    if (editInput.trim() && editInput.trim() !== msg.content) {
                                      editMessage(msg.id, editInput.trim());
                                    }
                                    setEditingMessageId(null);
                                  }
                                }}
                              />
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-[11px] font-medium text-gray-400 hidden sm:inline-block">escape to <span className="text-gray-500">cancel</span> • enter to <span className="text-emerald-600">save</span></span>
                                <div className="flex items-center gap-2 ml-auto">
                                  <button type="button" onClick={() => setEditingMessageId(null)} className="text-xs font-semibold text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">Cancel</button>
                                  <button type="submit" className="text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 px-4 py-1.5 rounded-lg shadow-sm shadow-emerald-600/20 transition-all">Save</button>
                                </div>
                              </div>
                            </form>
                          ) : (
                            <div className="flex items-end gap-2">
                              <div className="flex-1 leading-relaxed">
                                {msg.isDeleted && <ShieldAlert className="w-4 h-4 inline-block mr-2 opacity-50 mb-0.5" />}
                                {msg.content}
                                {msg.isEdited && !msg.isDeleted && (
                                  <span className={clsx("text-[10px] ml-1 font-medium opacity-60", isMe ? "text-blue-100" : "text-gray-400")}>(edited)</span>
                                )}
                              </div>
                              <span className={clsx("text-[10px] shrink-0 mb-0.5 leading-none", isMe ? "text-blue-200/80" : "text-gray-400")}>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })}
                <div ref={messagesEndRef} className="h-4" />
              </div>

              {/* Input Area */}
              <div className="p-4 sm:p-6 bg-white border-t border-gray-200 shrink-0 relative">

                {rateLimitError && (
                  <div className="text-red-600 text-sm mb-3 flex items-center gap-2 px-2 font-medium bg-red-50 p-2 rounded-lg border border-red-100 animate-in fade-in slide-in-from-bottom-2">
                    <ShieldAlert className="w-4 h-4" /> {rateLimitError}
                  </div>
                )}
                
                {typingUsers.size > 0 && (
                  <div className="absolute -top-6 left-6 text-[11px] text-gray-500 font-medium px-2 py-0.5 italic animate-pulse bg-white/80 backdrop-blur-sm rounded-t-lg">
                    {typingUsers.size === 1 
                      ? <><strong className="font-bold text-gray-700">{Array.from(typingUsers.values())[0]}</strong> is typing...</>
                      : typingUsers.size === 2 
                        ? <><strong className="font-bold text-gray-700">{Array.from(typingUsers.values()).join(' and ')}</strong> are typing...</>
                        : 'Multiple people are typing...'}
                  </div>
                )}

                <form onSubmit={handleSend} className="relative flex items-center">
                  <input
                    type="text"
                    value={input}
                    onChange={handleTyping}
                    placeholder="Type a message..."
                    className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all rounded-xl pl-5 pr-14 py-3.5 text-gray-900 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="absolute right-2.5 p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-lg transition-all shadow-sm active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          )}
            </>
          )}
        </div>

      </div>

      {activeChannel && (
        <ManageUsersModal
          isOpen={isManageModalOpen}
          onClose={() => setIsManageModalOpen(false)}
          activeChannelId={activeChannel}
        />
      )}

      {activeChannel && (
        <LeaveChannelModal
          isOpen={isLeaveModalOpen}
          onClose={() => setIsLeaveModalOpen(false)}
          activeChannelId={activeChannel}
          onLeave={handleLeaveChannel}
          channelMembersCount={channels.find(c => c.id === activeChannel)?._count?.members || 1}
        />
      )}

      <CreateChannelModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={(name, isPublic) => handleCreateChannel(name, isPublic)}
      />

      {/* Delete Channel Confirmation */}
      {deleteConfirmChannelId && (
        <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm overflow-hidden">
            <div className="px-6 pt-6 pb-4">
              <h2 className="text-base font-bold text-gray-900">Delete Channel</h2>
            </div>
            <div className="px-6 pb-6 flex flex-col gap-4">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete <strong className="text-gray-800">#{channels.find(c => c.id === deleteConfirmChannelId)?.name}</strong>? This will permanently remove all messages and cannot be undone.
              </p>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setDeleteConfirmChannelId(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { handleDeleteChannel(deleteConfirmChannelId); setDeleteConfirmChannelId(null); }}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-all active:scale-95"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
