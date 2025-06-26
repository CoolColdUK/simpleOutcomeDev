# SimpleOutcome Portfolio Website

A modern, responsive portfolio website built with Next.js and Material-UI, showcasing products and projects by SimpleOutcome.

## Features

- **Modern Design**: Clean, professional design using Material-UI components
- **Responsive Layout**: Optimized for desktop, tablet, and mobile devices
- **Product Showcase**: Highlighting products like CraftySmile and upcoming projects
- **Contact Integration**: Ready for contact form integration with backend services
- **SEO Optimized**: Proper meta tags and semantic HTML structure

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **UI Library**: Material-UI (MUI) v6
- **Styling**: Emotion (CSS-in-JS) with sx props
- **Language**: TypeScript
- **Font**: Roboto (Google Fonts)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Navigate to the project directory:

   ```bash
   cd packages/webSimpleOutcome
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with theme provider
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # Reusable components
│   ├── Header.tsx         # Navigation header
│   ├── HeroSection.tsx    # Hero section
│   ├── ProjectsSection.tsx # Products showcase
│   ├── Footer.tsx         # Footer component
│   └── ThemeProvider.tsx  # Material-UI theme provider
└── theme/                 # Theme configuration
    └── theme.ts           # Material-UI theme setup
```

## Customization

### Theme

The theme configuration is located in `src/theme/theme.ts`. You can customize:

- Color palette (primary, secondary, background colors)
- Typography (font families, sizes, weights)
- Component styles (buttons, cards, etc.)

### Content

Update the following files to customize content:

- `src/components/HeroSection.tsx` - Hero section content
- `src/components/ProjectsSection.tsx` - Product listings
- `src/components/Footer.tsx` - Footer information
- `src/app/layout.tsx` - Meta tags and site information

## Deployment

### GitHub Pages

1. Build the project:

   ```bash
   npm run build
   ```

2. Push to GitHub repository

3. Configure GitHub Pages in repository settings

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Vercel will automatically detect Next.js and deploy
3. Custom domain can be configured in Vercel dashboard

## Contact Integration

The website is prepared for contact form integration. You can:

1. Add a contact form component
2. Integrate with your existing backend (e.g., CraftySmile's backend)
3. Use services like Formspree or Netlify Forms

## License

This project is private and proprietary to SimpleOutcome.

## Support

For questions or support, contact: contact@simpleoutcome.dev
