// ==========================================
// MAIPÚ 3D: PLAZA AVENTURA 🏢🌳🎮
// Complete Three.js WebGL Engine
// ==========================================

// Global Game State
const GAME_STATE = {
  playerCharId: 'lucho',
  coins: 0,
  sopaipillas: 0,
  hasPlant: false,
  ladyHelped: false,
  score: 0,
  energy: 100,
  maxEnergy: 100,
  isDialogueActive: false,
  activeNPC: null,
  toastTimer: 0,
  superJumpActive: false,
  superJumpTimer: 0,
  missions: {
    sopaipillas: false,
    plantas: false,
    lady: false
  }
};

// Procedural Audio Synthesizer
class SynthAudio {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.bgmInterval = null;
    this.melodyIndex = 0;
    
    // Catchy arcade chiptune cueca track
    this.notes = [
      392.00, 523.25, 659.25, 523.25, 392.00, 523.25, 659.25, 0,
      349.23, 440.00, 587.33, 440.00, 349.23, 440.00, 587.33, 0,
      392.00, 523.25, 659.25, 783.99, 659.25, 523.25, 392.00, 523.25,
      293.66, 349.23, 440.00, 392.00, 349.23, 329.63, 261.63, 0
    ];
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopBGM();
    } else {
      this.startBGM();
    }
    return this.isMuted;
  }

  playSFX(type) {
    if (this.isMuted || !this.ctx) return;
    this.ctx.resume();

    const now = this.ctx.currentTime;
    
    switch (type) {
      case 'jump': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(700, now + 0.15);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      }
      case 'bark': {
        // Double sharp pulse for a dog bark
        [0, 0.08].forEach(delay => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(140, now + delay);
          osc.frequency.linearRampToValueAtTime(90, now + delay + 0.07);
          gain.gain.setValueAtTime(0.12, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.07);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + delay);
          osc.stop(now + delay + 0.07);
        });
        break;
      }
      case 'collect': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.setValueAtTime(698.46, now + 0.06);
        osc.frequency.setValueAtTime(880.00, now + 0.12);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
        break;
      }
      case 'buy': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(783.99, now + 0.08);
        osc.frequency.setValueAtTime(1046.50, now + 0.16);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      }
      case 'damage': {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.3);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      }
      case 'level': {
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99];
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0.1, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.2);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.2);
        });
        break;
      }
    }
  }

  startBGM() {
    this.stopBGM();
    if (this.isMuted || !this.ctx) return;
    this.ctx.resume();

    const eighthDuration = 60 / 140 / 2; // BPM 140

    this.bgmInterval = setInterval(() => {
      if (this.isMuted) return;
      const freq = this.notes[this.melodyIndex];
      const now = this.ctx.currentTime;

      if (freq > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + eighthDuration - 0.02);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + eighthDuration);
      }

      // Accompaniment
      if (this.melodyIndex % 4 === 0) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'square';
        const bassFreq = (freq > 0 ? freq : 392) / 2;
        bassOsc.frequency.setValueAtTime(bassFreq, now);
        bassGain.gain.setValueAtTime(0.015, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + eighthDuration * 2 - 0.04);
        bassOsc.connect(bassGain);
        bassGain.connect(this.ctx.destination);
        bassOsc.start(now);
        bassOsc.stop(now + eighthDuration * 2);
      }

      this.melodyIndex = (this.melodyIndex + 1) % this.notes.length;
    }, eighthDuration * 1000);
  }

  stopBGM() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

const sounds = new SynthAudio();

