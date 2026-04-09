import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/user.model.js";

const initializePassport = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/v1/user/auth/google/callback",
        proxy: true,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists
          let user = await User.findOne({ 
            $or: [
              { googleId: profile.id },
              { email: profile.emails[0].value }
            ]
          });

          if (user) {
            // If user exists but didn't have googleId (was registered via email), link them
            if (!user.googleId) {
              user.googleId = profile.id;
              user.isSSO = true;
              if (!user.profileImage) {
                user.profileImage = profile.photos[0].value;
              }
              await user.save();
            }
            return done(null, user);
          }

          // Create new user if not found
          user = await User.create({
            name: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,
            isSSO: true,
            profileImage: profile.photos[0].value,
            role: "user", // Default role
          });

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};

export default initializePassport;
