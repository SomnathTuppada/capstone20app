import { useState, useEffect } from "react";

export default function App() {
  const [file, setFile] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  // Read API base from Vite env (create frontend/.env if needed)
  const API = import.meta.env.VITE_API_URL || "http://localhost:5001";

  // fetch logged-in user (auth gateway)
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API}/auth/userinfo`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    };
    fetchUser();
  }, [API]);

  const handleLogin = () => {
    // redirect to auth gateway
    window.location.href = `${API}/auth/login`;
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API}/auth/logout`, { credentials: "include" });
    } catch {}
    setUser(null);
  };

  const handleFileChange = (e) => {
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }
    setFile(e.target.files[0]);
    setError("");
  };

  // IMPORTANT: async upload function (await inside function)
  const uploadFile = async () => {
    if (!user) {
      // if not logged in, redirect to login
      handleLogin();
      return;
    }
    if (!file) {
      setError("Please choose a file to upload.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API}/api/upload`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        // try to read server text (json or text)
        let text;
        try {
          text = await res.text();
        } catch (e) {
          text = `HTTP ${res.status}`;
        }
        setError(`Microservice / Backend error:\n${text}`);
        setLoading(false);
        return;
      }

      // read blob and create download url
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
    } catch (err) {
      setError("Cannot connect to backend: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.navbar}>
        <h2>Capstone App</h2>
        {!user ? (
          <button onClick={handleLogin} style={styles.loginBtn}>
            Login with Google
          </button>
        ) : (
          <div style={styles.userBox}>
            <img src={user.picture} alt="profile" style={styles.avatar} />
            <span>{user.name}</span>
            <button onClick={handleLogout} style={styles.logoutBtn}>
              Logout
            </button>
          </div>
        )}
      </div>

      <h1 style={styles.title}>File Prediction</h1>

      {!user ? (
        <p style={styles.message}>Please login with Google to use the prediction feature.</p>
      ) : (
        <>
          <input type="file" onChange={handleFileChange} style={styles.input} />
          <button onClick={uploadFile} style={styles.button} disabled={loading}>
            {loading ? "Processing..." : "Upload & Predict"}
          </button>
        </>
      )}

      {error && <div style={styles.error}>{error}</div>}

      {downloadUrl && (
        <a href={downloadUrl} download="prediction_output.csv" style={styles.downloadBtn}>
          Download Result File
        </a>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "30px",
    maxWidth: "700px",
    margin: "auto",
    fontFamily: "Arial",
  },
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  loginBtn: {
    padding: "10px 20px",
    backgroundColor: "#4285F4",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  logoutBtn: {
    marginLeft: "10px",
    padding: "8px 16px",
    backgroundColor: "#e63946",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  userBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  avatar: {
    width: "35px",
    height: "35px",
    borderRadius: "50%",
  },
  title: { textAlign: "center", marginBottom: "20px" },
  input: { marginBottom: "15px" },
  button: {
    padding: "12px",
    backgroundColor: "#0066ff",
    color: "white",
    width: "100%",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    marginBottom: "20px",
  },
  error: {
    background: "#ffd3d3",
    padding: "10px",
    borderRadius: "6px",
    color: "#a10000",
    whiteSpace: "pre-wrap",
  },
  downloadBtn: {
    display: "block",
    padding: "12px",
    textAlign: "center",
    backgroundColor: "#28a745",
    color: "white",
    borderRadius: "6px",
    textDecoration: "none",
  },
  message: {
    textAlign: "center",
    fontSize: "18px",
    marginTop: "20px",
  },
};
