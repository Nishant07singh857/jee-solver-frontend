// pages/_app.js
import '../styles/landing.css';  // ← Global CSS must be imported here

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default MyApp;