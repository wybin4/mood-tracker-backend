const { OAuth2Client } = require('google-auth-library');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const validateOauthToken = async (token) => {
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        return {
            id: payload.sub,
            email: payload.email,
            name: payload.name,
            picture: payload.picture,
        };
    } catch (error) {
        console.error('Error validating OAuth token:', error.message);
        return null;
    }
};

module.exports = { validateOauthToken };
