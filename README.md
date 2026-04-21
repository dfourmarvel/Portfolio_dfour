# Daniel Dela Dzikunu Portfolio

This project is a simple personal portfolio website for **Daniel Dela Dzikunu**, presented as a **medical student** and **cybersecurity enthusiast**. The site is built with plain HTML, CSS, and JavaScript, so it is lightweight, beginner-friendly, and easy to edit.

## Project Purpose

The goal of this portfolio is to introduce Daniel in a clear and professional way. The content focuses on:

- his identity as a medical student
- his growing interest in cybersecurity
- his values, strengths, and future direction
- a clean single-page layout that works on desktop and mobile

This version is intentionally simple, which makes it a good starting point for later updates such as adding real contact details, social links, projects, certifications, or academic achievements.

## File Structure

The project uses four files:

- `index.html`
- `style.css`
- `script.js`
- `README.md`

Each file has a separate responsibility.

## `index.html`

This file contains the full structure and content of the portfolio page.

### Main layout

The HTML is organized into these major parts:

1. `head`
2. `header`
3. `main`
4. `footer`

### In the `head`

The `head` includes:

- the page title
- responsive viewport settings
- a meta description
- a link to `style.css`

This makes the page display well on different screen sizes and connects the stylesheet.

### In the `header`

The header contains the main navigation bar. It includes:

- a brand area with the initials `DD`
- Daniel's full name
- a mobile menu button
- navigation links to the main sections of the page

The navigation links jump to:

- `#about`
- `#focus`
- `#journey`
- `#strengths`
- `#contact`

### In the hero section

The hero section is the first major section users see. It introduces Daniel clearly and includes:

- a short identity label: medical student and cybersecurity enthusiast
- a large headline
- a short introductory paragraph
- two call-to-action buttons
- a side panel with a short summary and three quick stat cards

This section is designed to feel welcoming and professional without being too heavy.

### About section

The `About Me` section is a three-card layout. Each card explains a different part of Daniel's profile:

- who he is
- what drives him
- what he values

This keeps the introduction easy to scan.

### Focus section

The `Main Focus` section contains three feature cards:

- Medical Studies
- Cybersecurity Curiosity
- Health and Technology

This section shows the main themes of the portfolio and the intersection between medicine and digital protection.

### Journey section

The `Journey` section is built like a simple timeline. It shows a progression through:

1. academic foundation
2. growing cybersecurity interest
3. future direction

This gives the page a sense of story and forward movement.

### Strengths section

The `Strengths` section is split into two cards:

- `Core Strengths`
- `Current Interests`

The first card uses pill-style tags for key qualities such as critical thinking and consistency. The second uses a bullet list to explain Daniel's current learning interests.

### Contact section

The contact section keeps things simple. It currently:

- explains that the section can be updated later
- includes buttons for navigation
- acts as a placeholder for future real contact details

This avoids inventing fake contact information while still completing the portfolio structure.

### Footer

The footer contains:

- the portfolio name
- a copyright line with the current year

The year is filled automatically by JavaScript.

## `style.css`

This file controls the appearance, layout, colors, spacing, responsiveness, and animation of the page.

### Design direction

The styling uses a soft, intentional visual direction:

- warm cream background tones
- deep teal as the primary color
- orange as an accent color
- rounded cards and soft shadows
- serif headings and clean sans-serif body text

This helps the page feel polished, calm, and a little more distinctive than a basic default layout.

### CSS variables

At the top of the file, the `:root` block defines reusable design tokens such as:

- background colors
- text colors
- border colors
- primary and accent colors
- shadows
- border radius values
- maximum layout width

Using variables makes the design easier to maintain and customize later.

### Global styles

The stylesheet includes base rules for:

- `box-sizing`
- body margin and font
- links
- buttons
- image behavior
- smooth scrolling

These create a consistent foundation across the page.

### Navigation styling

The navigation bar is styled to be:

- sticky at the top
- slightly transparent
- rounded
- responsive

There is also a visual change when the page scrolls, which makes the header feel more active and polished.

### Hero styling

The hero uses a two-column layout on larger screens:

- text content on one side
- summary cards on the other

On smaller screens, it stacks into a single column.

Buttons use two styles:

- primary gradient button
- lighter outlined button

### Card and section styling

The site uses several reusable card styles:

- panel cards
- info cards
- feature cards
- strength cards
- contact card

These share a common visual language with rounded corners, borders, soft backgrounds, and shadows.

### Timeline styling

The journey section uses a simple timeline layout with:

- numbered circular markers
- text content beside each marker
- top and bottom border lines for structure

### Lists and badges

Two list styles are used:

- `pill-list` for strengths
- `bullet-list` for interests

This creates visual variety while keeping the content readable.

### Responsive design

Media queries are included for smaller screens. These rules:

- stack grids into one column
- show the mobile menu button
- turn the navigation into a dropdown panel
- improve spacing for phones and tablets

This helps the portfolio work well across devices.

### Reveal animation

The `.reveal` class starts sections slightly lower and transparent. When JavaScript adds `.is-visible`, the sections fade and slide into place.

This gives the page a simple entrance animation without making it complicated.

## `script.js`

This file adds lightweight interactivity to the portfolio.

### 1. Current year

The script finds the footer element with the ID `year` and updates it with the current year using:

```js
new Date().getFullYear()
```

This means the footer stays current automatically.

### 2. Mobile navigation

The script controls the mobile menu button and dropdown navigation.

It does the following:

- opens and closes the menu when the button is clicked
- updates the `aria-expanded` attribute for accessibility
- closes the menu when a navigation link is clicked

This improves the mobile experience.

### 3. Reveal on scroll

The script uses `IntersectionObserver` to detect when sections enter the viewport.

When a section becomes visible:

- the class `.is-visible` is added
- the reveal animation is triggered
- the observer stops watching that item

This is more efficient than constantly checking scroll positions manually.

### 4. Active navigation highlight

Another `IntersectionObserver` watches the main sections with IDs.

When a section is in view:

- the matching navigation link gets the `.active` class
- the other links lose the active state

This helps visitors understand where they are on the page.

### 5. Header scroll state

The script also watches the window scroll position.

When the page is slightly scrolled:

- the `scrolled` class is added to the header
- the navigation bar gets a stronger background and shadow

This adds a subtle interface improvement.

## Overall Page Flow

The page follows a clear reading order:

1. introduction
2. personal background
3. focus areas
4. journey and direction
5. strengths and interests
6. contact area
7. footer

This makes the portfolio easy to understand even for a first-time visitor.

## Why This Structure Works

This structure is effective because it is:

- simple to read
- easy to maintain
- visually clean
- responsive
- easy to expand later

It is especially suitable for a personal portfolio that is still growing.

## How To Customize It Later

You can improve or personalize the portfolio by updating:

- the text content in `index.html`
- colors and typography in `style.css`
- interactions in `script.js`
- the contact section with real email or social links
- new sections such as projects, certifications, CV download, or testimonials

## Summary

This portfolio is a clean single-page website that introduces Daniel Dela Dzikunu as a medical student and cybersecurity enthusiast. The HTML provides a clear structure, the CSS creates a polished and responsive design, and the JavaScript adds small interactive touches. The code is intentionally straightforward, making it easy to learn from and easy to expand in the future.
