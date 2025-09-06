import { registerAs } from '@nestjs/config';

export default registerAs('supplier', () => ({
  acme: {
    host:
      process.env.ACME_BASE_URL ??
      'https://5f2be0b4ffc88500167b85a0.mockapi.io/suppliers/acme',
  },
  patagonia: {
    host:
      process.env.PATAGONIA_BASE_URL ??
      'https://5f2be0b4ffc88500167b85a0.mockapi.io/suppliers/patagonia',
  },
  paperflies: {
    host:
      process.env.PAPERFLIES_BASE_URL ??
      'https://5f2be0b4ffc88500167b85a0.mockapi.io/suppliers/paperflies',
  },
}));
