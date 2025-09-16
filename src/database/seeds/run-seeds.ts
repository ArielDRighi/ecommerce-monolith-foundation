import typeormConfig from '../../config/typeorm.config';
import { runSeeds } from './initial-data.seed';

async function run() {
  try {
    console.log('🔌 Connecting to database...');
    await typeormConfig.initialize();
    console.log('✅ Database connected');

    await runSeeds(typeormConfig);

    console.log('🔌 Disconnecting from database...');
    await typeormConfig.destroy();
    console.log('✅ Database disconnected');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

run().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
