import { Router } from "express";
import { createCategory, deleteCategory, getAllCategories, getCategoryById, searchCategory, updateCategory } from "../controllers/categoryController.js";
import { isAuthenticated, isAuthorized } from "../middlewares/authMiddleware.js";
import { categoryImageUpload } from "../middlewares/imageUpload.js";


const categoryRouter = Router();


categoryRouter.post('/category', isAuthenticated, isAuthorized(['admin']) , categoryImageUpload.single('image'),createCategory);

//all categories
categoryRouter.get('/category', getAllCategories);

//search category
categoryRouter.get('/category/search', searchCategory);

//one or single category
categoryRouter.get('/category/:id', getCategoryById);

//update category
categoryRouter.patch('/category/:id', isAuthenticated, isAuthorized(['admin']), categoryImageUpload.single('image'), updateCategory);

//delete category
categoryRouter.delete('/category/:id', isAuthenticated, isAuthorized(['admin']), deleteCategory);





export default categoryRouter;