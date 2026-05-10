# Frontend Phase 1 — Project Setup & Authentication UI

## Overview

This phase sets up the entire React frontend foundation and builds the
authentication flow. By the end, a user can land on a gothic-themed landing
page, register or login, and reach a protected dashboard. JWT tokens are
managed automatically via Axios interceptors.

---

## Tech Stack for This Phase

```
Vite + React 18
Tailwind CSS v3
Framer Motion
Zustand
Axios
React Router v6
```

---

## Folder Structure to Create

```
client/
├── public/
│   └── assets/
│       └── fonts/                   # Cinzel Decorative, EB Garamond
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.jsx
│   │   │   ├── RegisterForm.jsx
│   │   │   └── GoogleOAuthButton.jsx
│   │   └── ui/
│   │       ├── Button.jsx
│   │       ├── Input.jsx
│   │       ├── Spinner.jsx
│   │       └── PageTransition.jsx
│   ├── pages/
│   │   ├── Landing.jsx
│   │   ├── Auth.jsx               # Combined login/register page
│   │   ├── Dashboard.jsx          # Placeholder for now
│   │   └── NotFound.jsx
│   ├── store/
│   │   └── authStore.js
│   ├── services/
│   │   └── api.js                 # Axios instance
│   ├── hooks/
│   │   └── useAuth.js
│   ├── utils/
│   │   └── helpers.js
│   ├── router/
│   │   └── ProtectedRoute.jsx
│   ├── styles/
│   │   └── globals.css
│   └── App.jsx
├── index.html
├── vite.config.js
├── tailwind.config.js
└── .env
```

---

## Setup Commands

```bash
# Create Vite project
npm create vite@latest client -- --template react
cd client

# Install all dependencies for the entire project upfront
npm install react-router-dom axios zustand framer-motion
npm install socket.io-client

# Dev dependencies
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

---

## Environment Variables (`client/.env`)

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

---

## Design System — CSS Variables

### `src/styles/globals.css`

```css
@import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Courier+Prime&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* Backgrounds */
  --bg-primary: #0a0005;
  --bg-secondary: #12000a;
  --bg-surface: #1a0010;
  --bg-elevated: #220015;

  /* Borders */
  --border-subtle: #3d0020;
  --border-default: #5c0030;
  --border-strong: #8b0040;

  /* Archetype Colors */
  --vampire: #8b0000;
  --vampire-light: #c41e3a;
  --werewolf: #c45e00;
  --werewolf-light: #e07820;
  --witch: #5c0a8a;
  --witch-light: #8b2fc9;
  --hybrid: #8a7000;
  --hybrid-light: #c4a800;

  /* Text */
  --text-primary: #f0dce8;
  --text-secondary: #a07090;
  --text-muted: #604050;
  --text-accent: #c20045;

  /* Accent */
  --accent: #c20045;
  --accent-hover: #e0005a;
  --accent-glow: rgba(194, 0, 69, 0.3);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'EB Garamond', serif;
  min-height: 100vh;
  overflow-x: hidden;
}

h1, h2, h3, h4 {
  font-family: 'Cinzel Decorative', cursive;
}

/* Scrollbar */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: var(--bg-primary); }
::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 2px; }

/* Glow effect utility */
.glow-accent {
  box-shadow: 0 0 20px var(--accent-glow);
}

/* Blood drip animation */
@keyframes drip {
  0% { transform: scaleY(0); transform-origin: top; }
  100% { transform: scaleY(1); transform-origin: top; }
}

/* Flicker animation */
@keyframes flicker {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.85; }
}