// NPCs Configurations and Dialogues
const NPCS_DATA = {
  lady: {
    name: "Señora de las Monedas",
    emoji: "👩‍🦳",
    color: "#e2e8f0",
    dialogues: {
      initial: {
        text: "Hola mijito/a, ¿tendrá una monedita para el pancito por favor?... Las calles están muy frías.",
        options: [
          { text: "Dar Moneda (-1 🪙)", target: "give_coin", cond: () => GAME_STATE.coins >= 1 },
          { text: "No tengo monedas, disculpe", target: "no_coin" },
          { text: "Ignorar", target: "exit" }
        ]
      },
      give_coin: {
        text: "¡Dios te bendiga, vecinito lindo! Que Dios le multiplique su platita. ¡Tome este amuleto de la plaza!",
        action: () => {
          GAME_STATE.coins -= 1;
          GAME_STATE.ladyHelped = true;
          GAME_STATE.superJumpActive = true;
          GAME_STATE.superJumpTimer = 800; // Super jump for 800 frames
          document.getElementById('hud-coins').innerText = GAME_STATE.coins;
          showToast("¡Bendición concedida! ¡Súper Salto Activado!");
          checkMissionStatus();
        },
        options: [{ text: "¡Gracias!", target: "exit" }]
      },
      no_coin: {
        text: "No se preocupe, mijito. La buena intención es lo que vale. Cuídese de los pillos que andan en la esquina.",
        options: [{ text: "Igualmente, adiós", target: "exit" }]
      },
      already_helped: {
        text: "¡Hola de nuevo, vecinito! Gracias a tu pancito hoy tendré una linda tarde. ¡Ve con cuidado!",
        options: [{ text: "¡Adiós!", target: "exit" }]
      }
    }
  },
  alcalde: {
    name: "Alcalde Tomás Vodanovic",
    emoji: "👨‍💼",
    color: "#00f2fe",
    dialogues: {
      initial: {
        text: "¡Hola! Qué gusto saludarte. Estamos fiscalizando las obras de recuperación del centro de Maipú. ¿Cómo va tu recorrido por la plaza?",
        options: [
          { text: "Todo bien, Alcalde", target: "good" },
          { text: "¿Qué misiones tiene para mí?", target: "missions" },
          { text: "Tengo una denuncia por robos", target: "ladrón" }
        ]
      },
      good: {
        text: "Excelente. El orgullo de Maipú se construye con el trabajo de todos. ¡Que tengas un excelente día!",
        options: [{ text: "¡Igualmente!", target: "exit" }]
      },
      missions: {
        text: "Necesitamos recolectar 5 sopaipillas perdidas que los carritos botaron. Además, ayuda a los floristas locales comprando plantas y colabora con nuestra abuelita de la salida del metro.",
        options: [{ text: "¡Me pongo a trabajar!", target: "exit" }]
      },
      ladrón: {
        text: "¡Uf! Estamos al tanto. Hay un lanzazo merodeando los arbustos del Pimiento. Ten cuidado y cuida tus monedas. ¡Si juegas como el Quiltro, ládrale para ahuyentarlo!",
        options: [{ text: "Entendido, Alcalde", target: "exit" }]
      },
      victory: {
        text: "¡Increíble! Lograste cumplir todas las misiones y ayudaste a toda nuestra comunidad. ¡Eres oficialmente un Vecino Ilustre de Maipú! 🎉🇨🇱",
        action: () => {
          triggerVictory();
        },
        options: [{ text: "¡Viva Maipú!", target: "exit" }]
      }
    }
  },
  transito: {
    name: "Director de Tránsito",
    emoji: "🚨",
    color: "#10b981",
    dialogues: {
      initial: {
        text: "¡Alto ahí, colega! Los colectivos y micros van a toda velocidad por Pajaritos. Cruza con extrema precaución.",
        options: [
          { text: "¿Qué colectivos pasan por acá?", target: "colectivos" },
          { text: "Tenga cuidado también, adiós", target: "exit" }
        ]
      },
      colectivos: {
        text: "¡Uf! De todo. Pasan las micros del Transantiago y los colectivos verdes locales que van hacia Rinconada. ¡Esquiva la calle que los frenos fallan rápido!",
        options: [{ text: "Entendido", target: "exit" }]
      }
    }
  },
  ladron: {
    name: "El Ladrón ('Lanza')",
    emoji: "🥷",
    color: "#ff3366",
    dialogues: {
      initial: {
        text: "Oye hermano... ¿tení la hora? Anda con cuidado que te ando vigilando esa billetera...",
        options: [
          { text: "No te tengo miedo", target: "fight" },
          { text: "Salir corriendo", target: "exit" }
        ]
      },
      fight: {
        text: "¡Ja! Pura boca. ¡Dame esa moneda si no querí problemas!",
        action: () => {
          if (GAME_STATE.coins > 0) {
            GAME_STATE.coins = Math.max(0, GAME_STATE.coins - 1);
            document.getElementById('hud-coins').innerText = GAME_STATE.coins;
            sounds.playSFX('damage');
            showToast("¡Te han robado 1 moneda! 🪙");
          } else {
            GAME_STATE.energy = Math.max(0, GAME_STATE.energy - 20);
            document.getElementById('hud-energy').style.width = GAME_STATE.energy + '%';
            sounds.playSFX('damage');
            showToast("¡Te empujó! Perdiste 20 de energía.");
            if (GAME_STATE.energy <= 0) triggerGameOver();
          }
        },
        options: [{ text: "¡Rayos!", target: "exit" }]
      },
      scared: {
        text: "¡AY! ¡Sácame ese perro mugroso de encima! ¡Me carga que me ladren, ya me voy!",
        options: [{ text: "¡Así me gusta, pillo!", target: "exit" }]
      }
    }
  },
  plantas: {
    name: "Vendedor de Plantas Raras",
    emoji: "🪴",
    color: "#fbbf24",
    dialogues: {
      initial: {
        text: "¡Hola vecinito! Vendo plantas extrañas traídas desde las parcelas de Rinconada de Maipú. ¿Te interesa ver mi stock?",
        options: [
          { text: "Comprar Sopaipilla Carnívora (3 🪙)", target: "buy_plant", cond: () => GAME_STATE.coins >= 3 },
          { text: "¿Qué tipo de plantas tienes?", target: "info" },
          { text: "Solo estoy mirando, gracias", target: "exit" }
        ]
      },
      buy_plant: {
        text: "¡Excelente compra! La Sopaipilla Carnívora necesita mostaza una vez a la semana. ¡Cuídala bien!",
        action: () => {
          GAME_STATE.coins -= 3;
          GAME_STATE.hasPlant = true;
          document.getElementById('hud-coins').innerText = GAME_STATE.coins;
          sounds.playSFX('buy');
          showToast("¡Compraste una Planta Rara! 🪴");
          checkMissionStatus();
        },
        options: [{ text: "¡Genial, gracias!", target: "exit" }]
      },
      info: {
        text: "Tengo helechos prehistóricos criados en el Cerro Primo de Rivera y cactus que florecen con la cumbia chilena. ¡Y la joya de la corona, la Sopaipilla Carnívora, por solo 3 monedas!",
        options: [{ text: "Volver", target: "initial" }]
      },
      already_bought: {
        text: "¡Qué tal, vecinito! ¿Cómo se porta la plantita? Recuerda que le gusta tomar sol con música de Kidd Voodoo.",
        options: [{ text: "¡Se porta de lujo, adiós!", target: "exit" }]
      }
    }
  }
};

// 3D Game Engine Class
class Game3D {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    
    // Mechanics
    this.player = null;
    this.playerVelocity = new THREE.Vector3();
    this.isGrounded = true;
    this.keys = {};
    this.npcs = [];
    this.coins3D = [];
    this.sopaipillas3D = [];
    this.cars = [];

    // Camera orbit parameters
    this.cameraAngleX = 0;
    this.cameraAngleY = Math.PI / 8;
    this.cameraDistance = 14;
    this.mouseDrag = false;
    this.prevMouseX = 0;
    this.prevMouseY = 0;

    // Mobile Joystick values
    this.joystickVector = { x: 0, y: 0 };
    this.joystickActive = false;

