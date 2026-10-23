<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Gamuna Foundation Admin Dashboard</title>
    <link rel="stylesheet" href="css/styles.css" />
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;800&family=Lora:ital,wght@0,400;1,400&display=swap" rel="stylesheet" />
  </head>
  <body class="admin-body">
    <header class="admin-header">
      <div class="container admin-header-inner">
        <div>
          <p class="eyebrow">Website management</p>
          <h1>Gamuna Foundation Admin</h1>
        </div>
        <button id="logoutBtn" class="btn btn-outline">Log Out</button>
      </div>
    </header>

    <main class="container admin-layout">
      <section class="admin-summary">
        <div class="summary-card">
          <span class="summary-label">News</span>
          <strong id="newsCount">0</strong>
        </div>
        <div class="summary-card">
          <span class="summary-label">Members</span>
          <strong id="memberCount">0</strong>
        </div>
        <div class="summary-card">
          <span class="summary-label">Notices</span>
          <strong id="noticeCount">0</strong>
        </div>
      </section>

      <section class="admin-panels">
        <div class="panel">
          <h2>Add News</h2>
          <form id="newsForm" class="admin-form">
            <input type="text" name="title" placeholder="News title" required />
            <input type="text" name="summary" placeholder="Short summary" />
            <textarea name="content" rows="4" placeholder="Content" required></textarea>
            <input type="text" name="tag" placeholder="Tag (Announcement, Media Coverage...)" />
            <input type="text" name="date" placeholder="Date" />
            <input type="url" name="source" placeholder="Source link (optional)" />
            <button type="submit" class="btn btn-primary">Publish News</button>
          </form>
        </div>

        <div class="panel">
          <h2>Add Member</h2>
          <form id="memberForm" class="admin-form">
            <input type="text" name="name" placeholder="Member name" required />
            <input type="text" name="role" placeholder="Role" required />
            <input type="url" name="image_url" placeholder="Profile image URL" />
            <textarea name="bio" rows="3" placeholder="Short bio"></textarea>
            <button type="submit" class="btn btn-primary">Save Member</button>
          </form>
        </div>

        <div class="panel">
          <h2>Post Notice</h2>
          <form id="noticeForm" class="admin-form">
            <input type="text" name="title" placeholder="Notice title" required />
            <textarea name="message" rows="4" placeholder="Notice message" required></textarea>
            <input type="text" name="category" placeholder="Category" />
            <input type="text" name="date" placeholder="Date" />
            <button type="submit" class="btn btn-primary">Publish Notice</button>
          </form>
        </div>
      </section>

      <section class="admin-listings">
        <div class="panel panel-wide">
          <h2>News Posts</h2>
          <div id="newsList" class="data-list"></div>
        </div>

        <div class="panel panel-wide">
          <h2>Members</h2>
          <div id="memberList" class="data-list"></div>
        </div>

        <div class="panel panel-wide">
          <h2>Notices</h2>
          <div id="noticeList" class="data-list"></div>
        </div>
      </section>
    </main>

    <script src="js/admin.js"></script>
  </body>
</html>
