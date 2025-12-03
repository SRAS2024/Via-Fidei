# Via Fidei

Via Fidei is a multilingual Catholic website and app focused on clarity, beauty, and depth. It is designed to be classy, clean, beautifully styled, symmetrical, and user friendly, while remaining simple and low noise. It welcomes newcomers who seek a gentle introduction and it supports lifelong Catholics who want a complete, trustworthy reference without being overwhelmed.

The platform includes:

- A large curated library of prayers  
- Guides for sacramental life, vocations, and Catholic living  
- A Profile system with milestones and goals  
- A private spiritual journal  
- A lightweight admin mode for homepage content management  

All content is easy to read, organized top to bottom and left to right, carefully localized into many languages, and paired with icons, saint images, book covers, and Marian artwork.

---

## Tech stack

**Frontend**

- React (JavaScript or TypeScript)  
- Vite for development and build  
- HTML5 and CSS3 with responsive layout and a minimal, clean aesthetic  
- Optional small design system or utility approach if it reduces file count  

**Backend**

- Node.js with Express for API routing and server logic  
- REST API endpoints: auth, prayers, saints, guides, sacraments, history, profile, admin  
- Prisma ORM for type safe queries into PostgreSQL  

**Database**

- PostgreSQL hosted on Railway  
- Prisma migrations driven from `prisma/schema.prisma`

**Deployment**

- Railway web service
- Railway PostgreSQL plugin
- Environment variables for secrets, admin access, database URL, language behavior, theme persistence

### Railway deployment checklist

1. Provision a Railway PostgreSQL database and copy its `DATABASE_URL` into the service variables.
2. Set `JWT_SECRET`, `ADMIN_USERNAME`, and `ADMIN_PASSWORD` as Railway variables (never check these into git).
3. Ensure `CLIENT_ORIGIN` matches the public URL Railway gives you (for example `https://your-app.up.railway.app`).
4. Deploy with the default Node service configuration; Railway will run `npm run build` followed by `npm start`.
   - The `prestart` hook runs `prisma migrate deploy` through `database/prestart.js`, so the schema applies automatically when the database is reachable.
5. Railway health checks hit `/api/health` as defined in `railway.json`; waits are extended for initial cold starts.
   - By default, the health check responds with HTTP 200 even if the database is unavailable so the static site can boot. Set `REQUIRE_DATABASE_HEALTH=true` to force a 503 response when Prisma cannot connect.
6. If a deploy fails, inspect the Railway logs for the clear Prisma or environment message emitted by `database/prestart.js`.

---

## Design language

- Header: centered, balanced, responsive, symmetrical  
- Menu bar: centered navigation, clear spacing, large type scale  
- Core palette: black and white with minimal purposeful color  
  - Red = remove or delete  
  - Blue = save or continue  
  - Gray = cancel  
- Icons:
  - Sacraments, milestones, and consecrations always use accurate icons  
  - Icons related to sacraments, saints, Our Lady, and consecrations may use appropriate liturgical colors  
  - Consecrations use devotion specific icons  
- Profile picture:
  - Circular avatar with upload and change support  
  - Hover pencil icon at bottom right with tooltip: “Edit Profile Picture”  
  - Clicking opens a pop up with “Take Photo” or “Choose from Library” and the selected image updates the avatar  

The entire website must look and feel professionally designed: modern, classy, polished, and consistent across all pages, with smooth interactions and a calm, high end Catholic aesthetic. Layouts are fully responsive from small phones to large desktop monitors, and the performance target is fast load and minimal runtime overhead.

---

## User experience principles

The site is single user focused:

- No timelines  
- No direct messaging  
- No social graph  
- All content is personal, private, and oriented toward growth  

Primary navigation and header layout:

1. Banner centered across the top  
2. Website title centered beneath the banner  
3. Navigation tabs below the title, centered and evenly spaced  
4. Far right: two small icons for Account and Settings  

Primary tabs, left to right:

1. Home  
2. History  
3. Prayers  
4. Saints and Our Lady  
5. Sacraments  
6. Guides  

Right side icons:

- Account icon:
  - Logged out: dropdown has Login, which opens the login screen  
  - Logged in: dropdown has Profile, Settings, Logout  
  - Double click or double tap on Profile goes directly to the Profile page  