    this.initThree();
    this.createWorld();
    this.createUIEvents();
    this.animate();
  }

  // Set up lights, camera, WebGL
  initThree() {
    document.getElementById('webgl-fallback').style.display = 'none';

    // 1. Scene & Fog (Sunset orange-blue twilight fog)
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0c16);
    this.scene.fog = new THREE.FogExp2(0x0a0c16, 0.012);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(50, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
    
    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0x2d3a60, 1.2);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xff7722, 1.5); // Orange Sunset light
    sunLight.position.set(40, 50, -30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.bias = -0.001;
    this.scene.add(sunLight);

    // Floor shadow light helper
    const skyLight = new THREE.HemisphereLight(0x4facfe, 0xff7722, 0.6);
    this.scene.add(skyLight);
  }

  // Create 3D world elements
  createWorld() {
    // 1. Street and Ground Plane
    const groundGeo = new THREE.PlaneGeometry(300, 300);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x111622, roughness: 0.85 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 2. Central Park Lawn Area (Square Plaza)
    const plazaGeo = new THREE.BoxGeometry(100, 0.2, 100);
    const plazaMat = new THREE.MeshStandardMaterial({ color: 0x1b4332, roughness: 0.9 }); // Dark green lawn
    const plaza = new THREE.Mesh(plazaGeo, plazaMat);
    plaza.position.y = 0.1;
    plaza.receiveShadow = true;
    this.scene.add(plaza);

    // Plaza curbs / sidewalk borders (neon lines)
    const borderGeo = new THREE.BoxGeometry(101, 0.4, 101);
    const borderMat = new THREE.MeshStandardMaterial({ color: 0x00f2fe, emissive: 0x00f2fe, emissiveIntensity: 0.3 });
    const border = new THREE.Mesh(borderGeo, borderMat);
    border.position.y = 0.05;
    this.scene.add(border);

    // 3. Central Metro Station Entrance (Línea 5 - Circular structure)
    const metroGroup = new THREE.Group();
    metroGroup.position.set(0, 0, 0);

    // Circular glass / neon canopy
    const metroCapGeo = new THREE.CylinderGeometry(8, 8, 1.5, 32, 1, true);
    const metroCapMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, transparent: true, opacity: 0.75, roughness: 0.1 });
    const canopy = new THREE.Mesh(metroCapGeo, metroCapMat);
    canopy.position.y = 2.5;
    metroGroup.add(canopy);

    const metroRingGeo = new THREE.CylinderGeometry(8.1, 8.1, 0.2, 32);
    const metroRingMat = new THREE.MeshStandardMaterial({ color: 0x00f2fe, emissive: 0x00f2fe, emissiveIntensity: 0.8 });
    const ring = new THREE.Mesh(metroRingGeo, metroRingMat);
    ring.position.y = 3.3;
    metroGroup.add(ring);

    // Metro staircase hole representation (black cylinder)
    const staircaseGeo = new THREE.CylinderGeometry(7.5, 7.5, 1, 32);
    const staircaseMat = new THREE.MeshStandardMaterial({ color: 0x020617 });
    const stair = new THREE.Mesh(staircaseGeo, staircaseMat);
    stair.position.y = 0.1;
    metroGroup.add(stair);

    this.scene.add(metroGroup);

    // 4. Municipalidad de Maipú building
    this.muniGroup = new THREE.Group();
    this.muniGroup.position.set(-35, 0, -35); // Corner

    const muniBaseGeo = new THREE.BoxGeometry(22, 12, 16);
    const muniBaseMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
    const muniBase = new THREE.Mesh(muniBaseGeo, muniBaseMat);
    muniBase.position.y = 6;
    muniBase.castShadow = true;
    muniBase.receiveShadow = true;
    this.muniGroup.add(muniBase);

    // Glowing modern glass facade stripes
    const glassGeo = new THREE.BoxGeometry(22.2, 2, 14);
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x00f2fe, emissive: 0x00f2fe, emissiveIntensity: 0.4 });
    const glassStrip1 = new THREE.Mesh(glassGeo, glassMat);
    glassStrip1.position.y = 4;
    const glassStrip2 = new THREE.Mesh(glassGeo, glassMat);
    glassStrip2.position.y = 8;
    this.muniGroup.add(glassStrip1, glassStrip2);

    this.scene.add(this.muniGroup);

    // 5. Historic Pimiento Tree (Giant scale in the center area)
    this.treeGroup = new THREE.Group();
    this.treeGroup.position.set(15, 0, 15);

    const trunkGeo = new THREE.CylinderGeometry(1.2, 1.8, 8, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3d2e, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 4;
    trunk.castShadow = true;
    this.treeGroup.add(trunk);

    // Massive layered green foliage
    const foliageColors = [0x1e4620, 0x2d6a4f, 0x1b4332];
    for (let i = 0; i < 4; i++) {
      const leafGeo = new THREE.DodecahedronGeometry(3.5 - (i * 0.4), 1);
      const leafMat = new THREE.MeshStandardMaterial({ color: foliageColors[i % 3], roughness: 0.95 });
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set(
        (Math.random() - 0.5) * 2,
        6 + (i * 2),
        (Math.random() - 0.5) * 2
      );
      leaf.castShadow = true;
      this.treeGroup.add(leaf);
    }
    this.scene.add(this.treeGroup);

    // 6. Scattered decorative park trees & benches
    this.spawnParkDecor();

    // 7. Spawning coins and sopaipillas around
    this.spawnCollectibles();

    // 8. Dynamic circulating Colectivos (cars) along Av. Pajaritos (Z-axis highway)
    this.spawnRoadTraffic();
  }

  // Decorate park layout
  spawnParkDecor() {
    const treePositions = [
      [-25, 20], [-20, -25], [25, -20], [30, -5], [-5, 30], [20, 28]
    ];

    treePositions.forEach(pos => {
      const tree = new THREE.Group();
      tree.position.set(pos[0], 0, pos[1]);

      const trunkGeo = new THREE.CylinderGeometry(0.5, 0.7, 4, 8);
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 2;
      trunk.castShadow = true;
      tree.add(trunk);

      const leafGeo = new THREE.SphereGeometry(2, 8, 8);
      const leafMat = new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.9 });
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.y = 4.5;
      leaf.castShadow = true;
      tree.add(leaf);

      this.scene.add(tree);
    });
  }

  // Populate sopaipillas and coins in space
  spawnCollectibles() {
    const coinPositions = [
      [8, 1, -8], [-12, 1, 15], [3, 1, 24], [-24, 1, -6], [-5, 1, -30]
    ];
    const sopaipillaPositions = [
      [-15, 0.8, -15], [18, 0.8, -12], [22, 0.8, 8], [-3, 0.8, 18], [-28, 0.8, 24]
    ];

    // Spawn Coins (spinning golden cylinders)
    coinPositions.forEach(pos => {
      const coinGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.15, 16);
      const coinMat = new THREE.MeshStandardMaterial({ 
        color: 0xffd700, 
        roughness: 0.2, 
        metalness: 0.9, 
        emissive: 0xffd700, 
        emissiveIntensity: 0.2 
      });
      const coin = new THREE.Mesh(coinGeo, coinMat);
      coin.position.set(pos[0], pos[1], pos[2]);
      coin.rotation.x = Math.PI / 2;
      coin.castShadow = true;
      this.scene.add(coin);
      this.coins3D.push(coin);
    });

    // Spawn Sopaipillas (flat orange cylinders)
    sopaipillaPositions.forEach(pos => {
      const sopGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.18, 16);
      const sopMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.6 });
      const sop = new THREE.Mesh(sopGeo, sopMat);
      sop.position.set(pos[0], pos[1], pos[2]);
      sop.rotation.x = Math.PI / 2;
      sop.castShadow = true;
      this.scene.add(sop);
      this.sopaipillas3D.push(sop);
    });
  }

  // Spawns 3D traffic cars along the outer avenue (Av. Pajaritos at X = 65)
  spawnRoadTraffic() {
    const laneXPositions = [62, 68];
    const carColors = [0x10b981, 0xef4444, 0x2563eb, 0xf59e0b, 0xffffff]; // green (colectivo), red, blue, etc

    for (let i = 0; i < 4; i++) {
      const car = new THREE.Group();
      const lane = laneXPositions[i % 2];
      const zPos = (i * 70) - 140; // Spaced out
      
      car.position.set(lane, 0.5, zPos);
      car.userData = { 
        speed: (lane === 62 ? 0.6 : -0.6) + (Math.random() * 0.1), // different directions per lane
        lane: lane 
      };

      // Car body (voxel styled block)
      const bodyGeo = new THREE.BoxGeometry(3, 1, 5);
      const bodyMat = new THREE.MeshStandardMaterial({ color: carColors[i % carColors.length], roughness: 0.2 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.castShadow = true;
      car.add(body);

      // Cabin
      const cabGeo = new THREE.BoxGeometry(2.6, 0.8, 2.5);
      const cabMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1 });
      const cab = new THREE.Mesh(cabGeo, cabMat);
      cab.position.set(0, 0.8, -0.2);
      car.add(cab);

      // Wheels
      const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 8);
      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
      
      const w1 = new THREE.Mesh(wheelGeo, wheelMat);
      w1.rotation.z = Math.PI / 2;
      w1.position.set(1.5, -0.1, 1.5);
      
      const w2 = w1.clone();
      w2.position.x = -1.5;
      
      const w3 = w1.clone();
      w3.position.z = -1.5;
      
      const w4 = w2.clone();
      w4.position.z = -1.5;

      car.add(w1, w2, w3, w4);
      this.scene.add(car);
      this.cars.push(car);
    }
  }

  // Setup chosen character mesh in 3D
  setupPlayer3D(charId) {
    if (this.player) this.scene.add(this.player.mesh); // Cleanup just in case

    this.player = {
      id: charId,
      mesh: new THREE.Group(),
      speed: charId === 'quiltro' ? 0.24 : charId === 'carmen' ? 0.20 : 0.17,
      jumpForce: charId === 'carmen' ? 0.42 : 0.35,
      yPos: 0,
      vy: 0,
      radius: 1.2
    };

    // Procedural 3D modeling using primitives
    if (charId === 'lucho') {
      // 1. Don Lucho
      // Red Poncho
      const bodyGeo = new THREE.BoxGeometry(1.6, 1.8, 1);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0xff3366 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.9;
      body.castShadow = true;
      this.player.mesh.add(body);

      // White stripe
      const stripeGeo = new THREE.BoxGeometry(1.65, 0.2, 1.05);
      const stripeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.position.y = 1.0;
      this.player.mesh.add(stripe);

      // Head
      const headGeo = new THREE.BoxGeometry(1, 1, 1);
      const headMat = new THREE.MeshStandardMaterial({ color: 0xfbcfe8 });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.y = 2.1;
      head.castShadow = true;
      this.player.mesh.add(head);

      // Chupalla (Straw hat)
      const brimGeo = new THREE.CylinderGeometry(1.4, 1.4, 0.1, 16);
      const brimMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b });
      const brim = new THREE.Mesh(brimGeo, brimMat);
      brim.position.y = 2.65;
      
      const capGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.5, 16);
      const cap = new THREE.Mesh(capGeo, brimMat);
      cap.position.y = 2.9;

      this.player.mesh.add(brim, cap);

      // Slate Mustache
      const mustacheGeo = new THREE.BoxGeometry(0.7, 0.25, 0.1);
      const mustacheMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
      const mustache = new THREE.Mesh(mustacheGeo, mustacheMat);
      mustache.position.set(0, 1.9, 0.52);
      this.player.mesh.add(mustache);

    } else if (charId === 'carmen') {
      // 2. Doña Carmen
      // Coat/Skirt
      const bodyGeo = new THREE.BoxGeometry(1.4, 1.8, 1);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4facfe });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.9;
      body.castShadow = true;
      this.player.mesh.add(body);

      // Head
      const headGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
      const headMat = new THREE.MeshStandardMaterial({ color: 0xfed7aa });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.y = 2.0;
      head.castShadow = true;
      this.player.mesh.add(head);

      // Gray bun hair
      const hairGeo = new THREE.SphereGeometry(0.4, 8, 8);
      const hairMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0 });
      const hair = new THREE.Mesh(hairGeo, hairMat);
      hair.position.set(0, 2.3, -0.45);
      this.player.mesh.add(hair);

      // Glasses
      const glassesGeo = new THREE.BoxGeometry(0.7, 0.15, 0.1);
      const glassesMat = new THREE.MeshStandardMaterial({ color: 0xff3366 });
      const glasses = new THREE.Mesh(glassesGeo, glassesMat);
      glasses.position.set(0, 2.1, 0.46);
      this.player.mesh.add(glasses);

      // Green Scarf blowing back
      const scarfGeo = new THREE.BoxGeometry(0.4, 0.4, 1.2);
      const scarfMat = new THREE.MeshStandardMaterial({ color: 0x10b981 });
      const scarf = new THREE.Mesh(scarfGeo, scarfMat);
      scarf.position.set(0, 1.6, -0.6);
      this.player.mesh.add(scarf);

    } else {
      // 3. El Quiltro
      // Brown body (horizontal dog shape)
      const bodyGeo = new THREE.BoxGeometry(1, 1, 2.2);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0xd97706 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.7;
      body.castShadow = true;
      this.player.mesh.add(body);

      // Head
      const headGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
      const headMat = new THREE.MeshStandardMaterial({ color: 0xd97706 });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.set(0, 1.3, 0.8);
      head.castShadow = true;
      this.player.mesh.add(head);

      // Snout
      const snoutGeo = new THREE.BoxGeometry(0.4, 0.3, 0.5);
      const snoutMat = new THREE.MeshStandardMaterial({ color: 0xb45309 });
      const snout = new THREE.Mesh(snoutGeo, snoutMat);
      snout.position.set(0, 1.2, 1.25);
      this.player.mesh.add(snout);

      // Floppy ears
      const earGeo = new THREE.BoxGeometry(0.2, 0.7, 0.3);
      const earMat = new THREE.MeshStandardMaterial({ color: 0x92400e });
      
      const earL = new THREE.Mesh(earGeo, earMat);
      earL.position.set(0.45, 1.3, 0.7);
      
      const earR = earL.clone();
      earR.position.x = -0.45;
      this.player.mesh.add(earL, earR);

      // Tiny flag bandanna
      const bandGeo = new THREE.BoxGeometry(1.05, 0.25, 0.45);
      const bandMat = new THREE.MeshStandardMaterial({ color: 0x2563eb });
      const band = new THREE.Mesh(bandGeo, bandMat);
      band.position.set(0, 0.95, 0.7);
      this.player.mesh.add(band);

      // Tail
      const tailGeo = new THREE.BoxGeometry(0.2, 0.7, 0.2);
      const tail = new THREE.Mesh(tailGeo, headMat);
      tail.position.set(0, 1.2, -1.1);
      tail.rotation.x = -Math.PI / 4;
      this.player.mesh.add(tail);
    }

    // Shadow catcher helper
    this.player.mesh.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    this.player.mesh.position.set(0, 0, 15); // Start position
    this.scene.add(this.player.mesh);
  }

  // Create NPCs in 3D
  createNPCs() {
    // Cleanup first
    this.npcs.forEach(n => this.scene.remove(n.mesh));
    this.npcs = [];

    // Helper to build a standard voxel NPC mesh
    const buildNPCMesh = (charEmoji, colorHex) => {
      const group = new THREE.Group();
      
      // Colored body
      const bodyGeo = new THREE.BoxGeometry(1.5, 1.9, 1.1);
      const bodyMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.6 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.95;
      body.castShadow = true;
      group.add(body);

      // Head
      const headGeo = new THREE.BoxGeometry(1, 1, 1);
      const headMat = new THREE.MeshStandardMaterial({ color: 0xfbcfe8 });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.y = 2.15;
      group.add(head);

      // Emoji Indicator Floating above head
      const spriteGeo = new THREE.PlaneGeometry(1.5, 1.5);
      // We will render emoji to canvas to make texture, but simplified: let's draw floating emoji using HTML or a simple texture
      group.traverse(child => {
        if (child.isMesh) child.castShadow = true;
      });

      return group;
    };

    // 1. Señora de las Monedas
    const nLady = {
      id: 'lady',
      mesh: buildNPCMesh(0xe2e8f0, 0x64748b),
      radius: 1.5,
      yRot: 0
    };
    nLady.mesh.position.set(-10, 0, 3); // Cerca del metro
    
    // 2. Alcalde Tomás Vodanovic
    const nAlcalde = {
      id: 'alcalde',
      mesh: buildNPCMesh(0x00f2fe, 0x1e3a8a), // Blue polo suit
      radius: 1.5,
      yRot: Math.PI / 4
    };
    nAlcalde.mesh.position.set(-35, 0, -22); // Afuera de la Muni

    // 3. Director de tránsito
    const nTransito = {
      id: 'transito',
      mesh: buildNPCMesh(0x10b981, 0x059669), // Green jacket
      radius: 1.5,
      yRot: -Math.PI / 2
    };
    nTransito.mesh.position.set(45, 0, 10); // Cruzando Av. Pajaritos

    // 4. El Ladrón
    const nLadron = {
      id: 'ladron',
      mesh: buildNPCMesh(0xff3366, 0x334155), // Dark gray hoodie
      radius: 1.5,
      yRot: Math.PI
    };
    nLadron.mesh.position.set(15, 0, 8); // Escondido del pimiento

    // 5. Vendedor de Plantas
    const nPlantas = {
      id: 'plantas',
      mesh: buildNPCMesh(0xfbbf24, 0x78350f), // Gardener brown
      radius: 1.5,
      yRot: Math.PI / 2
    };
    nPlantas.mesh.position.set(22, 0, -25); // Escondido en jardines

    // Save and add to scene
    const activeNPCs = [nLady, nAlcalde, nTransito, nLadron, nPlantas];
    activeNPCs.forEach(npc => {
      npc.mesh.rotation.y = npc.yRot;
      this.scene.add(npc.mesh);
      this.npcs.push(npc);

      // Add a little floating indicator billboard
      const indGeo = new THREE.SphereGeometry(0.2, 4, 4);
      const indMat = new THREE.MeshStandardMaterial({ 
        color: NPCS_DATA[npc.id].color, 
        emissive: NPCS_DATA[npc.id].color, 
        emissiveIntensity: 0.6 
      });
      const ind = new THREE.Mesh(indGeo, indMat);
      ind.position.set(0, 3.4, 0);
      npc.mesh.add(ind);
    });
  }

  // Bind key inputs and mouse cameras
  createUIEvents() {
    const cards = document.querySelectorAll('.char-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        cards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        GAME_STATE.playerCharId = card.getAttribute('data-char');
        sounds.playSFX('collect');
      });
    });

    document.getElementById('btn-start').addEventListener('click', () => {
      sounds.init();
      this.startGame();
    });

    // Restart Buttons
    document.getElementById('btn-restart').addEventListener('click', () => {
      this.startGame();
    });
    document.getElementById('btn-win-restart').addEventListener('click', () => {
      this.startGame();
    });

    // Keyboard bindings
    window.addEventListener('keydown', (e) => {
      if (['Space', 'ArrowUp', 'KeyW', 'ArrowDown', 'KeyS'].includes(e.code) && !GAME_STATE.isDialogueActive) {
        e.preventDefault();
      }
      this.keys[e.code] = true;

      // Interaction key E / Enter
      if ((e.code === 'KeyE' || e.code === 'Enter') && !GAME_STATE.isDialogueActive) {
        this.checkInteractions();
      }

      // Special Bark for Quiltro G
      if (e.code === 'KeyG' && !GAME_STATE.isDialogueActive && GAME_STATE.playerCharId === 'quiltro') {
        this.quiltroBark();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Mouse drag camera rotation
    this.container.addEventListener('mousedown', (e) => {
      this.mouseDrag = true;
      this.prevMouseX = e.clientX;
      this.prevMouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
      this.mouseDrag = false;
    });

    this.container.addEventListener('mousemove', (e) => {
      if (this.mouseDrag) {
        const deltaX = e.clientX - this.prevMouseX;
        const deltaY = e.clientY - this.prevMouseY;
        
        this.cameraAngleX -= deltaX * 0.007;
        this.cameraAngleY = Math.max(0.05, Math.min(Math.PI / 2.2, this.cameraAngleY + deltaY * 0.007));
        
        this.prevMouseX = e.clientX;
        this.prevMouseY = e.clientY;
      }
    });

    // Mobile touch controls (Joysticks and buttons)
    const joyContainer = document.getElementById('virtual-joystick-container');
    const joyKnob = document.getElementById('virtual-joystick-knob');
    
    joyContainer.addEventListener('touchstart', (e) => {
      this.joystickActive = true;
      this.handleJoystickTouch(e.touches[0], joyContainer, joyKnob);
    });

    joyContainer.addEventListener('touchmove', (e) => {
      if (this.joystickActive) {
        this.handleJoystickTouch(e.touches[0], joyContainer, joyKnob);
      }
    });

    joyContainer.addEventListener('touchend', () => {
      this.joystickActive = false;
      this.joystickVector = { x: 0, y: 0 };
      joyKnob.style.top = '28px';
      joyKnob.style.left = '28px';
    });

    document.getElementById('touch-jump').addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (!GAME_STATE.isDialogueActive) this.playerJump();
    });

    document.getElementById('touch-interact').addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (!GAME_STATE.isDialogueActive) this.checkInteractions();
    });

    // Mute toggle
    const soundBtn = document.getElementById('sound-toggle');
    soundBtn.addEventListener('click', () => {
      sounds.init();
      const muted = sounds.toggleMute();
      soundBtn.classList.toggle('muted', muted);
    });
  }

  handleJoystickTouch(touch, container, knob) {
    const rect = container.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    
    const dist = Math.min(35, Math.sqrt(dx * dx + dy * dy));
    const angle = Math.atan2(dy, dx);
    
    // Joystick normalized vectors
    this.joystickVector.x = (Math.cos(angle) * dist) / 35;
    this.joystickVector.y = (Math.sin(angle) * dist) / 35;

    knob.style.left = (28 + Math.cos(angle) * dist) + 'px';
    knob.style.top = (28 + Math.sin(angle) * dist) + 'px';
  }

  startGame() {
    document.getElementById('menu-overlay').classList.add('hidden');
    document.getElementById('gameover-overlay').classList.add('hidden');
    document.getElementById('victory-overlay').classList.add('hidden');
    document.getElementById('game-hud').classList.remove('hidden');

    GAME_STATE.coins = 0;
    GAME_STATE.sopaipillas = 0;
    GAME_STATE.hasPlant = false;
    GAME_STATE.ladyHelped = false;
    GAME_STATE.energy = 100;
    GAME_STATE.isDialogueActive = false;
    GAME_STATE.superJumpActive = false;
    GAME_STATE.superJumpTimer = 0;
    GAME_STATE.missions = { sopaipillas: false, plantas: false, lady: false };

    // Set stats
    document.getElementById('hud-char-name').innerText = 
      GAME_STATE.playerCharId === 'lucho' ? 'Don Lucho' : GAME_STATE.playerCharId === 'carmen' ? 'Doña Carmen' : 'El Quiltro';
    document.getElementById('hud-coins').innerText = '0';
    document.getElementById('hud-sopaipillas').innerText = '0';
    document.getElementById('hud-energy').style.width = '100%';

    // Seed list
    document.getElementById('m-sopaipillas').className = '';
    document.getElementById('m-sopaipillas').innerText = '• Junta 5 Sopaipillas (0/5)';
    document.getElementById('m-plantas').className = '';
    document.getElementById('m-lady').className = '';

    this.setupPlayer3D(GAME_STATE.playerCharId);
    this.createNPCs();
    
    sounds.playSFX('level');
    sounds.startBGM();

    showToast("¡Explora la plaza e interactúa con los vecinos!");
  }

  playerJump() {
    if (!this.player || !this.isGrounded) return;
    
    const jumpVal = GAME_STATE.superJumpActive ? this.player.jumpForce * 1.6 : this.player.jumpForce;
    this.player.vy = jumpVal;
    this.isGrounded = false;
    sounds.playSFX('jump');
  }

  quiltroBark() {
    sounds.playSFX('bark');
    showToast("¡GUAU! Bark bark!");

    // Check if Ladrón is close to scare him!
    const ladrón = this.npcs.find(n => n.id === 'ladron');
    if (ladrón) {
      const dist = this.player.mesh.position.distanceTo(ladrón.mesh.position);
      if (dist < 10) {
        // Scare robber away! Move robber to outskirts
        ladrón.mesh.position.set(100, 0, 100); // Send him away
        sounds.playSFX('level');
        showToast("¡Asustaste al Ladrón con tus ladridos!");
        
        // Update dialogue to show he was scared
        NPCS_DATA.ladron.dialogues.initial = NPCS_DATA.ladron.dialogues.scared;
      }
    }
  }

  // Trigger dialogues when pressing E near NPCs
  checkInteractions() {
    if (GAME_STATE.isDialogueActive) return;

    let closestNPC = null;
    let minDist = 8.5; // Trigger radius

    this.npcs.forEach(npc => {
      const dist = this.player.mesh.position.distanceTo(npc.mesh.position);
      if (dist < minDist) {
        minDist = dist;
        closestNPC = npc;
      }
    });

    if (closestNPC) {
      this.triggerDialogue(closestNPC.id);
    }
  }

  triggerDialogue(npcId) {
    GAME_STATE.isDialogueActive = true;
    GAME_STATE.activeNPC = npcId;
    
    const npcInfo = NPCS_DATA[npcId];
    const panel = document.getElementById('dialogue-panel');
    const dSpeaker = document.getElementById('dialogue-speaker');
    const dText = document.getElementById('dialogue-text');
    const dOptions = document.getElementById('dialogue-options');
    const dPortrait = document.getElementById('portrait-avatar');
    
    // Set colors & titles
    dSpeaker.innerText = npcInfo.name;
    dSpeaker.style.color = npcInfo.color;
    dPortrait.innerText = npcInfo.emoji;
    document.getElementById('dialogue-portrait').style.borderColor = npcInfo.color;

    // Load initial node based on state
    let startNode = 'initial';
    if (npcId === 'lady' && GAME_STATE.ladyHelped) {
      startNode = 'already_helped';
    } else if (npcId === 'plantas' && GAME_STATE.hasPlant) {
      startNode = 'already_bought';
    } else if (npcId === 'alcalde' && GAME_STATE.missions.sopaipillas && GAME_STATE.missions.plantas && GAME_STATE.missions.lady) {
      startNode = 'victory';
    }

    this.loadDialogueNode(npcId, startNode, dText, dOptions);
    panel.classList.remove('hidden');
  }

  loadDialogueNode(npcId, nodeId, dText, dOptions) {
    const npcInfo = NPCS_DATA[npcId];
    const node = npcInfo.dialogues[nodeId];
    
    // Execute action if exists
    if (node.action) node.action();

    // Text typing effect
    dText.innerText = node.text;

    // Options rendering
    dOptions.innerHTML = '';
    node.options.forEach(opt => {
      // Check condition
      if (opt.cond && !opt.cond()) return;

      const btn = document.createElement('button');
      btn.className = 'dialogue-opt-btn';
      btn.innerText = opt.text;
      btn.addEventListener('click', () => {
        sounds.playSFX('collect');
        if (opt.target === 'exit') {
          this.closeDialogue();
        } else {
          this.loadDialogueNode(npcId, opt.target, dText, dOptions);
        }
      });
      dOptions.appendChild(btn);
    });
  }

  closeDialogue() {
    document.getElementById('dialogue-panel').classList.add('hidden');
    GAME_STATE.isDialogueActive = false;
    GAME_STATE.activeNPC = null;
  }

  // Animation frame loop
  animate() {
    requestAnimationFrame(() => this.animate());

    if (this.scene && this.renderer && this.camera) {
      // 1. Update Game Physics if playing and not paused by dialogue
      if (GAME_STATE.energy > 0 && !document.getElementById('menu-overlay').classList.contains('hidden')) {
        if (!GAME_STATE.isDialogueActive) {
          this.updatePlayerMovement();
          this.updateCollectibles();
        }
        this.updateTraffic();
      }

      // 2. Smooth Third-person Camera following player
      if (this.player && this.player.mesh) {
        const pPos = this.player.mesh.position;
        
        // Calculate orbit angles camera position
        const camX = pPos.x + this.cameraDistance * Math.sin(this.cameraAngleX) * Math.cos(this.cameraAngleY);
        const camY = pPos.y + this.cameraDistance * Math.sin(this.cameraAngleY) + 1.5;
        const camZ = pPos.z + this.cameraDistance * Math.cos(this.cameraAngleX) * Math.cos(this.cameraAngleY);

        this.camera.position.set(
          THREE.MathUtils.lerp(this.camera.position.x, camX, 0.1),
          THREE.MathUtils.lerp(this.camera.position.y, camY, 0.1),
          THREE.MathUtils.lerp(this.camera.position.z, camZ, 0.1)
        );
        
        // Always look smooth slightly above player chest
        const targetLook = new THREE.Vector3(pPos.x, pPos.y + 1.2, pPos.z);
        this.camera.lookAt(targetLook);
      }

      // Render scene
      this.renderer.render(this.scene, this.camera);
    }
  }

  updatePlayerMovement() {
    if (!this.player) return;

    // Movement relative to camera perspective
    const moveX = (this.keys['KeyD'] || this.keys['ArrowRight'] ? 1 : 0) - (this.keys['KeyA'] || this.keys['ArrowLeft'] ? 1 : 0);
    const moveZ = (this.keys['KeyS'] || this.keys['ArrowDown'] ? 1 : 0) - (this.keys['KeyW'] || this.keys['ArrowUp'] ? 1 : 0);

    // Joystick override
    let finalX = moveX;
    let finalZ = moveZ;
    if (this.joystickActive) {
      finalX = this.joystickVector.x;
      finalZ = this.joystickVector.y;
    }

    const moveVector = new THREE.Vector3(finalX, 0, finalZ);
    
    if (moveVector.lengthSq() > 0.01) {
      moveVector.normalize();

      // Project direction relative to camera angle
      const camYaw = this.cameraAngleX;
      const targetDir = new THREE.Vector3(
        moveVector.x * Math.cos(camYaw) + moveVector.z * Math.sin(camYaw),
        0,
        -moveVector.x * Math.sin(camYaw) + moveVector.z * Math.cos(camYaw)
      );

      // Apply displacement
      this.player.mesh.position.addScaledVector(targetDir, this.player.speed);

      // Rotate player mesh smoothly towards movement direction
      const targetAngle = Math.atan2(targetDir.x, targetDir.z);
      this.player.mesh.rotation.y = THREE.MathUtils.lerp(this.player.mesh.rotation.y, targetAngle, 0.18);

      // Walking bounce animation loop
      const bounce = Math.abs(Math.sin(Date.now() * 0.01)) * 0.15;
      this.player.mesh.position.y = this.player.yPos + bounce;
    } else {
      this.player.mesh.position.y = THREE.MathUtils.lerp(this.player.mesh.position.y, this.player.yPos, 0.2);
    }

    // Don Lucho double jump is false, Carmen has it naturally
    if (this.keys['Space'] && this.isGrounded) {
      this.playerJump();
    }

    // Don Lucho or others Double Jump logic
    if (this.keys['Space'] && !this.isGrounded && this.player.id === 'carmen' && !this.dJumpTriggered) {
      this.player.vy = this.player.jumpForce * 0.8;
      this.dJumpTriggered = true;
      sounds.playSFX('jump');
    }

    // Apply 3D Gravity
    if (!this.isGrounded) {
      this.player.vy -= 0.016; // gravity acceleration
      this.player.yPos += this.player.vy;

      if (this.player.yPos <= 0) {
        this.player.yPos = 0;
        this.player.vy = 0;
        this.isGrounded = true;
        this.dJumpTriggered = false;
      }
      this.player.mesh.position.y = this.player.yPos;
    }

    // Bounds limit (stay in the plaza square boundaries)
    const bounds = 85;
    this.player.mesh.position.x = Math.max(-bounds, Math.min(bounds, this.player.mesh.position.x));
    this.player.mesh.position.z = Math.max(-bounds, Math.min(bounds, this.player.mesh.position.z));

    // Collision checking with Municipalidad (bounding box)
    const pPos = this.player.mesh.position;
    // Muni is at -35, -35 with width 22, depth 16
    if (pPos.x > -47 && pPos.x < -23 && pPos.z > -44 && pPos.z < -26) {
      // push out of Muni bounds
      if (Math.abs(pPos.x - (-35)) > Math.abs(pPos.z - (-35))) {
        pPos.x = pPos.x > -35 ? -23 : -47;
      } else {
        pPos.z = pPos.z > -35 ? -26 : -44;
      }
    }

    // Collision checking with trees
    const treePos = this.treeGroup.position;
    if (pPos.distanceTo(treePos) < 2.5) {
      // push out of Pimiento tree
      const dir = new THREE.Vector3().subVectors(pPos, treePos).normalize();
      pPos.addScaledVector(dir, 0.2);
    }

    // Handle super jump timer countdown
    if (GAME_STATE.superJumpActive) {
      GAME_STATE.superJumpTimer--;
      if (GAME_STATE.superJumpTimer <= 0) {
        GAME_STATE.superJumpActive = false;
        showToast("Se agotó la bendición del Súper Salto.");
      }
    }
  }

  // Spin collectibles and check colliders
  updateCollectibles() {
    const pPos = this.player.mesh.position;

    // 1. Coins collision
    for (let i = 0; i < this.coins3D.length; i++) {
      const coin = this.coins3D[i];
      coin.rotation.z += 0.05; // Spin on flat axis

      if (pPos.distanceTo(coin.position) < 2.2) {
        // Collect
        this.scene.remove(coin);
        this.coins3D.splice(i, 1);
        i--;
        
        GAME_STATE.coins += 1;
        document.getElementById('hud-coins').innerText = GAME_STATE.coins;
        sounds.playSFX('collect');
        showToast("¡Recogiste una moneda! 🪙");
      }
    }

    // 2. Sopaipillas collision
    for (let i = 0; i < this.sopaipillas3D.length; i++) {
      const sop = this.sopaipillas3D[i];
      sop.rotation.z += 0.03;

      if (pPos.distanceTo(sop.position) < 2.2) {
        // Collect
        this.scene.remove(sop);
        this.sopaipillas3D.splice(i, 1);
        i--;
        
        GAME_STATE.sopaipillas += 1;
        document.getElementById('hud-sopaipillas').innerText = GAME_STATE.sopaipillas;
        sounds.playSFX('collect');
        showToast("¡Recogiste una rica Sopaipilla! 🥟");
        
        checkMissionStatus();
      }
    }
  }

  // Animates traffic cars on Pajaritos and handles road safety warnings!
  updateTraffic() {
    const pPos = this.player.mesh.position;

    this.cars.forEach(car => {
      car.position.z += car.userData.speed;
      
      // Loop around road boundaries
      if (car.position.z > 150) car.position.z = -150;
      if (car.position.z < -150) car.position.z = 150;

      // Check collision with player
      if (pPos.distanceTo(car.position) < 3.2 && !GAME_STATE.isDialogueActive) {
        // Hit by vehicle! Damage health
        GAME_STATE.energy = Math.max(0, GAME_STATE.energy - 35);
        document.getElementById('hud-energy').style.width = GAME_STATE.energy + '%';
        sounds.playSFX('damage');
        showToast("💥 ¡Impacto vial! Ten cuidado al cruzar Pajaritos.");

        // Push player back
        pPos.x = 50; // Throw player out of highway
        
        if (GAME_STATE.energy <= 0) {
          triggerGameOver();
        }
      }
    });
  }
}

