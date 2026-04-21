const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const startBtn = document.getElementById('start-btn');
const overlay = document.getElementById('overlay');
const memeOutput = document.getElementById('meme-output');
const memeContainer = document.querySelector('.meme-container');

// State
let isPlaying = false;
let previousPoseTree = null;
let takeDevSnapshot = false;

// 🔥 DEVELOPER AREA 🔥
const hardcodedGestures = [];

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    takeDevSnapshot = true;
    console.log('📸 Snapping pose data...');
  }
});

const assetsCache = {};
const actionsList = [
  { name: 'HANDS_UP', file: 'hands_up', gif: 'hands_up.gif' },
  { name: 'RIGHT_HAND_UP', file: 'right_hand', gif: 'right_hand.gif' },
  { name: 'FAST', file: 'fast', gif: 'fast.gif' },
  { name: 'HEAD_SHAKE', file: 'head_shake', gif: 'head_shake.gif' },
  { name: 'HEAD_NOD', file: 'head_nod', gif: 'head_nod.gif' },
  { name: 'FACE_MOVEMENT', file: 'face_move', gif: 'face_move.gif' }
];

// Pre-load assets into state memory (Session-lifetime Blobs & Auto-audio)
actionsList.forEach(action => {
  const audio = new Audio(`/music/${action.file}.mp3`);
  audio.preload = 'auto'; 
  
  assetsCache[action.name] = {
    audio: audio,
    durationMs: 2000, // fallback
    gifUrl: `/assets/${action.gif}` // initial fallback url
  };

  audio.addEventListener('loadedmetadata', () => {
    assetsCache[action.name].durationMs = audio.duration * 1000;
  });

  // Fetch GIF as Blob, store in memory cache for instantaneous 0-latency display
  fetch(`/assets/${action.gif}`)
    .then(response => response.blob())
    .then(blob => {
      assetsCache[action.name].gifUrl = URL.createObjectURL(blob);
    })
    .catch(err => console.warn('Failed to cache GIF:', err));
});

// Actions priority & cooldown
function triggerAction(actionName, customUrl = null) {
  if (isPlaying) return;
  isPlaying = true;
  
  memeContainer.classList.add('active');

  let durationMs = 2000;

  if (customUrl) {
    memeOutput.src = customUrl;
  } else if (assetsCache[actionName]) {
    memeOutput.src = assetsCache[actionName].gifUrl;
    durationMs = assetsCache[actionName].durationMs;
    const audioObj = assetsCache[actionName].audio;
    audioObj.currentTime = 0;
    audioObj.play().catch(e => console.error('Audio play error:', e));
  }
  
  console.log('--- Action Triggered: ' + actionName + ' ---\nLink: ' + memeOutput.src + '\nCooldown: ' + durationMs + 'ms');
  
  setTimeout(() => {
    isPlaying = false;
    memeOutput.src = 'https://placehold.co/400x400/png?text=Waiting+for+Gesture';
    memeContainer.classList.remove('active');
  }, durationMs);
}

function normalizePose(landmarks) {
   const nose = landmarks[0];
   const leftShoulder = landmarks[11];
   const rightShoulder = landmarks[12];
   const dx = leftShoulder.x - rightShoulder.x;
   const dy = leftShoulder.y - rightShoulder.y;
   const scale = Math.sqrt(dx*dx + dy*dy) || 0.1;

   return landmarks.map(lm => ({
     x: (parseFloat((lm.x - nose.x) / scale)).toFixed(3),
     y: (parseFloat((lm.y - nose.y) / scale)).toFixed(3),
     visibility: parseFloat(lm.visibility).toFixed(3)
   }));
}

function comparePose(poseA, poseB) {
  const keyIndices = [11, 12, 13, 14, 15, 16]; 
  let totalDist = 0;
  let validPoints = 0;
  for (let i of keyIndices) {
    if (poseA[i] && poseB[i] && poseA[i].visibility > 0.6 && poseB[i].visibility > 0.6) {
      const dx = poseA[i].x - poseB[i].x;
      const dy = poseA[i].y - poseB[i].y;
      totalDist += Math.sqrt(dx*dx + dy*dy);
      validPoints++;
    }
  }
  return validPoints > 0 ? totalDist / validPoints : 999;
}

