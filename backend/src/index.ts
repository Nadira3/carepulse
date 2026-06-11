import app from './app';
import { config } from './config/env';

const PORT = config.PORT;

app.listen(PORT, () => {
  console.log(`EMR Service running on port ${PORT}`);
  console.log(`Environment: ${config.NODE_ENV}`);
});
