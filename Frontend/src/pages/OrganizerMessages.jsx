import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import axiosInstance from "../utils/axios";
import toast from "react-hot-toast";

export default function OrganizerMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [sendingReply, setSendingReply] = useState(false);
  const [activeDeleteId, setActiveDeleteId] = useState(null);
  const [clearingChatId, setClearingChatId] = useState(null);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/v1/message/organizer");
      if (res.data?.success) {
        setMessages(res.data.messages);
      }
    } catch (error) {
      toast.error("Failed to fetch messages");
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = async (threadId) => {
    if (!window.confirm("Are you sure you want to clear this entire chat history for you?")) return;
    try {
      setClearingChatId(threadId);
      const res = await axiosInstance.post("/api/v1/message/clear-chat", { threadId });
      if (res.data.success) {
        toast.success("Chat history cleared");
        fetchMessages();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to clear chat");
    } finally {
      setClearingChatId(null);
    }
  };

  const handleDeleteMessage = async (threadId, messageId, deleteType) => {
    try {
      const res = await axiosInstance.delete("/api/v1/message/delete", {
        data: { threadId, messageId, deleteType }
      });
      if (res.data.success) {
        toast.success(deleteType === "me" ? "Deleted for you" : "Deleted for everyone");
        setActiveDeleteId(null);
        fetchMessages();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete message");
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return toast.error("Please enter a reply");
    try {
      setSendingReply(true);
      const res = await axiosInstance.post("/api/v1/message/reply", {
        messageId: selectedMessage._id,
        reply: replyText
      });
      if (res.data?.success) {
        toast.success("Reply sent successfully!");
        setReplyText("");
        setSelectedMessage(null);
        fetchMessages();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send reply");
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Navbar />
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Inquiries & Messages</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage and respond to attendee questions.</p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-12 text-center border dark:border-gray-800 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No messages yet</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Attendee inquiries will appear here.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {messages.map((msg) => (
              <div key={msg._id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-widest border border-indigo-100 dark:border-indigo-800">
                          {msg.eventId?.title}
                        </span>
                        {msg.isReplied ? (
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-widest border border-emerald-100 dark:border-emerald-800">Replied</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-widest border border-amber-100 dark:border-amber-800">Pending</span>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{msg.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{msg.email}</p>
                        </div>
                      </div>
                      
                      {/* Message Thread */}
                      <div className="mt-4 space-y-3">
                        {(msg.messages || []).map((m, idx) => (
                          <div 
                            key={idx} 
                            className={`group/msg p-4 rounded-xl border ${
                              m.senderType === "user" 
                                ? "bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-800 ml-0 mr-8" 
                                : "bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/20 ml-8 mr-0"
                            }`}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className={`text-[9px] font-bold uppercase tracking-widest ${
                                m.senderType === "user" ? "text-gray-500" : "text-indigo-600 dark:text-indigo-400"
                              }`}>
                                {m.senderType === "user" ? "Attendee" : "You (Organizer)"}
                              </span>

                              <div className="flex items-center gap-2">
                                <span className="text-[9px] text-gray-400">
                                  {new Date(m.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                </span>

                                {/* Delete Action */}
                                <div className="relative opacity-0 group-hover/msg:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => setActiveDeleteId(activeDeleteId?.messageId === m._id ? null : {threadId: msg._id, messageId: m._id})}
                                    className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded text-gray-400 hover:text-red-500 transition-colors"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>

                                  {activeDeleteId?.messageId === m._id && (
                                    <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg shadow-xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-200">
                                      <button 
                                        onClick={() => handleDeleteMessage(msg._id, m._id, "me")}
                                        className="w-full px-3 py-1.5 text-left text-[10px] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                      >
                                        Delete for me
                                      </button>
                                      {m.senderType === "organizer" && (
                                        <button 
                                          onClick={() => handleDeleteMessage(msg._id, m._id, "everyone")}
                                          className="w-full px-3 py-1.5 text-left text-[10px] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                                        >
                                          Delete for everyone
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <p className={`text-sm ${
                              m.senderType === "user" ? "text-gray-700 dark:text-gray-300" : "text-gray-600 dark:text-gray-400"
                            } whitespace-pre-wrap`}>
                              {m.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-2">
                      <button
                        onClick={() => handleClearChat(msg._id)}
                        disabled={clearingChatId === msg._id}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-red-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        {clearingChatId === msg._id ? (
                          <div className="w-3 h-3 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                        Clear Chat
                      </button>
                      {!msg.isReplied && (
                        <button
                          onClick={() => setSelectedMessage(msg)}
                          className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all"
                        >
                          Reply
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Reply Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border dark:border-gray-800 animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-6 text-white relative">
              <button onClick={() => setSelectedMessage(null)} className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-xl transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h3 className="text-xl font-bold">Reply to {selectedMessage.name}</h3>
              <p className="text-indigo-100 text-xs mt-1">Regarding: {selectedMessage.eventId?.title}</p>
            </div>
            <div className="p-6">
              <div className="mb-6 space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {(selectedMessage.messages || []).map((m, idx) => (
                  <div 
                    key={idx} 
                    className={`group/modal-msg p-4 rounded-xl border ${
                      m.senderType === "user" 
                        ? "bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 ml-0 mr-6" 
                        : "bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/20 ml-6 mr-0"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-[8px] font-bold uppercase tracking-widest ${
                        m.senderType === "user" ? "text-gray-500" : "text-indigo-600 dark:text-indigo-400"
                      }`}>
                        {m.senderType === "user" ? "Attendee" : "You"}
                      </span>

                      <div className="flex items-center gap-2">
                        <span className="text-[8px] text-gray-400">
                          {new Date(m.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>

                        {/* Delete Action in Modal */}
                        <div className="relative opacity-0 group-hover/modal-msg:opacity-100 transition-opacity">
                          <button 
                            onClick={() => setActiveDeleteId(activeDeleteId?.messageId === m._id ? null : {threadId: selectedMessage._id, messageId: m._id})}
                            className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>

                          {activeDeleteId?.messageId === m._id && (
                            <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg shadow-xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-200">
                              <button 
                                onClick={() => handleDeleteMessage(selectedMessage._id, m._id, "me")}
                                className="w-full px-3 py-1.5 text-left text-[9px] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                              >
                                Delete for me
                              </button>
                              {m.senderType === "organizer" && (
                                <button 
                                  onClick={() => handleDeleteMessage(selectedMessage._id, m._id, "everyone")}
                                  className="w-full px-3 py-1.5 text-left text-[9px] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                                >
                                  Delete for everyone
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className={`text-xs ${
                      m.senderType === "user" ? "text-gray-700 dark:text-gray-300" : "text-gray-600 dark:text-gray-400"
                    } whitespace-pre-wrap`}>
                      {m.content}
                    </p>
                  </div>
                ))}
              </div>
              <form onSubmit={handleReply} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Your Reply</label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Type your response..."
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={sendingReply}
                  className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {sendingReply ? "Sending..." : "Send Reply"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}