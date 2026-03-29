# GFYL Mobile - React Native

React Native mobile application for "Gita For Your Life" - Radha Govind Dham spiritual learning platform.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo Go app on your mobile device (for testing)

### Installation

```bash
npm install
```

### Environment Setup

Create a local env file from the example:

```bash
cp .env.example .env
```

Fill these values in `.env`:

- `EXPO_PUBLIC_GEMINI_API_KEY`
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Note: Never commit your `.env` file.

### Running the App

```bash
# Start the development server
npm start

# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios

# Run on Web
npm run web
```

### Testing on Your Phone
1. Install **Expo Go** from App Store (iOS) or Play Store (Android)
2. Run `npm start`
3. Scan the QR code with your phone camera (iOS) or Expo Go app (Android)

## 📁 Project Structure

```
GFYL-Mobile/
├── screens/          # Screen components
│   └── AuthScreen.tsx
├── components/       # Reusable components
├── types/           # TypeScript type definitions
├── assets/          # Images, fonts, etc.
├── App.tsx          # Main app entry point
└── package.json
```

## 🔧 Tech Stack

- **React Native** with **Expo**
- **TypeScript**
- **Expo Linear Gradient** for gradients
- **React Navigation** for screen navigation
- **Expo Vector Icons** for icons

## 📝 Features Implemented

- ✅ Authentication Screen (Login/Signup)
- ⏳ Home Screen (coming soon)
- ⏳ AI Buddy Chat (coming soon)
- ⏳ Bhagavad Gita Reader (coming soon)
- ⏳ Video Courses (coming soon)
- ⏳ Community Forums (coming soon)

## 🎨 Converting from Web Version

This app is being converted from the React/Vite web version. Key changes:
- `div` → `View`
- `button` → `TouchableOpacity`
- `input` → `TextInput`
- Tailwind CSS → StyleSheet
- lucide-react → @expo/vector-icons

## 🌐 Related Projects

- [GFYL Web App](../Religious%20Teaching%20App%20Design) - React/Vite web version

## 📱 Building for Production

```bash
# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

## 📄 License

Copyright © 2025 Radha Govind Dham
