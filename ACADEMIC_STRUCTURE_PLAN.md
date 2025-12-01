# Academic Structure Redesign Plan

## New Hierarchical Structure

```
Program (e.g., B.Tech, M.Tech, MBA)
  └─ Year (e.g., 1st Year, 2nd Year)
      └─ Course/Branch (e.g., Computer Science, Mechanical)
          └─ Subject (e.g., Data Structures, Thermodynamics)
```

## Database Schema

### Collection: `academic_structure`
```json
{
  "_id": "main",
  "programs": [
    {
      "id": "btech",
      "name": "B.Tech",
      "years": [
        {
          "id": "1",
          "name": "1st Year",
          "courses": [
            {
              "id": "cse",
              "name": "Computer Science",
              "subjects": [
                "Data Structures",
                "Algorithms",
                "Database Management"
              ]
            },
            {
              "id": "mech",
              "name": "Mechanical Engineering",
              "subjects": [
                "Thermodynamics",
                "Fluid Mechanics"
              ]
            }
          ]
        },
        {
          "id": "2",
          "name": "2nd Year",
          "courses": [...]
        }
      ]
    },
    {
      "id": "mtech",
      "name": "M.Tech",
      "years": [...]
    }
  ]
}
```

## Admin Panel Changes

1. **Program Management**
   - Add/Remove programs (B.Tech, M.Tech, etc.)
   
2. **Year Management** (per program)
   - Add/Remove years for selected program
   
3. **Course Management** (per program + year)
   - Add/Remove courses for selected program + year
   
4. **Subject Management** (per program + year + course)
   - Add/Remove subjects for selected program + year + course

## Upload Modal Changes

Cascading dropdowns:
1. Select Program → Shows years for that program
2. Select Year → Shows courses for that program + year
3. Select Course → Shows subjects for that program + year + course
4. Select Subject
5. Select Resource Type (Notes, PYQ, Formula Sheet)

## Resource Grid Changes

Filters will cascade based on the hierarchical structure.
