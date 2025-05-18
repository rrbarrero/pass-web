# WebPass - A Web Interface for pass (Password Store)

**WebPass** is a modern and user-friendly web interface for [pass](https://www.passwordstore.org/), the standard Unix password manager. It combines a React frontend with a FastAPI backend to provide secure and convenient access to your password store from the browser.

![alt text](docs/theme0.png)
(default theme)

> ⚠️ This project is provided as-is. Use at your own risk. I am not responsible for any damage or data loss caused by the usage of this application.

## 🔐 Focus on Security

WebPass prioritizes security at every step:

- **JWT (JSON Web Tokens)** for user authentication and session management.
- **GPG** integration to maintain full compatibility with `pass`.
- **Crucially, the GPG master password is never saved or cached at any time or location by WebPass.** It is used only temporarily during the decryption process.


---

🚨 **IMPORTANT SECURITY NOTICE: USE HTTPS** 🚨

For any production or even personal use where WebPass is accessible over a network (including `localhost` if other users or processes on your machine could intercept traffic, or any non-localhost access), **it is STRONGLY RECOMMENDED to deploy WebPass behind a reverse proxy configured with HTTPS (SSL/TLS).**

- **Why?** Without HTTPS, your login credentials (username/password for WebPass) and the GPG passphrase (if entered in the frontend) will be transmitted in **plain text** between your browser and the WebPass backend. This makes them vulnerable to interception by anyone.
- **How?** Configure a web server like Nginx, Caddy, or Apache as a reverse proxy to handle incoming HTTPS connections, terminate SSL/TLS, and then forward the requests to WebPass (which can then run on HTTP locally on the server). Services like Let's Encrypt offer free SSL certificates.

**Never expose WebPass directly to the internet or an untrusted network over plain HTTP if you are concerned about the security of your credentials.**

---

## 🎨 Extensible and Themed

WebPass is designed to be easily extensible:

- Add new **themes** with minimal effort to match your personal style or organization branding.
- Built with modularity in mind, allowing future enhancements or custom features.

![alt text](docs/theme1.png)
(retro theme)
![alt text](docs/theme2.png)
(cyberpunk theme)

* You can select the desired theme on frontend/.dev and rebuild frontend container.

## 📁 Host Requirements

Before running WebPass, ensure the following are properly set up on the host machine:

- A cloned repository of your personal `pass` store (e.g., `~/.password-store`).
- The corresponding **GPG keys** must already be available.
- The `docker-compose` service mounts these directories **as read-only**, meaning your data remains untouched and secure by design.

These requirements are critical for WebPass to function correctly, as it relies on the host’s `pass` and GPG environment to operate securely.

## 🚀 Quick Start

### Prerequisites

- `curl`
- `bash`
- `docker` and `docker-compose`

### Installation & Run

```bash
curl -sSL https://raw.githubusercontent.com/rrbarrero/pass-web/main/ops/install.sh | bash
```

🧪 Development Status
This project is under active development. Expect rapid iterations, breaking changes, and new features. Contributions and feedback are welcome!

📄 Disclaimer
This software is provided without any warranty. You are solely responsible for how you use it. Make sure you understand the implications of exposing password management to a web interface.

📄 License: GNU GPLv3