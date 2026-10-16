import { render } from 'preact';
import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/latin-500.css';
import './styles/theme.css';
import './styles/app.css';
import { App } from './ui/App';
import { requestPersistentStorage } from './storage/persist';

void requestPersistentStorage();

const root = document.getElementById('app');
if (!root) throw new Error('#app is missing from index.html');
render(<App />, root);