- Settings icon:
  - Theme toggle: light, dark, system  
  - Language selector listed under the theme toggle  

---

## Localization and language behavior

Supported languages with full localization:

- English (default fallback)  
- Spanish  
- Portuguese  
- French  
- Italian  
- German  
- Polish  
- Russian  
- Ukrainian  

Language behavior:

- On first visit, the site uses the device or browser language if it matches a supported language  
- If the device language is not supported, the site falls back to English  
- Users can override the language in Settings  
- The override is stored per user and applied automatically on future logins  

All content entities in the database are tagged with a language code, tags, source metadata, and last updated timestamps.

---

## Core sections

### Home

- Mission statement at the top  
- Optional notices section above About Via Fidei, stacking in order and pushing About downward  
- About Via Fidei section  
- Quick links: Sacraments, OCIA, Rosary, Confession, Guides  
- Always visible language selector  

### History

- Comprehensive, catechism aligned overview of Church history  
- Sections such as Apostolic Age, Early Church, Councils, Middle Ages, Reformation era, Modern era, Vatican Councils, Contemporary Church  
- Timelines for major councils and key historical events  
- Simple glossary of terms with icons and short definitions  
- Print friendly pages  
- No search bar in this section  

### Prayers

- Thousands of approved Catholic prayers seeded at launch  
- Categories such as Marian, Christ centered, Angelic, Sacramental, Seasonal, Devotions, Daily  
- Prayer page includes title, content, categories, print friendly styling, and Add to My Prayers  
- Multilingual, defaulting to user language or browser locale  
- Admin can add or edit prayers and categories through data updates  

**Search behavior in Prayers**

- Search is local only within the Prayers section  
- Search bar appears on the Prayers page itself, integrated into the layout rather than the global header  
- Typeahead shows three suggestions at a time based on closest matches  
- Results are limited strictly to prayers that exist in the Via Fidei library  
- Full search results list closest matches within reason after submit  

### Saints and Our Lady

- All canonized saints in the dataset  
- All approved Marian apparitions in the dataset  
- Each entry includes name, feast day, patronages, biography, canonization status for saints, apparition details for Our Lady, photo or icon, and an official prayer  

Selecting a saint or apparition opens an About page:

- Large, high quality photo or icon at the top, centered and responsive  
- A story section beneath the image with 1 to 3 well crafted paragraphs describing the life, witness, and significance of the saint, or the apparition story and its Church approval context for Our Lady  
- Clean typography, comfortable line spacing, and print friendly layout  
- Option to Add to Saved Saints or Our Lady from this page  
- Profile view for saved saints and apparitions shows only image and prayer  
- Duplicate saves are prevented in the data model  

**Search behavior in Saints and Our Lady**

- Search is local only within this section  
- Search bar appears on the Saints and Our Lady page itself, not in the global header  
- Typeahead shows three suggestions at a time based on closest matches  
- Results are limited strictly to saints and apparitions that exist in the Via Fidei library  
- Full search results list closest matches within reason after submit  

### Sacraments

- Seven sacraments with accurate icons  
- Each sacrament page contains meaning, biblical foundation, preparation, what to expect, and common questions  
- Linked to Goals and Milestones templates  
- No search bar in this section  

### Guides

- Broad, well organized guides for Catholic life, practice, discernment, and vocation  
- Step by step guides with checklists for OCIA, Confession, Rosary, Adoration, consecrations, and vocations  
- Each guide includes an overview, steps, recommended reading, and checklist templates  
- OCIA guide links directly to the Catechism of the Catholic Church document  
- Users can Add as Goal from within a guide  
- No search bar in this section  

---

## Profile area

### My Prayers

- Saved prayers with the ability to remove each one individually  
- Removal uses a confirmation pop up:  
  - “Are you sure you want to remove [Prayer Name] from your prayers?”  

### Journal

- Journal entries with title and text block  
- Buttons: Save, Cancel  
- Pencil icon tooltip: Edit  
- Trash icon tooltip: Delete  
- Delete uses a confirmation pop up:  
  - “Are you sure you want to delete [Journal Title]?”  
- Entries can be favorited with a star icon  

### Milestones

Three tiers with plus button behavior:

