import crypto from "crypto";
import { createOrderValidator, updateOrderValidator } from "../validators/orderValidator.js";
import { orderModel } from "../models/orderModel.js";
import { productModel } from "../models/productModel.js";
import { couponModel } from "../models/couponModel.js";
import { userModel } from "../models/userModel.js";



export const createOrder = async (req, res) => {
  try {
    //validating request body
    const { error, value } = createOrderValidator.validate(
      { ...req.body },
      { abortEarly: false }
    );

    if (error) {
      return res.status(422).json({
        message: "Validation failed",
        errors: error.details.map((err) => err.message),
      });
    }

    //generating unique order number
    const datePart = new Date()
      .toISOString()
      .replace(/[-:.TZ]/g, "")
      .slice(0, 8); // YYYYMMDD
    const randomPart = crypto.randomBytes(4).toString("hex").toUpperCase(); // 8 chars
    const orderNumber = `ORD-${datePart}-${randomPart}`;


    //calculating item subtotals (respect product discounts)
    let subtotal = 0;
    const itemsWithDetails = [];

    for (const item of value.items) {
      const product = await productModel.findById(item.productId);

      if (!product) {
        return res.status(404).json({
          message: `Product with ID ${item.productId} not found`,
        });
      }

      //if product has a discountPrice, use it; else use normal price
      const effectivePrice =
        product.discountPrice && product.discountPrice < product.price
          ? product.discountPrice
          : product.price;

      const itemSubtotal = effectivePrice * item.quantity;
      subtotal += itemSubtotal;

      itemsWithDetails.push({
        ...item,
        name: product.name,
        price: effectivePrice,
        sku: product.sku,
        subtotal: itemSubtotal,
      });
    }

    //applying coupon if provided
    let discount = 0;
    if (value.couponCode) {
      const coupon = await couponModel.findOne({ code: value.couponCode });

      if (coupon) {
        if (coupon.discountType === "percentage") {
          discount = (subtotal * coupon.discountValue) / 100;
        } else if (coupon.discountType === "fixed") {
          discount = coupon.discountValue;
        }
      }
    }

    //computing grand total
    const tax = value.tax || 0;
    const shippingFee = value.shippingFee || 0;

    const grandTotal = subtotal + tax + shippingFee - discount;

    //saving order
    const newOrder = await orderModel.create({
      ...value,
      items: itemsWithDetails,
      orderNumber,
      customerId: req.auth.id,  //from logged-in user
      tax,
      shippingFee,
      discountPrice: discount,
      grandTotal,
    });

    //populating for clean response
    const populatedOrder = await orderModel
      .findById(newOrder._id)
      .populate("customerId", "fullName email")
      .populate("items.productId", "name price sku stock");

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      subtotal,
      discount,
      tax,
      shippingFee,
      grandTotal,
      data: populatedOrder,
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message || "Unknown error",
    });
  }
};