.flicker { animation: flicker 3s infinite; }
```

---

## `tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#0a0005",
          secondary: "#12000a",
          surface: "#1a0010",
          elevated: "#220015",
        },
        border: {
          subtle: "#3d0020",
          default: "#5c0030",
          strong: "#8b0040",
        },
        accent: {
          DEFAULT: "#c20045",
          hover: "#e0005a",
        },
        text: {
          primary: "#f0dce8",
          secondary: "#a07090",
          muted: "#604050",
        },
        vampire: { DEFAULT: "#8b0000", light: "#c41e3a" },
        werewolf: { DEFAULT: "#c45e00", light: "#e07820" },
        witch: { DEFAULT: "#5c0a8a", light: "#8b2fc9" },
        hybrid: { DEFAULT: "#8a7000", light: "#c4a800" },
      },
      fontFamily: {
        display: ["Cinzel Decorative", "cursive"],
        body: ["EB Garamond", "serif"],
        mono: ["Courier Prime", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.4s ease-out",
        flicker: "flicker 3s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        slideUp: {
          "0%": { opacity: 0, transform: "translateY(20px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
```

---

## `src/services/api.js` — Axios Instance

```javascript
import axios from "axios";
import { useAuthStore } from "../store/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // Send cookies (refresh token)
});

// Request interceptor — attach access token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401, refresh token
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        const newToken = data.accessToken;
        useAuthStore.getState().setAccessToken(newToken);
        processQueue(null, newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        window.location.href = "/auth";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

---

## `src/store/authStore.js` — Zustand Auth Store

```javascript
import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../services/api";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isLoading: false,
      error: null,

      setAccessToken: (token) => set({ accessToken: token }),

      register: async (name, email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.post("/auth/register", {
            name,
            email,
            password,
          });
          set({
            user: data.user,
            accessToken: data.accessToken,
            isLoading: false,
          });
          return { success: true };
        } catch (err) {
          const message = err.response?.data?.message || "Registration failed";
          set({ error: message, isLoading: false });
          return { success: false, error: message };
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.post("/auth/login", { email, password });
          set({
            user: data.user,
            accessToken: data.accessToken,
            isLoading: false,
          });
          return { success: true };
        } catch (err) {
          const message = err.response?.data?.message || "Login failed";
          set({ error: message, isLoading: false });
          return { success: false, error: message };
        }
      },

      logout: async () => {
        try {
          await api.post("/auth/logout");
        } catch (_) {}
        set({ user: null, accessToken: null });
      },

      fetchMe: async () => {
        try {
          const { data } = await api.get("/auth/me");
          set({ user: data.user });
        } catch (_) {
          set({ user: null, accessToken: null });
        }
      },

      updateUser: (updates) =>
        set((state) => ({ user: { ...state.user, ...updates } })),

      clearError: () => set({ error: null }),
    }),
    {
      name: "mysticmatch-auth",
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
      }),
    }
  )
);
```

---

## `src/router/ProtectedRoute.jsx`

```jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const ProtectedRoute = ({ children }) => {
  const { user, accessToken } = useAuthStore();
  const location = useLocation();

  if (!user || !accessToken) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
```

---

## `src/App.jsx`

```jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "./store/authStore";
import ProtectedRoute from "./router/ProtectedRoute";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

function App() {
  const { user, fetchMe, accessToken } = useAuthStore();

  // Rehydrate user on app load
  useEffect(() => {
    if (accessToken && !user) {
      fetchMe();
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/auth"
          element={user ? <Navigate to="/dashboard" replace /> : <Auth />}
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

---

## `src/pages/Landing.jsx`

```jsx
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background atmospheric gradient */}
      <div className="absolute inset-0 bg-gradient-radial from-vampire/10 via-transparent to-transparent pointer-events-none" />

      {/* Blood moon decoration */}
      <motion.div
        className="absolute top-16 right-16 w-32 h-32 rounded-full bg-gradient-radial from-vampire-light/30 to-vampire/10 blur-xl"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 4, repeat: Infinity }}
      />

      <motion.div
        className="text-center z-10 px-6 max-w-3xl"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        {/* Logo */}
        <motion.p
          className="text-text-secondary font-mono text-sm tracking-[0.3em] mb-4 uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Welcome to Mystic Falls
        </motion.p>

        <motion.h1
          className="font-display text-5xl md:text-7xl text-text-primary mb-6 leading-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          Mystic
          <span className="text-accent"> Match</span>
        </motion.h1>

        <motion.p
          className="text-text-secondary text-xl font-body italic mb-10 leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          "Some bonds transcend lifetimes. Some connections are written in blood."
          <br />
          Find yours.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <button
            onClick={() => navigate(user ? "/dashboard" : "/auth")}
            className="px-10 py-4 bg-accent hover:bg-accent-hover text-white font-display text-sm tracking-widest uppercase transition-all duration-300 glow-accent border border-accent/50"
          >
            Enter Mystic Falls
          </button>
        </motion.div>
      </motion.div>

      {/* Bottom tagline */}
      <motion.p
        className="absolute bottom-8 text-text-muted font-mono text-xs tracking-widest"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        ◆ YOUR SUPERNATURAL STORY BEGINS HERE ◆
      </motion.p>
    </div>
  );
};

