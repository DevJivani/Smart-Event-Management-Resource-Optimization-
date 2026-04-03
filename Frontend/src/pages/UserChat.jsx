import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { Navigate, useNavigate, useParams, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import axiosInstance from "../utils/axios";
import toast from "react-hot-toast";

const UserChat = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const { chatId: urlChatId } = useParams();
  const location = useLocation();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getOtherParticipant = (chat) => {
    if (!chat || !chat.participants) return null;
    return chat.participants.find(p => (p._id || p) !== user._id);
  };

  const fetchChats = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/v1/chat/my-chats");
      if (res.data?.success) {
        // De-duplicate chats if they exist in DB (same other participant + same event)
        const uniqueChats = [];
        const seen = new Set();
        (res.data.chats || []).forEach(chat => {
          const otherId = getOtherParticipant(chat)?._id || getOtherParticipant(chat);
          const key = `${otherId}-${chat.eventId?._id || chat.eventId}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueChats.push(chat);
          }
        });
        setChats(uniqueChats);
        
        // If there's a chatId in URL, find it or create it
        if (urlChatId) {
          const found = uniqueChats.find(c => c._id === urlChatId);
          if (found) {
            setActiveChat(found);
          }
        } else if (location.state?.receiverId && location.state?.eventId) {
          // If we're coming from EventDetails with a new chat request
          const res2 = await axiosInstance.post("/api/v1/chat/get-or-create", {
            receiverId: location.state.receiverId,
            eventId: location.state.eventId
          });
          if (res2.data?.success) {
            setActiveChat(res2.data.chat);
            // Refresh list and ensure NO duplicates
            setChats(prev => {
              const exists = prev.some(c => c._id === res2.data.chat._id);
              if (exists) return prev;
              return [res2.data.chat, ...prev];
            });
          }
        }
      }
    } catch (error) {
      toast.error("Failed to fetch chats");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeChat) return;
    try {
      setSending(true);
      const res = await axiosInstance.post("/api/v1/chat/send", {
        chatId: activeChat._id,
        content: messageText
      });
      if (res.data?.success) {
        setActiveChat(res.data.chat);
        setChats(prev => prev.map(c => c._id === res.data.chat._id ? res.data.chat : c));
        setMessageText("");
      }
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId, deleteType) => {
    if (!activeChat) return;
    try {
      setDeletingId(messageId);
      const res = await axiosInstance.delete("/api/v1/chat/delete-message", {
        data: {
          chatId: activeChat._id,
          messageId,
          deleteType
        }
      });
      if (res.data?.success) {
        toast.success(deleteType === "everyone" ? "Deleted for everyone" : "Deleted for you");
        setActiveChat(res.data.chat);
        setChats(prev => prev.map(c => c._id === res.data.chat._id ? res.data.chat : c));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete message");
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [urlChatId, location.state]);

  useEffect(() => {
    scrollToBottom();
  }, [activeChat?.messages]);

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] transition-colors duration-300">
      <Navbar />
      <main className="max-w-7xl mx-auto p-4 sm:p-8 flex flex-col md:flex-row gap-6 h-[calc(100vh-120px)]">
        
        {/* Chat List Sidebar */}
        <div className="w-full md:w-80 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Messages</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {chats.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <p className="text-sm">No chats yet. Connect with attendees on the event page!</p>
              </div>
            ) : (
              chats.map((chat) => (
                <div 
                  key={chat._id}
                  onClick={() => setActiveChat(chat)}
                  className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all border-b border-gray-50 dark:border-gray-800/50 ${activeChat?._id === chat._id ? 'bg-indigo-50/50 dark:bg-indigo-900/10 border-l-4 border-l-indigo-600' : ''}`}
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                    {getOtherParticipant(chat)?.profileImage ? (
                      <img src={getOtherParticipant(chat).profileImage} alt={getOtherParticipant(chat)?.name || "User"} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg font-bold text-indigo-600">
                        {getOtherParticipant(chat)?.name?.charAt(0) || "?"}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white truncate text-sm">{getOtherParticipant(chat)?.name || "Unknown"}</h3>
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium truncate">{chat.eventId?.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                      {chat.messages.length > 0 ? chat.messages[chat.messages.length-1].content : "Start chatting!"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Chat Window */}
        <div className="flex-1 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
          {activeChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                    {getOtherParticipant(activeChat)?.profileImage ? (
                      <img src={getOtherParticipant(activeChat).profileImage} alt={getOtherParticipant(activeChat)?.name || "User"} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg font-bold text-indigo-600">
                        {getOtherParticipant(activeChat)?.name?.charAt(0) || "?"}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">{getOtherParticipant(activeChat)?.name || "Unknown"}</h3>
                    <p className="text-[10px] text-gray-500">{activeChat.eventId?.title}</p>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30 dark:bg-gray-950/20">
                {activeChat.messages.filter(m => !m.deletedBy.includes(user._id)).length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <svg className="w-12 h-12 mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="text-sm">No messages yet. Say hello!</p>
                  </div>
                ) : (
                  activeChat.messages
                    .filter(m => !m.deletedBy.includes(user._id))
                    .map((msg, idx) => (
                    <div 
                      key={idx} 
                      className={`flex ${msg.senderId === user._id ? 'justify-end' : 'justify-start'} group`}
                    >
                      <div className={`relative max-w-[70%] p-3 rounded-2xl text-sm ${
                        msg.senderId === user._id 
                          ? 'bg-indigo-600 text-white rounded-tr-none' 
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-100 dark:border-gray-700 rounded-tl-none'
                      }`}>
                        {msg.isDeletedForEveryone ? (
                          <p className="italic text-[11px] opacity-70 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                            {msg.content}
                          </p>
                        ) : (
                          <p>{msg.content}</p>
                        )}
                        <p className={`text-[9px] mt-1 ${msg.senderId === user._id ? 'text-indigo-200' : 'text-gray-400'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>

                        {/* Delete Menu */}
                        {!msg.isDeletedForEveryone && (
                          <div className={`absolute top-0 ${msg.senderId === user._id ? 'right-full mr-2' : 'left-full ml-2'} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1`}>
                            <button 
                              onClick={() => handleDeleteMessage(msg._id, "me")}
                              title="Delete for me"
                              className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                            {msg.senderId === user._id && (
                              <button 
                                onClick={() => handleDeleteMessage(msg._id, "everyone")}
                                title="Delete for everyone"
                                className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 dark:border-gray-800 flex gap-2">
                <input 
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
                <button 
                  disabled={sending || !messageText.trim()}
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  {sending ? '...' : 'Send'}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Your Conversations</h3>
              <p className="text-sm max-w-xs text-center">Select a chat from the left to start communicating with other event attendees.</p>
            </div>
          )}
        </div>

      </main>
      <Footer />
    </div>
  );
};

export default UserChat;