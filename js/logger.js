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
    /\b[A-Z]\d{9}\b/g, // National ID (Taiwan)
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // Phone numbers
    /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g, // Email addresses
];
const PHI_KEYS = [
    'name', 'patientname', 'fullname', 'firstname', 'lastname', 'familyname', 'givenname',
    'dob', 'dateofbirth', 'birthdate', 'birthday',
    'address', 'streetaddress', 'city', 'zipcode', 'postalcode',
    'phone', 'phonenumber', 'telephone', 'mobile', 'fax',
    'email', 'emailaddress',
    'ssn', 'socialsecuritynumber', 'nationalid', 'passport',
    'mrn', 'medicalrecordnumber', 'patientid',
    'password', 'pin', 'creditcard', 'bankaccount',
    'identifier', 'id_number',
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
        else if (Array.isArray(value)) {
            sanitized[key] = value.map(item => {
                if (typeof item === 'string')
                    return stripPHI(item);
                if (typeof item === 'object' && item !== null)
                    return sanitizeContext(item);
                return item;
            });
        }
        else if (typeof value === 'object' && value !== null) {
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
        this.transports = [];
    }
    setLevel(level) {
        this.level = level;
    }
    setSessionId(id) {
        this.sessionId = id;
    }
    addTransport(transport) {
        this.transports.push(transport);
    }
    removeTransport(name) {
        const idx = this.transports.findIndex(t => t.name === name);
        if (idx !== -1) {
            this.transports[idx].destroy();
            this.transports.splice(idx, 1);
        }
    }
    createEntry(level, message, context) {
        const entry = {
            timestamp: new Date().toISOString(),
            level: LEVEL_NAMES[level],
            message: stripPHI(message),
            url: typeof window !== 'undefined' && window.location
                ? window.location.origin + window.location.pathname
                : undefined,
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
        // Dispatch to registered transports
        for (const transport of this.transports) {
            if (level >= transport.minLevel) {
                try {
                    transport.send(entry);
                }
                catch { /* silent */ }
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
