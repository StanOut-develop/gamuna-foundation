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
      <section class="admin-grid">
        <div class="admin-card">
          <div class="card-header">
            <h2>Site Settings</h2>
          </div>
          <form id="settingsForm" class="admin-form">
            <label>Site Name</label>
            <input type="text" name="siteName" />
            <label>Tagline</label>
            <input type="text" name="tagline" />
            <label>Email</label>
            <input type="email" name="email" />
            <label>Phone</label>
            <input type="text" name="phone" />
            <label>Facebook</label>
            <input type="url" name="facebook" />
            <label>Address</label>
            <input type="text" name="address" />
            <button type="submit" class="btn btn-primary">Save Settings</button>
          </form>
        </div>

        <div class="admin-card">
          <div class="card-header">
            <h2>Home Page</h2>
          </div>
          <form id="homeForm" class="admin-form">
            <label>Eyebrow</label>
            <input type="text" name="eyebrow" />
            <label>Hero Title</label>
            <textarea name="heroTitle" rows="3"></textarea>
            <label>Hero Subtitle</label>
            <textarea name="heroSubtitle" rows="3"></textarea>
            <label>Mission Label</label>
            <input type="text" name="missionLabel" />
            <label>Mission Text</label>
            <textarea name="missionText" rows="3"></textarea>
            <button type="submit" class="btn btn-primary">Save Home</button>
          </form>
        </div>

        <div class="admin-card">
          <div class="card-header">
            <h2>About Page</h2>
          </div>
          <form id="aboutForm" class="admin-form">
            <label>Heading</label>
            <input type="text" name="heading" />
            <label>Overview</label>
            <textarea name="overview" rows="3"></textarea>
            <label>Vision</label>
            <textarea name="vision" rows="4"></textarea>
            <label>Mission</label>
            <textarea name="mission" rows="4"></textarea>
            <label>Location</label>
            <textarea name="location" rows="3"></textarea>
            <button type="submit" class="btn btn-primary">Save About</button>
          </form>
        </div>
      </section>

      <section class="admin-grid two-column">
        <div class="admin-card">
          <div class="card-header">
            <h2>Programs</h2>
          </div>
          <form id="programsForm" class="admin-form">
            <label>Program list (one item per line)</label>
            <textarea name="programsText" rows="10" placeholder="Program title | description"></textarea>
            <button type="submit" class="btn btn-primary">Save Programs</button>
          </form>
        </div>

        <div class="admin-card">
          <div class="card-header">
            <h2>News & Notices</h2>
          </div>
          <form id="newsForm" class="admin-form">
            <label>News Title</label>
            <input type="text" name="title" />
            <label>Summary</label>
            <input type="text" name="summary" />
            <label>Content</label>
            <textarea name="content" rows="4"></textarea>
            <label>Tag</label>
            <input type="text" name="tag" />
            <label>Date</label>
            <input type="text" name="date" />
            <label>Source Link</label>
            <input type="url" name="source" />
            <button type="submit" class="btn btn-primary">Add News</button>
          </form>

          <form id="noticeForm" class="admin-form spacing-top">
            <label>Notice Title</label>
            <input type="text" name="title" />
            <label>Message</label>
            <textarea name="message" rows="3"></textarea>
            <label>Category</label>
            <input type="text" name="category" />
            <label>Date</label>
            <input type="text" name="date" />
            <button type="submit" class="btn btn-primary">Add Notice</button>
          </form>
        </div>
      </section>

      <section class="admin-listings">
        <div class="admin-card full-width">
          <div class="card-header">
            <h2>Current Content</h2>
          </div>
          <div class="content-panel-grid">
            <div>
              <h3>News</h3>
              <div id="newsList" class="data-list"></div>
            </div>
            <div>
              <h3>Notices</h3>
              <div id="noticeList" class="data-list"></div>
            </div>
            <div>
              <h3>Programs</h3>
              <div id="programList" class="data-list"></div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <script src="js/admin.js"></script>
  </body>
</html>
