import {Config} from '@remotion/cli/config';

// Three.js / WebGL scenes need the ANGLE OpenGL renderer to render
// correctly and consistently across machines (both in Studio and CLI render).
Config.setChromiumOpenGlRenderer('angle');
