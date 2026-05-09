import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css"; // Custom styles for Login Page

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("auth"));
    if (user?.username === "admin") {
      console.log("Redirecting to dashboard...", user);
      navigate("/dashboard"); // Ensure it's executed inside useEffect
    }
  }, [navigate]); // Runs only when component mounts

  const handleLogin = () => {
    let valid = true;

    // Validate Username
    if (username.trim() === "") {
      setUsernameError("Username is required");
      valid = false;
    } else {
      setUsernameError("");
    }

    // Validate Password
    if (password.trim() === "") {
      setPasswordError("Password is required");
      valid = false;
    } else {
      setPasswordError("");
    }

    // Proceed with login if valid
    if (valid) {
      // Mock validation (replace with actual API call)
      if (username === "admin" && password === "password") {
        // Set session storage
        sessionStorage.setItem("auth", JSON.stringify({ username }));

        // Redirect to dashboard
        navigate("/dashboard");
      } else {
        setUsernameError("Invalid credentials");
        setPasswordError("");
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>WELCOME HOME</h1>
        <div className="input-group">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          {usernameError && (
            <div className="error-message">{usernameError}</div>
          )}
        </div>
        <div className="input-group">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {passwordError && (
            <div className="error-message">{passwordError}</div>
          )}
        </div>
        <button onClick={handleLogin}>Login</button>
      </div>
    </div>
  );
};

export default LoginPage;
