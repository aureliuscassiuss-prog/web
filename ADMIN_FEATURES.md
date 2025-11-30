# Admin Panel Features

## Admin Access
- **Admin Email**: `rajraja8852@gmail.com`
- This email automatically receives admin role upon login/registration
- Admin panel link appears in sidebar only for admin users

## Admin Panel Features

### 1. Pending Reviews Tab
- View all pending resource uploads
- Approve or reject submissions
- See uploader details, subject, branch, and year

### 2. Academic Structure Tab
Manage the academic structure of the application:

#### Programs
- Add/remove degree programs (e.g., B.Tech, M.Tech, MBA, MCA)
- Default: B.Tech, M.Tech, MBA, MCA

#### Years
- Add/remove academic years (e.g., 1st Year, 2nd Year, 3rd Year, 4th Year)
- Default: 1st Year, 2nd Year, 3rd Year, 4th Year

#### Branches
- Add/remove branches/departments (e.g., Computer Science, Electronics, Mechanical, Civil)
- Default: Computer Science, Electronics, Mechanical, Civil

#### Subjects
- Add/remove subjects (e.g., Mathematics, Physics, Chemistry, Programming)
- Default: Mathematics, Physics, Chemistry, Programming

## API Endpoints

### Public Endpoints
- `GET /api/structure` - Fetch academic structure (no authentication required)
  - Returns: `{ programs: [], years: [], branches: [], subjects: [] }`

### Admin-Only Endpoints
- `GET /api/admin/structure` - Fetch academic structure (admin auth required)
- `POST /api/admin/structure` - Add/remove items from structure (admin auth required)
  - Body: `{ type: 'program'|'year'|'branch'|'subject', value: string, action: 'add'|'remove' }`
- `GET /api/admin/pending` - Get pending uploads (admin auth required)
- `POST /api/admin/action` - Approve/reject uploads (admin auth required)

## Database Collections
- `users` - User accounts (role field determines admin access)
- `academic_structure` - Stores the academic structure configuration
  - Document ID: 'main'
  - Fields: programs[], years[], branches[], subjects[]

## Usage Instructions

1. **Login as Admin**
   - Use email: `rajraja8852@gmail.com`
   - Create account if it doesn't exist

2. **Access Admin Panel**
   - Look for "Admin Panel" link in sidebar
   - Only visible to admin users

3. **Manage Academic Structure**
   - Click "Academic Structure" tab
   - Use input fields to add new items
   - Click trash icon to remove items
   - Changes save immediately to database

4. **Review Uploads**
   - Click "Pending Reviews" tab
   - Approve or reject pending submissions
   - Approved items appear in main feed

## Future Enhancements
- Upload modal and resource browsing will use dynamic structure from admin panel
- Additional admin features can be added to the panel
