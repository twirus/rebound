import { render } from 'preact';
import '@fontsource/barlow/400.css';
import '@fontsource/barlow/500.css';
import '@fontsource/barlow/600.css';
import '@fontsource/barlow-semi-condensed/500.css';
import '@fontsource/barlow-semi-condensed/600.css';
import './ui/theme.css';
import './ui/app.css';
import { App } from './ui/App';
import { createGameWorld } from './game/session';

const root = document.getElementById('app');
if (!root) throw new Error('Missing #app element');
render(<App world={createGameWorld()} />, root);
