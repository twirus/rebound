import { render } from 'preact';
import '@fontsource/roboto-condensed/400.css';
import '@fontsource/roboto-condensed/500.css';
import '@fontsource/roboto-condensed/600.css';
import './ui/theme.css';
import './ui/app.css';
import './ui/tree/tree.css';
import { App } from './ui/App';

const root = document.getElementById('app');
if (!root) throw new Error('Missing #app element');
render(<App />, root);
