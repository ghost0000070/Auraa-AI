# Auraa AI - AI Employee Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Auraa AI is a platform designed to deploy and manage autonomous AI employees. These AI agents can be configured with specific skills, assigned to various business tasks, and integrated into existing workflows to automate complex processes.

## Key Features

- **🤖 Deploy AI Employees:** Choose from a variety of pre-built AI employee templates, each with specialized skills for different departments like marketing, legal, finance, and customer support.
- **⚡ Skill Creation:** Discover and build hundreds of unique skills for your AI Employees to perform any task required for your business.
- **📊 Project Management:** Automatically create entire projects, assign tasks to AI and human team members, and estimate project ETAs with capacity and resource planning.
- **🎫 Customer Support Automation:** Empower your AI employees to handle customer support tickets by leveraging help center articles, internal knowledge bases, and past ticket data.
- **📈 Social Media Management:** Automate the creation and posting of social media content across platforms like LinkedIn, Facebook, Instagram, and Twitter, maintaining a consistent brand voice.

## Getting Started

This project is a React-based web application built with Vite and uses Firebase for backend services, including Firestore for the database and Firebase Authentication.

### Prerequisites

- Node.js and npm
- Firebase CLI
- A configured Firebase project

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ghost0000070/Auraa-AI.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

### ⚠️ Security Notice

**IMPORTANT**: After cloning this repository:

1. **Never commit your `.env` file** - it contains sensitive Firebase credentials
2. If you've just merged a PR that removed a committed `.env` file, **immediately rotate all Firebase API keys**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Project Settings > General
   - Delete the current web app
   - Create a new web app with new credentials
   - Update your local `.env` file with new credentials

3. **Owner Account**: The account `owner@auraa-ai.com` has unrestricted access to all platform features regardless of subscription tier.

## Project Structure

- `src/`: Contains the main React application source code.
  - `components/`: Reusable React components.
  - `lib/`: Core application logic, including AI employee templates.
  - `pages/`: Top-level page components.
- `functions/`: Cloud Functions for Firebase.
- `docs/`: Project documentation.
- `firebase.json`: Configuration for Firebase services and deployment rules.
- `CHANGELOG.md`: All notable changes to this project.

## Deployment

This project is configured for deployment to Firebase Hosting. The GitHub Action in this repository will automatically deploy a preview of your app for each pull request. When a pull request is merged, the action will deploy to the live channel.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Changelog

All notable changes to this project are documented in the [CHANGELOG.md](CHANGELOG.md) file.

## Contact

If you have any questions, you can contact us by email: support@auraa-ai.com
