import { expressjwt } from "express-jwt";
import { userModel } from "../models/userModel.js";
import { vendorModel } from "../models/vendorModel.js";

export const isAuthenticated = expressjwt({
    secret: process.env.JWT_SECRET_KEY,
    algorithms: ['HS256'],
    requestProperty: 'auth'
});

// async function checkIfUserIsVendor(id){
//     return await vendorModel.findById(req.auth.id);
// }




//authorization
export const isAuthorized = (roles) => {
    return async (req, res, next) => {
        try {
            // let user = await checkIfUserIsVendor(req.auth.id);
            let user = await vendorModel.findById(req.auth.id)
            let role = 'vendor';

            if (!user) {
                user = await userModel.findById(req.auth.id);
                role = 'user';
            }

            if (!user) {
                return res.status(404).json('User not found');
            }

            if (user.role === 'admin' || roles.includes(user.role)) {
                return next();
            }

            // if (!roles.includes(user.role)) {
            return res.status(403).json('You are not authorized')
            // }
            // next();
        } catch (error) {
            console.error('Authorization error:', error);
            res.status(500).json('Authorization error')
        }
    };
};