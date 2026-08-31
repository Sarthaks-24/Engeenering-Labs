import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import Customer from '../models/customer.model.js';

dotenv.config();


const authMiddleware = async (req,res,next)=>{
    const token = req.cookies.token;
    if(!token){
        return res.status(401).json({error:'UnAuthorized'});
    }
    const decoded = jwt.verify(token,process.env.JWT_SECRET);

    const customer = await Customer.findById(decoded.id);
    if (!customer) {
            return res.status(401).json({
                error: "Unauthorized"
            });
    }
    req.user = customer;
    next();

}

export default authMiddleware;