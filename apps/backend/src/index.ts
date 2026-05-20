import 'dotenv/config';

import { checkDbConnection } from './db/client';

// const PORT = process.env.PORT ?? 4000;

async function bootstrap(){
    console.log("Devpulse backend staring ");
    await checkDbConnection();
    console.log("App is running on port 4000");
}

bootstrap().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});