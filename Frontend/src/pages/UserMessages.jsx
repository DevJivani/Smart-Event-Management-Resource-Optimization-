import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import axiosInstance from "../utils/axios";
import toast from "react-hot-toast";

export default function UserMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [followUpText, setFollowUpText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeDeleteId, setActiveDeleteId] = useState(null); // {threadId, messageId}
  const [clearingChatId, setClearingChatId] = useState(null);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/v1/message/user");
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
    if (!window.confirm("Are you sure you want to clear this entire chat history?")) return;
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

  const handleFollowUp = async (messageId) => {
    if (!followUpText.trim()) return;
    try {
      setSubmitting(true);
      const res = await axiosInstance.post("/api/v1/message/follow-up", {
        messageId,
        followUp: followUpText
      });
      if (res.data.success) {
        toast.success("Follow-up sent!");
        setFollowUpText("");
        setActiveReplyId(null);
        fetchMessages();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send follow-up");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] text-gray-900 dark:text-white selection:bg-purple-500/30 transition-colors duration-300">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative py-20 overflow-hidden border-b border-gray-200 dark:border-white/5 bg-white dark:bg-transparent">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-transparent to-blue-600/5 dark:from-purple-600/10 dark:to-blue-600/10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h1 className="text-5xl font-extrabold tracking-tight mb-4">
            Organizer <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400">Replies</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl leading-relaxed">
            Check responses from event organizers to your inquiries.
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-gray-200 dark:border-white/5 border-t-purple-500 rounded-full animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-16 text-center border border-gray-200 dark:border-white/10 shadow-xl dark:shadow-2xl max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-3">No replies yet</h3>
            <p className="text-gray-500 text-lg">
              When organizers respond to your questions, they will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-8">
            {messages.map((msg) => (
              <div 
                key={msg._id} 
                className="group relative bg-white dark:bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-gray-200 dark:border-white/10 overflow-hidden hover:bg-gray-50 dark:hover:bg-white/[0.07] transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/10"
              >
                <div className="p-10">
                  <div className="flex flex-col md:flex-row justify-between gap-8">
                    <div className="flex-1 space-y-6">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="px-4 py-1.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-widest border border-purple-500/20">
                            {msg.eventId?.title}
                          </span>
                          {msg.isReplied ? (
                            <span className="px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-widest border border-emerald-500/20">Replied</span>
                          ) : (
                            <span className="px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-widest border border-amber-500/20">Pending Response</span>
                          )}
                        </div>

                        {/* Clear Chat Button */}
                        <button
                          onClick={() => handleClearChat(msg._id)}
                          disabled={clearingChatId === msg._id}
                          className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest text-red-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                        >
                          {clearingChatId === msg._id ? (
                            <div className="w-3 h-3 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin"></div>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                          Clear All Chat
                        </button>
                      </div>
                      
                      <div>
                        <h3 className="text-2xl font-bold mb-6 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                          Conversation with {msg.organizerId?.userName || "Organizer"}
                        </h3>
                        
                        {/* Message Thread */}
                        <div className="space-y-4">
                          {(msg.messages || []).map((m, idx) => (
                            <div 
                              key={idx} 
                              className={`group/msg p-6 rounded-2xl border ${
                                m.senderType === "user" 
                                  ? "bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5 ml-0 mr-12" 
                                  : "bg-purple-50 dark:bg-purple-500/10 border-purple-100 dark:border-purple-500/20 ml-12 mr-0"
                              }`}
                            >
                              <div className="flex justify-between items-center mb-2">
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${
                                  m.senderType === "user" ? "text-gray-400 dark:text-gray-500" : "text-purple-600 dark:text-purple-400"
                                }`}>
                                  {m.senderType === "user" ? "You" : "Organizer"}
                                </span>
                                
                                <div className="flex items-center gap-3">
                                  <span className="text-[10px] text-gray-400 dark:text-gray-600">
                                    {new Date(m.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                  </span>

                                  {/* Delete Action */}
                                  <div className="relative opacity-0 group-hover/msg:opacity-100 transition-opacity">
                                    <button 
                                      onClick={() => setActiveDeleteId(activeDeleteId?.messageId === m._id ? null : {threadId: msg._id, messageId: m._id})}
                                      className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>

                                    {activeDeleteId?.messageId === m._id && (
                                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in-95 duration-200">
                                        <button 
                                          onClick={() => handleDeleteMessage(msg._id, m._id, "me")}
                                          className="w-full px-4 py-2 text-left text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                        >
                                          Delete for me
                                        </button>
                                        {m.senderType === "user" && (
                                          <button 
                                            onClick={() => handleDeleteMessage(msg._id, m._id, "everyone")}
                                            className="w-full px-4 py-2 text-left text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-400/5 transition-colors"
                                          >
                                            Delete for everyone
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <p className={`text-sm leading-relaxed ${
                                m.senderType === "user" ? "text-gray-600 dark:text-gray-400" : "text-gray-800 dark:text-gray-200"
                              } whitespace-pre-wrap`}>
                                {m.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Ask Again / Follow-up Section */}
                      <div className="pt-6 border-t border-gray-100 dark:border-white/5 mt-6">
                        {activeReplyId === msg._id ? (
                          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <textarea
                              value={followUpText}
                              onChange={(e) => setFollowUpText(e.target.value)}
                              placeholder="Type your follow-up question here..."
                              className="w-full p-6 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:ring-2 focus:ring-purple-500 outline-none transition-all resize-none min-h-[120px]"
                            />
                            <div className="flex gap-3">
                              <button
                                onClick={() => handleFollowUp(msg._id)}
                                disabled={submitting || !followUpText.trim()}
                                className="px-8 py-3 bg-purple-600 dark:bg-white text-white dark:text-black font-bold rounded-2xl hover:bg-purple-700 dark:hover:bg-gray-200 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-purple-500/20 dark:shadow-none"
                              >
                                {submitting ? <div className="w-4 h-4 border-2 border-white/20 dark:border-black/20 border-t-white dark:border-t-black rounded-full animate-spin"></div> : "Send Follow-up"}
                              </button>
                              <button
                                onClick={() => {
                                  setActiveReplyId(null);
                                  setFollowUpText("");
                                }}
                                className="px-8 py-3 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-bold rounded-2xl hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setActiveReplyId(msg._id)}
                            className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-bold text-sm uppercase tracking-widest transition-colors group"
                          >
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                            Ask Again / Follow-up
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
