# Gamuna Foundation Website

This project is a static front-end website for the Gamuna Foundation with a simple admin dashboard and saved content system.

## Features

- Add and manage news posts
- Add and manage members
- Publish notices
- Login-protected admin portal
- SQLite database storage
- Public pages read content dynamically from the database

## Default admin login

- Username: `admin`
- Password: `gamuna123`

You can change these using environment variables:

```bash
ADMIN_USERNAME=your_username ADMIN_PASSWORD=your_password SESSION_SECRET=your_secret npm start
```

## Run locally

```bash
npm install
npm start
```

Then open:

- http://localhost:3000/
- http://localhost:3000/login.html
- http://localhost:3000/admin.html

## Notes

The public pages are still served as a static site, but their content now pulls from the admin database so you can manage website content without editing HTML manually.

The database file is stored in the `data/` folder.

## Production recommendation

For a live deployment, use environment variables and a secure hosted database or a managed service. This setup is website-ready for a small nonprofit website and is a good starting point for a production deployment.

