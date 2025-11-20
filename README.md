# VipBooru

<p align="center">
  <img src="public/logo.png" alt="VipBooru Logo" width="120" />
</p>

<p align="center">
  A modern frontend alternative for Danbooru
</p>

<p align="center">
  <a href="https://www.gnu.org/licenses/gpl-3.0"><img src="https://img.shields.io/badge/License-GPLv3-blue.svg" alt="License: GPL v3"></a>
  <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/React-19-61dafb.svg" alt="React"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.6-blue.svg" alt="TypeScript"></a>
</p>

## Features

- Fast and responsive interface built with React and Vite
- Mobile-friendly design that adapts to all screen sizes
- Advanced tag search with autocomplete suggestions
- Virtualized masonry grid for smooth scrolling with thousands of images
- Configurable image loading (lazy/eager) for performance optimization
- Optional API key support for increased rate limits
- Clean, modern UI with Material-UI components
- Supports images, gifs, and videos

## Installation

### Prerequisites

- Node.js 20.19.0+ or 22.12.0+
- npm 10+

### Setup

```bash
git clone https://github.com/Ipmake/vipbooru.git
cd vipbooru
npm install
npm run dev
```

The application will be available at `http://localhost:5173`

## Building for Production

```bash
npm run build
npm run preview
```

## Usage

Use the search bar to search for images using Danbooru tags. Click any image to view it in full resolution with its details. Configure your preferences in the settings page, including optional API credentials and image loading strategy.

## Tech Stack

- React 19
- TypeScript
- Vite
- Material-UI v7
- React Router
- Axios

## License

GNU General Public License v3.0 - see [LICENSE](LICENSE) file for details.

## Author

Created by [Ipmake](https://ipmake.dev)

- GitHub: [@Ipmake](https://github.com/Ipmake)
- Support: [Ko-fi](https://ko-fi.com/ipmake)

## Note

This project is not affiliated with Danbooru. It's an independent frontend client.