export default Landing;
```

---

## `src/pages/Auth.jsx`

```jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LoginForm from "../components/auth/LoginForm";
import RegisterForm from "../components/auth/RegisterForm";

const Auth = () => {
  const [mode, setMode] = useState("login"); // "login" | "register"

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gradient-to-b from-vampire/5 via-transparent to-witch/5 pointer-events-none" />

      <motion.div
        className="w-full max-w-md z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl text-text-primary mb-2">
            Mystic<span className="text-accent">Match</span>
          </h1>
          <p className="text-text-secondary font-body italic text-sm">
            {mode === "login"
              ? "The night remembers those who return."
              : "Your supernatural story begins with a name."}
          </p>
        </div>

        {/* Tab Switch */}
        <div className="flex border border-border-subtle mb-8">
          {["login", "register"].map((tab) => (
            <button
              key={tab}
              onClick={() => setMode(tab)}
              className={`flex-1 py-3 font-display text-xs tracking-widest uppercase transition-all duration-300 ${
                mode === tab
                  ? "bg-accent text-white"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {tab === "login" ? "Return" : "Begin"}
            </button>
          ))}
        </div>

        {/* Forms */}
        <AnimatePresence mode="wait">
          {mode === "login" ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <LoginForm />
            </motion.div>
          ) : (
            <motion.div
              key="register"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <RegisterForm />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Switch mode link */}
        <p className="text-center text-text-muted text-sm mt-6 font-body">
          {mode === "login" ? "New to Mystic Falls?" : "Already a creature of the night?"}{" "}
          <button
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="text-accent hover:text-accent-hover underline underline-offset-2 transition-colors"
          >
            {mode === "login" ? "Begin your story" : "Return"}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
```

---

## `src/components/auth/LoginForm.jsx`

```jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import Input from "../ui/Input";
import Button from "../ui/Button";

const LoginForm = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => {
    clearError();
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(form.email, form.password);
    if (result.success) navigate("/dashboard");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="Email"
        name="email"
        type="email"
        value={form.email}
        onChange={handleChange}
        placeholder="your@email.com"
        required
      />
      <Input
        label="Password"
        name="password"
        type="password"
        value={form.password}
        onChange={handleChange}
        placeholder="••••••••"
        required
      />

      {error && (
        <p className="text-accent text-sm font-body text-center border border-accent/30 bg-accent/5 py-2 px-4">
          {error}
        </p>
      )}

      <Button type="submit" loading={isLoading} fullWidth>
        Enter the Night
      </Button>
    </form>
  );
};

export default LoginForm;
```

---

## `src/components/auth/RegisterForm.jsx`

```jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import Input from "../ui/Input";
import Button from "../ui/Button";

const RegisterForm = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const { register, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => {
    clearError();
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return;
    const result = await register(form.name, form.email, form.password);
    if (result.success) navigate("/onboarding/quiz");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="Your Name"
        name="name"
        value={form.name}
        onChange={handleChange}
        placeholder="What do they call you?"
        required
      />
      <Input
        label="Email"
        name="email"
        type="email"
        value={form.email}
        onChange={handleChange}
        placeholder="your@email.com"
        required
      />
      <Input
        label="Password"
        name="password"
        type="password"
        value={form.password}
        onChange={handleChange}
        placeholder="At least 6 characters"
        required
        minLength={6}
      />

      {error && (
        <p className="text-accent text-sm font-body text-center border border-accent/30 bg-accent/5 py-2 px-4">
          {error}
        </p>
      )}

      <Button type="submit" loading={isLoading} fullWidth>
        Begin My Story
      </Button>
    </form>
  );
};

export default RegisterForm;
```

---

## Shared UI Components

### `src/components/ui/Input.jsx`

```jsx
const Input = ({ label, error, ...props }) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label className="font-mono text-xs text-text-secondary tracking-widest uppercase">
        {label}
      </label>
    )}
    <input
      className="bg-bg-surface border border-border-subtle text-text-primary placeholder-text-muted px-4 py-3 font-body text-base outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/20 transition-all duration-200"
      {...props}
    />
    {error && <p className="text-accent text-xs font-mono">{error}</p>}
  </div>
);

export default Input;
```

### `src/components/ui/Button.jsx`

```jsx
import Spinner from "./Spinner";

const Button = ({
  children,
  loading = false,
  fullWidth = false,
  variant = "primary",
  size = "md",
  ...props
}) => {
  const base =
    "font-display tracking-widest uppercase transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";

  const variants = {
    primary: "bg-accent hover:bg-accent-hover text-white border border-accent/50 glow-accent",
    outline: "bg-transparent border border-border-default text-text-primary hover:border-accent hover:text-accent",
    ghost: "bg-transparent text-text-secondary hover:text-text-primary",
  };

  const sizes = {
    sm: "px-4 py-2 text-xs",
    md: "px-8 py-3 text-sm",
    lg: "px-12 py-4 text-base",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""}`}
      disabled={loading}
      {...props}
    >
      {loading ? <Spinner size="sm" /> : children}
    </button>
  );
};

export default Button;
```

### `src/components/ui/Spinner.jsx`

```jsx
const Spinner = ({ size = "md" }) => {
  const sizes = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-8 h-8" };
  return (
    <div
      className={`${sizes[size]} border-2 border-text-muted border-t-accent rounded-full animate-spin`}
    />
  );
};

export default Spinner;
```

### `src/components/ui/PageTransition.jsx`

```jsx
import { motion } from "framer-motion";

const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -12 }}
    transition={{ duration: 0.35, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

export default PageTransition;
```

---

## `src/pages/Dashboard.jsx` (Placeholder)

```jsx
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";

const Dashboard = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center text-center px-4">
      <h1 className="font-display text-3xl text-text-primary mb-4">
        Welcome, {user?.name}
      </h1>
      <p className="text-text-secondary font-body italic mb-2">
        Type:{" "}
        <span className="text-accent">
          {user?.supernaturalType || "Unclassified"}
        </span>
      </p>
      <p className="text-text-muted text-sm mb-8 font-mono">
        Quiz: {user?.quizCompleted ? "✓ Complete" : "✗ Pending"}
      </p>
      <Button onClick={handleLogout} variant="outline">
        Leave Mystic Falls
      </Button>
    </div>
  );
};

