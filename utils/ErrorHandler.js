class ErrorHandler extends Error{ //Creates a new class ErrorHandler that inherits everything from JavaScript’s built-in Error class
    constructor(message,statusCode){
        super(message); // call parent (Error) constructor with message
        this.statusCode = statusCode // custom property to hold HTTP status code

        Error.captureStackTrace(this,this.constructor); // Ensures that the stack trace points to where the error was actually created, not inside this class constructor
        // A stack trace is basically a "map" (or a log) of the sequence of function calls that the program went through right before an error happened.

        // This line ensures the stack trace is attached to your custom error, but it hides the constructor itself from the trace (so debugging stays clean).
        // That means when you throw your ErrorHandler, the stack trace will point to the real cause (like your route or controller), not just the ErrorHandler constructor.
    }
    
}
export default ErrorHandler

// Error.captureStackTrace(targetObject, constructorOpt)
// targetObject → The object that will receive the stack property (in your case, this → your custom error instance).
// constructorOpt → A function you want to exclude from the stack trace.