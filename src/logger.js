const chalk = require('chalk');
const moment = require('moment');
const fs = require('fs-extra');
const path = require('path');

class Logger {
    constructor(level = 'info') {
        this.level = level;
        this.levels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3
        };
        
        this.ensureLogDirectory();
    }

    ensureLogDirectory() {
        const logDir = path.join(process.cwd(), 'logs');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }

    shouldLog(level) {
        return this.levels[level] <= this.levels[this.level];
    }

    formatMessage(level, message, data = null) {
        const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
        const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
        
        let fullMessage = `${prefix} ${message}`;
        if (data) {
            fullMessage += ` ${JSON.stringify(data)}`;
        }
        
        return fullMessage;
    }

    writeToFile(level, message) {
        const logFile = path.join(process.cwd(), 'logs', `app-${moment().format('YYYY-MM-DD')}.log`);
        const logMessage = this.formatMessage(level, message) + '\n';
        
        fs.appendFileSync(logFile, logMessage, 'utf8');
    }

    error(message, data = null) {
        if (this.shouldLog('error')) {
            console.error(chalk.red(this.formatMessage('error', message, data)));
            this.writeToFile('error', message);
        }
    }

    warn(message, data = null) {
        if (this.shouldLog('warn')) {
            console.warn(chalk.yellow(this.formatMessage('warn', message, data)));
            this.writeToFile('warn', message);
        }
    }

    info(message, data = null) {
        if (this.shouldLog('info')) {
            console.log(chalk.blue(this.formatMessage('info', message, data)));
            this.writeToFile('info', message);
        }
    }

    debug(message, data = null) {
        if (this.shouldLog('debug')) {
            console.log(chalk.gray(this.formatMessage('debug', message, data)));
            this.writeToFile('debug', message);
        }
    }

    success(message, data = null) {
        console.log(chalk.green(this.formatMessage('success', message, data)));
        this.writeToFile('info', `SUCCESS: ${message}`);
    }
}

module.exports = Logger;
