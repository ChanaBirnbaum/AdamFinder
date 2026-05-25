# Search Dropdown Redesign

This component already exists in the project.

IMPORTANT:
- Keep existing functionality
- Keep existing API
- Keep existing logic and handlers
- Keep existing data flow
- Keep Redux/hooks/state behavior unchanged

Goal:
Apply the new visual design only.

Allowed changes:
- JSX structure only if required for layout
- Styling
- Class names
- MUI layout components
- Responsive adjustments

Avoid:
- Rewriting business logic
- Renaming important props
- Changing API calls
- Changing search behavior
- Replacing existing architecture

Design requirements:
- Match provided Figma screenshots
- Use Heebo typography
- RTL support
- Use flexbox based layouts
- Use existing MUI theme
- Responsive
- Reusable styling

Font Family: Heebo

Typography:
- Primary: 16px / 600
- Secondary: 14px / 400
- Badge: 12px / 400

Colors:
- Primary Blue: #006AFF
- Dark Text: #00033D
- Gray Text: #8E929F
- Border Gray: #F5F5F5

Container:
- White background
- 8px radius
- shadow: 0px 4px 12px rgba(6, 77, 173, 0.15)

Search field:
- Height: 47px
- Border: 2px solid #006AFF
- Radius: 8px

Tabs:
- Active tab has blue bottom border
- Active text is blue + semibold

Results:
- Vertical list
- Divider between items
- Result item height ~93px

Profile image:
- 40x40
- border: 1.5px solid #00033D
- border-radius: 4px

Toggle:
- Height: 24px
- Rounded background
- Inactive background: #C5CBDD
- White toggle circle