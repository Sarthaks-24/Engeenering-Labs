import Product from "../models/product.model.js";
import mongoose from "mongoose";

const createProduct = async(req,res)=>{
    try{
        const {name,description,price,category,image,stock} = req.body;
        if(!name || !description || !price || !category || !image ||!stock){
            return res.status(400).json({error:"Missing required field"})
        }
        if(price<=0){
            return res.status(400).json({error:"Invalid price"});
        }
        if(stock<0){
            return res.status(400).json({error:"Invalid stock"});
        }

        const product = await Product.create({
            name,
            description,
            price,
            category,
            image,
            stock
        })

        res.status(201).json(product);
    }catch(err){
        res.status(500).json({message:"Internal Server Error"})
    }
}

const getProducts = async(req,res)=>{
    try{
        const search = req.query.search;
        const category = req.query.category;
        const sort = req.query.sort;
        
        let products = await Product.find();
        if(search) products = products.filter(product =>product.name.toLowerCase().includes(search.toLowerCase()));
        if(category) products = products.filter(product =>product.category.toLowerCase().includes(category.toLowerCase()));
        if(sort){
            if(sort=="price_asc") products = products.sort((a,b) => a.price-b.price);
            else products = products.sort((a,b) => b.price-a.price);
        }
        products = products.map(product => {
                delete product.createdAt
                return product

        })
        res.status(200).json({
            "success":true,
            "count":products.length,
            "products": products
        })
    }catch(err){
        res.status(500).json({message:"Internal Server Error"})
    }
}

const getProduct = async(req,res)=>{
    try{
        
       const id = req.params.id;
       if(!id || !mongoose.Types.ObjectId.isValid(id)){
        return res.status(400).json({error:"Invalid product ID"});
       }
       const product = await Product.findById(id);
       if(!product){
        return res.status(404).json({error:"Product not found"});
       }
       return res.status(200).json(product);

    }catch(err){
        res.status(500).json({message:"Internal Server Error"})
    }
}


export {createProduct,getProduct, getProducts}