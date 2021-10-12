const HTMLTemplate = require('html-template-loader')
const embed = new HTMLTemplate(`<!DOCTYPE html>
    <html>
    <head>
    <script src="https://cdn.lr-ingest.io/LogRocket.min.js" crossorigin="anonymous"></script>
    <script>window.LogRocket && window.LogRocket.init('%LOGROCKET_ID%', {shouldCaptureIP: false});LogRocket.identify('%DISCORD_TAG%:%DISCORD_ID%') </script>
    <meta name="twitter:card" content="%IMAGETYPE%">
    <link rel="apple-touch-icon" sizes="120x120" href="https://%URL%/ico/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="https://%URL%/ico/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="https://%URL%/ico/favicon-16x16.png">
    <link rel="manifest" href="https://%URL%/ico/site.webmanifest">
    <link rel="mask-icon" href="https://%URL%/ico/safari-pinned-tab.svg" color="#5bbad5">
    <link rel="shortcut icon" href="https://%URL%/ico/favicon.ico">
    <meta name="msapplication-TileColor" content="#%COLOR%">
    <meta name="msapplication-config" content="https://URL/ico/browserconfig.xml">
    <meta name="theme-color" content="#%COLOR%">
    %DTYPE%
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="%AUTHOR%">
    <meta property="og:title" content="%TITLE%">
    <meta property="og:description" content="%DESCRIPTION%">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.16.1/umd/popper.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.6.0/js/bootstrap.min.js"></script>
    <script src="https://unpkg.com/vue/dist/vue.js"></script>
    <script src="https://unpkg.com/vuesax@4.0.1-alpha.16/dist/vuesax.min.js"></script>
    <script src="/assets/particles.js"></script>
    <script>
        particlesJS.load('particles-js', '/assets/particles.json', () => {})
        new Vue({
          el: '#app'
        })
    </script>
    <style>
    %ASSETS%
    </style>
    <title>%URL%</title>
    </head>
<body>
%BODY%
</body></html>`)

module.exports = { embed }