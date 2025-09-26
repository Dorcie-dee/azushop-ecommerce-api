import { Router } from "express"
import { cancelOrder, createOrder, deleteOrder, getAllOrders, getMyOrders, getSingleOrder, updateOrder } from "../controllers/orderController.js";
import { isAuthenticated, isAuthorized } from "../middlewares/authMiddleware.js";



const orderRouter = Router();


orderRouter.post('/orders', isAuthenticated, createOrder);


// all orders on the platform
orderRouter.get('/orders', isAuthenticated, isAuthorized(['admin']), getAllOrders);


//logged-in customer sees only their own orders.
orderRouter.get('/orders/my-orders', isAuthenticated, isAuthorized(['user']), getMyOrders);


//getting single  order
orderRouter.get('/orders/:id', isAuthenticated, getSingleOrder);


//admin updates status (e.g., processing → shipped → delivered), assign tracking number, update payment status, etc.
orderRouter.patch('/orders/:id', isAuthenticated, isAuthorized(['admin']), updateOrder);


//customer cancels their own order if it’s still in `pending` or `processing`.
orderRouter.patch('/orders/:id/cancel', isAuthenticated, cancelOrder);


//
orderRouter.delete('/orders/:id', isAuthenticated, isAuthorized(['admin']), deleteOrder);



// POST`/api/orders/apply-coupon`
//* Takes a `couponCode` and returns recalculated totals (without creating the order yet).


// GET`/api/orders/track/:trackingNumber`
// * Public endpoint to check status by tracking number.

// POST`/api/orders/:id/refund`


export default orderRouter;