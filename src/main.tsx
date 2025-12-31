import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';


// No initial loader removal — startup UI controlled by React routes.

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);