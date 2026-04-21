# Gesture Cat Meme App

An interactive AI-powered gesture recognition meme application that uses body pose detection to trigger animated GIF responses based on user movements.

## Project Overview

This is a real-time gesture recognition web application that uses MediaPipe Pose to detect user movements through the webcam and displays corresponding animated GIFs and sound effects. The app supports two themes: **Cat Memes** and **One Piece**.

![Project Structure](https://via.placeholder.com/1200x400?text=Gesture+Cat+Meme+App)

## Tech Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Build Tool**: Vite 5.0
- **Pose Detection**: Google MediaPipe Pose
- **Media Processing**: Canvas API for overlay rendering
- **Deployment**: Static file serving

## File Structure

```
cat-meme-1/
├── index.html              # Main HTML entry point
├── package.json           # NPM configuration
├── src/
│   ├── main.js           # Core application logic (358 lines)
│   └── style.css         # Styling (148 lines)
├── public/
│   ├── assets/          # Animated GIF assets
│   │   ├── one_piece/   # One Piece themed GIFs
│   │   │   ├── attention.gif
│   │   │   ├── hand_cross.gif
│   │   │   ├── hand_movement.gif
│   │   │   ├── head_movement.gif
│   │   │   ├── kick.gif
│   │   │   ├── left_hand_up.gif
│   │   │   ├── right_hand_up.gif
│   │   │   └── squat.gif
│   │   ├── face_move.gif
│   │   ├── fast.gif
│   │   ├── hands_up.gif
│   │   ├── head_nod.gif
│   │   ├── head_shake.gif
│   │   └── right_hand.gif
│   └── music/            # Audio files
│       ├── face_move.mp3
│       ├── fast.mp3
│       ├── hands_up.mp3
│       ├── head_nod.mp3
│       ├── head_shake.mp3
│       ├── overtaken.mp3 (One Piece BGM)
│       └── right_hand.mp3
└── .git/
```

## Core Features

### 1. Real-time Pose Detection
- Uses MediaPipe Pose for body landmark detection
- Tracks 33 body keypoints including:
  - Face: nose, eyes, ears
  - Upper body: shoulders, elbows, wrists
  - Lower body: hips, knees, ankles

### 2. Gesture Recognition

#### Cat Mode Gestures:
| Gesture | Trigger Condition | Output |
|---------|-------------------|--------|
| HANDS_UP | Both wrists above shoulders | hands_up.gif + audio |
| RIGHT_HAND_UP | Right wrist above shoulder only | right_hand.gif + audio |
| FAST | Rapid hand movement (>0.08 frame delta) | fast.gif + audio |
| HEAD_SHAKE | Nose horizontal movement (>0.03 delta) | head_shake.gif + audio |
| HEAD_NOD | Nose vertical movement (>0.03 delta) | head_nod.gif + audio |
| FACE_MOVEMENT | Face moved beyond boundaries (x>0.7 or x<0.3) | face_move.gif + audio |

#### One Piece Mode Gestures:
| Gesture | Trigger Condition | Output |
|---------|-------------------|--------|
| KICK | Ankle above hip level | kick.gif |
| SQUAT | Hip at or below knee level | squat.gif |
| ATTENTION | Wrists near hips (<0.25 distance) | attention.gif |
| HAND_CROSS | Wrists crossed near chest | hand_cross.gif |
| RIGHT_HAND_UP | Right wrist above shoulder | right_hand_up.gif |
| LEFT_HAND_UP | Left wrist above shoulder | left_hand_up.gif |
| HAND_MOVEMENT | Fast hand movement | hand_movement.gif |
| HEAD_MOVEMENT | Head shake/nod/movement | head_movement.gif |

### 3. Theme Switching
- Dropdown selector to switch between **Cat** and **One Piece** themes
- One Piece mode includes background music (overtaken.mp3)
- Each theme has unique GIF sets and audio

### 4. Developer Tools
- Press **Spacebar** to log current pose data to console
- Normalized pose array output for creating new gestures
- Console logging for debugging

## Architecture Analysis

### State Management
```javascript
// Main application state
let isPlaying = false;          // Prevents gesture overlap
let previousPoseTree = null;    // Velocity detection
let takeDevSnapshot = false;   // Developer mode
let currentMode = 'cat';     // Theme mode
```

### Asset Pre-loading
- GIFs fetched as Blobs and cached in memory
- Audio elements pre-loaded for instant playback
- Reduces latency when triggering reactions

### Pose Processing Pipeline
1. **Capture**: Webcam frame → MediaPipe Pose
2. **Normalize**: Scale landmarks relative to nose position
3. **Compare**: Match against hardcoded gesture poses
4. **Evaluate**: Check velocity and position conditions
5. **Trigger**: Display GIF + play audio (after cooldown)

### Key Functions

| Function | Purpose |
|----------|---------|
| `normalizePose()` | Scales landmarks relative to nose for invariant matching |
| `comparePose()` | Calculates Euclidean distance between poses |
| `triggerAction()` | Displays GIF and plays audio for matched gesture |
| `processLandmarks()` | Main pose processing pipeline |

## Technical Details

### Video Configuration
- Resolution: 640x480
- Framerate: Device-dependent
- Mirrored display (scaleX(-1))

### Visibility Thresholds
- Minimum visibility for detection: 0.5 (most limbs)
- Strict visibility: 0.8 (nose for head gestures)

### MediaPipe Configuration
```javascript
{
  modelComplexity: 1,
  smoothLandmarks: true,
  enableSegmentation: false,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
}
```

## External Dependencies

Loaded via CDN (jsdelivr):
- `@mediapipe/camera_utils`
- `@mediapipe/control_utils`
- `@mediapipe/drawing_utils`
- `@mediapipe/pose`

## Installation & Usage

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Browser Support

Requires:
- WebGL support
- getUserMedia API access
- Modern ES6+ JavaScript

## Potential Improvements

1. **Machine Learning**: Train custom gesture models instead of threshold-based detection
2. **Multi-player**: Multiple users gesture detection
3. **Custom Gestures**: UI for recording new gestures
4. **Social Sharing**: Export gesture recordings
5. **Performance**: WebGPU acceleration for lower latency

## License

ISC License

## Author

Created for interactive AI gestural experiences with memes.