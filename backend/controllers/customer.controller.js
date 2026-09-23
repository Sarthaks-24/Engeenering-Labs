import Customer from "../models/customer.model.js";
import bcrypt from 'bcrypt';
import generateToken from "../utils/generateToken.js";

const registerCustomer = async (req,res) =>{
    //console.log("req recieved");
    const { fullName, email, password, phone } = req.body;

    if(!fullName|| !email || !password || !phone){
        return res.status(400).json({'error':"Missing a required field"});
    }

    if(password.length<6) return res.status(400).json({'error':"Password too Short"});

    const existing = await Customer.findOne({email});

    if(existing) return res.status(409).json({'error':'Email already in use'});

    const hashPass = await bcrypt.hash(password,10);

    const customer = await Customer.create({
        name:fullName,
        email,
        password:hashPass,
        phone
    })

    res.status(201).json({
        success:true,
        message: "Customer registered successfully",
        customer:{
            id:customer._id,
            fullName:fullName,
            email:email,
            phone:phone
        }
    });
}

const loginCustomer = async(req,res)=>{
    try{
        const{email,password} = req.body;

        const user = await Customer.findOne({email});

        if(!user){
            return res.status(401).json({
                error:'Invalid email or password'
            })
        }

        const validUser = await bcrypt.compare(password,user.password);

        if(!validUser){
            return res.status(401).json({
                error:'Invalid email or password'
            })
        }

        const token = generateToken(user._id);

        res.cookie('token',token,{
            httpOnly:true
        })

        return res.status(200).json({
            success: true,
            message: "Login successful",
            customer: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone
            }
        });
    }catch(err){
        return res.status(500).json({
            error: "Internal server error"
        });

    }
}

const showCustomer = (req,res)=>{
    return res.status(200).json({
        id:req.user._id,
        name:req.user.name,
        email:req.user.email,
        phone:req.user.phone,
    })
}


const logoutCustomer = (req,res)=>{
    res.clearCookie('token')
    return res.status(200).json({
        success:true,
        message:'Logout Successfull'
    })
}
export {registerCustomer, loginCustomer,showCustomer,logoutCustomer};
