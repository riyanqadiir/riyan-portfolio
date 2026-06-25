import React, { useState } from "react";
import "../assets/styles/Contact.scss";

/**
 * Contact form component.
 *
 * Security note: This component no longer calls Brevo directly from the
 * browser. The Brevo API key was previously exposed as REACT_APP_BREVO_API_KEY
 * inside the client bundle — anyone could extract it from the network tab.
 *
 * Now it POSTs to /api/contact (the backend serverless function) which holds
 * the key securely in server-side environment variables.
 */
function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");

  const sendEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("idle");
    setStatusMessage("");

    if (!name || !email || !message) {
      setStatus("error");
      setStatusMessage("Please fill out all fields.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setStatusMessage(data.message || "Message sent successfully!");
        setName("");
        setEmail("");
        setMessage("");
      } else {
        setStatus("error");
        if (data.errors && Array.isArray(data.errors)) {
          setStatusMessage(
            data.errors.map((e: { message: string }) => e.message).join(", ")
          );
        } else {
          setStatusMessage(data.message || "Failed to send message.");
        }
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
      setStatusMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="contact">
      <div className="items-container">
        <div className="contact_wrapper">
          <h1>Contact Me</h1>
          <p>
            Got a project waiting to be realized? Let's collaborate and make it
            happen!
          </p>

          <form className="contact-form" onSubmit={sendEmail} noValidate>
            {/* Status Banner */}
            {status !== "idle" && (
              <div
                style={{
                  marginBottom: "16px",
                  padding: "12px 16px",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: 500,
                  backgroundColor:
                    status === "success"
                      ? "rgba(34, 197, 94, 0.1)"
                      : "rgba(239, 68, 68, 0.1)",
                  border: `1px solid ${
                    status === "success"
                      ? "rgba(34, 197, 94, 0.3)"
                      : "rgba(239, 68, 68, 0.3)"
                  }`,
                  color: status === "success" ? "#22c55e" : "#f87171",
                }}
              >
                {statusMessage}
              </div>
            )}

            <div className="form-flex">
              <div className="field">
                <label htmlFor="contact-name">Your Name*</label>
                <input
                  id="contact-name"
                  type="text"
                  placeholder="What's your name?"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "4px",
                    border: "2px solid #5000ca",
                    backgroundColor: "#ffffff",
                    color: "#000000",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div className="field">
                <label htmlFor="contact-email">Email / Phone*</label>
                <input
                  id="contact-email"
                  type="text"
                  placeholder="How can I reach you?"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "4px",
                    border: "2px solid #5000ca",
                    backgroundColor: "#ffffff",
                    color: "#000000",
                    fontSize: "14px",
                  }}
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="contact-message">Message*</label>
              <textarea
                id="contact-message"
                placeholder="Send me any inquiries or questions"
                rows={8}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "4px",
                  border: "2px solid #5000ca",
                  backgroundColor: "#ffffff",
                  color: "#000000",
                  fontSize: "14px",
                  resize: "vertical",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: "10px",
                padding: "10px 24px",
                borderRadius: "4px",
                border: "none",
                backgroundColor: "#ffffff",
                color: "#050f0b",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                transition: "opacity 0.2s",
              }}
            >
              {loading ? "Sending..." : "SEND"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Contact;
