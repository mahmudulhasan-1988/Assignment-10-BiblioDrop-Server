import { SignJWT } from 'jose-cjs';

const secret = 'jAyzfrRCRHPhMQIeWdmNoefiRG7sEJy8';
const secretKey = new TextEncoder().encode(secret);

const jwt = await new SignJWT({
  sub: 'user-test-001',
  name: 'Test User',
  email: 'test@bibliodrop.com',
  image: '',
})
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuedAt()
  .setExpirationTime('1h')
  .sign(secretKey);

console.log(jwt);
