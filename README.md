# 🚀 Twiller

A modern, full-stack social media platform inspired by X (formerly Twitter), built using the MERN stack. Twiller allows users to create posts, connect with others, share images, and interact through a responsive, feature-rich interface. The project also includes secure authentication, email and SMS verification, cloud image storage, and integrated payments.

---

## ✨ Features

### 👤 Authentication & Security

* Secure user authentication with **Firebase Authentication**
* Email & Password login
* Google Sign-In
* Password reset via email
* OTP verification
* Protected routes
* Session management

### 📝 Social Features

* Create, edit, and delete posts
* Upload images with posts
* Like and unlike posts
* Comment system
* Reply to comments
* Share posts
* User profiles
* Responsive timeline/feed
* Modern Twitter-inspired UI

### ☁️ Media Upload

* Image uploads using **Cloudinary**
* Optimized cloud storage
* Fast image delivery

### 💳 Payments

* Integrated **Razorpay Test API**
* Secure payment workflow
* Invoice generation after successful payments

### 📧 Email Automation

Automated emails powered by **Brevo SMTP**:

* OTP verification
* Password reset
* Payment invoices
* Welcome emails
* Account notifications

### 📱 SMS Verification

* OTP SMS using **FAST2SMS API**
* Mobile verification support

### 🎨 User Experience

* Fully responsive design
* Dark modern interface
* Smooth animations
* Fast page transitions
* Clean and intuitive UI

---

# 🛠 Tech Stack

## Frontend

* React
* Vite
* Tailwind CSS
* Axios
* Framer Motion

## Backend

* Node.js
* Express.js

## Database

* MongoDB
* Mongoose

## Authentication

* Firebase Authentication

## Cloud Services

* Cloudinary

## Email Service

* Brevo SMTP

## SMS Service

* FAST2SMS

## Payments

* Razorpay Test API

---

# 📂 Project Structure

```text
Twiller/
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── config/
│   └── server.js
│
└── README.md
```

---

# ⚙️ Environment Variables

Create a `.env` file in the backend directory and configure the required environment variables.

```env
# Server
PORT=

# MongoDB
MONGO_URI=

# Firebase
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=

# JWT
JWT_SECRET=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# Brevo SMTP
BREVO_SMTP_HOST=
BREVO_SMTP_PORT=
BREVO_SMTP_USER=
BREVO_SMTP_PASSWORD=

# FAST2SMS
FAST2SMS_API_KEY=
```

---

# 🚀 Installation

Clone the repository

```bash
git clone https://github.com/your-username/twiller.git
```

Move into the project directory

```bash
cd twiller
```

Install frontend dependencies

```bash
cd frontend
npm install
```

Install backend dependencies

```bash
cd ../backend
npm install
```

Configure the `.env` file.

Start the backend server

```bash
npm run dev
```

Start the frontend

```bash
cd ../frontend
npm run dev
```

---

# 📸 Screenshots

Add screenshots of:

* Login Page
* Home Feed
* User Profile
* Create Post
* Comments
* Payment Page
* Mobile View

---

# 🔒 Security

* Firebase Authentication
* Password reset workflow
* OTP verification
* Secure password handling
* Environment variable protection
* Cloud image storage
* Protected backend APIs

---

# 📈 Future Improvements

* Follow & Unfollow users
* Real-time notifications
* Direct messaging
* Video uploads
* Story feature
* Bookmark posts
* Trending hashtags
* Advanced search
* Admin dashboard
* Progressive Web App (PWA)

---

# 🤝 Contributing

Contributions, issues, and feature requests are welcome.

Feel free to fork the repository and submit a pull request.

---

# 📄 License

This project is licensed under the MIT License.

---

# 👨‍💻 Author

**Rutik Phadtare**

Full Stack Developer

If you found this project helpful, consider giving it a ⭐ on GitHub!
