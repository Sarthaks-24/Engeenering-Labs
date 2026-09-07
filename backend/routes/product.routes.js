import express from 'express';
import {createProduct,getProduct,getProducts} from '../controllers/product.controller.js';

const productsRouter = express.Router();

productsRouter.post('/',createProduct);
productsRouter.get('/',getProducts);
productsRouter.get('/:id',getProduct);


export default productsRouter;
