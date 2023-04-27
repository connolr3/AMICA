const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');


function initalise(passport, getUserbyEmail) {
    const authenticateUser = async(email, password, done) => {
        const user = getUserbyEmail(email)
        if (user == null) {
            return done(null, false, { message: "No user with that email" });
        }
        try {
            if (await bcrypt.compare(password, userpassword)) {
                return done(null, user);
            } else {
                return done(null, false, { message: "Password incorrect!" });
            }
        } catch (e) {
            return done(e)
        }
    }
    passport.use(new LocalStrategy({ usernameField: 'email' }), authenticateUser)
    passport.serializeUser((user, done) => {})
    passport.deserializeUser((id, done) => {})
}


module.exports(initalise)