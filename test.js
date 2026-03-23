const axios = require('axios');

axios.post('http://localhost:5000/api/auth/login', {
  email: 'admin@kora.com',
  password: 'admin123'
}).then(res => console.log('SUCCESS:', res.data)).catch(err => console.error('ERROR:', err.response?.data || err.message));