//get all orders - admin only
export const getAllOrders = async (req, res) => {
  try {

    //filters
    const {
      status,             //by status: pending, shipped, delivered, cancelled
      paymentStatus,      //by payment: pending, paid, refunded
      customerId,         //by customer id
      startDate,          //by date range
      endDate,
      sortBy = "createdAt",
      order = "desc",     //asc or desc
      page = 1,
      limit = 10,
    } = req.query;

    let query = {};

    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (customerId) query.customerId = customerId;
    if (startDate && endDate) {
      query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    //pagination
    const skip = (page - 1) * limit;

    const orders = await orderModel.find(query)
      .sort({ [sortBy]: order === "desc" ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("customerId", "fullName email")
      .populate("items.productId", "name price stock");

    const totalOrders = await orderModel.countDocuments(query);

    res.status(200).json({
      success: true,
      totalOrders,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalOrders / limit),
      orders,
    });

  } catch (error) {
    console.error("Error fetching all orders:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};



//get all orders - customer only
export const getMyOrders = async (req, res) => {
  try {

    if (!req.auth || !req.auth.id) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    const { sortBy = "createdAt", order = "desc", page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const customerId = req.auth.id

    const orders = await orderModel.find({ customerId })
      .sort({ [sortBy]: order === "desc" ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("items.productId", "name price");

    const totalOrders = await orderModel.countDocuments({ customerId });

    res.status(200).json({
      success: true,
      totalOrders,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalOrders / limit),
      orders,
    });

  } catch (error) {
    console.error("Error fetching my orders:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};



//get single order
export const getSingleOrder = async (req, res) => {
  try {

    if (!req.auth || !req.auth.id) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    const { id } = req.params;

    const order = await orderModel.findById(id)
      .populate("customerId", "fullName email")
      .populate("items.productId", "name price sku stock");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json(order);

  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};



//update order - admin only
export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;

    //validate request body
    const { error, value } = updateOrderValidator.validate(
      { ...req.body },
      { abortEarly: false }
    );

    if (error) {
      return res.status(422).json({
        message: "Validation failed",
        errors: error.details.map((err) => err.message),
      });
    }

    const updatedData = {
      ...value,
      admin: req.auth.id,
    };

    const order = await orderModel
      .findById(id)
      .exec();

    //updating order
    const updatedOrder = await orderModel.findByIdAndUpdate(id,
      updatedData,
      {
      new: true,
      runValidators: false
    })

    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Order updated successfully",
      order: updatedOrder,
    });

  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};



//customers cancels their own order
export const cancelOrder = async (req, res) => {
  try {

    const order = await orderModel.findOne({
      _id: req.params.id,
      customerId: req.auth.id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or not authorized",
      });
    }

    if (!["pending", "processing"].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order with status '${order.orderStatus}'`,
      });
    }

    order.orderStatus = "cancelled";
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    console.error("Cancel Order Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};



export const deleteOrder = async (req, res) => {
  try {
    if (!req.auth || !req.auth.id) {
      return res.status(401).json({
        message: "Unauthorized access"
      });
    }

    const { id } = req.params;

    const order = await orderModel.findById(id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    const adminId = req.auth.id;
    const admin = await userModel.findById(adminId).select("fullName");

    //deleting order
    await orderModel.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Order deleted successfully",
      deletedBy: admin ? admin.fullName : "Unknown Admin",
      order
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};


// export const createOrder1 = async (req, res) => {
//   try {

//     //validate request body
//     const { error, value } = createOrderValidator.validate(
//       { ...req.body },
//       { abortEarly: false }
//     );

//     if (error) {
//       return res.status(422).json({
//         message: "Validation failed",
//         errors: error.details.map((err) => err.message),
//       });
//     }

//     //auto-generating unique order number ORD-YYYYMMDD-XXXXXXXX
//     const datePart = new Date()
//       .toISOString()
//       .replace(/[-:.TZ]/g, "")
//       .slice(0, 8);     //YYYYMMDD
//     const randomPart = crypto.randomBytes(4).toString("hex").toUpperCase(); //8 chars
//     const orderNumber = `ORD-${datePart}-${randomPart}`;


//     const totalAmount = value.items.reduce((acc, item) => {
//       return acc + item.price * item.quantity;
//     }, 0);


//     //creating order
//     const newOrder = await orderModel.create({
//       ...value,
//       orderNumber,
//       customerId: req.auth.id, // from logged in user
//     });

//     //populating for cleaner response
//     const populatedOrder = await orderModel
//       .findById(newOrder._id)
//       .populate("customerId", "fullName email")
//       .populate("items.productId", "name price sku");

//     return res.status(201).json({
//       success: true,
//       message: "Order created successfully",
//       totalAmount,
//       data: populatedOrder,
//     });

//   } catch (error) {
//     res.status(500).json({
//       message: "Server error",
//       error: error.message || "Unknown error",
//     });
//   }
// };




