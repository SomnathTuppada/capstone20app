import { useState, useEffect } from "react";

function App() {
  const [file, setFile] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  // Fetch logged in user
  const fetchUser = async () => {
    try {
      const res = await fetch("http://localhost:5001/auth/userinfo", {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleLogin = () => {
    window.location.href = "http://localhost:5001/auth/login";
  };

  const handleLogout = async () => {
    await fetch("http://localhost:5001/auth/logout", {
      credentials: "include",
    });
    setUser(null);
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setDownloadUrl(null);
  };

  const uploadFile = async () => {
    if (!user) {
      handleLogin(); // trigger Google login
      return;
    }

    if (!file) {
      setError("Please upload a file");
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:5001/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        setError("Microservice / Backend error");
        setLoading(false);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(
        new Blob([blob], { type: "text/csv" })
      );
      setDownloadUrl(url);
    } catch (err) {
      setError("Cannot connect to backend");
    }

    setLoading(false);
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
        <p style={styles.message}>
          Please login with Google to use prediction feature.
        </p>
      ) : (
        <>
          <input type="file" onChange={handleFileChange} style={styles.input} />

          <button onClick={uploadFile} style={styles.button}>
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

export default App;
