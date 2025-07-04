const corsAnywhere = require('cors-anywhere');

// Create a proxy server
const server = corsAnywhere.createServer({
  originWhitelist: [], // Allow all origins
  requireHeader: [],
  removeHeaders: ['cookie', 'cookie2']
});

const port = 8080;
const host = 'localhost';

console.log(`Starting CORS proxy server on http://${host}:${port}`);
server.listen(port, host, () => {
  console.log(`CORS proxy server is running on http://${host}:${port}`);
  console.log('Use this URL as your CORS proxy: http://localhost:8080/');
}); 