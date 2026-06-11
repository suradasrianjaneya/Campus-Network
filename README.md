# 🎓 CampusConnect

> A Professional Campus Community Platform for Students

CampusConnect is a modern full-stack web application designed to simplify student life by providing a centralized platform for **Lost & Found**, **Buy & Sell Marketplace**, and **Campus Announcements**. Built specifically for college students, the platform enables seamless interaction, efficient item recovery, and secure campus trading within a trusted academic environment.

---

## 🚀 Key Features

### 🔍 Lost & Found

Never lose track of your belongings again.

- Report lost items with detailed descriptions and images.
- Post found items to help owners recover them quickly.
- Filter reports by category and status.
- Search lost and found records instantly.
- Mark items as recovered or resolved.

---

### 🛒 Campus Marketplace

Buy and sell items safely within your college community.

- Create product listings with images.
- Set prices and item conditions.
- Browse products by category.
- Mark listings as sold.
- Manage your own marketplace posts.

**Categories Include:**
- Electronics
- Books
- Stationery
- Cycles
- Accessories
- Lab Equipment
- Furniture
- Others

---

### 📢 Student Feed & Announcements

Stay connected with your campus.

- Share announcements and updates.
- Post events and opportunities.
- Ask questions and start discussions.
- Like and comment on posts.
- Engage with fellow students.

---

### 👤 User Authentication

Secure and reliable account management.

- Student Signup & Login
- JWT Authentication
- Protected Routes
- Password Encryption
- Session Management

---

### 🔎 Smart Search

Quickly find what you're looking for.

Search across:

- Lost Items
- Found Items
- Marketplace Listings
- Student Posts

---

### 📱 Fully Responsive

Optimized for:

- Desktop 💻
- Tablet 📱
- Mobile 📲

---

## 🛠️ Technology Stack

### Frontend

- React.js
- Vite
- Tailwind CSS
- JavaScript

### Backend

- Node.js
- Express.js

### Database

- MongoDB

### Authentication

- JWT (JSON Web Tokens)

### Additional Services

- Cloudinary (Image Storage)
- Socket.io (Real-Time Features)

---

## 📂 Project Structure

```bash
CampusConnect/
│
├── client/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── server/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── package.json
│
└── README.md
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/campusconnect.git
cd campusconnect
```

### 2️⃣ Install Frontend Dependencies

```bash
cd client
npm install
```

### 3️⃣ Install Backend Dependencies

```bash
cd ../server
npm install
```

---

## 🔧 Environment Variables

Create a `.env` file inside the `server` folder.

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_secret_key

CLOUDINARY_CLOUD_NAME=your_cloud_name

CLOUDINARY_API_KEY=your_api_key

CLOUDINARY_API_SECRET=your_api_secret
```

---

## ▶️ Running the Application

### Start Backend Server

```bash
cd server
npm run dev
```

### Start Frontend Application

```bash
cd client
npm run dev
```

---

## 🎯 Project Objective

CampusConnect aims to solve common challenges faced by students by creating a single platform for:

- Recovering lost belongings.
- Buying and selling products within campus.
- Sharing announcements and opportunities.
- Strengthening student collaboration.
- Building a connected campus community.

---

## 🔒 Security Features

- JWT Authentication
- Password Hashing
- Protected API Routes
- Input Validation
- Secure Data Handling
- Error Handling Middleware

---

## 🌟 Future Scope

Planned enhancements include:

- Real-Time Messaging
- Push Notifications
- AI-Powered Search
- Student Clubs & Communities
- Campus Event Management
- Profile Verification System
- Campus Navigation Integration

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository.
2. Create your feature branch.
3. Commit your changes.
4. Push to your branch.
5. Open a Pull Request.

---

## 📄 License

This project is intended for educational, academic, and learning purposes.

---

## ❤️ Built For Students

CampusConnect is designed to make campus life smarter, safer, and more connected by providing a reliable platform where students can collaborate, trade, communicate, and help one another.

### Made with ❤️ for Students.