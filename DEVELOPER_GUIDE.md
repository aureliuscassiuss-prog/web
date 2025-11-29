# 📘 UniNotes Developer Guide

Welcome to the UniNotes codebase! This guide is written in simple language to help you understand how the project works and how to customize it.

---

## 📂 Project Structure (The Folders)

Here is what each folder is for:
The
### 1. `api/` ( Backend)
This is the **brain** of your application. It handles all the logic, database connections, and security.
- **`auth/`**: Handles Sign Up (`register.ts`) and Sign In (`login.ts`).
- **`profile/`**: Handles updating user details (`update.ts`) and fetching uploads (`uploads.ts`).
- **`resources/`**: Fetches the list of notes (`list.ts`) frm the odatabase.
- **`upload/`**: Handles saving new notes (`resource.ts`).
- **`admin/`**: Logic for the Admin Panel (approving/rejecting notes).
- **`ai/`**: Connects to the AI (Groq) to answer questions.

### 2. `src/` (The Frontend)
This is what the user **sees**. It contains all the React code.
- **`components/`**: The building blocks of your app (Buttons, Cards, Modals).
  - `Header.tsx`: The top bar with search and profile.
  - `Sidebar.tsx`: The side menu (Home, Uploads, Admin).
  - `ResourceGrid.tsx`: The main list of notes.
  - `AdminPanel.tsx`: The dashboard for approving notes.
  - `Profile.tsx`: The user profile page.
- **`contexts/`**: Global data management.
  - `AuthContext.tsx`: Remembers who is logged in.
- **`data/`**: Static data files.
  - `academicStructure.ts`: Lists of Branches, Years, and Subjects.
  - `premiumAvatars.tsx`: The SVG code for the avatars.
- **`App.tsx`**: The main container that puts everything together.
- **`main.tsx`**: The entry point that starts React.

### 3. `public/` (Static Files)
Files here are served directly to the browser.
- `vite.svg`: The favicon (icon in the browser tab).
- You can put images here if you want to link them directly.

### 4. `scripts/` (Automation)
Helper programs to run tasks.
- `seedDatabase.ts`: Fills the database with sample data.
- `makeAdmin.ts`: Makes a user an Admin.
- `test-db.js`: Tests the database connection.

### 5. `lib/` (Shared Code)
- `mongodb.ts`: The code that connects to your MongoDB database. Used by all API files.

---

## 🛠️ Key Files Explained

### `dev-server.ts`
This is your **local server**. When you run `npm run dev`, this file starts up. It simulates the Vercel cloud environment on your computer so you can test APIs locally.
- It tells the app: "When someone goes to `/api/auth/login`, run the code in `api/auth/login.ts`".

### `src/App.tsx`
The **Main Controller**. It decides what to show on the screen based on the `currentView`.
- If `currentView === 'home'`, it shows the `ResourceGrid`.
- If `currentView === 'admin'`, it shows the `AdminPanel`.

---

## 🚀 How to Customize Functionality

### 1. How to Add a New Branch or Subject?
Go to: `src/data/academicStructure.ts`
- **To add a Branch**: Add a new object to the `BRANCHES` array.
  ```typescript
  { id: 'me', name: 'Mechanical Engineering', code: 'ME' }
  ```
- **To add a Subject**: Add it to the `SUBJECTS` object under the correct branch and year.
  ```typescript
  'cse-2': [ ...existing, { id: 'new-sub', name: 'New Subject' } ]
  ```

### 2. How to Change the Color Scheme?
Go to: `src/index.css`
- This file contains the global styles.
- We use **Tailwind CSS**, so most colors are changed directly in the components (e.g., `bg-black`, `text-white`).
- To change the global background, look for the `body` tag in `index.css`.

### 3. How to Change the Logo?
Go to: `src/components/Sidebar.tsx`
- Look for the `<GraduationCap />` icon. You can replace it with another icon from `lucide-react` or an `<img>` tag.

### 4. How to Add a New Feature?
**Example: Add a "Favorites" section.**
1.  **Backend**: Create `api/profile/favorites.ts` to save/load favorites in MongoDB.
2.  **Frontend**:
    - Add a "Heart" button in `ResourceGrid.tsx`.
    - Create a `Favorites` view in `App.tsx`.
    - Add "Favorites" link in `Sidebar.tsx`.

---

## 🔄 Data Flow (How it works)

1.  **User Action**: User clicks "Upload".
2.  **Frontend**: `UploadModal.tsx` collects the data and sends it to `/api/upload/resource`.
3.  **Backend**: `api/upload/resource.ts` receives the data, checks if you are logged in, and saves it to **MongoDB** with `status: 'pending'`.
4.  **Admin Action**: You go to Admin Panel. `AdminPanel.tsx` asks `/api/admin/pending` for the list.
5.  **Approval**: You click "Approve". `AdminPanel.tsx` sends a request to `/api/admin/action`.
6.  **Database Update**: The backend updates the resource status to `'approved'`.
7.  **Result**: The resource now appears in the main list because `api/resources/list.ts` only looks for `'approved'` items.

---

## ❓ Common Questions

**Q: What is `npm run dev`?**
A: It runs two things at once:
1.  `vite`: The tool that builds your React frontend (fast!).
2.  `tsx dev-server.ts`: The local backend server.

**Q: Where is my data stored?**
A: In your local **MongoDB** database. The database name is `uninotes`.

**Q: How do I deploy this?**
A: When you are ready, you can deploy to **Vercel**. Vercel will automatically handle the `api/` folder as "Serverless Functions". You will need a cloud MongoDB (like MongoDB Atlas) for the production database.
