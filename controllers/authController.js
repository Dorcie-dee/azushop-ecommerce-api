import { userModel } from "../models/userModel.js";
import { forgotPasswordValidator, loginValidator, registerUserValidator, registerVendorValidator, resendVerificationValidator, resetPasswordValidator, updatePasswordValidator, verifyUsersValidator } from "../validators/userValidator.js";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { registerUserMailTemplate, registerVendorMailTemplate, resetPasswordMailTemplate, sendingEmail } from "../utils/mailing.js";
import { vendorModel } from "../models/vendorModel.js";



//manual user signup
export const registerUser = async (req, res) => {
  try {

    //validate user info
    const { error, value } = registerUserValidator.validate(req.body);
    if (error) {
      return res.status(422).json({ message: error.message });
    }

    //checking if user doesn't exist yet
    const userAlreadyExists = await userModel.findOne({
      email: value.email
    });

    if (userAlreadyExists) {
      return res.status(409).json({ message: 'User already exists' })
    }

    //password hash
    const hashingPassword = await bcrypt.hash(value.password, 10);

    //6-digit OTP verification token
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

    //OTP to expire in 20 minutes
    const verificationTokenExpiresAt = new Date(Date.now() + 20 * 60 * 1000);


    //create new user record in db
    const incomingUser = await userModel.create({
      ...value,
      password: hashingPassword,
      role: "user",
      provider: 'local',
      isVerified: false,
      verificationToken,
      verificationTokenExpiresAt,
      lastLogin: new Date()
    });


    //Generate JWT that expires in 20 minutes
    const token = jwt.sign(
      { id: incomingUser._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "20m" }
    );

    //email sending
    try {
      const emailSubject = "Your AzuShop Verification Code";
      const emailBody = registerUserMailTemplate
        .replace('{{fullName}}', value.fullName)
        .replace('{{verificationToken}}', verificationToken);

      await sendingEmail(incomingUser.email, emailSubject, emailBody);
    } catch (emailError) {
      console.error('Error sending email:', emailError.message);
    }


    //remove password before sending response
    const userWithoutPassword = incomingUser.toObject();
    delete userWithoutPassword.password;

    // Return response
    return res.status(201).json({
      message: 'User created successfully. Check your email for the OTP token.',
      // data: incomingUser,
      data: userWithoutPassword,
      token,
    });

  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};



//manual vendor signup
export const registerVendor = async (req, res) => {
  try {
    //validate learner info
    const { error, value } = registerVendorValidator.validate(req.body);
    if (error) {
      return res.status(422).json({ message: error.message });
    }

    //checking if vendor doesn't exist yet
    const vendorAlreadyExists = await vendorModel.findOne({
      email: value.email
    });

    if (vendorAlreadyExists) {
      return res.status(409).json({ message: 'Vendor already exists' })
    }

    //password hash
    const hashingPassword = await bcrypt.hash(value.password, 10);

    //6-digit OTP verification token
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

    //OTP to expire in 20 minutes
    const verificationTokenExpiresAt = new Date(Date.now() + 20 * 60 * 1000);


    //create new vendor record in db
    const incomingVendor = await vendorModel.create({
      ...value,
      password: hashingPassword,
      role: "vendor",
      provider: 'local',
      isVerified: false,
      verificationToken,
      verificationTokenExpiresAt,
      lastLogin: new Date()
    });


    //Generate JWT that expires in 20 minutes
    const token = jwt.sign(
      { id: incomingVendor._id },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "20m" }
    );

    //email sending
    try {
      const emailSubject = "Your AzuShop Verification Code";
      const emailBody = registerVendorMailTemplate
        .replace('{{fullName}}', value.fullName)
        .replace('{{verificationToken}}', verificationToken);

      await sendingEmail(incomingVendor.email, emailSubject, emailBody);
    } catch (emailError) {
      console.error('Error sending email:', emailError.message);
    }


    //remove password before sending response
    const userWithoutPassword = incomingVendor.toObject();
    delete userWithoutPassword.password;

    // Return response
    return res.status(201).json({
      message: 'Vendor created successfully. Check your email for the OTP token.',
      // data: incomingVendor,
      data: userWithoutPassword,
      token,
    });

  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};



//manual email signup verification
export const verifyUsers = async (req, res) => {
  try {
    // Validate incoming request
    const { error, value } = verifyUsersValidator.validate(req.body);
    if (error) {
      return res.status(422).json({ message: error.message });
    }

    const { email, verificationToken } = value;

    // Check if user exists. only works with those who signed up as users and not vendors
    // const user = await userModel.findOne({ email });

    //finding users in both models.
    let user = await userModel.findOne({ email });
    let role = 'user';

    if (!user) {
      user = await vendorModel.findOne({ email });
      role = 'vendor';
    }

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    //If already verified
    if (user.isEmailVerified) {
      return res.status(400).json({ message: "User is already verified." });
    }

    //checking if token matches and is not expired
    const now = Date.now();
    const isTokenExpired = !user.verificationTokenExpiresAt || now > user.verificationTokenExpiresAt.getTime();

    if (user.verificationToken !== verificationToken || isTokenExpired) {
      return res.status(400).json({ message: "Invalid or expired verification token." });
    }

    //updating verification status
    user.isEmailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiresAt = undefined;
    user.lastLogin = new Date();

    await user.save();

    return res.status(200).json({ message: "User verified successfully." });

  } catch (error) {
    console.error("Verification error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};



//manual resend verification token
export const resendVerificationEmail = async (req, res) => {
  try {

    // Validate request body
    const { error, value } = resendVerificationValidator.validate(req.body);

    if (error) {
      return res.status(422).json({ message: error.message });
    }

    // Find user by email
    // const user = await userModel.findOne({ email: value.email });

    const { email } = value
    //find user by email
    let user = await vendorModel.findOne({ email });
    let role = 'vendor';

    if (!user) {
      user = await userModel.findOne({ email });
      role = 'user';
    }

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: "User is already verified." });
    }

    //rate-limiting logic: max 3 resends in 30 minutes
    const THIRTY_MINUTES = 30 * 60 * 1000;
    const now = Date.now();

    if (user.lastResendAt && now - user.lastResendAt.getTime() < THIRTY_MINUTES) {
      if (user.resendAttempts >= 3) {
        return res.status(429).json({
          message: "You've reached the maximum number of OTP requests. Try again in 30 minutes.",
        });
      }
      user.resendAttempts += 1;
    } else {
      user.resendAttempts = 1;
      user.lastResendAt = new Date();
    }

    //generating new 6-digit OTP and expiry time
    const newVerificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    const newExpiry = new Date(now + 20 * 60 * 1000); // 20 minutes from now

    user.verificationToken = newVerificationToken;
    user.verificationTokenExpiresAt = newExpiry;

    await user.save();


    // Select email template based on role
    const emailSubject = "Your New AzuShop Verification Code";

    let emailBody = "";
    if (user.role === "vendor") {
      emailBody = registerVendorMailTemplate
        .replace("{{fullName}}", user.fullName)
        .replace("{{verificationToken}}", newVerificationToken);

    } else {
      emailBody = registerUserMailTemplate
        .replace("{{fullName}}", user.fullName)
        .replace("{{verificationToken}}", newVerificationToken);
    }

    await sendingEmail(user.email, emailSubject, emailBody);

    return res.status(200).json({
      message: "Verification token resent successfully. Please check your email.",
      newVerificationToken
    });

  } catch (error) {
    console.error("Resend verification error:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};



//manual login
export const loginUser = async (req, res) => {
  try {
    const { error, value } = loginValidator.validate(req.body);

    if (error) {
      return res.status(422).json({ message: error.message });
    }

    //if email exists
    // const user = await userModel.findOne({ email: value.email });

    const { email } = value
    let user = await vendorModel.findOne({ email });
    let role = 'vendor';

    if (!user) {
      user = await userModel.findOne({ email });
      role = 'user';
    }


    if (!user) {
      return res.status(404).json('User not found')
    };

    //comparing password
    const isAMatch = await bcrypt.compare(value.password, user.password);
    if (!isAMatch) {
      return res.status(401).json('Invalid credentials');
    }

    //generating jwt token
    const token = jwt.sign({
      id: user._id, role: user.role
    },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '5h' });

    res.status(200).json({
      token,
      user: {
        role: user.role,
        email: user.email,
        id: user.id
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}



//manual forgot password
export const forgotPassword = async (req, res) => {
  try {
    const { error, value } = forgotPasswordValidator.validate(req.body);
    if (error) {
      return res.status(422).json({ message: error.message });
    }

    // const user = await userModel.findOne({ email: value.email });

    const { email } = value;
    let user = await vendorModel.findOne({ email });
    let role = 'vendor';

    if (!user) {
      user = await userModel.findOne({ email });
      role = 'user';
    }


    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    //expire after 15 mins
    const tokenExpires = new Date(Date.now() + 15 * 60 * 1000);

    user.resetToken = resetToken;
    user.resetTokenExpires = tokenExpires;
    await user.save();


    const resetURL = `${process.env.BASE_RESET_URL}/${resetToken}`;

    //email sending
    try {
      const emailSubject = "Your AzuShop Password Reset Code";
      const emailBody = resetPasswordMailTemplate
        .replace('{{fullName}}', user.fullName)
        .replace('{{resetToken}}', resetURL)
        .replace('{{user}}', role);

      await sendingEmail(user.email, emailSubject, emailBody);

      res.status(200).json({
        message: "Reset code sent to email",
        //optional: I need to remove this in production
        resetURL: resetURL
      });

    } catch (resetEmailError) {
      console.error('Error sending reset email code:', resetEmailError.message);
      res.status(500).json({
        message: "Failed to send reset email.",
        error: error.message
      });
    }

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};



//manual reset password with only new and confirm password in UI
export const resetPassword = async (req, res) => {
  try {
    const { error, value } = resetPasswordValidator.validate(req.body);
    if (error) {
      return res.status(422).json({ message: error.message });
    }

    const { token } = req.params;
    const { newPassword } = value;

    // const user = await userModel.findOne({ resetToken: token });


    let user = await vendorModel.findOne({ resetToken: token });
    let role = 'vendor';

    if (!user) {
      user = await userModel.findOne({ resetToken: token });
      role = 'user';
    }

    if (!user || new Date() > user.resetTokenExpires) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;

    await user.save();

    res.status(200).json({ message: "Password reset successful" });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};



//manual password update/change
export const updatePassword = async (req, res) => {
  try {
    if (!req.auth || !req.auth.id) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    //validating input
    const { error, value } = updatePasswordValidator.validate(req.body);
    if (error) {
      return res.status(422).json({ message: error.message });
    }

    //extracting validated data
    const { currentPassword, newPassword } = value;

    //finding user (either vendor or user)
    let account = await vendorModel.findById(req.auth.id);
    let role = 'vendor';

    if (!account) {
      account = await userModel.findById(req.auth.id);
      role = 'user';
    }

    if (!account) {
      return res.status(404).json('User not found')
    };

    // //updating user password
    // const updatedPassword = await vendorModel.findById(
    //   req.auth.id
    // );

    //comparing password
    const isTheSame = await bcrypt.compare(currentPassword, account.password);

    if (!isTheSame) {
      return res.status(401).json({ message: "Incorrect current password" });
    }

    account.password = await bcrypt.hash(newPassword, 10);
    await account.save();

    const updatedPassword = await (role === "vendor"
      ? vendorModel.findById(account._id).select("-password")
      : userModel.findById(account._id).select("-password"));


    res.status(200).json({
      message: "Password updated successfully",
      update: updatedPassword
    });

  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};


