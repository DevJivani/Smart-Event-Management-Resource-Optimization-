import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axiosInstance from "../utils/axios";
import { toast } from "react-hot-toast";
import Navbar from "../components/Navbar";
import StatusBadge from "../components/StatusBadge";

const PublicProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublicProfile = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/api/v1/user/public/${userId}`);
        if (res.data.success) {
          setProfile(res.data.user);
        } else {
          toast.error(res.data.message || "Failed to load profile");
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Error loading profile");
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchPublicProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col transition-colors duration-300">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col transition-colors duration-300">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">User not found</h1>
          <button onClick={() => navigate(-1)} className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col transition-colors duration-300">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-24">
          <div className="flex flex-col md:flex-row items-center gap-8 text-white">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white/20 overflow-hidden shadow-2xl bg-white/10 flex items-center justify-center text-5xl font-bold backdrop-blur-sm">
              {profile.profileImage ? (
                <img src={profile.profileImage} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                profile.name?.charAt(0).toUpperCase()
              )}
            </div>
            <div className="text-center md:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                <h1 className="text-4xl sm:text-5xl font-bold">{profile.name}</h1>
                <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
                  profile.role === 'organizer' 
                    ? 'bg-blue-400/20 text-blue-200 border border-blue-400/30' 
                    : 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30'
                }`}>
                  {profile.role}
                </span>
              </div>
              <p className="text-white/80 text-lg">
                Member since {new Date(profile.memberSince).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </p>
            </div>

            {/* Organizer Stats Badge */}
            {profile.role === 'organizer' && profile.stats && (
              <div className="flex gap-4 sm:gap-6 mt-8 md:mt-0">
                <div className="text-center bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 min-w-[100px]">
                  <p className="text-2xl font-bold text-white">{profile.stats.avgRating || '0'}</p>
                  <p className="text-[10px] uppercase font-bold text-white/60 tracking-widest mt-1">Avg Rating</p>
                </div>
                <div className="text-center bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 min-w-[100px]">
                  <p className="text-2xl font-bold text-white">{profile.stats.totalEvents || '0'}</p>
                  <p className="text-[10px] uppercase font-bold text-white/60 tracking-widest mt-1">Total Events</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 py-12 w-full">
        {!profile.publicProfile ? (
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-12 text-center border border-gray-100 dark:border-gray-800 shadow-sm transition-colors">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">This Profile is Private</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              The user has chosen to keep their event activity and reviews private.
            </p>
          </div>
        ) : profile.role === 'organizer' ? (
          /* Organizer Specific Layout */
          <div className="space-y-12">
            <section className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Hosted Events
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">Explore events organized by {profile.name}</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {profile.hostedEvents?.length > 0 ? (
                  profile.hostedEvents.map((event) => (
                    <Link 
                      key={event._id} 
                      to={`/event/${event._id}`}
                      className="group bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-500 flex flex-col"
                    >
                      <div className="aspect-video relative overflow-hidden bg-gray-100 dark:bg-gray-800">
                        {event.bannerImage ? (
                          <img src={event.bannerImage} alt={event.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30" />
                        )}
                        <div className="absolute top-4 right-4">
                          <StatusBadge status={event.status} />
                        </div>
                      </div>
                      <div className="p-6 flex-1 flex flex-col">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-lg">
                            {event.categoryId?.name}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 transition-colors line-clamp-1">
                          {event.title}
                        </h3>
                        <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-50 dark:border-gray-800">
                          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-xs font-medium">{event.city || event.venue}</span>
                          </div>
                          <p className="text-xs font-bold text-gray-900 dark:text-white">
                            {event.isPaid ? `$${event.price}` : 'Free'}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400">No events hosted yet.</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        ) : (
          /* Regular User Layout */
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Attended Events Section */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Attended Events
                </h2>
              </div>
              
              <div className="grid gap-4">
                {profile.attendedEvents?.length > 0 ? (
                  profile.attendedEvents.map((booking) => (
                    <Link 
                      key={booking._id} 
                      to={`/event/${booking.eventId?._id}`}
                      className="group bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 flex gap-4 hover:shadow-md transition-all duration-300"
                    >
                      <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-gray-100 dark:bg-gray-800">
                        {booking.eventId?.bannerImage ? (
                          <img src={booking.eventId.bannerImage} alt={booking.eventId.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 transition-colors">
                          {booking.eventId?.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {booking.eventId?.city || booking.eventId?.venue}
                        </p>
                        <p className="text-xs font-medium text-gray-400 mt-2">
                          {new Date(booking.eventId?.startDate).toLocaleDateString()}
                        </p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="py-12 text-center bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400">No attended events yet.</p>
                  </div>
                )}
              </div>
            </section>

            {/* Reviews Section */}
            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                Recent Reviews
              </h2>

              <div className="grid gap-6">
                {profile.reviews?.length > 0 ? (
                  profile.reviews.map((review) => (
                    <div key={review._id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 transition-colors">
                      <div className="flex items-center justify-between mb-4">
                        <Link to={`/event/${review.eventId?._id}`} className="font-bold text-gray-900 dark:text-white hover:text-indigo-600 transition-colors">
                          {review.eventId?.title}
                        </Link>
                        <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg">
                          <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-xs font-bold text-amber-700 dark:text-amber-400">{review.rating}</span>
                        </div>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm italic">"{review.comment}"</p>
                      <p className="text-[10px] text-gray-400 mt-4 uppercase font-bold tracking-widest">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400">No reviews shared yet.</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default PublicProfile;