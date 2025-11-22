# 🚀 Riyan Qadir — Developer Portfolio

A modern, high-performance, and fully-responsive developer portfolio showcasing my skills, projects, and professional journey. Built from the ground up using a contemporary **React + TypeScript** stack, it features smooth user experience, robust backend integration, and optimal deployment.

🔗 **Live Website:** https://riyan-portfolio.vercel.app  
🔗 **GitHub Repo:** [Riyan Portfolio](https://github.com/riyanqadiir/riyan-portfolio)

---

## 💡 Overview & Features

This portfolio is designed to be a fast and engaging showcase, highlighting my technical expertise with a clean, professional aesthetic.

### Key Features ✨

* **Responsive & Adaptive:** Fully functional and visually appealing on all devices (mobile, tablet, and desktop).
* **Dual-Theme Mode:** Seamless **Dark / Light mode** toggle for user preference.
* **Smooth UX:** Enhanced with **section fade-in animations** and intuitive navigation.
* **Professional Showcase:** Dedicated sections for **Expertise**, **Timeline**, and detailed **Projects**.
* **Robust Contact System:**
    * **Contact Form:** Powered by the **Brevo API** for reliable message delivery.
    * **Validation:** Client-side form validation implemented using **Zod** schema library.
    * **Feedback:** Modern toast notifications via **React Hot Toast** for user feedback.
* **SEO Optimized:** Ensures high visibility and search ranking with:
    * `og:image` (Open Graph)
    * `canonical URL`
    * `robots.txt`
    * `sitemap.xml`
* **Performance:** Hosted on **Vercel** leveraging automatic caching, CDN, and build optimizations for top-tier speed.

---

## 🛠 Tech Stack

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | **React 18** | Core user interface library. |
| **Language** | **TypeScript** | Static typing for reliable and scalable code. |
| **Styling** | **SCSS** | Modular and maintainable CSS preprocessor. |
| **Validation** | **Zod** | Schema definition and validation for forms. |
| **Notifications** | **React Hot Toast** | Simple and effective toast notifications. |
| **Deployment** | **Vercel** | High-performance static site hosting and continuous deployment. |
| **Backend/API** | **Brevo (formerly Sendinblue)** | Powers the contact form's email functionality. |
| **Icons** | **FontAwesome** | Professional and versatile icon library. |

---

## 🚀 Getting Started

Follow these steps to set up and run the portfolio locally.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/riyanqadiir/riyan-portfolio.git
    cd riyan-portfolio
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables:**
    Create a `.env` file in the root directory and add your Brevo API key and configuration:
    ```
    # Example:
    REACT_APP_BREVO_API_KEY=your_brevo_api_key_here
    REACT_APP_BREVO_EMAIL=your_verified_sender_email
    ```

4.  **Run the application:**
    ```bash
    npm start
    ```
    The application will be available at `http://localhost:3000`.

---

## 🙌 Credits

This project is a heavily improved and rebuilt version by **Riyan Qadir**, based on the original concept by [Yuji Sato](https://github.com/yujisatojr/).