export default Dashboard;
```

---

## `src/pages/NotFound.jsx`

```jsx
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center text-center px-4">
      <p className="font-mono text-text-muted text-sm tracking-widest mb-4">404</p>
      <h1 className="font-display text-4xl text-text-primary mb-4">
        Lost in Mystic Falls
      </h1>
      <p className="text-text-secondary font-body italic mb-8">
        Even vampires have a sense of direction. This path leads nowhere.
      </p>
      <Button onClick={() => navigate("/")}>Return to the Beginning</Button>
    </div>
  );
};

export default NotFound;
```

---

## Testing Checklist

- [ ] `npm run dev` starts without errors
- [ ] Landing page renders with gothic theme and animations
- [ ] Clicking "Enter Mystic Falls" navigates to `/auth`
- [ ] Register form submits and navigates to `/onboarding/quiz` (even if that page is a placeholder)
- [ ] Login form submits and navigates to `/dashboard`
- [ ] Wrong credentials show error message
- [ ] Duplicate email on register shows error message
- [ ] Refreshing the dashboard page keeps user logged in (persisted store)
- [ ] Navigating to `/dashboard` without auth redirects to `/auth`
- [ ] Logged-in user visiting `/auth` redirects to `/dashboard`
- [ ] Logout clears state and redirects to `/`
- [ ] Axios interceptor attaches `Bearer` token to all requests
- [ ] Expired token triggers refresh and retries original request

---

## ✅ Phase 1 Complete When

- All pages render without console errors
- Auth flow (register → dashboard, login → dashboard) works end to end
- Protected routes redirect unauthenticated users
- Zustand persists auth state across page reload
- Axios interceptor handles token refresh transparently
- Gothic design system is applied consistently (fonts, colors, no light mode)