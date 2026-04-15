import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

// Preferir URL de conexión (SUPABASE_DB_URL). Si no está, usa parámetros individuales.
const connectionString = process.env.SUPABASE_DB_URL || null;

export const sequelize = connectionString
	? new Sequelize(connectionString, {
			dialect: 'postgres',
			dialectOptions: {
				ssl: {
					require: true,
					rejectUnauthorized: false,
				},
			},
			logging: false,
		})
	: new Sequelize(
			process.env.SUPABASE_DB_NAME || process.env.DB_NAME,
			process.env.SUPABASE_DB_USER || process.env.DB_USER,
			process.env.SUPABASE_DB_PASS || process.env.DB_PASS,
			{
				host: process.env.SUPABASE_DB_HOST || process.env.DB_HOST,
				port: Number(process.env.SUPABASE_DB_PORT || process.env.DB_PORT || 5432),
				dialect: 'postgres',
				dialectOptions: {
					ssl: {
						require: true,
						rejectUnauthorized: false,
					},
				},
				logging: false,
			}
		);

export const dbConnectSupabase = async () => {
	try {
		await sequelize.authenticate();
		console.log('Conexión exitosa a Supabase (Postgres).');
	} catch (err) {
		console.error('Error de conexión a Supabase:', err.message || err);
		throw err;
	}
};

export default sequelize;

