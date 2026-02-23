// src/logger.ts — Structured logging with PHI stripping
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
    LogLevel[LogLevel["FATAL"] = 4] = "FATAL";
})(LogLevel || (LogLevel = {}));
// Patterns that indicate PHI content
const PHI_PATTERNS = [
    /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
    /\b\d{4}[-/]\d{2}[-/]\d{2}\b/g, // Date of birth (YYYY-MM-DD)
    /\b\d{2}[-/]\d{2}[-/]\d{4}\b/g, // Date of birth (MM/DD/YYYY)
];
const PHI_KEYS = [
    'ssn', 'socialsecuritynumber', 'password', 'pin',
    'creditcard', 'bankaccount', 'identifier',
    'patientname', 'dob', 'dateofbirth', 'birthdate',
    'address', 'phone', 'email', 'mrn',
];
function stripPHI(value) {
    let sanitized = value;
    for (const pattern of PHI_PATTERNS) {
        sanitized = sanitized.replace(pattern, '[REDACTED]');
    }
    return sanitized;
}
function sanitizeContext(obj) {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        if (PHI_KEYS.some(phi => lowerKey.includes(phi))) {
            sanitized[key] = '[REDACTED]';
        }
        else if (typeof value === 'string') {
            sanitized[key] = stripPHI(value);
        }
        else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            sanitized[key] = sanitizeContext(value);
        }
        else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}
const LEVEL_NAMES = {
    [LogLevel.DEBUG]: 'DEBUG',
    [LogLevel.INFO]: 'INFO',
    [LogLevel.WARN]: 'WARN',
    [LogLevel.ERROR]: 'ERROR',
    [LogLevel.FATAL]: 'FATAL',
};
class Logger {
    constructor() {
        this.level = LogLevel.INFO;
        this.sessionId = '';
    }
    setLevel(level) {
        this.level = level;
    }
    setSessionId(id) {
        this.sessionId = id;
    }
    createEntry(level, message, context) {
        const entry = {
            timestamp: new Date().toISOString(),
            level: LEVEL_NAMES[level],
            message: stripPHI(message),
            url: typeof window !== 'undefined' && window.location ? window.location.href : undefined,
        };
        if (this.sessionId) {
            entry.sessionId = this.sessionId;
        }
        if (context) {
            const safeContext = sanitizeContext(context);
            if (safeContext.calculatorId) {
                entry.calculatorId = String(safeContext.calculatorId);
            }
            entry.context = safeContext;
        }
        return entry;
    }
    emit(level, message, context) {
        if (level < this.level)
            return;
        const entry = this.createEntry(level, message, context);
        // Console output
        const json = JSON.stringify(entry);
        switch (level) {
            case LogLevel.DEBUG:
                console.debug(json);
                break;
            case LogLevel.INFO:
                console.log(json);
                break;
            case LogLevel.WARN:
                console.warn(json);
                break;
            case LogLevel.ERROR:
            case LogLevel.FATAL:
                console.error(json);
                break;
        }
        // Sentry breadcrumb (lazy import to avoid circular deps)
        if (level >= LogLevel.WARN) {
            try {
                const sentry = globalThis.__SENTRY_INSTANCE__;
                if (sentry?.addBreadcrumb) {
                    sentry.addBreadcrumb({
                        category: 'logger',
                        message: entry.message,
                        level: level >= LogLevel.ERROR ? 'error' : 'warning',
                        data: entry.context,
                    });
                }
            }
            catch {
                // Sentry not available
            }
        }
    }
    debug(message, context) {
        this.emit(LogLevel.DEBUG, message, context);
    }
    info(message, context) {
        this.emit(LogLevel.INFO, message, context);
    }
    warn(message, context) {
        this.emit(LogLevel.WARN, message, context);
    }
    error(message, context) {
        this.emit(LogLevel.ERROR, message, context);
    }
    fatal(message, context) {
        this.emit(LogLevel.FATAL, message, context);
    }
}
export const logger = new Logger();
export default logger;
