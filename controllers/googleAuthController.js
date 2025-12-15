// controllers/googleAuthController.js
import { OAuth2Client } from "google-auth-library";
import User from "../models/userModels.js";
import generateToken from "../utils/generateToken.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req, res) => {
  const { token } = req.body;

  try {
    // Verify token with Google
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name } = payload;

    // Check if user exists
    let user = await User.findOne({ email });
    if (!user) {
      // Create new user with null password
      user = await User.create({
        name,
        email,
        password: null,
      });
    }

    // Send back app JWT
    res.json({
      message: "Google login successful",
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Google login failed" });
  }
};
