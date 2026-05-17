// pages/_app.js
import '../styles/landing.css';
import Head from 'next/head';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f172a" />
        <link rel="apple-touch-icon" href="https://cdn-icons-png.flaticon.com/512/12104/12104065.png" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;