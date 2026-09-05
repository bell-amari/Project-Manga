# Manga Labs

**Code Name:** `Project-Manga`

Manga Labs is a manga discovery, tracking, and collection platform built to help readers discover new series, organize the manga they own, track what they are reading, and explore detailed information about manga, characters, staff, ratings, and more.

The project is currently under active development.

---

## Overview

Manga Labs is being designed as a central place for manga readers to manage and explore their collections.

The long-term goal is to combine:

* Manga discovery
* Personal bookshelves
* Reading progress
* Ratings and reviews
* Wishlist management
* Character and staff information
* Community features
* User-created manga libraries
* Personalized recommendations

Manga Labs is part of **Scopein Labs**.

---

## Current Features

### Manga Discovery

Browse popular and highly rated manga using external manga metadata.

Current discovery features include:

* Top manga rankings
* Manga cover artwork
* Titles and alternative titles
* Ratings
* Volume information
* Descriptions
* Genres
* Publication status
* Author and staff information
* Character information

### Manga Detail Pages

Individual manga can have dedicated pages containing more detailed information about the series.

Planned and developing information includes:

* Cover art
* Synopsis
* Rating
* Genres
* Chapters
* Volumes
* Publishing status
* Start and end dates
* Characters
* Staff
* Related manga
* Recommendations

### Your Bookshelf

The Manga Labs bookshelf is intended to allow users to maintain a personal manga library.

Books can eventually be organized by statuses such as:

* Owned
* Reading
* Finished
* Wishlist

Additional bookshelf features are planned, including:

* Personal ratings
* Reading progress
* Private notes
* Volume tracking
* Duplicate purchase prevention

---

## Technology Stack

Manga Labs currently uses a modern TypeScript web stack.

### Frontend

* React
* TypeScript
* TanStack Start
* Vite
* Tailwind CSS

### Data

Manga metadata is currently being integrated through manga data APIs such as **AniList**.

The project is being designed so that the application can gradually move toward its own Manga Labs data layer and database rather than depending entirely on third-party APIs.

### Backend / Database

The backend architecture is being developed around scalable managed services.

Current or planned technologies include:

* Supabase
* PostgreSQL
* Authentication
* Row Level Security
* Cloud storage
* Server-side API routes

### Infrastructure

* GitHub — source control
* Cloudflare — DNS, CDN, security, and deployment infrastructure
* Scopein Labs domain infrastructure

Production application:

```text
mangalabs.scopeinlabs.com
```

---

## Repository

Repository code name:

```text
Project-Manga
```

The repository name describes the development project while the public-facing product is called **Manga Labs**.

---

## Project Structure

The exact structure may evolve as Manga Labs grows, but the application follows a component-based architecture.

Example:

```text
project-manga/
├── public/
├── src/
│   ├── components/
│   ├── routes/
│   ├── services/
│   ├── lib/
│   ├── hooks/
│   ├── types/
│   └── styles/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## Getting Started

### Requirements

Before running Manga Labs locally, install:

* Node.js
* npm
* Git

Check your installations:

```bash
node --version
npm --version
git --version
```

---

## Clone the Repository

```bash
git clone https://github.com/YOUR-USERNAME/project-manga.git
```

Move into the project:

```bash
cd project-manga
```

---

## Install Dependencies

```bash
npm install
```

---

## Run the Development Server

```bash
npm run dev
```

Vite will provide the local development address in the terminal.

It will typically look similar to:

```text
http://localhost:5173
```

---

## Build for Production

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

---

## Available Scripts

Depending on the current project configuration:

```bash
npm run dev
```

Starts the local development server.

```bash
npm run build
```

Creates a production build.

```bash
npm run preview
```

Previews the production build locally.

```bash
npm run lint
```

Runs ESLint.

```bash
npm run format
```

Formats the project using Prettier.

---

## Manga Data Architecture

Manga Labs currently consumes external manga metadata while the internal data architecture continues to develop.

A major design goal is to avoid tightly coupling the user experience to a single external provider.

Instead of components calling external APIs directly, the application should use a data layer similar to:

```text
UI
 ↓
Manga Labs Services
 ↓
Manga Labs API / Database
 ↓
