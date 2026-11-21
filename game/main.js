// Bootstrap: wire the canvas, HUD and overlay into a Game and start it.
import { Game } from './game.js';

const canvas = document.getElementById('game');
const overlay = document.getElementById('overlay');
const toast = document.getElementById('toast');
const statusEl = document.getElementById('status');

const hud = {
  level: document.getElementById('hud-level'),
  seals: document.getElementById('hud-seals'),
  alertLabel: document.getElementById('hud-alert-label'),
  alertFill: document.getElementById('hud-alert-fill'),
  alertBar: document.getElementById('hud-alert-bar'),
  time: document.getElementById('hud-time'),
  sound: document.getElementById('hud-sound'),
};

const game = new Game(canvas, overlay, hud, toast, statusEl);
game.start();
