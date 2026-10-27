import {Config} from '@remotion/cli/config';

// The asset library is the public dir: staticFile('font/inter/Inter-Variable.ttf') etc.
// One source of truth, hashed by tools/asset_lock.py.
Config.setPublicDir('../assets');
Config.setVideoImageFormat('png');
Config.setPixelFormat('yuv420p');
Config.setCodec('h264');
Config.setCrf(16);
// Frames are pure functions of the frame number, so concurrency never changes the output.
Config.setOverwriteOutput(true);