External Data Providers
```

This architecture allows Manga Labs to:

* Cache frequently requested manga
* Reduce API rate-limit problems
* Normalize inconsistent external data
* Combine multiple manga data sources
* Improve page performance
* Preserve important metadata
* Eventually operate its own manga catalog

---

## Planned Database Architecture

Potential Manga Labs database entities include:

```text
users
profiles
manga
manga_titles
manga_genres
genres
authors
staff
characters
manga_characters
manga_staff
volumes
chapters
bookshelves
bookshelf_entries
reading_progress
user_ratings
reviews
comments
likes
wishlists
follows
notifications
```

The database schema will continue evolving as features are implemented.

---

## Authentication

Future authenticated users will be able to maintain their Manga Labs account and personal library.

User data should be protected using:

* Secure authentication
* Hashed credentials handled by the authentication provider
* Database Row Level Security
* Server-side authorization
* Principle-of-least-privilege access
* Protected environment variables

Passwords should never be stored directly by Manga Labs application code.

---

## Environment Variables

API keys and private configuration should be placed in environment files rather than committed to Git.

Example:

```text
.env
.env.local
```

Possible variables may include:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Never commit secret keys, passwords, service-role credentials, or private tokens to the repository.

Environment files containing secrets should be included in:

```text
.gitignore
```

---

## Development Principles

Manga Labs is being built around several core principles.

### Scalability

Features should work beyond the initial prototype and support a growing manga catalog and user base.

### Security

User accounts and private bookshelf information must be protected by default.

### Performance

Manga pages should not depend on unnecessary external API requests every time a visitor opens the site.

### Reliability

External APIs should be treated as data sources rather than permanent single points of failure.

### Maintainability

API access, database logic, UI components, and application services should remain separated so individual parts of the system can evolve independently.

---

## Roadmap

### Phase 1 — Manga Discovery

* [x] Manga Labs interface
* [x] Top manga section
* [x] AniList integration
* [x] Dynamic manga metadata
* [x] Manga artwork
* [ ] Improved search
* [ ] Full manga detail pages
* [ ] Character pages
* [ ] Staff pages

### Phase 2 — Manga Database

* [ ] Manga Labs database schema
* [ ] Manga metadata caching
* [ ] API ingestion pipeline
* [ ] Data normalization
* [ ] Multiple data-source support
* [ ] Automated metadata updates

### Phase 3 — User Accounts

* [ ] User registration
* [ ] Sign in
* [ ] Profiles
* [ ] Secure authentication
* [ ] Account settings

### Phase 4 — Bookshelf

* [ ] Add manga to bookshelf
* [ ] Owned status
* [ ] Reading status
* [ ] Finished status
* [ ] Wishlist
* [ ] Volume tracking
* [ ] Reading progress
* [ ] Personal ratings
* [ ] Private notes

### Phase 5 — Community

* [ ] Reviews
* [ ] Comments
* [ ] Likes
* [ ] User profiles
* [ ] Following
* [ ] Activity feeds
* [ ] Community ratings

### Phase 6 — Advanced Manga Labs Features

* [ ] Personalized manga recommendations
* [ ] Collection statistics
* [ ] Reading analytics
* [ ] Recommendation engine
* [ ] User-submitted manga
* [ ] Creator tools
* [ ] Manga PDF support
* [ ] Advanced discovery tools

---

## Contributing

Manga Labs is currently an actively developed project.

Development should follow normal Git workflows:

```bash
git pull
git checkout -b feature/feature-name
```

After making changes:

```bash
git add .
git commit -m "Describe the change"
git push
```

Feature branches can then be merged through GitHub pull requests.

---

## Git Commit Guidelines

Clear commit messages are encouraged.

Examples:

```text
feat: add manga detail page

feat: integrate character data

fix: handle missing AniList volume data

fix: correct manga rating display

refactor: move AniList queries into manga service

style: update bookshelf layout

docs: update README
```

---

## Security

Do not commit:

* API secrets
* Database passwords
* Authentication tokens
* Service-role keys
* Private user data
* `.env` files containing secrets

If a credential is accidentally committed, it should be considered compromised and rotated immediately.

---

## Status

**Manga Labs is currently in active development.**

Features, infrastructure, APIs, and database architecture may change significantly as the project evolves.

---

## Project Vision

Manga Labs aims to become more than a manga ranking website.

The goal is to build a platform where manga readers can:

> **Discover it. Read it. Own it. Track it.**

One library for the manga you love and the manga you haven't discovered yet.

---

## Brand

**Product:** Manga Labs
**Code Name:** Project-Manga
**Organization:** Scopein Labs
**Website:** `mangalabs.scopeinlabs.com`

---

## License

A license has not yet been specified.

Until a license is added, the source code should be considered proprietary unless otherwise stated.

---

© Scopein Labs. All rights reserved.