1. Sacrament milestones  
   - Add via plus button listing the seven sacraments  
   - Cannot be duplicated  
2. Spiritual milestones  
   - Consecrations or retreats from a predefined list  
   - Cannot be duplicated  
   - Completed consecrations auto promote from Goals  
3. Personal milestones  
   - Created from user goals that are completed  
   - Plus button opens a create goal screen with title, optional date range, and editable checklist  
   - Templates include novenas and fasts  

### My Goals

- Templates: novenas, OCIA, consecrations, vocation discernment  
- Custom goals with title, description, and checklist  
- Completion promotes goals to Milestones  
- If not completed by due date, status becomes Overdue but still completable later  
- Delete uses confirmation:  
  - “Are you sure you want to delete [Goal Title]?”  

### Settings within Profile

- Theme: light, dark, system  
- Language override  
- Privacy overview  
- Profile picture editing  

---

## Theme behavior

- Default theme is light mode  
- Dark mode is optional through Settings  
- Each user’s theme choice is stored and automatically reapplied on login  

---

## Authentication

Core auth:

- Register, Login, Logout  
- Logging out or creating an account redirects to Home  

Create Account form:

- First Name, Last Name  
- Email  
- Password and Re enter Password fields  
- View or Hide toggle under Re enter Password  
- Create Account button  

Login form:

- Email and Password fields  
- Link: “Do not have an account? Create Account.”  
- “Forgot password” link opens Reset Password page  

Reset Password flow (no email service):

- Reset page fields: Email, First Name, Last Name, New Password, Re enter New Password  
- Server validates that email plus first name plus last name match a user  
- If valid, the user can reset the password immediately  
- No email sending, no token delivery, no external services  

Interactive actions that require login:

- Add to My Prayers  
- Journal save  
- Add or edit Goals and Milestones  
- Profile edits  

---

## Admin mode

Access:

- Admin panel reachable at `/admin`  
- Visiting `/admin` shows only an administrator login screen  

Admin login form:

- Username  
- Password  
- Login button  

Credentials:

- Admin username and password stored only in Railway environment variables  
- Credentials are never exposed in client code  

Admin UI after login:

- A simplified mirrored Home page only  
- Banner at top and copyright footer at bottom  
- No standard site tabs or user navigation  
- Top right contains a Logout button only  
- Admin can edit:
  1. Mission statement and About Via Fidei content  
  2. Notices, added above About via an Add Notices button, with ordered display  
  3. Optional photo collage at the bottom via an Add Photo Collage button  

Photo collage:

- On tap, open native device picker: Take Photo, Photo Library, Files  
- Images are arranged into a clean responsive collage  
- If no collage exists, the public Home page shows only Notices and About  

Admin logout:

- Logout returns to the admin login screen  
- Saved changes publish immediately to the public Home page  

---

## Data model and constraints

High level:

- Duplicate sacraments, consecrations, saved prayers, saints, and apparitions are prevented per user  
- Journal entries include title, body, timestamps, and favorite toggle  
- Goals store due dates and can become Overdue while remaining completable  
- Profile pictures are stored per user  
- All content entities include language, tags, source metadata, and last updated timestamp  

Seeding and optional scraping:

- A database seed module initializes core libraries at launch:  
  - prayers  
  - saints  
  - Marian apparitions  
  - history summaries  
  - guides  
- Any scraping uses only publicly available, free to use sources that require no private keys or special API access  
- Scraped data is normalized, cached, and versioned so the live site stays fast and stable  
- Attribution is stored in metadata when required  

---

## File and folder layout

The project uses a minimal file tree with a maximum of three folders. Everything else lives at the repo root.

Root files (example):

- `package.json`  
- `index.js`  
- `prisma/schema.prisma`
- `vite.config.js`  
- `railway.json`  
- `.env.example`  
- `README.md`  

Folders:

1. `client`  
   - React app, pages, components, styles, i18n resources  
2. `server`  
   - Express app, routes, controllers, middleware, admin guard  
3. `database`  
   - Prisma migrations, seed scripts, optional scraper, dataset snapshots  

This layout keeps the project clean and professional while staying compact for deployment on Railway.

---

## Local development

1. Install dependencies:

   ```bash
   npm install
