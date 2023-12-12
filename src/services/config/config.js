//** Initialize ENV file is required for usage */
const config = {
    development: {
        DB_USERNAME  : process.env.DB_USERNAME_DEV,
        DB_PASSWORD  : process.env.DB_PASSWORD_DEV,
        DB_DATABASE  : process.env.DB_DATABASE_DEV,
        DB_HOST      : process.env.DB_HOST_DEV,
    },
    test: {
        DB_USERNAME  : process.env.DB_USERNAME_TEST,
        DB_PASSWORD  : process.env.DB_PASSWORD_TEST,
        DB_DATABASE  : process.env.DB_DATABASE_TEST,
        DB_HOST      : process.env.DB_HOST_TEST,
    },
    production: {
        DB_USERNAME  : process.env.DB_USERNAME_PROD,
        DB_PASSWORD  : process.env.DB_PASSWORD_PROD,
        DB_DATABASE  : process.env.DB_DATABASE_PROD,
        DB_HOST      : process.env.DB_HOST_PROD,
    }
}

//** Export Config File */
const env = process.env.NODE_ENV || 'development';
const envConfigs = config[env];
module.exports =  envConfigs;

