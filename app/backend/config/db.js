const mysql = require("mysql2")
require("dotenv").config()

// Default values as fallback
const dbConfig = {
  host: process.env.DB_HOST || "ct467-database.cjc2ywku69ul.ap-southeast-2.rds.amazonaws.com",
  user: process.env.DB_USER || "admin",
  password: process.env.DB_PASSWORD || "CT467-DATABASE",
  database: process.env.DB_NAME || "quan_ly_rap_phim",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
}

console.log("🔧 Database Configuration:")
console.log("📍 Host:", dbConfig.host)
console.log("👤 User:", dbConfig.user)
console.log("🗄️ Database:", dbConfig.database)
console.log("🔌 Port:", dbConfig.port)
console.log("🔗 Connection Limit:", dbConfig.connectionLimit)

const pool = mysql.createPool(dbConfig)

// Test connection immediately
pool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Database connection failed!")
    console.error("🔍 Error details:", {
      code: err.code,
      errno: err.errno,
      sqlMessage: err.sqlMessage,
      sqlState: err.sqlState,
      fatal: err.fatal,
    })
    console.error("📋 Connection config used:", {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database,
      port: dbConfig.port,
    })
  } else {
    console.log("✅ Database connected successfully!")
    console.log("📊 Connection details:", {
      threadId: connection.threadId,
      host: dbConfig.host,
      database: dbConfig.database,
      user: dbConfig.user,
      port: dbConfig.port,
    })

    // Test a simple query
    connection.query("SELECT 1 as test", (queryErr, results) => {
      if (queryErr) {
        console.error("❌ Database query test failed:", queryErr)
      } else {
        console.log("✅ Database query test successful:", results)
      }
      connection.release()
    })
  }
})

// Handle pool events
pool.on("connection", (connection) => {
  console.log("🔗 New database connection established as id " + connection.threadId)
})

pool.on("error", (err) => {
  console.error("❌ Database pool error:", err)
  if (err.code === "PROTOCOL_CONNECTION_LOST") {
    console.log("🔄 Attempting to reconnect to database...")
  } else {
    throw err
  }
})

module.exports = pool
