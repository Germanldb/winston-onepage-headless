const data = {
  first_name: 'Test',
  last_name: 'User',
  document_id: '12345678',
  email: 'test@example.com',
  phone: '3001234567',
  city: 'Bogotá',
  state: 'BOG',
  address_1: 'Calle 123',
  payment_method: 'addi',
  items: []
};

fetch('http://localhost:4322/api/create-order', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
}).then(res => res.json()).then(console.log).catch(console.error);
