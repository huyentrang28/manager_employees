// Script để kill process đang sử dụng port 3001
const { exec } = require('child_process')
const util = require('util')
const execPromise = util.promisify(exec)

async function killPort(port) {
  try {
    // Windows command
    const { stdout } = await execPromise(`netstat -ano | findstr :${port}`)
    const lines = stdout.split('\n').filter(line => line.includes('LISTENING'))
    
    if (lines.length > 0) {
      const pids = new Set()
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/)
        if (parts.length > 0) {
          const pid = parts[parts.length - 1]
          if (pid && !isNaN(pid)) {
            pids.add(pid)
          }
        }
      })
      
      for (const pid of pids) {
        try {
          await execPromise(`taskkill /F /PID ${pid}`)
          console.log(`✅ Killed process ${pid} on port ${port}`)
        } catch (error) {
          // Process might already be killed
        }
      }
    } else {
      console.log(`✅ Port ${port} is free`)
    }
  } catch (error) {
    // Port might be free already
    console.log(`✅ Port ${port} is free`)
  }
}

killPort(3001).catch(console.error)

