const http = require('http');

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/v1/categories?companyId=69f89dc05a295800321d08fc', // Dummy company id
  method: 'GET',
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(data);
  });
});

req.on('error', error => {
  console.error(error);
});

req.end();
