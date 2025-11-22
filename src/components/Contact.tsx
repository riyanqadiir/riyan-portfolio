import React, { useState } from "react";
import "../assets/styles/Contact.scss";

function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const sendEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name || !email || !message) {
      alert("Please fill out all fields.");
      return;
    }

    const sender = process.env.REACT_APP_BREVO_EMAIL;
    const apiKey = process.env.REACT_APP_BREVO_API_KEY;

    if (!sender || !apiKey) {
      alert("Email service is not configured.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: { email: sender },
          to: [{ email: sender }],
          subject: "New Portfolio Contact Submission",
          htmlContent: `
            <h3>New message from your portfolio</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email / Phone:</strong> ${email}</p>
            <p><strong>Message:</strong></p>
            <p>${message}</p>
          `,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(errText);
        alert("Failed to send message.");
      } else {
        alert("Message sent successfully!");
        setName("");
        setEmail("");
        setMessage("");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
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
            <div className="form-flex">
              <div className="field">
                <label htmlFor="name">Your Name*</label>
                <input
                  id="name"
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
                <label htmlFor="email">Email / Phone*</label>
                <input
                  id="email"
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
              <label htmlFor="message">Message*</label>
              <textarea
                id="message"
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
