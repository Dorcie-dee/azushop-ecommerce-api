Got it ✅ — I’ll expand the **Azushop README** to include **example request & response payloads** for each module (Auth, Products, Categories, Orders). That way, devs can quickly test your API just like the LAMS example you showed.

Here’s the updated **README.md** draft:

---

# 🛒 Azushop E-commerce API

Welcome to **Azushop**, a feature-rich **E-commerce REST API** that powers modern online stores with authentication, product management, categories, and orders.

This project covers:
**Authentication, user roles, product management, categories, orders, email notifications, search/filtering, and secure checkout flow.**

---

# 🕹️ Published POSTMAN Documentation URL

👉 [Azushop API Documentation](https://documenter.getpostman.com/view/xxxxxx)

---

## ⚡ System Overview

* 🟢 **Open Access**: Anyone can browse categories and products.
* 🔑 **Authentication**: Secure JWT-based login/signup with role-based access.
* 🛍️ **Products**: Vendors and admins can manage products with images, descriptions, discounts, and variants.
* 📂 **Categories**: Organize products into categories and subcategories for structured browsing.
* 📦 **Orders**: Customers can place, view, and track orders.
* 📧 **Email Notifications**: Integrated with Nodemailer for welcome emails and order updates.
* 🔍 **Search & Filters**: Advanced filtering by name, category, price, discount, and stock.

---

# 🔑 Auth Module

Handles **user identity & security** — signup, login, profile, and authentication.

| Method | Endpoint             | Description                 | Role          |
| ------ | -------------------- | --------------------------- | ------------- |
| POST   | `/api/auth/register` | Register a new user         | Open          |
| POST   | `/api/auth/login`    | Login with email & password | Open          |
| GET    | `/api/auth/me`       | Get current user profile    | Authenticated |
| POST   | `/api/auth/logout`   | Logout user                 | Authenticated |

### Example: Register

**Request**

```json
POST /api/auth/register
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "StrongPass123",
  "role": "vendor"
}
```

**Response**

```json
{
  "message": "User registered successfully",
  "user": {
    "id": "usr_12345",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "vendor"
  }
}
```

---

### Example: Login

**Request**

```json
POST /api/auth/login
{
  "email": "jane@example.com",
  "password": "StrongPass123"
}
```

**Response**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR...",
  "user": {
    "id": "usr_12345",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "vendor"
  }
}
```

---

# 🛍️ Products Module

Manages the **creation, update, deletion, and retrieval of products**.

| Method | Endpoint            | Description                   | Role         |
| ------ | ------------------- | ----------------------------- | ------------ |
| POST   | `/api/products`     | Create a product              | Vendor/Admin |
| GET    | `/api/products`     | Get all products (searchable) | Open         |
| GET    | `/api/products/:id` | Get single product            | Open         |
| PUT    | `/api/products/:id` | Update product                | Vendor/Admin |
| DELETE | `/api/products/:id` | Delete product                | Vendor/Admin |

### Example: Create Product

**Request**

```json
POST /api/product
{
  "name": "Canon r100 mirrorless",
  "description": "mirrorless dslr",
  "price": 120,
  "discountPrice": 99,
  "stock": 50,
  "category": "cat_001"
}
```

**Response**

```json
{
  "message": "Product created successfully",
  "product": {
    "id": "prd_1001",
    "name": "Canon r100 mirrorless",
    "sku": "CAN12345",
    "price": 120,
    "discountPrice": 99,
    "stock": 50,
    "category": "cat_001",
  }
}
```

---

# 📂 Categories Module

Organizes **products into structured groups** for browsing and filtering.

| Method | Endpoint            | Description         | Role  |
| ------ | ------------------- | ------------------- | ----- |
| POST   | `/api/category`     | Create category     | Admin |
| GET    | `/api/category`     | Get all categories  | Open  |
| GET    | `/api/category/:id` | Get single category | Open  |
| PATCH  | `/api/category/:id` | Update category     | Admin |
| DELETE | `/api/category/:id` | Delete category     | Admin |

### Example: Create Category

**Request**

```json
POST /api/category
{
  "name": "Cameras",
  "parentCategory": null,
  "isActive": true
}
```

**Response**

```json
{
  "message": "Category created successfully",
  "category": {
    "id": "cat_001",
    "name": "Cameras",
    "slug": "cameras",
    "isActive": true
  }
}
```

---

# 📦 Orders Module

Handles **customer checkout and order management**.

| Method   | Endpoint                   | Description         | Role  |
| ------   | -----------------          | ------------------- | ----- |
| POST     | `/api/orders`              | Place a new order   | User  |
| GET      | `/api/orders`              | Get all orders      | Admin |
| GET      | `/api/orders/my-orders`    | Get user's orders   | User  |
| GET      | `/api/orders/:id`          | Get specific order  | Both  |
| PATCH    | `/api/orders/:id`          | Update order status | Admin |
| PATCH    | `/api/orders/:id/cancel`   | Cancel order status | User  |
| DELETE   | `/api/orders/:id`          | Cancel order        | User  |

### Example: Place Order

**Request**

```json
POST /api/orders
{
  "userId": "usr_12345",
  "items": [
    {
      "productId": "prd_1001",
      "quantity": 2
    }
  ],
  "totalPrice": 198,
  "shippingAddress": "123 Main St, Accra, Ghana"
}
```

**Response**

```json
{
  "message": "Order placed successfully",
  "order": {
    "id": "ord_5001",
    "userId": "usr_12345",
    "items": [
      {
        "productId": "prd_1001",
        "quantity": 2
      }
    ],
    "totalPrice": 198,
    "status": "pending",
    "shippingAddress": "123 Main St, Accra, Ghana"
  }
}
```

---

# ⚙️ Installation & Setup

Follow these steps to **set up Azushop locally**.

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Dorcie-dee/azushop-ecommerce-api
cd azushop-api
```

### 2️⃣ Fork the Repository (Optional)

Click the **Fork** button on GitHub to make your own copy for customization.

### 3️⃣ Install Dependencies

```bash
npm install
```

### 4️⃣ Create Environment Variables

Create a `.env` file in the root with:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email
EMAIL_PASS=your_password
```

### 5️⃣ Run the Project

```bash
npm run dev
```

App will be running at:
👉 `http://localhost:4020`

---

# 🤝 Contributing

PRs are welcome. Please open an issue for major changes before submitting.

---

# ⭐ Support

👉 **Star this repo** ⭐ if you like it
👉 **Check out my other projects** 
👉 **Let’s collaborate on something impactful**

---

# 👋 Final Note

Thanks for stopping by 💜
Keep building, keep learning, and let’s create something amazing together!