function processLandmarks(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  if (results.poseLandmarks) {
    drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS,
                   {color: '#00FF00', lineWidth: 4});
    drawLandmarks(canvasCtx, results.poseLandmarks,
                  {color: '#FF0000', lineWidth: 2});
                  
    const landmarks = results.poseLandmarks;
    const currentNorm = normalizePose(landmarks);
    
    if (takeDevSnapshot) {
      takeDevSnapshot = false;
      console.log('✅ DEVELOPER: Pose Array:\n\n' + JSON.stringify(currentNorm));
    }

    let matchedHardcoded = null;
    if (!isPlaying) {
      for (let hg of hardcodedGestures) {
        if (!hg.pose) continue;
        const matchDist = comparePose(currentNorm, hg.pose);
        if (matchDist < 0.8) { 
           matchedHardcoded = hg;
           break;
        }
      }
    }

    const nose = landmarks[0];
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];

    // Evaluate Velocity base actions
    let fastSpeed = false;
    let headShake = false;
    let headNod = false;

    if (previousPoseTree) {
       let dxLeft = Math.abs(leftWrist.x - previousPoseTree.left.x);
       let dxRight = Math.abs(rightWrist.x - previousPoseTree.right.x);
       if (leftWrist.visibility > 0.6 && rightWrist.visibility > 0.6) {
           if (dxLeft > 0.08 || dxRight > 0.08) fastSpeed = true;
       }

       let dxNose = Math.abs(nose.x - previousPoseTree.nose.x);
       let dyNose = Math.abs(nose.y - previousPoseTree.nose.y);
       if (nose.visibility > 0.8) {
           // Quick threshold: nose velocity across frames
           if (dxNose > 0.03) headShake = true;
           else if (dyNose > 0.03) headNod = true;
       }
    }
    previousPoseTree = { left: leftWrist, right: rightWrist, nose: nose };

    // Standard static actions with Visibility guards to prevent phantom 'offscreen' triggers
    const bothHandsUp = leftWrist.visibility > 0.5 && rightWrist.visibility > 0.5 &&
                        leftWrist.y < leftShoulder.y && rightWrist.y < rightShoulder.y;
                        
    // Physical right hand means index 16. It must be UP (lower Y value) and physical left hand DOWN or OFFSCREEN
    const rightHandUp = rightWrist.visibility > 0.5 && rightWrist.y < rightShoulder.y && 
                        (leftWrist.visibility < 0.5 || leftWrist.y > leftShoulder.y);

    // Absolute position face strays beyond outer boundaries (e.g., Leaning left or right deeply)
    // 0.5 is center. > 0.7 means they leaned far left. < 0.3 means they leaned far right.
    const faceMovement = nose.x > 0.7 || nose.x < 0.3 || nose.y > 0.7 || nose.y < 0.3;
    
    // Master Trigger Condition List
    if (matchedHardcoded) {
      triggerAction('HARDCODED', matchedHardcoded.gifUrl);
    } else if (bothHandsUp) {
      triggerAction('HANDS_UP');
    } else if (rightHandUp) {
      triggerAction('RIGHT_HAND_UP');
    } else if (fastSpeed) {
      triggerAction('FAST');
    } else if (headShake) {
      triggerAction('HEAD_SHAKE');
    } else if (headNod) {
      triggerAction('HEAD_NOD');
    } else if (faceMovement) {
      triggerAction('FACE_MOVEMENT');
    }
  }
  canvasCtx.restore();
}

const pose = new Pose({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
}});
pose.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  enableSegmentation: false,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});
pose.onResults(processLandmarks);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await pose.send({image: videoElement});
  },
  width: 640,
  height: 480
});

startBtn.addEventListener('click', () => {
  overlay.style.display = 'none';
  console.log('📷 Camera starting...');
  camera.start().then(() => {
    console.log('✅ Camera & MediaPipe are fully up and running! Try making a gesture.');
  });
});
