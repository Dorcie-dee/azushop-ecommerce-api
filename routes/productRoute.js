import { Router } from "express";
import { isAuthenticated, isAuthorized } from "../middlewares/authMiddleware.js";
import { productImageUpload } from "../middlewares/imageUpload.js";
import { createProduct, deleteProduct, getAllProducts, getProductById, searchProducts, updateProduct, getVendorProducts } from "../controllers/productController.js";


const productRouter = Router();


productRouter.post('/product', isAuthenticated, isAuthorized(['admin']), productImageUpload.array('images', 3), createProduct );

//all products
productRouter.get('/product', getAllProducts);

//specific vendor/admin's products
productRouter.get('/product/vendor', isAuthenticated, getVendorProducts);

//search products
productRouter.get('/product/search', searchProducts);

//one or single product
productRouter.get('/product/:id', getProductById);

//update product
productRouter.patch('/product/:id', isAuthenticated, isAuthorized(['admin']), productImageUpload.array('images', 3), updateProduct);

//delete product
productRouter.delete('/product/:id', isAuthenticated, isAuthorized(['admin']), deleteProduct);



export default productRouter;