// Global UI Notifications helper
function showToast(msg) {
  const toast = document.getElementById('hud-toast');
  toast.innerText = msg;
  toast.classList.remove('hidden');
  
  if (window.toastTimeout) clearTimeout(window.toastTimeout);
  
  window.toastTimeout = setTimeout(() => {
    toast.classList.add('hidden');
  }, 2500);
}

// Check if quests lists are solved
function checkMissionStatus() {
  // 1. Sopaipillas lost
  const sopCount = GAME_STATE.sopaipillas;
  document.getElementById('m-sopaipillas').innerText = `• Junta 5 Sopaipillas (${sopCount}/5)`;
  if (sopCount >= 5) {
    document.getElementById('m-sopaipillas').className = 'done';
    GAME_STATE.missions.sopaipillas = true;
  }

  // 2. Buy plant
  if (GAME_STATE.hasPlant) {
    document.getElementById('m-plantas').className = 'done';
    document.getElementById('m-plantas').innerText = `• Compra la Planta Rara (1/1)`;
    GAME_STATE.missions.plantas = true;
  } else {
    document.getElementById('m-plantas').innerText = `• Compra la Planta Rara (0/1)`;
  }

  // 3. Help abuela
  if (GAME_STATE.ladyHelped) {
    document.getElementById('m-lady').className = 'done';
    document.getElementById('m-lady').innerText = `• Ayuda a la abuelita (1/1)`;
    GAME_STATE.missions.lady = true;
  } else {
    document.getElementById('m-lady').innerText = `• Ayuda a la abuelita (0/1)`;
  }
}

function triggerGameOver() {
  sounds.stopBGM();
  sounds.playSFX('damage');
  document.getElementById('gameover-overlay').classList.remove('hidden');
  document.getElementById('game-hud').classList.add('hidden');
  if (window.gameInstance && window.gameInstance.player) {
    window.gameInstance.scene.remove(window.gameInstance.player.mesh);
  }
}

function triggerVictory() {
  sounds.stopBGM();
  sounds.playSFX('level');
  document.getElementById('victory-overlay').classList.remove('hidden');
  document.getElementById('game-hud').classList.add('hidden');
}

// Initialise on load
window.addEventListener('DOMContentLoaded', () => {
  // Instantiates the 3D world
  window.gameInstance = new Game3D();
});
